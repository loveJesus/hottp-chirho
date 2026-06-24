// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { Database } from "bun:sqlite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filenameChirho = fileURLToPath(import.meta.url);
const __dirnameChirho = dirname(__filenameChirho);
const dbPathChirho = join(__dirnameChirho, "progress-chirho.sqlite");

type ArgsChirho = {
  commandChirho: string;
  idChirho: number | null;
  agentCodeChirho: string;
  actionTakenChirho: string;
  resultOfActionChirho: string;
  overviewOfResultChirho: string;
};

function argValueChirho(nameChirho: string): string | null {
  const prefixChirho = `--${nameChirho}=`;
  const matchChirho = process.argv.find((argChirho) => argChirho.startsWith(prefixChirho));
  return matchChirho === undefined ? null : matchChirho.slice(prefixChirho.length);
}

function parseArgsChirho(): ArgsChirho {
  const commandChirho = process.argv[2] ?? "";
  const idTextChirho = argValueChirho("id-chirho");
  return {
    commandChirho,
    idChirho: idTextChirho === null ? null : Number(idTextChirho),
    agentCodeChirho: argValueChirho("agent-code-chirho") ?? "codex-gpt5-chirho",
    actionTakenChirho: argValueChirho("action-taken-chirho") ?? "",
    resultOfActionChirho: argValueChirho("result-of-action-chirho") ?? "",
    overviewOfResultChirho: argValueChirho("overview-of-result-chirho") ?? "",
  };
}

function requireTextChirho(valueChirho: string, fieldChirho: string): string {
  if (valueChirho.trim().length === 0) {
    throw new Error(`${fieldChirho} is required`);
  }
  return valueChirho;
}

function openDbChirho(): Database {
  const dbChirho = new Database(dbPathChirho);
  dbChirho.exec(`
    CREATE TABLE IF NOT EXISTS steps_taken_chirho (
      id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_code_chirho TEXT NOT NULL,
      timestamp_start_chirho TEXT NOT NULL,
      timestamp_end_chirho TEXT,
      action_taken_chirho TEXT NOT NULL,
      result_of_action_chirho TEXT NOT NULL DEFAULT '',
      overview_of_result_chirho TEXT NOT NULL DEFAULT ''
    );
  `);
  return dbChirho;
}

function startChirho(argsChirho: ArgsChirho): void {
  const dbChirho = openDbChirho();
  const nowChirho = new Date().toISOString();
  const insertChirho = dbChirho.query(`
    INSERT INTO steps_taken_chirho (
      agent_code_chirho,
      timestamp_start_chirho,
      action_taken_chirho,
      result_of_action_chirho,
      overview_of_result_chirho
    )
    VALUES (?, ?, ?, ?, ?)
  `);
  insertChirho.run(
    requireTextChirho(argsChirho.agentCodeChirho, "agent-code-chirho"),
    nowChirho,
    requireTextChirho(argsChirho.actionTakenChirho, "action-taken-chirho"),
    argsChirho.resultOfActionChirho,
    argsChirho.overviewOfResultChirho,
  );
  const idRowChirho = dbChirho.query<{ id_chirho: number }, []>("SELECT last_insert_rowid() AS id_chirho").get();
  if (idRowChirho === null) {
    throw new Error("Could not read inserted progress row id");
  }
  console.log(String(idRowChirho.id_chirho));
  dbChirho.close();
}

function finishChirho(argsChirho: ArgsChirho): void {
  if (argsChirho.idChirho === null || !Number.isInteger(argsChirho.idChirho)) {
    throw new Error("id-chirho is required for finish");
  }
  const dbChirho = openDbChirho();
  const nowChirho = new Date().toISOString();
  const updateChirho = dbChirho.query(`
    UPDATE steps_taken_chirho
       SET timestamp_end_chirho = ?,
           result_of_action_chirho = ?,
           overview_of_result_chirho = ?
     WHERE id_chirho = ?
  `);
  const resultChirho = updateChirho.run(
    nowChirho,
    requireTextChirho(argsChirho.resultOfActionChirho, "result-of-action-chirho"),
    requireTextChirho(argsChirho.overviewOfResultChirho, "overview-of-result-chirho"),
    argsChirho.idChirho,
  );
  if (resultChirho.changes !== 1) {
    throw new Error(`No progress row updated for id ${argsChirho.idChirho}`);
  }
  console.log(`finished ${argsChirho.idChirho}`);
  dbChirho.close();
}

const argsChirho = parseArgsChirho();
if (argsChirho.commandChirho === "start") {
  startChirho(argsChirho);
} else if (argsChirho.commandChirho === "finish") {
  finishChirho(argsChirho);
} else {
  throw new Error("Usage: bun spec-chirho/log_step_chirho.ts start|finish --...");
}
