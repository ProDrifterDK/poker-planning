import { Octokit } from '@octokit/rest';
import { BaseIntegration } from './BaseIntegration';
import { IntegrationResult, IssueData, GitHubConfig } from './types';

/**
 * Integración con GitHub Issues
 */
export class GitHubIntegration extends BaseIntegration {
  protected override config: GitHubConfig;
  private octokit: Octokit;

  constructor(config: GitHubConfig) {
    super(config);
    this.config = config;
    this.octokit = new Octokit({
      auth: config.token,
    });
    this.octokit = new Octokit({
      auth: config.token,
    });
  }

  /**
   * Verifica si la configuración es válida
   */
  validateConfig(): IntegrationResult {
    if (!this.config.token) {
      return {
        success: false,
        message: 'El token de GitHub es requerido',
      };
    }

    if (!this.config.owner) {
      return {
        success: false,
        message: 'El propietario del repositorio es requerido',
      };
    }

    if (!this.config.repo) {
      return {
        success: false,
        message: 'El nombre del repositorio es requerido',
      };
    }

    return {
      success: true,
      message: 'Configuración válida',
    };
  }

  /**
   * Envía un issue a GitHub
   */
  async sendIssue(issue: IssueData): Promise<IntegrationResult> {
    try {
      const validation = this.validateConfig();
      if (!validation.success) {
        return validation;
      }

      // Preparar el cuerpo del issue con la información de estimación
      let body = issue.description || '';
      body += `\n\n## Estimación\n`;
      body += `Promedio: ${issue.average || 'N/A'}\n\n`;

      // Añadir detalles de las estimaciones individuales si están disponibles
      if (issue.estimations && Object.keys(issue.estimations).length > 0) {
        body += `### Estimaciones individuales\n`;
        body += `| Participante | Estimación |\n`;
        body += `| --- | --- |\n`;
        
        for (const [participant, estimation] of Object.entries(issue.estimations)) {
          body += `| ${participant} | ${estimation} |\n`;
        }
      }

      // Crear el issue en GitHub
      const response = await this.octokit.issues.create({
        owner: this.config.owner,
        repo: this.config.repo,
        title: issue.summary,
        body,
        labels: ['planning-poker'],
      });

      return {
        success: true,
        message: `Issue creado en GitHub con número: ${response.data.number}`,
        data: response.data,
      };
    } catch (error) {
      console.error('Error al enviar issue a GitHub:', error);
      return {
        success: false,
        message: 'Error al enviar issue a GitHub',
        error,
      };
    }
  }

  /**
   * Actualiza un issue existente en GitHub
   */
  async updateIssue(issue: IssueData): Promise<IntegrationResult> {
    try {
      const validation = this.validateConfig();
      if (!validation.success) {
        return validation;
      }

      // Verificar si el issue existe
      const findResult = await this.findIssue(issue.key);
      if (!findResult.success) {
        return {
          success: false,
          message: `El issue ${issue.key} no existe en GitHub`,
        };
      }

      // Preparar el cuerpo del issue con la información de estimación
      let body = issue.description || '';
      body += `\n\n## Estimación\n`;
      body += `Promedio: ${issue.average || 'N/A'}\n\n`;

      // Añadir detalles de las estimaciones individuales si están disponibles
      if (issue.estimations && Object.keys(issue.estimations).length > 0) {
        body += `### Estimaciones individuales\n`;
        body += `| Participante | Estimación |\n`;
        body += `| --- | --- |\n`;
        
        for (const [participant, estimation] of Object.entries(issue.estimations)) {
          body += `| ${participant} | ${estimation} |\n`;
        }
      }

      // Actualizar el issue en GitHub
      const issueNumber = parseInt(issue.key, 10);
      const response = await this.octokit.issues.update({
        owner: this.config.owner,
        repo: this.config.repo,
        issue_number: issueNumber,
        body,
      });

      return {
        success: true,
        message: `Issue ${issue.key} actualizado en GitHub`,
        data: response.data,
      };
    } catch (error) {
      console.error('Error al actualizar issue en GitHub:', error);
      return {
        success: false,
        message: 'Error al actualizar issue en GitHub',
        error,
      };
    }
  }

  /**
   * Busca un issue en GitHub
   */
  async findIssue(key: string): Promise<IntegrationResult> {
    try {
      const validation = this.validateConfig();
      if (!validation.success) {
        return validation;
      }

      // Convertir la clave a número
      const issueNumber = parseInt(key, 10);
      if (isNaN(issueNumber)) {
        return {
          success: false,
          message: `La clave del issue debe ser un número: ${key}`,
        };
      }

      // Buscar el issue en GitHub
      const response = await this.octokit.issues.get({
        owner: this.config.owner,
        repo: this.config.repo,
        issue_number: issueNumber,
      });

      return {
        success: true,
        message: `Issue ${key} encontrado en GitHub`,
        data: response.data,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Not Found')) {
        return {
          success: false,
          message: `Issue ${key} no encontrado en GitHub`,
        };
      }

      console.error('Error al buscar issue en GitHub:', error);
      return {
        success: false,
        message: 'Error al buscar issue en GitHub',
        error,
      };
    }
  }
}