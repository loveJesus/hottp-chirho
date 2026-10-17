// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

// Run: bun test src-chirho/corpus-intake-chirho/

import { Database } from "bun:sqlite";
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

import { classifyPageChirho, loadKnownWordsFromChirho } from "../classify-french-chirho.ts";
import { draftLineSegmentsChirho } from "./draft-segments-chirho.ts";
import { pageKeyChirho, workingSetKeysChirho } from "./intake-config-chirho.ts";
import {
  donePagesChirho,
  failedPageKeysChirho,
  openIntakeDbChirho,
  pagesNeedingDraftsChirho,
  recordPageDraftsChirho,
  recordPageDoneChirho,
  recordPageFailedChirho,
  startRunChirho,
  type IntakePageResultChirho,
} from "./intake-db-chirho.ts";
import { parseIntakeArgsChirho, planTargetsChirho, pngSizeChirho } from "./intake-runner-chirho.ts";
import { lineBoxOutsideImageChirho, parseHocrLinesChirho, type LineBboxChirho } from "./page-geometry-chirho.ts";
import { protectedPagesChirho } from "./protected-pages-chirho.ts";

const tempDirsChirho: string[] = [];
function tempDirChirho(): string {
  const dirChirho = mkdtempSync(join(tmpdir(), "corpus-intake-test-chirho-"));
  tempDirsChirho.push(dirChirho);
  return dirChirho;
}
afterEach(() => {
  for (const dirChirho of tempDirsChirho.splice(0)) rmSync(dirChirho, { recursive: true, force: true });
});

function lineChirho(yChirho: number, textChirho: string): LineBboxChirho {
  return { xMinChirho: 100, yMinChirho: yChirho, xMaxChirho: 900, yMaxChirho: yChirho + 40, textChirho, wordsChirho: [] };
}

function resultChirho(pageChirho: number, linesChirho: LineBboxChirho[]): IntakePageResultChirho {
  return {
    volumeNumberChirho: 2,
    pageNumberChirho: pageChirho,
    imageRelPathChirho: `pages-chirho/vol-2-chirho/0000-chirho/page-${String(pageChirho).padStart(4, "0")}-chirho.png`,
    imageSha256Chirho: "ab".repeat(32),
    imageBytesChirho: 1234,
    imageWidthChirho: 2500,
    imageHeightChirho: 3500,
    frenchTextChirho: "texte",
    geometrySourceChirho: "tesseract-hocr-chirho",
    geometryVersionChirho: 2,
    linesChirho,
    elapsedMsChirho: 10,
  };
}

function linesOfChirho(dbChirho: Database, pageChirho: number): string[] {
  return (dbChirho
    .query(`SELECT pdftotext_chirho FROM intake_lines_chirho WHERE volume_number_chirho = 2 AND page_number_chirho = ? ORDER BY line_index_chirho`)
    .all(pageChirho) as Array<{ pdftotext_chirho: string }>).map((rChirho) => rChirho.pdftotext_chirho);
}

describe("protected pages", () => {
  test("the working set is the 46 hosted pages", () => {
    const keysChirho = workingSetKeysChirho();
    expect(keysChirho.size).toBe(46);
    expect(keysChirho.has("5:50")).toBe(true);
    expect(keysChirho.has("5:71")).toBe(false);
  });

  test("progress-database work outside the working set is protected too", () => {
    const pathChirho = join(tempDirChirho(), "progress-chirho.sqlite");
    const dbChirho = new Database(pathChirho, { create: true });
    dbChirho.exec(`
      CREATE TABLE pages_chirho (id_chirho INTEGER PRIMARY KEY, volume_number_chirho INTEGER, page_number_chirho INTEGER);
      CREATE TABLE scanlines_chirho (id_chirho INTEGER PRIMARY KEY, page_id_chirho INTEGER);
      CREATE TABLE segments_chirho (id_chirho INTEGER PRIMARY KEY, scanline_id_chirho INTEGER);
      CREATE TABLE events_chirho (id_chirho INTEGER PRIMARY KEY, page_id_chirho INTEGER);
      CREATE TABLE words_chirho (id_chirho INTEGER PRIMARY KEY, scanline_id_chirho INTEGER, is_human_confirmed_chirho INTEGER);
      INSERT INTO pages_chirho VALUES (1, 1, 400), (2, 2, 10), (3, 3, 20), (4, 3, 21), (5, 1, 148), (6, 4, 30);
      INSERT INTO scanlines_chirho VALUES (10, 2), (11, 3), (12, 4), (13, 6);
      INSERT INTO events_chirho VALUES (100, 1), (101, 5);
      INSERT INTO segments_chirho VALUES (200, 10);
      INSERT INTO words_chirho VALUES (300, 11, 1), (301, 12, 0);
    `);
    dbChirho.close();

    const protectedChirho = protectedPagesChirho(pathChirho);
    expect(protectedChirho.extraKeysChirho.sort()).toEqual(["1:400", "2:10", "3:20"]);
    expect(protectedChirho.keysChirho.size).toBe(49);
    expect(protectedChirho.keysChirho.has("3:21")).toBe(false);
    expect(protectedChirho.keysChirho.has("4:30")).toBe(false);
  });

  test("a missing progress database fails closed", () => {
    expect(() => protectedPagesChirho(join(tempDirChirho(), "absent-chirho.sqlite"))).toThrow(/refusing/);
  });
});

