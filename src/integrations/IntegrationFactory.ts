import { BaseIntegration } from './BaseIntegration';
import { JiraIntegration } from './JiraIntegration';
import { TrelloIntegration } from './TrelloIntegration';
import { GitHubIntegration } from './GitHubIntegration';
import { Integration, IntegrationType, JiraConfig, TrelloConfig, GitHubConfig } from './types';

/**
 * Fábrica para crear instancias de integraciones
 */
export class IntegrationFactory {
  /**
   * Crea una instancia de integración según el tipo
   */
  static createIntegration(config: Integration): BaseIntegration {
    switch (config.type) {
      case IntegrationType.JIRA:
        return new JiraIntegration(config as JiraConfig);
      case IntegrationType.TRELLO:
        return new TrelloIntegration(config as TrelloConfig);
      case IntegrationType.GITHUB:
        return new GitHubIntegration(config as GitHubConfig);
      default:
        // Usamos una aserción de tipo para evitar el error de TypeScript
        const type = (config as { type: string }).type;
        throw new Error(`Tipo de integración no soportado: ${type}`);
    }
  }

  /**
   * Crea una instancia de integración Jira
   */
  static createJiraIntegration(config: JiraConfig): JiraIntegration {
    return new JiraIntegration(config);
  }

  /**
   * Crea una instancia de integración Trello
   */
  static createTrelloIntegration(config: TrelloConfig): TrelloIntegration {
    return new TrelloIntegration(config);
  }

  /**
   * Crea una instancia de integración GitHub
   */
  static createGitHubIntegration(config: GitHubConfig): GitHubIntegration {
    return new GitHubIntegration(config);
  }
}