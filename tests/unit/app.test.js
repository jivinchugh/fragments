// src/app.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('App Middleware and Routes', () => {
  // Test 404 Not Found Handler
  test('should return HTTP 404 for non-existent routes', async () => {
    const res = await request(app).get('/non-existent-route');
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      status: 'error',
      error: {
        message: 'not found',
        code: 404,
      },
    });
  });

  // Test Root Route
  test('should return a successful response for root route', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();
  });

  // Test custom 500 error
  test('should return HTTP 500 for internal server errors', async () => {
    const res = await request(app).get('/error'); // Test the /error route
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      status: 'error',
      error: {
        message: 'Internal server error',
        code: 500,
      },
    });
  });

  // Test client-related errors with status less than 500
  test('should handle client-related errors with status less than 500', async () => {
    // Simulate a client error (e.g., bad request)
    const res = await request(app)
      .get('/bad-request') // Ensure this route triggers a 400 error
      .query({ param: 'invalid' }); // Adjust as needed to trigger the error

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      status: 'error',
      error: {
        message: 'Bad Request', // Adjust message based on your implementation
        code: 400,
      },
    });
  });

  // Test error handling with no error message
  test('should handle errors without a specific message', async () => {
    app.use((req, res, next) => {
      const error = new Error();
      error.status = 503;
      next(error);
    });

    const res = await request(app).get('/error-without-message');
    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({
      status: 'error',
      error: {
        message: 'unable to process request', // Default message
        code: 503,
      },
    });
  });

  // Test for unauthorized access
  test('should return HTTP 401 for unauthorized access', async () => {
    const res = await request(app).get('/private-route');
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      status: 'error',
      error: {
        message: 'Unauthorized access',
        code: 401,
      },
    });
  });

  // Test for valid and invalid POST data
  test('should handle valid and invalid POST data', async () => {
    const validDataResponse = await request(app)
      .post('/data-route')
      .send({ key: 'validData' });
    expect(validDataResponse.statusCode).toBe(200);

    const invalidDataResponse = await request(app)
      .post('/data-route')
      .send({ key: 'invalidData' });
    expect(invalidDataResponse.statusCode).toBe(400);
    expect(invalidDataResponse.body).toEqual({
      status: 'error',
      error: {
        message: 'Invalid data',
        code: 400,
      },
    });
  });
});
