// Importar los mocks primero para que se apliquen antes de importar los módulos reales
import '../mocks/firebaseConfigMock';
import '../mocks/firebaseMocks';

// Ahora importamos los módulos que usan Firebase
import { useRoomStore } from '@/store/roomStore';
import { useErrorStore, ErrorType } from '@/store/errorStore';
import { resetFirebaseMocks } from '../mocks/firebaseMocks';

describe('Room Store Integration', () => {
  // Resetear el estado de los stores y mocks antes de cada test
  beforeEach(() => {
    // Resetear el store de salas
    useRoomStore.setState({
      roomId: null,
      sessionId: null,
      participants: [],
      issues: [],
      votes: {},
      currentIssueId: null,
      reveal: false,
      estimationOptions: [1, 2, 3, 5, 8, 13, 21, "?", "∞", "☕"],
      seriesKey: "fibonacci",
      isLoading: false,
      error: null,
    });

    // Resetear el store de errores
    useErrorStore.setState({
      currentError: null,
      errorHistory: [],
    });

    // Resetear los mocks de Firebase
    resetFirebaseMocks();

    // Mock console.error para evitar ruido en los tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createRoom', () => {
    it('should create a room with the specified series', async () => {
      // Arrange
      const { createRoom } = useRoomStore.getState();
      const seriesKey = 'fibonacci';
      
      // Act
      const roomId = await createRoom(seriesKey);
      
      // Assert
      const state = useRoomStore.getState();
      expect(roomId).toBeTruthy();
      expect(state.roomId).toBe(roomId);
      expect(state.seriesKey).toBe(seriesKey);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set error state when creation fails', async () => {
      // Arrange
      const { createRoom } = useRoomStore.getState();
      
      // Mock update to fail
      const updateMock = jest.requireMock('firebase/database').update;
      updateMock.mockImplementationOnce(() => Promise.reject(new Error('Firebase error')));
      
      // Act & Assert
      await expect(createRoom('fibonacci')).rejects.toThrow();
      
      // Check error state
      const roomState = useRoomStore.getState();
      expect(roomState.isLoading).toBe(false);
      expect(roomState.error).toBeTruthy();
      
      // Check error store
      const errorState = useErrorStore.getState();
      expect(errorState.currentError).not.toBeNull();
      expect(errorState.currentError?.type).toBe(ErrorType.ROOM_CREATION_FAILED);
    });
  });

  describe('joinRoomWithName', () => {
    it('should join an existing room', async () => {
      // Arrange
      const { joinRoomWithName } = useRoomStore.getState();
      const roomId = 'testroom';
      const name = 'Test User';
      
      // Act
      await joinRoomWithName(roomId, name);
      
      // Assert
      const state = useRoomStore.getState();
      expect(state.roomId).toBe(roomId);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set error when room does not exist', async () => {
      // Arrange
      const { joinRoomWithName } = useRoomStore.getState();
      const roomId = 'nonexistent';
      const name = 'Test User';
      
      // Mock get to return null for non-existent room
      const getMock = jest.requireMock('firebase/database').get;
      getMock.mockImplementationOnce(() => Promise.resolve({
        exists: () => false,
        val: () => null,
      }));
      
      // Act & Assert
      await expect(joinRoomWithName(roomId, name)).rejects.toThrow();
      
      // Check error state
      const roomState = useRoomStore.getState();
      expect(roomState.isLoading).toBe(false);
      expect(roomState.error).toBeTruthy();
      
      // Check error store
      const errorState = useErrorStore.getState();
      expect(errorState.currentError).not.toBeNull();
      expect(errorState.currentError?.type).toBe(ErrorType.ROOM_NOT_FOUND);
    });
  });

  describe('selectEstimation', () => {
    it('should update participant estimation', async () => {
      // Arrange - Join a room first
      const { joinRoomWithName, selectEstimation } = useRoomStore.getState();
      await joinRoomWithName('testroom', 'Test User');
      
      // Act
      await selectEstimation(5);
      
      // Assert
      // Since we're mocking Firebase, we can't easily check if the data was updated
      // But we can check that no errors occurred
      const state = useRoomStore.getState();
      expect(state.error).toBeNull();
      
      // Check that update was called
      const updateMock = jest.requireMock('firebase/database').update;
      expect(updateMock).toHaveBeenCalled();
    });

    it('should not allow estimation when reveal is true', async () => {
      // Arrange - Join a room first and set reveal to true
      const { joinRoomWithName, selectEstimation } = useRoomStore.getState();
      await joinRoomWithName('testroom', 'Test User');
      useRoomStore.setState({ reveal: true });
      
      // Act
      await selectEstimation(5);
      
      // Assert
      // Check error store
      const errorState = useErrorStore.getState();
      expect(errorState.currentError).not.toBeNull();
      expect(errorState.currentError?.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(errorState.currentError?.message).toContain('No puedes cambiar tu estimación');
    });
  });

  describe('revealEstimations', () => {
    it('should set reveal to true', async () => {
      // Arrange - Join a room first
      const { joinRoomWithName, revealEstimations } = useRoomStore.getState();
      await joinRoomWithName('testroom', 'Test User');
      
      // Act
      await revealEstimations();
      
      // Assert
      const state = useRoomStore.getState();
      expect(state.reveal).toBe(true);
      
      // Check that update was called
      const updateMock = jest.requireMock('firebase/database').update;
      expect(updateMock).toHaveBeenCalled();
    });
  });

  describe('startNewVote', () => {
    it('should reset voting state', async () => {
      // Arrange - Join a room and reveal estimations
      const { joinRoomWithName, revealEstimations, startNewVote } = useRoomStore.getState();
      await joinRoomWithName('testroom', 'Test User');
      await revealEstimations();
      
      // Act
      await startNewVote();
      
      // Assert
      const state = useRoomStore.getState();
      expect(state.reveal).toBe(false);
      
      // Check that update was called
      const updateMock = jest.requireMock('firebase/database').update;
      expect(updateMock).toHaveBeenCalled();
    });
  });

  describe('addIssue', () => {
    it('should add a new issue', async () => {
      // Arrange - Join a room first
      const { joinRoomWithName, addIssue } = useRoomStore.getState();
      await joinRoomWithName('testroom', 'Test User');
      
      // Act
      await addIssue('PROJ-3', 'New test issue');
      
      // Assert
      // Check that push and update were called
      const pushMock = jest.requireMock('firebase/database').push;
      const updateMock = jest.requireMock('firebase/database').update;
      expect(pushMock).toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalled();
    });

    it('should validate issue data', async () => {
      // Arrange - Join a room first
      const { joinRoomWithName, addIssue } = useRoomStore.getState();
      await joinRoomWithName('testroom', 'Test User');
      
      // Act
      await addIssue('', '');
      
      // Assert
      // Check error store
      const errorState = useErrorStore.getState();
      expect(errorState.currentError).not.toBeNull();
      expect(errorState.currentError?.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(errorState.currentError?.message).toContain('La clave y el resumen del issue son obligatorios');
    });
  });

  describe('selectCurrentIssue', () => {
    it('should update current issue', async () => {
      // Arrange - Join a room first
      const { joinRoomWithName, selectCurrentIssue } = useRoomStore.getState();
      await joinRoomWithName('testroom', 'Test User');
      
      // Act
      await selectCurrentIssue('issue1');
      
      // Assert
      const state = useRoomStore.getState();
      expect(state.currentIssueId).toBe('issue1');
      
      // Check that update was called
      const updateMock = jest.requireMock('firebase/database').update;
      expect(updateMock).toHaveBeenCalled();
    });
  });
});