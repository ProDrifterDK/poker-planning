/**
 * Mock para firebaseConfig.ts
 *
 * Este archivo proporciona mocks para la configuración de Firebase
 * que se utilizan en los tests.
 */

// Mock para firebase/app
jest.mock('firebase/app', () => {
  return {
    initializeApp: jest.fn(() => ({
      name: 'mock-app',
      options: {
        projectId: 'mock-project-id',
        databaseURL: 'https://mock-database-url.firebaseio.com',
      },
    })),
  };
});

// Mock para firebase/firestore
jest.mock('firebase/firestore', () => {
  return {
    getFirestore: jest.fn(() => ({
      type: 'firestore',
      app: {
        name: 'mock-app',
      },
    })),
  };
});

// Mock para firebase/database
jest.mock('firebase/database', () => {
  return {
    getDatabase: jest.fn(() => ({
      type: 'database',
      app: {
        name: 'mock-app',
      },
    })),
    ref: jest.fn((db, path) => ({ db, path })),
    onValue: jest.fn((reference, callback) => {
      callback({
        val: () => ({}),
        exists: () => true,
      });
      return jest.fn();
    }),
    update: jest.fn(() => Promise.resolve()),
    push: jest.fn(() => ({
      key: `mock-key-${Math.random().toString(36).substring(2, 8)}`,
    })),
    get: jest.fn(() => Promise.resolve({
      val: () => ({}),
      exists: () => true,
    })),
  };
});

// Mock para src/lib/firebaseConfig.ts
jest.mock('@/lib/firebaseConfig', () => {
  return {
    firestore: {
      type: 'firestore',
      app: {
        name: 'mock-app',
      },
    },
    realtimeDb: {
      type: 'database',
      app: {
        name: 'mock-app',
      },
    },
  };
});

// Este archivo no es un test, es un helper para los tests
// Añadimos un test dummy para evitar el error de Jest
describe('Firebase Config Mocks', () => {
  it('should be a mock helper', () => {
    expect(true).toBe(true);
  });
});