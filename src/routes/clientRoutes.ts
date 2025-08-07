import { FastifyInstance } from 'fastify';
import { ClientController } from '../controllers/ClientController';

export async function clientRoutes(fastify: FastifyInstance) {
  const tags = ['Clients'];

  fastify.post('/clients', {
    schema: {
      tags,
      summary: 'Criar novo cliente',
      description: 'Cria um novo cliente no sistema',
      body: {
        type: 'object',
        required: ['name', 'email', 'age', 'familyProfile'],
        properties: {
          name: { type: 'string', minLength: 2, description: 'Nome do cliente' },
          email: { type: 'string', format: 'email', description: 'Email do cliente' },
          age: { type: 'integer', minimum: 18, maximum: 120, description: 'Idade do cliente' },
          isActive: { type: 'boolean', default: true, description: 'Status ativo/inativo' },
          familyProfile: {
            type: 'string',
            enum: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE', 'ULTRA_HIGH_NET_WORTH'],
            description: 'Perfil familiar do cliente'
          }
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
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            data: { type: 'array' }
          }
        },
        409: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, ClientController.create);

  fastify.get('/clients', {
    schema: {
      tags,
      summary: 'Listar clientes',
      description: 'Lista clientes com filtros e paginação',
      querystring: {
        type: 'object',
        properties: {
          isActive: { type: 'boolean', description: 'Filtrar por status ativo/inativo' },
          familyProfile: { type: 'string', description: 'Filtrar por perfil familiar' },
          ageMin: { type: 'integer', description: 'Idade mínima' },
          ageMax: { type: 'integer', description: 'Idade máxima' },
          search: { type: 'string', description: 'Buscar por nome ou email' },
          page: { type: 'integer', minimum: 1, default: 1, description: 'Página' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Itens por página' },
          sortBy: { type: 'string', default: 'createdAt', description: 'Campo para ordenação' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Ordem de classificação' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, ClientController.findAll);

  fastify.get('/clients/:id', {
    schema: {
      tags,
      summary: 'Buscar cliente por ID',
      description: 'Retorna um cliente específico com todos os relacionamentos',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID do cliente' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, ClientController.findById);

  fastify.put('/clients/:id', {
    schema: {
      tags,
      summary: 'Atualizar cliente',
      description: 'Atualiza os dados de um cliente',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID do cliente' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, description: 'Nome do cliente' },
          email: { type: 'string', format: 'email', description: 'Email do cliente' },
          age: { type: 'integer', minimum: 18, maximum: 120, description: 'Idade do cliente' },
          isActive: { type: 'boolean', description: 'Status ativo/inativo' },
          familyProfile: {
            type: 'string',
            enum: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE', 'ULTRA_HIGH_NET_WORTH'],
            description: 'Perfil familiar do cliente'
          }
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
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, ClientController.update);

  fastify.delete('/clients/:id', {
    schema: {
      tags,
      summary: 'Deletar cliente',
      description: 'Remove um cliente do sistema',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID do cliente' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, ClientController.delete);

  fastify.get('/clients/:id/alignment', {
    schema: {
      tags,
      summary: 'Calcular alinhamento do cliente',
      description: 'Calcula o percentual de alinhamento do cliente ao planejamento',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID do cliente' }
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
                currentPatrimony: { type: 'number' },
                plannedPatrimony: { type: 'number' },
                alignmentPercent: { type: 'number' },
                category: { type: 'string', enum: ['EXCELLENT', 'GOOD', 'WARNING', 'CRITICAL'] }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, ClientController.getAlignment);
}

