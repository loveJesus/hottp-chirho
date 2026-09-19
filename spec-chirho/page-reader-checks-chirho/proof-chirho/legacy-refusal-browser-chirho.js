// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
// Only disposable local D1. All content requests here must be refused.
async (parentPageChirho) => {
  const contextChirho = await parentPageChirho.context().browser().newContext();
  const originChirho = 'http://127.0.0.1:5182', evidenceChirho = [];
  try {
    const loginChirho = await contextChirho.request.post(originChirho + '/reviewer-chirho?/loginChirho', { headers: { Origin: originChirho, Accept: 'text/html' }, form: { user_chirho: 'fixture-reviewer-chirho', password_chirho: 'fixture-password-for-local-tests-only-chirho' }, maxRedirects: 0 });
    if (loginChirho.status() !== 303) throw new Error('Fixture sign-in failed');
    const eventsChirho = async () => (await (await contextChirho.request.get(originChirho + '/api-chirho/events-chirho')).json()).eventsChirho;
    const beforeChirho = await eventsChirho();
    const validChirho = { pageIdChirho: 1, aggregateTypeChirho: 'word-chirho', eventTypeChirho: 'word-verified-chirho', payloadChirho: {} };
    for (const bodyChirho of [null, {}, { ...validChirho, pageIdChirho: -1 }, { ...validChirho, payloadChirho: [] }, { ...validChirho, aggregateTypeChirho: 'segment-chirho' }, { ...validChirho, eventTypeChirho: 'segment-reading-confirmed-chirho', payloadChirho: { segmentIdChirho: 9793 } }, { ...validChirho, eventTypeChirho: 'unknown-chirho' }]) {
      const responseChirho = await contextChirho.request.post(originChirho + '/api-chirho/events-chirho', { headers: { Origin: originChirho, 'Content-Type': 'application/json' }, data: JSON.stringify(bodyChirho) });
      if (responseChirho.status() !== 400) throw new Error(`Expected 400, got ${responseChirho.status()}`);
      evidenceChirho.push('invalid or reserved legacy event refused before insert');
    }
    if (JSON.stringify(beforeChirho) !== JSON.stringify(await eventsChirho())) throw new Error('Refused requests changed event history');
    evidenceChirho.push('all refused requests leave copied event history unchanged');
    return { assertionsChirho: evidenceChirho.length, evidenceChirho };
  } finally { await contextChirho.close(); }
}
