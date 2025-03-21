import axios from 'axios';
import { BaseIntegration } from './BaseIntegration';
import { IntegrationResult, IssueData, JiraConfig } from './types';

// Interfaz para los campos de Jira
interface JiraFields {
  project: {
    key: string;
  };
  summary: string;
  description: {
    type: string;
    version: number;
    content: Array<{
      type: string;
      content: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
  issuetype: {
    name: string;
  };
  [key: string]: unknown; // Para campos personalizados
}

/**
 * Integración con Jira
 */
export class JiraIntegration extends BaseIntegration {
  protected override config: JiraConfig;

  constructor(config: JiraConfig) {
    super(config);
    this.config = config;
  }

  /**
   * Verifica si la configuración es válida
   */
  validateConfig(): IntegrationResult {
    if (!this.config.domain) {
      return {
        success: false,
        message: 'El dominio de Jira es requerido',
      };
    }

    if (!this.config.email) {
      return {
        success: false,
        message: 'El email de Jira es requerido',
      };
    }

    if (!this.config.apiToken) {
      return {
        success: false,
        message: 'El token de API de Jira es requerido',
      };
    }

    if (!this.config.projectKey) {
      return {
        success: false,
        message: 'La clave del proyecto de Jira es requerida',
      };
    }

    return {
      success: true,
      message: 'Configuración válida',
    };
  }

  /**
   * Obtiene la URL base de la API de Jira
   */
  private getBaseUrl(): string {
    return `https://${this.config.domain}.atlassian.net/rest/api/3`;
  }

  /**
   * Obtiene las cabeceras de autenticación para Jira
   */
  private getAuthHeaders(): Record<string, string> {
    const token = Buffer.from(`${this.config.email}:${this.config.apiToken}`).toString('base64');
    return {
      'Authorization': `Basic ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Envía un issue a Jira
   */
  async sendIssue(issue: IssueData): Promise<IntegrationResult> {
    try {
      const validation = this.validateConfig();
      if (!validation.success) {
        return validation;
      }

      // Preparar los datos para Jira
      const fields: JiraFields = {
        project: {
          key: this.config.projectKey,
        },
        summary: issue.summary,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: issue.description || '',
                },
              ],
            },
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: `Estimación promedio: ${issue.average || 'N/A'}`,
                },
              ],
            },
          ],
        },
        issuetype: {
          name: 'Story',
        },
      };

      // Añadir campo personalizado para la estimación si existe
      if (issue.average) {
        // Nota: El ID del campo personalizado puede variar según la configuración de Jira
        // Aquí usamos un ID genérico que debe ser reemplazado por el correcto
        fields['customfield_10016'] = Number(issue.average);
      }

      const jiraIssue = { fields };

      // Enviar la solicitud a Jira
      const response = await axios.post(
        `${this.getBaseUrl()}/issue`,
        jiraIssue,
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        message: `Issue creado en Jira con ID: ${response.data.key}`,
        data: response.data,
      };
    } catch (error) {
      console.error('Error al enviar issue a Jira:', error);
      return {
        success: false,
        message: 'Error al enviar issue a Jira',
        error,
      };
    }
  }

  /**
   * Actualiza un issue existente en Jira
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
          message: `El issue ${issue.key} no existe en Jira`,
        };
      }

      // Preparar los datos para actualizar
      const fields: Partial<JiraFields> = {
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: issue.description || '',
                },
              ],
            },
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: `Estimación promedio: ${issue.average || 'N/A'}`,
                },
              ],
            },
          ],
        },
      };

      // Añadir campo personalizado para la estimación si existe
      if (issue.average) {
        // Nota: El ID del campo personalizado puede variar según la configuración de Jira
        fields['customfield_10016'] = Number(issue.average);
      }

      const updateData = { fields };

      // Enviar la solicitud a Jira
      await axios.put(
        `${this.getBaseUrl()}/issue/${issue.key}`,
        updateData,
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        message: `Issue ${issue.key} actualizado en Jira`,
      };
    } catch (error) {
      console.error('Error al actualizar issue en Jira:', error);
      return {
        success: false,
        message: 'Error al actualizar issue en Jira',
        error,
      };
    }
  }

  /**
   * Busca un issue en Jira
   */
  async findIssue(key: string): Promise<IntegrationResult> {
    try {
      const validation = this.validateConfig();
      if (!validation.success) {
        return validation;
      }

      // Enviar la solicitud a Jira
      const response = await axios.get(
        `${this.getBaseUrl()}/issue/${key}`,
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        message: `Issue ${key} encontrado en Jira`,
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return {
          success: false,
          message: `Issue ${key} no encontrado en Jira`,
        };
      }

      console.error('Error al buscar issue en Jira:', error);
      return {
        success: false,
        message: 'Error al buscar issue en Jira',
        error,
      };
    }
  }
}