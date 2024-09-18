// tests/unit/app.test.js

const request = require('supertest');

const app = require('../../src/app');

describe('404 handler test', () => {
  test('error code 404 has occurred', () => request(app).get('/nonexistent-route').expect(404));
});
