import { createRequire } from 'node:module';
import { expect, it } from 'vitest';

// Exercise the dependency actually used by Expo Router, including the committed patch.
const mobileRequire = createRequire(new URL('../../apps/mobile/package.json', import.meta.url));
const routerRequire = createRequire(mobileRequire.resolve('expo-router/package.json'));
const queryRequire = createRequire(routerRequire.resolve('query-string'));
const decode = queryRequire('decode-uri-component') as (value: string) => string;

it('preserves query decoding and malformed-byte recovery through the CJS entry point', () => {
  expect(decode('trade+and+cooperation')).toBe('trade and cooperation');
  expect(decode('Fr%C3%A9d%C3%A9ric')).toBe('Frédéric');
  expect(decode('%C3%A5%FF')).toBe('å%FF');
  expect(decode('%FE%FF')).toBe('\uFFFD\uFFFD');
});

it('handles a long malformed deep-link parameter without recursive decoding', () => {
  const malformed = '%FF'.repeat(12000);
  expect(decode(malformed)).toBe(malformed);
}, 1000);
