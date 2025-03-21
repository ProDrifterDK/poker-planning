/**
 * Tipos de integraciones soportadas
 */
export enum IntegrationType {
    JIRA = 'jira',
    TRELLO = 'trello',
    GITHUB = 'github',
}

/**
 * Configuración base para todas las integraciones
 */
export interface IntegrationConfig {
    type: IntegrationType;
    name: string;
    enabled: boolean;
}

/**
 * Configuración específica para Jira
 */
export interface JiraConfig extends IntegrationConfig {
    type: IntegrationType.JIRA;
    domain: string;
    email: string;
    apiToken: string;
    projectKey: string;
}

/**
 * Configuración específica para Trello
 */
export interface TrelloConfig extends IntegrationConfig {
    type: IntegrationType.TRELLO;
    apiKey: string;
    token: string;
    boardId: string;
    listId: string;
}

/**
 * Configuración específica para GitHub
 */
export interface GitHubConfig extends IntegrationConfig {
    type: IntegrationType.GITHUB;
    token: string;
    owner: string;
    repo: string;
}

/**
 * Tipo unión para todas las configuraciones de integración
 */
export type Integration = JiraConfig | TrelloConfig | GitHubConfig;

/**
 * Datos de un issue para enviar a una integración
 */
export interface IssueData {
    key: string;
    summary: string;
    description?: string;
    average?: string | number;
    estimations?: Record<string, string | number>;
}

/**
 * Resultado de una operación de integración
 */
export interface IntegrationResult {
    success: boolean;
    message: string;
    data?: unknown;
    error?: Error | unknown;
}