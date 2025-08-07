import { FastifyInstance } from 'fastify';
import { SimulationController } from '../controllers/SimulationController';

export async function simulationRoutes(fastify: FastifyInstance) {

  const tags = ['Simulations'];

  fastify.post('/simulations', {
    schema: {
      tags,
      summary: 'Criar nova simulação',
      description: 'Cria uma nova simulação de projeção patrimonial',
      body: {
        type: 'object',
        required: ['clientId', 'name', 'initialValue', 'interestRate', 'projectionYears'],
        properties: {
          clientId: { type: 'string', description: 'ID do cliente' },
          name: { type: 'string', minLength: 3, description: 'Nome da simulação' },
          initialValue: { type: 'number', minimum: 0, description: 'Valor inicial' },
          interestRate: { type: 'number', minimum: 0, maximum: 1, description: 'Taxa de juros anual (0-1)' },
          projectionYears: { type: 'integer', minimum: 1, maximum: 50, description: 'Anos de projeção' }
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
  }, SimulationController.create);

  fastify.get('/simulations', {
    schema: {
      tags,
      summary: 'Listar simulações',
      description: 'Lista simulações com filtros e paginação',
      querystring: {
        type: 'object',
        properties: {
          clientId: { type: 'string', description: 'Filtrar por cliente' },
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
  }, SimulationController.findAll);

  fastify.get('/simulations/:id', {
    schema: {
      tags,
      summary: 'Buscar simulação por ID',
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
  }, SimulationController.findById);

  fastify.put('/simulations/:id', {
    schema: {
      tags,
      summary: 'Atualizar simulação',
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
          name: { type: 'string', minLength: 3 },
          initialValue: { type: 'number', minimum: 0 },
          interestRate: { type: 'number', minimum: 0, maximum: 1 },
          projectionYears: { type: 'integer', minimum: 1, maximum: 50 }
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
  }, SimulationController.update);

  fastify.delete('/simulations/:id', {
    schema: {
      tags,
      summary: 'Deletar simulação',
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
  }, SimulationController.delete);

  fastify.get('/clients/:clientId/simulations', {
    schema: {
      tags,
      summary: 'Buscar simulações por cliente',
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
  }, SimulationController.findByClient);

  fastify.post('/projections/generate', {
    schema: {
      tags,
      summary: 'Gerar projeção patrimonial',
      description: 'Gera uma projeção patrimonial em tempo real sem salvar',
      body: {
        type: 'object',
        required: ['clientId', 'initialValue'],
        properties: {
          clientId: { type: 'string', description: 'ID do cliente' },
          initialValue: { type: 'number', minimum: 0, description: 'Valor inicial' },
          interestRate: { type: 'number', minimum: 0, maximum: 1, default: 0.04, description: 'Taxa de juros anual (padrão 4%)' },
          projectionYears: { type: 'integer', minimum: 1, maximum: 50, default: 40, description: 'Anos de projeção (padrão até 2060)' }
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
                projectionData: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      year: { type: 'integer' },
                      projectedValue: { type: 'number' }
                    }
                  }
                },
                parameters: {
                  type: 'object',
                  properties: {
                    initialValue: { type: 'number' },
                    interestRate: { type: 'number' },
                    projectionYears: { type: 'integer' },
                    eventsCount: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, SimulationController.generateProjection);
}

