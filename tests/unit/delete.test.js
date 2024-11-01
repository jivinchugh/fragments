const request = require('supertest');
const express = require('express');
const { Fragment } = require('../../src/model/fragment');
const deleteRoute = require('../../src/routes/api/delete');
const app = express();
app.use(express.json());

app.use((req, res, next) => {
  req.user = { id: 'ownerId' };
  next();
});

app.use('/v1/fragment', deleteRoute);

jest.mock('../../src/model/fragment');

describe('DELETE /v1/fragment/:id', () => {
  test('basic test', () => {
    expect(true).toBe(true);
  });
  describe('DELETE /v1/fragment/:id', () => {
    const mockFragment = {
      id: '06dbf21a-52c0-4d03-87a9-8d567bd8673e',
      ownerId: 'ownerId',
      created: '2024-10-05T20:44:37.547Z',
      updated: '2024-10-05T20:44:37.548Z',
      size: 14,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should delete a fragment when found', async () => {
      Fragment.byId.mockResolvedValue(mockFragment);
      Fragment.delete.mockResolvedValue();

      const response = await request(app)
        .delete('/v1/fragment/06dbf21a-52c0-4d03-87a9-8d567bd8673e');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        message: 'Fragment deleted',
      });
    });

    test('should return 404 if fragment not found', async () => {
      Fragment.byId.mockResolvedValue(null);

      const response = await request(app)
        .delete('/v1/fragment/invalid-id');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        status: 'error',
        error: {
          code: 404,
          message: 'Fragment not found',
        },
      });
    });

    test('should return 500 on error', async () => {
      const errorMessage = 'Database connection error';
      Fragment.byId.mockRejectedValue(new Error(errorMessage));

      const response = await request(app)
        .delete('/v1/fragment/06dbf21a-52c0-4d03-87a9-8d567bd8673e');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        status: 'error',
        error: {
          code: 500,
          message: 'An error occurred while fetching the fragment',
        },
      });
    });
  });
});
