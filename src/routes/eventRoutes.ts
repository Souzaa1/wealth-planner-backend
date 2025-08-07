import { FastifyInstance } from 'fastify';
import { EventController } from '../controllers/EventController';

export async function eventRoutes(fastify: FastifyInstance) {
  const tags = ['Events'];

  fastify.post('/events', {
    schema: {
      tags,
      summary: 'Criar novo evento',
      description: 'Cria um novo evento financeiro para um cliente',
      body: {
        type: 'object',
        required: ['clientId', 'type', 'value', 'frequency', 'startDate'],
        properties: {
          clientId: { type: 'string', description: 'ID do cliente' },
          type: {
            type: 'string',
            enum: ['INCOME', 'EXPENSE', 'INVESTMENT', 'WITHDRAWAL', 'BONUS', 'INHERITANCE', 'LOAN'],
            description: 'Tipo do evento'
          },
          description: { type: 'string', description: 'Descrição do evento' },
          value: { type: 'number', minimum: 0, description: 'Valor do evento' },
          frequency: {
            type: 'string',
            enum: ['ONCE', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'],
            description: 'Frequência do evento'
          },
          startDate: { type: 'string', format: 'date-time', description: 'Data de início' },
          endDate: { type: 'string', format: 'date-time', description: 'Data de fim (opcional)' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, EventController.create);

  fastify.get('/events', {
    schema: {
      tags,
      summary: 'Listar eventos',
      description: 'Lista eventos com filtros e paginação',
      querystring: {
        type: 'object',
        properties: {
          clientId: { type: 'string', description: 'Filtrar por cliente' },
          type: { type: 'string', description: 'Filtrar por tipo de evento' },
          frequency: { type: 'string', description: 'Filtrar por frequência' },
          startDate: { type: 'string', format: 'date-time', description: 'Data de início para filtro' },
          endDate: { type: 'string', format: 'date-time', description: 'Data de fim para filtro' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
            pagination: { type: 'object' }
          }
        }
      }
    }
  }, EventController.findAll);

  fastify.get('/events/:id', {
    schema: {
      tags,
      summary: 'Buscar evento por ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, EventController.findById);

  fastify.put('/events/:id', {
    schema: {
      tags,
      summary: 'Atualizar evento',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['INCOME', 'EXPENSE', 'INVESTMENT', 'WITHDRAWAL', 'BONUS', 'INHERITANCE', 'LOAN']
          },
          description: { type: 'string' },
          value: { type: 'number', minimum: 0 },
          frequency: {
            type: 'string',
            enum: ['ONCE', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']
          },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, EventController.update);

  fastify.delete('/events/:id', {
    schema: {
      tags,
      summary: 'Deletar evento',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, EventController.delete);

  fastify.get('/clients/:clientId/events', {
    schema: {
      tags,
      summary: 'Buscar eventos por cliente',
      description: 'Retorna todos os eventos de um cliente com estatísticas',
      params: {
        type: 'object',
        required: ['clientId'],
        properties: {
          clientId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                events: { type: 'array' },
                summary: {
                  type: 'object',
                  properties: {
                    totalEvents: { type: 'integer' },
                    totalIncome: { type: 'number' },
                    totalExpenses: { type: 'number' },
                    totalInvestments: { type: 'number' },
                    netFlow: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, EventController.findByClient);
}

