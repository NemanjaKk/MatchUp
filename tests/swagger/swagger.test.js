const r2 = require('r2');

const url = 'http://localhost:3000/swagger';

// unit tests

// API tests
test('swagger is working test', async () => {
  const data = await r2(url).text;
  expect(data).not.toBe(
    'Sorry, there was an error with the swagger document and it is currently not available',
  );
});