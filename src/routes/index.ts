import { FastifyInstance } from 'fastify';
import { clientRoutes } from './clientRoutes';
import { goalRoutes } from './goalRoutes';
import { walletRoutes } from './walletRoutes';
import { eventRoutes } from './eventRoutes';
import { simulationRoutes } from './simulationRoutes';

export async function registerRoutes(fastify: FastifyInstance) {

  await fastify.register(async function (fastify) {
    fastify.get('/health', {
      schema: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Verifica se a API está funcionando',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
              version: { type: 'string' }
            }
          }
        }
      }
    }, async (request, reply) => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      };
    });

    await fastify.register(clientRoutes);
    await fastify.register(goalRoutes);
    await fastify.register(walletRoutes);
    await fastify.register(eventRoutes);
    await fastify.register(simulationRoutes);

  }, { prefix: '/api/v1' });

  fastify.get('/', async (request, reply) => {
    return {
      message: 'Wealth Planner API',
      version: '1.0.0',
      documentation: '/docs',
      health: '/api/v1/health'
    };
  });
}

