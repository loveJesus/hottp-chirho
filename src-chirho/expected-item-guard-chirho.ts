// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Shared exact-item write guards for offline policy writers.
 */

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function splitCsvChirho(valueChirho: string | undefined): string[] {
  return (valueChirho ?? "")
    .split(",")
    .map((partChirho) => partChirho.trim())
    .filter((partChirho) => partChirho.length > 0);
}

export function parseExpectedItemIdsChirho(argsChirho: string[]): Set<string> {
  const expectedItemIdsChirho = new Set<string>();
  const valuesChirho = [
    ...splitCsvChirho(parseArgValueChirho(argsChirho, "expected-item-ids-chirho")),
    ...argsChirho
      .filter((argChirho) => argChirho.startsWith("--expected-item-id-chirho="))
      .flatMap((argChirho) => splitCsvChirho(argChirho.slice("--expected-item-id-chirho=".length))),
  ];
  for (const itemIdChirho of valuesChirho) {
    if (expectedItemIdsChirho.has(itemIdChirho)) {
      throw new Error(`duplicate expected item id: ${itemIdChirho}`);
    }
    expectedItemIdsChirho.add(itemIdChirho);
  }
  return expectedItemIdsChirho;
}

export function assertExpectedItemIdsChirho(selectedItemIdsChirho: string[], expectedItemIdsChirho: Set<string>): void {
  if (expectedItemIdsChirho.size !== selectedItemIdsChirho.length) {
    throw new Error(
      "--expected-item-id-chirho or --expected-item-ids-chirho must name every selected item exactly once"
    );
  }
  const selectedKeyChirho = [...selectedItemIdsChirho].sort().join(",");
  const expectedKeyChirho = [...expectedItemIdsChirho].sort().join(",");
  if (selectedKeyChirho !== expectedKeyChirho) {
    throw new Error(`expected item id set [${expectedKeyChirho}] does not match selected item ids [${selectedKeyChirho}]`);
  }
}

export function expectedItemGuardArgsChirho(selectedItemIdsChirho: string[]): string[] {
  const argsChirho = [`--expected-item-count-chirho=${selectedItemIdsChirho.length}`];
  if (selectedItemIdsChirho.length !== 0) {
    argsChirho.push(`--expected-item-ids-chirho=${[...selectedItemIdsChirho].sort().join(",")}`);
  }
  return argsChirho;
}
