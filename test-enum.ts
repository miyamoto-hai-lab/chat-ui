import { z } from 'zod';

const emptyToUndefined = (val: unknown) => (val === '' ? undefined : val);

const preprocessEnum = <T extends string>(
  values: [T, ...T[]],
  defaultValue: T
) =>
  z.preprocess(
    (val) => (typeof val === 'string' && val !== '' ? val.toLowerCase() : emptyToUndefined(val)),
    z.enum(values).default(defaultValue)
  );

const schema = z.object({
  ROLE: preprocessEnum(['user', 'assistant'], 'assistant'),
  EXIT: preprocessEnum(['never', 'max', 'always'], 'always'),
  TURNS: z.preprocess(
    (val) => (typeof val === 'string' && val !== '' ? val.toUpperCase() : emptyToUndefined(val)),
    z.string().default('OFF')
  ),
});

const testCases = [
  { input: { ROLE: 'USER', EXIT: 'MAX', TURNS: 'on' }, expected: { ROLE: 'user', EXIT: 'max', TURNS: 'ON' } },
  { input: { ROLE: 'Assistant', EXIT: 'Always', TURNS: 'off' }, expected: { ROLE: 'assistant', EXIT: 'always', TURNS: 'OFF' } },
  { input: { ROLE: '', EXIT: '', TURNS: '' }, expected: { ROLE: 'assistant', EXIT: 'always', TURNS: 'OFF' } },
  { input: { ROLE: undefined, EXIT: undefined, TURNS: undefined }, expected: { ROLE: 'assistant', EXIT: 'always', TURNS: 'OFF' } },
];

testCases.forEach(({ input, expected }, index) => {
  try {
    const result = schema.parse(input);
    const passed = JSON.stringify(result) === JSON.stringify(expected);
    console.log(`Test Case ${index + 1}: ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) {
      console.error('Expected:', expected);
      console.error('Received:', result);
    }
  } catch (e) {
    console.error(`Test Case ${index + 1}: ERROR`, e);
  }
});
