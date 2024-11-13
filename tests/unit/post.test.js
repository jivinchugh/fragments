const request = require('supertest');
const app = require('../../src/app');

describe('POST /v1/fragments', () => {
  describe('Authentication', () => {
    test('unauthenticated requests are denied', () => {
      return request(app)
        .post('/v1/fragments')
        .expect(401);
    });

    test('incorrect credentials are denied', () => {
      return request(app)
        .post('/v1/fragments')
        .auth('invalid@email.com', 'incorrect_password')
        .expect(401);
    });

    test('missing credentials are denied', () => {
      return request(app)
        .post('/v1/fragments')
        .auth('', '')
        .expect(401);
    });
  });

  // Content Type Tests updated to match supported types
  describe('Content Type Validation', () => {
    test('missing Content-Type header returns 415', async () => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .send('test data');

      expect(res.status).toBe(415);
    });

    // Test all supported content types
    test.each([
      ['text/plain', 'Hello World'],
      ['text/markdown', '# Header'],
      ['text/html', '<p>Hello</p>'],
      ['text/csv', 'name,age\njohn,30'],
      ['application/json', { key: 'value' }],
      ['image/png', Buffer.from('fake-png-data')],
      ['image/jpeg', Buffer.from('fake-jpeg-data')],
      ['image/gif', Buffer.from('fake-gif-data')],
      ['image/webp', Buffer.from('fake-webp-data')],
      ['image/avif', Buffer.from('fake-avif-data')],
      ['application/yaml', 'key: value'],
    ])('supports %s content type', async (contentType, data) => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', contentType)
        .send(contentType === 'application/json' ? data :
          Buffer.isBuffer(data) ? data :
            JSON.stringify(data));

      expect(res.status).toBe(201);
      expect(res.body.fragment.type).toBe(contentType);
    });

    // Test unsupported content types
    test.each([
      'audio/mpeg',
      'video/mp4',
      'application/pdf',
      'invalid/type'
    ])('returns 415 for unsupported content type: %s', async (contentType) => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', contentType)
        .send('test data');

      expect(res.status).toBe(415);
      expect(res.body.error.code).toBe(415);
      expect(res.body.error.message).toBe('The content format for fragment (supplied by client) is not supported!!');
    });
  });

  // Extended Data Handling Tests
  describe('Data Handling', () => {
    test('handles empty content correctly', async () => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('');

      expect(res.status).toBe(201);
      expect(res.body.fragment.size).toBe(0);
    });

    test('handles large content correctly', async () => {
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB of data
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send(largeContent);

      expect(res.status).toBe(201);
      expect(res.body.fragment.size).toBe(largeContent.length);
    });

    test('size property matches actual content length', async () => {
      const content = 'Hello, World!';
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send(content);

      expect(res.status).toBe(201);
      expect(res.body.fragment.size).toBe(content.length);
    });
  });

  // Response Structure Tests
  describe('Response Structure', () => {
    test('successful response includes all required properties', async () => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('test content');

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('ok');
      expect(res.body.fragment).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          ownerId: expect.any(String),
          created: expect.any(String),
          updated: expect.any(String),
          type: expect.any(String),
          size: expect.any(Number),
        })
      );
    });

    test('response includes correct Content-Type header', async () => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('test content');

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    test('response includes Location header with correct URL', async () => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('test content');

      expect(res.headers.location).toBeDefined();
      expect(res.headers.location).toMatch(/^http:\/\/.*\/v1\/fragments\/[a-zA-Z0-9-_]+$/);
    });
  });

  // Data Handling Tests
  describe('Data Handling', () => {
    test('handles empty content correctly', async () => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('');

      expect(res.status).toBe(201);
      expect(res.body.fragment.size).toBe(0);
    });

    test('handles large content correctly', async () => {
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB of data
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send(largeContent);

      expect(res.status).toBe(201);
      expect(res.body.fragment.size).toBe(largeContent.length);
    });

    test('size property matches actual content length', async () => {
      const content = 'Hello, World!';
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send(content);

      expect(res.status).toBe(201);
      expect(res.body.fragment.size).toBe(content.length);
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    test('handles server errors gracefully', async () => {
      // Mock Fragment.save to throw an error
      jest.spyOn(console, 'error').mockImplementation(() => { }); // Suppress error logging
      const originalSave = require('../../src/model/fragment').Fragment.prototype.save;
      require('../../src/model/fragment').Fragment.prototype.save = async () => {
        throw new Error('Database error');
      };

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('test content');

      expect(res.status).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.error).toBeDefined();

      // Restore original save function
      require('../../src/model/fragment').Fragment.prototype.save = originalSave;
    });
  });

});