describe("planning a run", () => {
  const countsChirho = new Map([[5, 160]]);
  const argsChirho = parseIntakeArgsChirho(["--vol=5"]);

  test("never targets protected pages", () => {
    const planChirho = planTargetsChirho(argsChirho, countsChirho, workingSetKeysChirho(), new Map(), new Set(), () => true);
    const targetKeysChirho = planChirho.targetsChirho.map((tChirho) => pageKeyChirho(tChirho.volumeNumberChirho, tChirho.pageNumberChirho));
    expect(planChirho.protectedChirho).toBe(26);
    expect(planChirho.targetsChirho.length).toBe(160 - 26);
    for (const keyChirho of workingSetKeysChirho()) expect(targetKeysChirho).not.toContain(keyChirho);
  });

  test("resumes: done pages are skipped only while still valid", () => {
    const doneChirho = new Map([
      ["5:1", { imageRelPathChirho: "kept", imageBytesChirho: 1, geometryVersionChirho: 2 }],
      ["5:2", { imageRelPathChirho: "lost", imageBytesChirho: 1, geometryVersionChirho: 2 }],
    ]);
    const planChirho = planTargetsChirho(argsChirho, countsChirho, new Set(), doneChirho, new Set(["5:3"]),
      (dChirho) => dChirho.imageRelPathChirho === "kept");
    const pagesChirho = planChirho.targetsChirho.map((tChirho) => tChirho.pageNumberChirho);
    expect(planChirho.alreadyDoneChirho).toBe(1);
    expect(pagesChirho).not.toContain(1);
    expect(pagesChirho).toContain(2);
    expect(pagesChirho).toContain(3);

    const skipChirho = planTargetsChirho(parseIntakeArgsChirho(["--vol=5", "--skip-failed", "--limit=4"]), countsChirho,
      new Set(), doneChirho, new Set(["5:3"]), (dChirho) => dChirho.imageRelPathChirho === "kept");
    expect(skipChirho.skippedFailedChirho).toBe(1);
    expect(skipChirho.targetsChirho.map((tChirho) => tChirho.pageNumberChirho)).toEqual([2, 4, 5, 6]);
  });

  test("arguments are validated", () => {
    expect(() => parseIntakeArgsChirho([])).toThrow(/exactly one/);
    expect(() => parseIntakeArgsChirho(["--all", "--vol=1"])).toThrow(/exactly one/);
    expect(() => parseIntakeArgsChirho(["--all", "--start=3"])).toThrow(/exactly one --vol/);
    expect(() => parseIntakeArgsChirho(["--vol=9"])).toThrow(/unknown volume/);
    expect(() => parseIntakeArgsChirho(["--vol=1", "--start=9", "--end=3"])).toThrow(/after/);
    expect(parseIntakeArgsChirho(["--all"]).volumesChirho).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("intake database", () => {
  test("a failed page is retried and its lines replaced", () => {
    const dbChirho = openIntakeDbChirho(join(tempDirChirho(), "intake-chirho.sqlite"));
    const runChirho = startRunChirho(dbChirho, {}, 1, {});
    recordPageFailedChirho(dbChirho, runChirho, 2, 7, "tesseract exploded", 5);
    expect(failedPageKeysChirho(dbChirho).has("2:7")).toBe(true);

    recordPageDoneChirho(dbChirho, runChirho, resultChirho(7, [lineChirho(10, "un"), lineChirho(60, "deux")]));
    recordPageDoneChirho(dbChirho, runChirho, resultChirho(7, [lineChirho(10, "trois")]));
    const rowChirho = dbChirho
      .query(`SELECT status_chirho, attempt_count_chirho, line_count_chirho, error_chirho FROM intake_pages_chirho`)
      .get() as { status_chirho: string; attempt_count_chirho: number; line_count_chirho: number; error_chirho: string | null };
    expect(rowChirho).toEqual({ status_chirho: "lines-extracted-chirho", attempt_count_chirho: 3, line_count_chirho: 1, error_chirho: null });
    expect(linesOfChirho(dbChirho, 7)).toEqual(["trois"]);
    expect(donePagesChirho(dbChirho).get("2:7")).toMatchObject({ imageBytesChirho: 1234, geometryVersionChirho: 2 });
    expect(failedPageKeysChirho(dbChirho).size).toBe(0);
    dbChirho.close();
  });

  test("a write that fails part way leaves the earlier page intact", () => {
    const dbChirho = openIntakeDbChirho(join(tempDirChirho(), "intake-chirho.sqlite"));
    const runChirho = startRunChirho(dbChirho, {}, 1, {});
    recordPageDoneChirho(dbChirho, runChirho, resultChirho(8, [lineChirho(10, "un"), lineChirho(60, "deux")]));
    const brokenChirho = { ...lineChirho(110, "cassé"), xMaxChirho: Number.NaN };
    expect(() => recordPageDoneChirho(dbChirho, runChirho, resultChirho(8, [lineChirho(10, "neuf"), brokenChirho]))).toThrow();
    expect(linesOfChirho(dbChirho, 8)).toEqual(["un", "deux"]);
    const rowChirho = dbChirho.query(`SELECT attempt_count_chirho, line_count_chirho FROM intake_pages_chirho`).get();
    expect(rowChirho).toEqual({ attempt_count_chirho: 1, line_count_chirho: 2 });
    dbChirho.close();
  });
});

describe("page geometry helpers", () => {
  test("hOCR lines keep word boxes and decode entities", () => {
    const hocrChirho = [
      `<span class='ocr_line' id='line_1_1' title="bbox 10 20 300 60; baseline 0 -5">`,
      `<span class='ocrx_word' id='word_1_1' title='bbox 10 22 90 58; x_wconf 95'>l&#39;autre</span>`,
      `<span class='ocrx_word' id='word_1_2' title='bbox 100 22 300 58; x_wconf 91'>R&amp;D</span>`,
      `</span>`,
      `<span class='ocr_line' id='line_1_2' title="bbox 12 70 280 110; baseline 0 -5">`,
      `<span class='ocrx_word' id='word_1_3' title='bbox 12 72 280 108; x_wconf 88'>texte</span>`,
      `</span>`,
      `<span class='ocr_header' id='line_1_3' title="bbox 400 5 600 40; baseline 0 -5">`,
      `<span class='ocrx_word' id='word_1_4' title='bbox 400 6 600 39; x_wconf 90'>Titre</span>`,
      `</span>`,
      `<span class='ocr_textfloat' id='line_1_4' title="bbox 20 120 60 150; baseline 0 -5">`,
      `<span class='ocrx_word' id='word_1_5' title='bbox 20 121 60 149; x_wconf 90'>40</span>`,
    ].join("\n");
    const linesChirho = parseHocrLinesChirho(hocrChirho);
    // Header and text-float lines are lines of their own, not words of the line before.
    expect(linesChirho.map((lChirho) => lChirho.textChirho)).toEqual(["l'autre R&D", "texte", "Titre", "40"]);
    expect(linesChirho[2]).toMatchObject({ xMinChirho: 400, yMinChirho: 5, xMaxChirho: 600, yMaxChirho: 40 });
    expect(linesChirho[0]).toMatchObject({ xMinChirho: 10, yMinChirho: 20, xMaxChirho: 300, yMaxChirho: 60 });
    expect(linesChirho[0]!.wordsChirho[1]).toMatchObject({ textChirho: "R&D", xMinChirho: 100, xMaxChirho: 300 });
  });

  test("line boxes off the page image are caught; bottom padding is allowed", () => {
    const pageChirho = [lineChirho(10, "haut"), { ...lineChirho(3460, "bas"), yMaxChirho: 3512 }];
    expect(lineBoxOutsideImageChirho(pageChirho, 2480, 3500)).toBeNull();
    const inflatedChirho = { ...lineChirho(10, "trop large"), xMaxChirho: 3600 };
    expect(lineBoxOutsideImageChirho([...pageChirho, inflatedChirho], 2480, 3500)).toBe(inflatedChirho);
    const belowChirho = { ...lineChirho(3480, "dessous"), yMaxChirho: 3530 };
    expect(lineBoxOutsideImageChirho([belowChirho], 2480, 3500)).toBe(belowChirho);
  });

  test("PNG size comes from the header, and non-PNG input is refused", () => {
    const headerChirho = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52,
      0, 0, 0x09, 0xf6, 0, 0, 0x0c, 0xe4,
    ]);
    expect(pngSizeChirho(headerChirho)).toEqual({ widthChirho: 2550, heightChirho: 3300 });
    expect(() => pngSizeChirho(new TextEncoder().encode("GIF89a and then some bytes"))).toThrow(/not a PNG/);
  });
});

describe("classifier input", () => {
  test("known words come from the page's volume and the globals only", () => {
    const dbChirho = new Database(join(tempDirChirho(), "known-chirho.sqlite"), { create: true });
    dbChirho.exec(`
      CREATE TABLE known_words_chirho (word_chirho TEXT, volume_number_chirho INTEGER);
      INSERT INTO known_words_chirho VALUES ('Partout', 0), ('Duhm', 2), ('Rudolph', 3);
    `);
    expect([...loadKnownWordsFromChirho(dbChirho, 2)].sort()).toEqual(["Duhm", "Partout"]);
    dbChirho.close();
  });

  test("an injected known word is auto-accepted; without it the word stays a candidate", async () => {
    const linesChirho = [{ lineIndexChirho: 0, wordsChirho: [{ textChirho: "Zqxwvk", xMinChirho: 0, yMinChirho: 0, xMaxChirho: 9, yMaxChirho: 9 }] }];
    expect((await classifyPageChirho(linesChirho, new Set(["Zqxwvk"])))[0]!.reasonChirho).toBe("known-words-chirho");
    expect((await classifyPageChirho(linesChirho, new Set()))[0]!.reasonChirho).toBe("candidate-chirho");
  });
});

describe("draft segments", () => {
  const wordChirho = (textChirho: string, xMinChirho: number, xMaxChirho: number, scriptHintChirho?: string) =>
    ({ textChirho, xMinChirho, yMinChirho: 0, xMaxChirho, yMaxChirho: 40, scriptHintChirho });

  test("tiles the whole line by script and flags a wide gap as unknown", () => {
    const lineChirho = { xMinChirho: 100, widthChirho: 1000, wordsChirho: [
      wordChirho("Selon", 110, 200), wordChirho("le", 215, 250), wordChirho("XYZ", 300, 420), wordChirho("et", 440, 470)] };
    const tilesChirho = draftLineSegmentsChirho(lineChirho, ["hunspell-chirho", "hunspell-chirho", "candidate-chirho", "hunspell-chirho"], 80);
    expect(tilesChirho.map((tChirho) => [tChirho.xMinPxChirho, tChirho.widthPxChirho, tChirho.scriptChirho, tChirho.machineTextChirho, tChirho.reasonChirho]))
      .toEqual([
        [0, 200, "french-chirho", "Selon le", "classifier-chirho"],
        [200, 140, "unknown-chirho", "XYZ", "classifier-chirho"],
        [340, 30, "french-chirho", "et", "classifier-chirho"],
        [370, 630, "unknown-chirho", "", "gap-chirho"],
      ]);
    expect(tilesChirho.reduce((nChirho, tChirho) => nChirho + tChirho.widthPxChirho, 0)).toBe(1000);
    expect(tilesChirho[1]).toMatchObject({ wordStartIndexChirho: 2, wordEndIndexChirho: 2 });
  });

  test("font-hinted runs keep their script and read right to left", () => {
    const lineChirho = { xMinChirho: 0, widthChirho: 500, wordsChirho: [
      wordChirho("voir", 0, 60), wordChirho("א", 80, 120, "hebrew-chirho"), wordChirho("ב", 130, 170, "hebrew-chirho")] };
    const tilesChirho = draftLineSegmentsChirho(lineChirho, ["hunspell-chirho", "candidate-chirho", "candidate-chirho"], 80);
    expect(tilesChirho[1]).toMatchObject({ scriptChirho: "hebrew-chirho", machineTextChirho: "ב א" });
  });

  test("words listed right to left still tile without zero-width tiles", () => {
    // Vol 4 p6 line 12 as tesseract listed it: the Hebrew words come right to left.
    const lineChirho = { xMinChirho: 202, widthChirho: 1118, wordsChirho: [
      wordChirho("À.", 202, 240), wordChirho("Divisés", 255, 387), wordChirho("ou", 401, 447), wordChirho("א", 974, 1089),
      wordChirho("אד", 531, 707), wordChirho("ה", 490, 510), wordChirho("ה\u200e", 453, 472), wordChirho("XXV", 1247, 1320)] };
    const reasonsChirho = ["citation-chirho", "hunspell-chirho", "hunspell-chirho", "candidate-chirho", "candidate-chirho",
      "candidate-chirho", "candidate-chirho", "citation-chirho"] as const;
    const tilesChirho = draftLineSegmentsChirho(lineChirho, [...reasonsChirho], 80);
    let atChirho = 0;
    for (const tileChirho of tilesChirho) {
      expect(tileChirho.xMinPxChirho).toBe(atChirho);
      expect(tileChirho.widthPxChirho).toBeGreaterThan(0);
      atChirho += tileChirho.widthPxChirho;
    }
    expect(atChirho).toBe(1118);
    expect(tilesChirho.find((tChirho) => tChirho.machineTextChirho.startsWith("אד"))).toMatchObject({
      xMinPxChirho: 251, machineTextChirho: "אד ה ה", wordStartIndexChirho: 4, wordEndIndexChirho: 6 });
  });

  test("an empty line is one unknown tile, and verdicts must match words", () => {
    expect(draftLineSegmentsChirho({ xMinChirho: 0, widthChirho: 300, wordsChirho: [] }, [], 80))
      .toEqual([expect.objectContaining({ xMinPxChirho: 0, widthPxChirho: 300, scriptChirho: "unknown-chirho" })]);
    expect(() => draftLineSegmentsChirho({ xMinChirho: 0, widthChirho: 300, wordsChirho: [wordChirho("a", 0, 9)] }, [], 80)).toThrow(/one classifier verdict/);
  });

  test("re-extracting a page discards its drafts", () => {
    const dbChirho = openIntakeDbChirho(join(tempDirChirho(), "intake-chirho.sqlite"));
    const runChirho = startRunChirho(dbChirho, {}, 1, {});
    recordPageDoneChirho(dbChirho, runChirho, resultChirho(9, [lineChirho(10, "un"), lineChirho(60, "deux")]));
    const tileChirho = draftLineSegmentsChirho({ xMinChirho: 100, widthChirho: 800, wordsChirho: [] }, [], 80)[0]!;
    const countsChirho = recordPageDraftsChirho(dbChirho, 2, 9, 1, [{ lineIndexChirho: 0, segmentsChirho: [tileChirho] }, { lineIndexChirho: 1, segmentsChirho: [tileChirho] }]);
    expect(countsChirho).toEqual({ segmentCountChirho: 2, flaggedCountChirho: 2 });
    expect(pagesNeedingDraftsChirho(dbChirho, 1, [2])).toEqual([]);
    expect(pagesNeedingDraftsChirho(dbChirho, 2, [2])).toEqual([{ volumeNumberChirho: 2, pageNumberChirho: 9 }]);

    recordPageDoneChirho(dbChirho, runChirho, resultChirho(9, [lineChirho(10, "trois")]));
    expect(dbChirho.query(`SELECT COUNT(*) AS n_chirho FROM intake_segments_chirho`).get()).toEqual({ n_chirho: 0 });
    expect(pagesNeedingDraftsChirho(dbChirho, 1, [2])).toEqual([{ volumeNumberChirho: 2, pageNumberChirho: 9 }]);
    dbChirho.close();
  });
});
