/**
 * Mock para Firebase Realtime Database
 *
 * Este archivo proporciona mocks simplificados para las funciones de Firebase
 * que se utilizan en los tests.
 */

// Mock data para salas
export const mockRoomData = {
  testroom: {
    metadata: {
      createdAt: 1616161616,
      seriesKey: 'fibonacci',
      seriesValues: [1, 2, 3, 5, 8, 13, 21, '?', '∞', '☕'],
    },
    sessions: {
      session1: {
        active: true,
        reveal: false,
        currentIssueId: 'issue1',
        startedAt: 1616161616,
      }
    },
    participants: {
      participant1: {
        name: 'Test User',
        joinedAt: 1616161616,
        active: true,
      }
    },
    issues: {
      issue1: {
        key: 'PROJ-1',
        summary: 'Test issue',
        createdAt: 1616161616,
        status: 'pending',
        average: null,
      }
    }
  }
};

// Mock para Firebase
jest.mock('firebase/database', () => {
  // Función para simular la navegación en los datos
  const getDataFromPath = (path: string) => {
    if (path.startsWith('rooms/testroom')) {
      return mockRoomData.testroom;
    }
    return null;
  };

  return {
    // Mock para ref
    ref: jest.fn((db, path) => ({ db, path })),
    
    // Mock para onValue
    onValue: jest.fn((reference, callback) => {
      const data = getDataFromPath(reference.path);
      
      callback({
        val: () => data,
        exists: () => data !== null,
      });
      
      // Retorna una función de unsubscribe
      return jest.fn();
    }),
    
    // Mock para update
    update: jest.fn(() => Promise.resolve()),
    
    // Mock para push
    push: jest.fn(() => ({
      key: `mock-key-${Math.random().toString(36).substring(2, 8)}`,
    })),
    
    // Mock para get
    get: jest.fn((reference) => {
      const data = getDataFromPath(reference.path);
      
      return Promise.resolve({
        val: () => data,
        exists: () => data !== null,
      });
    }),
    
    // Mock para la base de datos
    realtimeDb: {},
    
    // Mock para getDatabase
    getDatabase: jest.fn(() => ({})),
  };
});

// Mock para firebase/app
jest.mock('firebase/app', () => {
  return {
    initializeApp: jest.fn(() => ({})),
  };
});

// Mock para firebase/firestore
jest.mock('firebase/firestore', () => {
  return {
    getFirestore: jest.fn(() => ({})),
  };
});

// Helper para resetear mocks entre tests
export const resetFirebaseMocks = () => {
  jest.clearAllMocks();
};

// Este archivo no es un test, es un helper para los tests
// Añadimos un test dummy para evitar el error de Jest
describe('Firebase Mocks', () => {
  it('should be a mock helper', () => {
    expect(true).toBe(true);
  });
});