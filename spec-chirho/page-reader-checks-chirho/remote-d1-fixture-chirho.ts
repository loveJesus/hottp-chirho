// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
// Explicit opt-in release smoke. Creates ONLY an empty disposable D1, executes
// the same synthetic SQL tests through the documented batch API, then removes it.
export async function remoteFixtureChirho(): Promise<{ dbChirho: D1Database; disposeChirho: () => Promise<void> }> {
  if (process.env.HOTTP_REMOTE_D1_SMOKE_CHIRHO !== 'create-disposable-chirho') throw new Error('Remote smoke requires explicit opt-in.');
  const baseChirho = 'https://api.cloudflare.com/client/v4/accounts/aecd5616f7ef88323e52b6406ba384bd/d1/database';
  const headersChirho = { 'X-Auth-Email': process.env.CLOUDFLARE_GLOBAL_API_EMAIL_CHIRHO!, 'X-Auth-Key': process.env.CLOUDFLARE_GLOBAL_API_KEY_CHIRHO!, 'Content-Type': 'application/json' };
  async function apiChirho(pathChirho: string, methodChirho: string, bodyChirho?: unknown) {
    const responseChirho = await fetch(baseChirho + pathChirho, { method: methodChirho, headers: headersChirho, body: bodyChirho === undefined ? undefined : JSON.stringify(bodyChirho) });
    const dataChirho = await responseChirho.json() as { success: boolean; result: unknown; errors: { message: string }[] };
    if (!responseChirho.ok || !dataChirho.success) throw new Error(`D1 smoke API ${responseChirho.status}: ${JSON.stringify(dataChirho.errors)}`);
    return dataChirho.result;
  }
  const nameChirho = `hottp-reader-smoke-${crypto.randomUUID().slice(0, 8)}-chirho`;
  const createdChirho = await apiChirho('', 'POST', { name: nameChirho }) as { uuid: string; name: string };
  const idChirho = createdChirho.uuid;
  if (!/^[a-f0-9-]{36}$/.test(idChirho) || idChirho === '873a8eda-1551-4ee7-9e3b-9b281b6c1635') throw new Error('Unsafe smoke database target.');
  console.log(`Created disposable D1 ${nameChirho} (${idChirho}); production database excluded.`);
  type QueryChirho = { sql: string; params: unknown[] };
  type ResultChirho = { results: Record<string, unknown>[]; success: boolean; meta: unknown };
  const queryChirho = async (statementsChirho: QueryChirho[]): Promise<ResultChirho[]> => await apiChirho(`/${idChirho}/query`, 'POST', { batch: statementsChirho }) as ResultChirho[];
  function prepareChirho(sqlChirho: string, paramsChirho: unknown[] = []) {
    return {
      queryChirho: { sql: sqlChirho, params: paramsChirho },
      bind: (...valuesChirho: unknown[]) => prepareChirho(sqlChirho, valuesChirho),
      run: async () => (await queryChirho([{ sql: sqlChirho, params: paramsChirho }]))[0],
      all: async () => (await queryChirho([{ sql: sqlChirho, params: paramsChirho }]))[0],
      first: async (columnChirho?: string) => {
        const rowChirho = (await queryChirho([{ sql: sqlChirho, params: paramsChirho }]))[0]?.results[0] ?? null;
        return columnChirho && rowChirho ? rowChirho[columnChirho] : rowChirho;
      },
    };
  }
  return {
    dbChirho: { prepare: prepareChirho, batch: async (statementsChirho: ReturnType<typeof prepareChirho>[]) => queryChirho(statementsChirho.map((statementChirho) => statementChirho.queryChirho)) } as unknown as D1Database,
    disposeChirho: async () => {
      const currentChirho = await apiChirho(`/${idChirho}`, 'GET') as { uuid: string; name: string };
      if (currentChirho.uuid !== idChirho || currentChirho.name !== nameChirho) throw new Error('Refusing cleanup: disposable database identity mismatch.');
      await apiChirho(`/${idChirho}`, 'DELETE');
      console.log(`Removed synthetic-only disposable D1 ${nameChirho} (${idChirho}).`);
    },
  };
}
