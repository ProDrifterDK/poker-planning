import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Integration, IntegrationResult, IssueData } from '@/integrations';
import { IntegrationFactory } from '@/integrations';

interface IntegrationState {
  // Lista de configuraciones de integración
  integrations: Integration[];
  
  // Estado de carga y error
  isLoading: boolean;
  error: string | null;
}

interface IntegrationActions {
  // Acciones para gestionar integraciones
  addIntegration: (integration: Integration) => void;
  updateIntegration: (index: number, integration: Integration) => void;
  removeIntegration: (index: number) => void;
  toggleIntegration: (index: number) => void;
  
  // Acciones para enviar issues a integraciones
  sendIssueToIntegration: (index: number, issue: IssueData) => Promise<IntegrationResult>;
  sendIssueToAllIntegrations: (issue: IssueData) => Promise<IntegrationResult[]>;
  
  // Acciones para gestionar estado
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

// Estado inicial
const initialState: IntegrationState = {
  integrations: [],
  isLoading: false,
  error: null,
};

// Crear el store
export const useIntegrationStore = create<IntegrationState & IntegrationActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Acciones para gestionar integraciones
      addIntegration: (integration) => {
        set((state) => ({
          integrations: [...state.integrations, integration],
        }));
      },
      
      updateIntegration: (index, integration) => {
        set((state) => {
          const integrations = [...state.integrations];
          integrations[index] = integration;
          return { integrations };
        });
      },
      
      removeIntegration: (index) => {
        set((state) => {
          const integrations = [...state.integrations];
          integrations.splice(index, 1);
          return { integrations };
        });
      },
      
      toggleIntegration: (index) => {
        set((state) => {
          const integrations = [...state.integrations];
          integrations[index] = {
            ...integrations[index],
            enabled: !integrations[index].enabled,
          };
          return { integrations };
        });
      },
      
      // Acciones para enviar issues a integraciones
      sendIssueToIntegration: async (index, issue) => {
        const { integrations } = get();
        const integration = integrations[index];
        
        if (!integration) {
          return {
            success: false,
            message: `Integración con índice ${index} no encontrada`,
          };
        }
        
        if (!integration.enabled) {
          return {
            success: false,
            message: `La integración ${integration.name} está deshabilitada`,
          };
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const integrationInstance = IntegrationFactory.createIntegration(integration);
          const result = await integrationInstance.sendIssue(issue);
          
          if (!result.success) {
            set({ error: result.message });
          }
          
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          set({ error: errorMessage });
          
          return {
            success: false,
            message: errorMessage,
            error,
          };
        } finally {
          set({ isLoading: false });
        }
      },
      
      sendIssueToAllIntegrations: async (issue) => {
        const { integrations } = get();
        const enabledIntegrations = integrations.filter((integration) => integration.enabled);
        
        if (enabledIntegrations.length === 0) {
          return [{
            success: false,
            message: 'No hay integraciones habilitadas',
          }];
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const results = await Promise.all(
            enabledIntegrations.map((integration) => {
              const integrationInstance = IntegrationFactory.createIntegration(integration);
              return integrationInstance.sendIssue(issue);
            })
          );
          
          const errors = results.filter((result) => !result.success);
          if (errors.length > 0) {
            set({ error: `${errors.length} integraciones fallaron` });
          }
          
          return results;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          set({ error: errorMessage });
          
          return [{
            success: false,
            message: errorMessage,
            error,
          }];
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Acciones para gestionar estado
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'poker-planning-integrations',
      partialize: (state) => ({
        integrations: state.integrations,
      }),
    }
  )
);