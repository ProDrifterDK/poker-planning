import { Integration, IntegrationResult, IssueData } from './types';

/**
 * Clase base para todas las integraciones
 */
export abstract class BaseIntegration {
  protected config: Integration;

  constructor(config: Integration) {
    this.config = config;
  }

  /**
   * Verifica si la integración está habilitada
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Obtiene el nombre de la integración
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Verifica si la configuración es válida
   */
  abstract validateConfig(): IntegrationResult;

  /**
   * Envía un issue a la integración
   */
  abstract sendIssue(issue: IssueData): Promise<IntegrationResult>;

  /**
   * Actualiza un issue existente en la integración
   */
  abstract updateIssue(issue: IssueData): Promise<IntegrationResult>;

  /**
   * Busca un issue en la integración
   */
  abstract findIssue(key: string): Promise<IntegrationResult>;
}