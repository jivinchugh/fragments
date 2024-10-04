const {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
} = require('../../src/model/data/memory');

const MemoryDB = require('../../src/model/data/memory/memory-db');

// Mock the MemoryDB used in the actual implementation
jest.mock('../../src/model/data/memory/memory-db', () => {
  return jest.fn().mockImplementation(() => {
    const db = {};
    return {
      put: (ownerId, id, value) => {
        db[`${ownerId}:${id}`] = value;
        return Promise.resolve();
      },
      get: (ownerId, id) => {
        return Promise.resolve(db[`${ownerId}:${id}`] || null);
      },
      clear: () => {
        // Add a clear method for testing
        Object.keys(db).forEach(key => delete db[key]);
        return Promise.resolve();
      },
    };
  });
});

// Create an in-memory database for testing
const data = new MemoryDB();

describe('In-Memory Fragment Database', () => {
  const fragment = {
    id: 'fragment1',
    ownerId: 'owner123',
    type: 'text/plain',
  };

  const buffer = Buffer.from('Some fragment data');

  beforeEach(async () => {
    // Clear the in-memory database before each test
    await data.clear();
  });

  // Test writing a fragment and verifying it can be read back
  test('should write a fragment and read it back', async () => {
    await writeFragment(fragment); // Write the fragment
    const result = await readFragment(fragment.ownerId, fragment.id); // Read the fragment
    expect(result).toEqual(fragment); // Check if the read result matches the written fragment
  });

  // Test writing fragment data and verifying it can be read back
  test('should write fragment data and read it back', async () => {
    await writeFragmentData(fragment.ownerId, fragment.id, buffer); // Write fragment data
    const result = await readFragmentData(fragment.ownerId, fragment.id); // Read the fragment data
    expect(result).toEqual(buffer); // Check if the read data matches the written buffer
  });
});
