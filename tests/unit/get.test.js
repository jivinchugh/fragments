// tests/unit/get.test.js

const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

// Mock the Fragment model
jest.mock('../../src/model/fragment');

describe('GET /v1/fragments', () => {
  // Authentication Tests
  describe('Authentication', () => {
    test('unauthenticated requests are denied', () =>
      request(app).get('/v1/fragments').expect(401)
    );

    test('incorrect credentials are denied', () =>
      request(app)
        .get('/v1/fragments')
        .auth('invalid@email.com', 'incorrect_password')
        .expect(401)
    );

    test('authenticated users get a fragments array', async () => {
      // Mock the Fragment.byUser to return an empty array
      Fragment.byUser.mockResolvedValue([]);

      const res = await request(app)
        .get('/v1/fragments')
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(Array.isArray(res.body.fragments)).toBe(true);
    });
  });

  // Successful Response Tests
  describe('Successful Responses', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
    });

    test('returns array of fragment ids when fragments exist', async () => {
      const mockFragments = [
        { id: 'fragment1', ownerId: 'user1@email.com' },
        { id: 'fragment2', ownerId: 'user1@email.com' }
      ];
      Fragment.byUser.mockResolvedValue(mockFragments);

      const res = await request(app)
        .get('/v1/fragments')
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.body.fragments).toEqual(mockFragments);
    });
  });

  // Error Cases
  describe('Error Handling', () => {
    test('returns 500 when database error occurs', async () => {
      Fragment.byUser.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .get('/v1/fragments')
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.error.message).toBe('Database error');
    });
  });

  // Response Format Tests
  describe('Response Format', () => {
    test('response includes correct content type header', async () => {
      Fragment.byUser.mockResolvedValue([]);

      const res = await request(app)
        .get('/v1/fragments')
        .auth('user1@email.com', 'password1');

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    test('response body has required properties', async () => {
      Fragment.byUser.mockResolvedValue([]);

      const res = await request(app)
        .get('/v1/fragments')
        .auth('user1@email.com', 'password1');

      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('fragments');
    });
  });
});
