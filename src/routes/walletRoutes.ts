import { FastifyInstance } from 'fastify';
import { WalletController } from '../controllers/WalletController';

export async function walletRoutes(fastify: FastifyInstance) {

  const tags = ['Wallets'];

  fastify.post('/wallets', {
    schema: {
      tags,
      summary: 'Criar entrada de carteira',
      description: 'Cria uma nova entrada de carteira para um cliente',
      body: {
        type: 'object',
        required: ['clientId', 'assetClass', 'percentage', 'currentValue', 'totalPatrimony', 'alignmentPercent'],
        properties: {
          clientId: { type: 'string', description: 'ID do cliente' },
          assetClass: { type: 'string', minLength: 2, description: 'Classe de ativo' },
          percentage: { type: 'number', minimum: 0, maximum: 100, description: 'Percentual da carteira' },
          currentValue: { type: 'number', minimum: 0, description: 'Valor atual' },
          totalPatrimony: { type: 'number', minimum: 0, description: 'Patrimônio total' },
          alignmentPercent: { type: 'number', minimum: 0, maximum: 100, description: 'Percentual de alinhamento' }
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
  }, WalletController.create);

  fastify.get('/wallets', {
    schema: {
      tags,
      summary: 'Listar entradas de carteira',
      description: 'Lista entradas de carteira com filtros e paginação',
      querystring: {
        type: 'object',
        properties: {
          clientId: { type: 'string', description: 'Filtrar por cliente' },
          assetClass: { type: 'string', description: 'Filtrar por classe de ativo' },
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
  }, WalletController.findAll);

  fastify.get('/wallets/:id', {
    schema: {
      tags,
      summary: 'Buscar entrada de carteira por ID',
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
  }, WalletController.findById);

  fastify.put('/wallets/:id', {
    schema: {
      tags,
      summary: 'Atualizar entrada de carteira',
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
          assetClass: { type: 'string', minLength: 2 },
          percentage: { type: 'number', minimum: 0, maximum: 100 },
          currentValue: { type: 'number', minimum: 0 },
          totalPatrimony: { type: 'number', minimum: 0 },
          alignmentPercent: { type: 'number', minimum: 0, maximum: 100 }
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
  }, WalletController.update);

  fastify.delete('/wallets/:id', {
    schema: {
      tags,
      summary: 'Deletar entrada de carteira',
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
  }, WalletController.delete);

  fastify.get('/clients/:clientId/wallet', {
    schema: {
      tags,
      summary: 'Buscar carteira por cliente',
      description: 'Retorna a carteira completa de um cliente com resumo',
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
                wallets: { type: 'array' },
                summary: {
                  type: 'object',
                  properties: {
                    totalCurrentValue: { type: 'number' },
                    totalPatrimony: { type: 'number' },
                    overallAlignment: { type: 'number' },
                    totalEntries: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, WalletController.findByClient);
}

