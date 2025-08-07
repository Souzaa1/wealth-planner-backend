import { FastifyInstance } from 'fastify';
import { GoalController } from '../controllers/GoalController';

export async function goalRoutes(fastify: FastifyInstance) {
  const tags = ['Goals'];

  fastify.post('/goals', {
    schema: {
      tags,
      summary: 'Criar nova meta',
      description: 'Cria uma nova meta para um cliente',
      body: {
        type: 'object',
        required: ['clientId', 'type', 'description', 'targetValue', 'targetDate'],
        properties: {
          clientId: { type: 'string', description: 'ID do cliente' },
          type: {
            type: 'string',
            enum: ['RETIREMENT', 'SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM', 'EDUCATION', 'REAL_ESTATE', 'EMERGENCY_FUND'],
            description: 'Tipo da meta'
          },
          description: { type: 'string', minLength: 5, description: 'Descrição da meta' },
          targetValue: { type: 'number', minimum: 0, description: 'Valor alvo' },
          targetDate: { type: 'string', format: 'date-time', description: 'Data alvo' }
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
  }, GoalController.create);

  fastify.get('/goals', {
    schema: {
      tags,
      summary: 'Listar metas',
      description: 'Lista metas com filtros e paginação',
      querystring: {
        type: 'object',
        properties: {
          clientId: { type: 'string', description: 'Filtrar por cliente' },
          type: { type: 'string', description: 'Filtrar por tipo de meta' },
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
  }, GoalController.findAll);

  fastify.get('/goals/:id', {
    schema: {
      tags,
      summary: 'Buscar meta por ID',
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
  }, GoalController.findById);

  fastify.put('/goals/:id', {
    schema: {
      tags,
      summary: 'Atualizar meta',
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
            enum: ['RETIREMENT', 'SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM', 'EDUCATION', 'REAL_ESTATE', 'EMERGENCY_FUND']
          },
          description: { type: 'string', minLength: 5 },
          targetValue: { type: 'number', minimum: 0 },
          targetDate: { type: 'string', format: 'date-time' }
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
  }, GoalController.update);

  fastify.delete('/goals/:id', {
    schema: {
      tags,
      summary: 'Deletar meta',
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
  }, GoalController.delete);

  fastify.get('/clients/:clientId/goals', {
    schema: {
      tags,
      summary: 'Buscar metas por cliente',
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
            data: { type: 'array' }
          }
        }
      }
    }
  }, GoalController.findByClient);
}

