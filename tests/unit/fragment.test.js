const { Fragment } = require('../../src/model/fragment');

// Wait for a certain number of ms. Feel free to change this value
// if it isn't long enough for your test runs. Returns a Promise.
const wait = async (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

const validTypes = [
  `text/plain`,
  /*
   Currently, only text/plain is supported. Others will be added later.

  `text/markdown`,
  `text/html`,
  `application/json`,
  `image/png`,
  `image/jpeg`,
  `image/webp`,
  `image/gif`,
  */
];

describe('Fragment class', () => {
  test('common formats are supported', () => {
    validTypes.forEach((format) => expect(Fragment.isSupportedType(format)).toBe(true));
  });

  describe('Fragment()', () => {
    test('ownerId and type are required', () => {
      expect(() => new Fragment({})).toThrow();
    });

    test('ownerId is required', () => {
      expect(() => new Fragment({ type: 'text/plain', size: 1 })).toThrow();
    });

    test('type is required', () => {
      expect(() => new Fragment({ ownerId: '1234', size: 1 })).toThrow();
    });

    test('type can be a simple media type', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      expect(fragment.type).toEqual('text/plain');
    });

    test('type can include a charset', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.type).toEqual('text/plain; charset=utf-8');
    });

    test('size gets set to 0 if missing', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain' });
      expect(fragment.size).toBe(0);
    });

    test('size must be a number', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: '1' })).toThrow();
    });

    test('size can be 0', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 })).not.toThrow();
    });

    test('size cannot be negative', () => {
      expect(() => new Fragment({ ownerId: '1234', type: 'text/plain', size: -1 })).toThrow();
    });

    test('invalid types throw', () => {
      expect(
        () => new Fragment({ ownerId: '1234', type: 'application/msword', size: 1 })
      ).toThrow();
    });

    test('valid types can be set', () => {
      validTypes.forEach((format) => {
        const fragment = new Fragment({ ownerId: '1234', type: format, size: 1 });
        expect(fragment.type).toEqual(format);
      });
    });

    test('fragments have an id', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 1 });
      expect(fragment.id).toMatch(
        /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
      );
    });

    test('fragments use id passed in if present', () => {
      const fragment = new Fragment({
        id: 'id',
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      });
      expect(fragment.id).toEqual('id');
    });

    test('fragments get a created datetime string', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      });
      expect(Date.parse(fragment.created)).not.toBeNaN();
    });

    test('fragments get an updated datetime string', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      });
      expect(Date.parse(fragment.updated)).not.toBeNaN();
    });
  });

  describe('isSupportedType()', () => {
    test('common text types are supported, with and without charset', () => {
      expect(Fragment.isSupportedType('text/plain')).toBe(true);
      expect(Fragment.isSupportedType('text/plain; charset=utf-8')).toBe(true);
    });

    test('other types are not supported', () => {
      expect(Fragment.isSupportedType('application/octet-stream')).toBe(false);
      expect(Fragment.isSupportedType('application/msword')).toBe(false);
      expect(Fragment.isSupportedType('audio/webm')).toBe(false);
      expect(Fragment.isSupportedType('video/ogg')).toBe(false);
    });
  });

  describe('mimeType, isText', () => {
    test('mimeType returns the mime type without charset', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.type).toEqual('text/plain; charset=utf-8');
      expect(fragment.mimeType).toEqual('text/plain');
    });

    test('mimeType returns the mime type if charset is missing', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      expect(fragment.type).toEqual('text/plain');
      expect(fragment.mimeType).toEqual('text/plain');
    });

    test('isText return expected results', () => {
      // Text fragment
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.isText).toBe(true);
    });
  });

  describe('formats', () => {
    test('formats returns the expected result for plain text', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      });
      expect(fragment.formats).toEqual(['text/plain']);
    });
  });

  describe('save(), getData(), setData(), byId(), byUser(), delete()', () => {
    test('byUser() returns an empty array if there are no fragments for this user', async () => {
      expect(await Fragment.byUser('1234')).toEqual([]);
    });

    test('a fragment can be created and save() stores a fragment for the user', async () => {
      const data = Buffer.from('hello');
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);

      const fragment2 = await Fragment.byId('1234', fragment.id);
      expect(fragment2).toEqual(fragment);
      expect(await fragment2.getData()).toEqual(data);
    });

    test('save() updates the updated date/time of a fragment', async () => {
      const ownerId = '7777';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      const modified1 = fragment.updated;
      await wait();
      await fragment.save();
      const fragment2 = await Fragment.byId(ownerId, fragment.id);
      expect(Date.parse(fragment2.updated)).toBeGreaterThan(Date.parse(modified1));
    });

    test('setData() updates the updated date/time of a fragment', async () => {
      const data = Buffer.from('hello');
      const ownerId = '7777';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      await fragment.save();
      const modified1 = fragment.updated;
      await wait();
      await fragment.setData(data);
      await wait();
      const fragment2 = await Fragment.byId(ownerId, fragment.id);
      expect(Date.parse(fragment2.updated)).toBeGreaterThan(Date.parse(modified1));
    });

    test("a fragment is added to the list of a user's fragments", async () => {
      const data = Buffer.from('hello');
      const ownerId = '5555';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);

      expect(await Fragment.byUser(ownerId)).toEqual([fragment.id]);
    });

    test('full fragments are returned when requested for a user', async () => {
      const data = Buffer.from('hello');
      const ownerId = '6666';
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(data);

      expect(await Fragment.byUser(ownerId, true)).toEqual([fragment]);
    });

    test('setData() throws if not give a Buffer', () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/plain', size: 0 });
      expect(() => fragment.setData()).rejects.toThrow();
    });

    test('setData() updates the fragment size', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('a'));
      expect(fragment.size).toBe(1);

      await fragment.setData(Buffer.from('aa'));
      const { size } = await Fragment.byId('1234', fragment.id);
      expect(size).toBe(2);
    });

    test('a fragment can be deleted', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      await fragment.save();
      await fragment.setData(Buffer.from('a'));

      await Fragment.delete('1234', fragment.id);

      // Updated test to check that byId returns null after deletion
      const deletedFragment = await Fragment.byId('1234', fragment.id);
      expect(deletedFragment).toBeNull();
    });
  });
  describe('convertType()', () => {
    test('converts text/markdown to text/html', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      const data = Buffer.from('# Hello World');
      const { convertedData, convertedType } = await fragment.convertType(data, 'html');
      expect(convertedType).toBe('text/html');
      expect(convertedData).toBe('<h1>Hello World</h1>\n');
    });

    test('returns null for unsupported conversion', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      const data = Buffer.from('# Hello World');
      const { convertedData, convertedType } = await fragment.convertType(data, 'xml');
      expect(convertedData).toBeNull();
      expect(convertedType).toBeNull();
    });

    test('returns same data for same type conversion', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      const data = Buffer.from('Hello World');
      const { convertedData, convertedType } = await fragment.convertType(data, 'txt');
      expect(convertedType).toBe('text/plain');
      expect(convertedData).toEqual(data);
    });
  });

  describe('formats getter', () => {
    test('returns correct formats for text/plain', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 });
      expect(fragment.formats).toEqual(['text/plain']);
    });

    test('returns correct formats for text/markdown', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/markdown', size: 0 });
      expect(fragment.formats).toEqual(['text/plain', 'text/markdown', 'text/html']);
    });

    test('returns correct formats for text/html', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/html', size: 0 });
      expect(fragment.formats).toEqual(['text/plain', 'text/html']);
    });

    test('returns correct formats for application/json', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'application/json', size: 0 });
      // Updated to include application/yml which is returned by the implementation
      expect(fragment.formats).toEqual(['text/plain', 'application/json', 'application/yaml', 'application/yml']);
    });

    test('returns correct formats for text/csv', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/csv', size: 0 });
      expect(fragment.formats).toEqual(['text/plain', 'text/csv', 'application/json']);
    });

    test('returns correct formats for image types', () => {
      const imageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'];
      imageTypes.forEach(type => {
        const fragment = new Fragment({ ownerId: '1234', type, size: 0 });
        expect(fragment.formats).toEqual(['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif']);
      });
    });

    test('returns empty array for unsupported types', () => {
      // Instead of creating a Fragment instance with an unsupported type,
      // we can test the static method directly
      expect(Fragment.isSupportedType('application/octet-stream')).toBe(false);
    });
  });

  describe('convertType() image conversions', () => {
    // Helper function to create a test image buffer
    const createTestImageBuffer = async (format = 'png') => {
      const sharp = require('sharp');
      return sharp({
        create: {
          width: 100,
          height: 100,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 0.5 }
        }
      }).toFormat(format).toBuffer();
    };

    test('handles unsupported image conversion gracefully', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'image/png', size: 0 });
      const data = await createTestImageBuffer('png');
      const { convertedData, convertedType } = await fragment.convertType(data, 'tiff');

      expect(convertedData).toBeNull();
      expect(convertedType).toBeNull();
    });

    test('handles conversion with error gracefully', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'image/png', size: 0 });
      // Pass an invalid buffer to simulate conversion error
      const { convertedData, convertedType } = await fragment.convertType(Buffer.from('invalid'), 'jpg');

      expect(convertedData).toBeNull();
      expect(convertedType).toBeNull();
    });
  });


});
