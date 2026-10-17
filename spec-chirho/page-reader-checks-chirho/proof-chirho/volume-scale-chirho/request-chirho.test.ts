// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { describe, expect, test } from 'bun:test';
import { exportRangeChirho, pageWindowChirho } from '../../../../app-chirho/src/lib/server-chirho/catalog-chirho/request-chirho';

describe('bounded catalog request parameters', () => {
  test('forward inclusive and backward exclusive page-number cursors', () => {
    expect(pageWindowChirho(new URLSearchParams())).toEqual({ fromChirho: 1, beforeChirho: null });
    expect(pageWindowChirho(new URLSearchParams('from-chirho=148'))).toEqual({ fromChirho: 148, beforeChirho: null });
    expect(pageWindowChirho(new URLSearchParams('before-chirho=148'))).toEqual({ fromChirho: 1, beforeChirho: 148 });
  });
  test('ambiguous, malformed, negative and unsafe cursors refuse', () => {
    for (const queryChirho of ['from-chirho=1&before-chirho=5', 'from-chirho=1&from-chirho=2', 'before-chirho=2&before-chirho=3',
      ...['', '0', '-1', '1.5', 'NaN', '1e3', '0x10', '9007199254740992', '1%0a', '%3Cscript%3E'].map((valueChirho) => 'from-chirho=' + valueChirho)]) {
      expect(() => pageWindowChirho(new URLSearchParams(queryChirho))).toThrow();
    }
  });
  test('export requires an explicit ordered range; caller limits cannot enlarge it', () => {
    expect(exportRangeChirho(new URLSearchParams('volume-chirho=3&from-chirho=51&to-chirho=75'))).toEqual({ volumeChirho: 3, fromChirho: 51, toChirho: 75 });
    for (const queryChirho of ['volume-chirho=3', 'volume-chirho=3&from-chirho=2', 'from-chirho=1&to-chirho=5',
      'volume-chirho=3&from-chirho=5&to-chirho=1', 'volume-chirho=3&from-chirho=0&to-chirho=1',
      'volume-chirho=3&from-chirho=1&to-chirho=2&to-chirho=20000']) {
      expect(() => exportRangeChirho(new URLSearchParams(queryChirho))).toThrow();
    }
    expect(pageWindowChirho(new URLSearchParams('limit-chirho=999999'))).toEqual({ fromChirho: 1, beforeChirho: null });
  });
});
