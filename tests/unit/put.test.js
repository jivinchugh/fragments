const request = require('supertest');
const express = require('express');
const { Fragment } = require('../../src/model/fragment');
const putRoute = require('../../src/routes/api/put');
const app = express();
app.use(express.json());

app.use((req, res, next) => {
  req.user = { id: 'ownerId' };
  next();
});

app.use('/v1/fragment', putRoute);

jest.mock('../../src/model/fragment');

describe('PUT /v1/fragment/:id/:ext', () => {
  test('basic test', () => {
    expect(true).toBe(true);
  });

  describe('PUT /v1/fragment/:id/:ext', () => {
    const mockFragment = {
      id: '06dbf21a-52c0-4d03-87a9-8d567bd8673e',
      ownerId: 'ownerId',
      created: '2024-10-05T20:44:37.547Z',
      updated: '2024-10-05T20:44:37.548Z',
      type: 'text/plain',
      size: 14,
      getData: jest.fn(),
      convertType: jest.fn(),
      setData: jest.fn(),
      save: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should update a fragment when found and conversion is successful', async () => {
      // Mock the behavior of the fragment retrieval and conversion
      Fragment.byId.mockResolvedValue(mockFragment);
      mockFragment.getData.mockResolvedValue('currentData');
      mockFragment.convertType.mockResolvedValue({ convertedData: 'newData', convertedType: 'newType' });

      // Perform the PUT request
      const response = await request(app)
        .put('/v1/fragment/06dbf21a-52c0-4d03-87a9-8d567bd8673e/newExt');

      // Verify the response status
      expect(response.status).toBe(200);

      // Create a new expected fragment object including the extension
      const expectedFragment = {
        id: '06dbf21a-52c0-4d03-87a9-8d567bd8673e',
        ownerId: 'ownerId',
        created: '2024-10-05T20:44:37.547Z',
        updated: '2024-10-05T20:44:37.548Z',
        size: 14,
        type: 'newType',
      };

      // Check the response body
      expect(response.body).toEqual({
        status: 'ok',
        fragment: expectedFragment,
      });
    });

    test('should return 404 if fragment not found', async () => {
      Fragment.byId.mockResolvedValue(null);

      const response = await request(app)
        .put('/v1/fragment/invalid-id/newExt');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        status: 'error',
        error: {
          code: 404,
          message: 'Fragment not found',
        },
      });
    });

    test('should return 415 if conversion is invalid', async () => {
      Fragment.byId.mockResolvedValue(mockFragment);
      mockFragment.getData.mockResolvedValue('currentData');
      mockFragment.convertType.mockResolvedValue({ convertedData: null });

      const response = await request(app)
        .put('/v1/fragment/06dbf21a-52c0-4d03-87a9-8d567bd8673e/invalidExt');

      expect(response.status).toBe(415);
      expect(response.body).toEqual({
        status: 'error',
        error: {
          code: 415,
          message: 'Fragment cannot be converted to this type or extension is invalid',
        },
      });
    });

    test('should return 500 on error', async () => {
      const errorMessage = 'Database connection error';
      Fragment.byId.mockRejectedValue(new Error(errorMessage));

      const response = await request(app)
        .put('/v1/fragment/06dbf21a-52c0-4d03-87a9-8d567bd8673e/newExt');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        status: 'error',
        error: {
          code: 500,
          message: 'An error occurred while updating the fragment extension',
        },
      });
    });
  });
});
