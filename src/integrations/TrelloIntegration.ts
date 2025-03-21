import axios from 'axios';
import { BaseIntegration } from './BaseIntegration';
import { IntegrationResult, IssueData, TrelloConfig } from './types';

/**
 * Integración con Trello
 */
export class TrelloIntegration extends BaseIntegration {
  protected override config: TrelloConfig;

  constructor(config: TrelloConfig) {
    super(config);
    this.config = config;
  }

  /**
   * Verifica si la configuración es válida
   */
  validateConfig(): IntegrationResult {
    if (!this.config.apiKey) {
      return {
        success: false,
        message: 'La clave de API de Trello es requerida',
      };
    }

    if (!this.config.token) {
      return {
        success: false,
        message: 'El token de Trello es requerido',
      };
    }

    if (!this.config.boardId) {
      return {
        success: false,
        message: 'El ID del tablero de Trello es requerido',
      };
    }

    if (!this.config.listId) {
      return {
        success: false,
        message: 'El ID de la lista de Trello es requerido',
      };
    }

    return {
      success: true,
      message: 'Configuración válida',
    };
  }

  /**
   * Obtiene la URL base de la API de Trello
   */
  private getBaseUrl(): string {
    return 'https://api.trello.com/1';
  }

  /**
   * Obtiene los parámetros de autenticación para Trello
   */
  private getAuthParams(): Record<string, string> {
    return {
      key: this.config.apiKey,
      token: this.config.token,
    };
  }

  /**
   * Envía un issue a Trello como una tarjeta
   */
  async sendIssue(issue: IssueData): Promise<IntegrationResult> {
    try {
      const validation = this.validateConfig();
      if (!validation.success) {
        return validation;
      }

      // Preparar la descripción de la tarjeta con la información de estimación
      let description = issue.description || '';
      description += `\n\n## Estimación\n`;
      description += `Promedio: ${issue.average || 'N/A'}\n\n`;

      // Añadir detalles de las estimaciones individuales si están disponibles
      if (issue.estimations && Object.keys(issue.estimations).length > 0) {
        description += `### Estimaciones individuales\n`;
        
        for (const [participant, estimation] of Object.entries(issue.estimations)) {
          description += `- ${participant}: ${estimation}\n`;
        }
      }

      // Crear la tarjeta en Trello
      const response = await axios.post(
        `${this.getBaseUrl()}/cards`,
        null,
        {
          params: {
            ...this.getAuthParams(),
            idList: this.config.listId,
            name: `${issue.key}: ${issue.summary}`,
            desc: description,
            pos: 'bottom',
          },
        }
      );

      return {
        success: true,
        message: `Tarjeta creada en Trello con ID: ${response.data.id}`,
        data: response.data,
      };
    } catch (error) {
      console.error('Error al enviar issue a Trello:', error);
      return {
        success: false,
        message: 'Error al enviar issue a Trello',
        error,
      };
    }
  }

  /**
   * Actualiza una tarjeta existente en Trello
   */
  async updateIssue(issue: IssueData): Promise<IntegrationResult> {
    try {
      const validation = this.validateConfig();
      if (!validation.success) {
        return validation;
      }

      // Verificar si la tarjeta existe
      const findResult = await this.findIssue(issue.key);
      if (!findResult.success) {
        return {
          success: false,
          message: `La tarjeta con ID ${issue.key} no existe en Trello`,
        };
      }

      // Preparar la descripción de la tarjeta con la información de estimación
      let description = issue.description || '';
      description += `\n\n## Estimación\n`;
      description += `Promedio: ${issue.average || 'N/A'}\n\n`;

      // Añadir detalles de las estimaciones individuales si están disponibles
      if (issue.estimations && Object.keys(issue.estimations).length > 0) {
        description += `### Estimaciones individuales\n`;
        
        for (const [participant, estimation] of Object.entries(issue.estimations)) {
          description += `- ${participant}: ${estimation}\n`;
        }
      }

      // Actualizar la tarjeta en Trello
      const response = await axios.put(
        `${this.getBaseUrl()}/cards/${issue.key}`,
        null,
        {
          params: {
            ...this.getAuthParams(),
            name: issue.summary,
            desc: description,
          },
        }
      );

      return {
        success: true,
        message: `Tarjeta ${issue.key} actualizada en Trello`,
        data: response.data,
      };
    } catch (error) {
      console.error('Error al actualizar tarjeta en Trello:', error);
      return {
        success: false,
        message: 'Error al actualizar tarjeta en Trello',
        error,
      };
    }
  }

  /**
   * Busca una tarjeta en Trello
   */
  async findIssue(key: string): Promise<IntegrationResult> {
    try {
      const validation = this.validateConfig();
      if (!validation.success) {
        return validation;
      }

      // Buscar la tarjeta en Trello
      const response = await axios.get(
        `${this.getBaseUrl()}/cards/${key}`,
        {
          params: this.getAuthParams(),
        }
      );

      return {
        success: true,
        message: `Tarjeta ${key} encontrada en Trello`,
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return {
          success: false,
          message: `Tarjeta ${key} no encontrada en Trello`,
        };
      }

      console.error('Error al buscar tarjeta en Trello:', error);
      return {
        success: false,
        message: 'Error al buscar tarjeta en Trello',
        error,
      };
    }
  }
}