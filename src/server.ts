import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { registerRoutes } from './routes';
import { errorHandler } from './middleware/error-handler';
import { connectToDatabase, disconnectFromDatabase } from './models';

const fastify = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
        ...(process.env.NODE_ENV === 'development' && {
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true
                }
            }
        })
    }
});

fastify.setErrorHandler(errorHandler);

fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL || 'http://localhost:3000']
        : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
});

fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    sign: {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
});

fastify.register(swagger, {
    openapi: {
        openapi: '3.0.0',
        info: {
            title: 'Wealth Planner API',
            description: 'API para sistema de planejamento financeiro multi family office',
            version: '1.0.0',
            contact: {
                name: 'Wealth Planner Team',
                email: 'dev@wealthplanner.com'
            }
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:4000',
                description: 'Servidor de desenvolvimento'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ],
        tags: [
            { name: 'Health', description: 'Endpoints de saúde da API' },
            { name: 'Auth', description: 'Autenticação e autorização' },
            { name: 'Clients', description: 'Gerenciamento de clientes' },
            { name: 'Goals', description: 'Gerenciamento de metas' },
            { name: 'Wallets', description: 'Gerenciamento de carteiras' },
            { name: 'Events', description: 'Gerenciamento de eventos financeiros' },
            { name: 'Simulations', description: 'Simulações e projeções patrimoniais' }
        ]
    }
});

fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
        docExpansion: 'list',
        deepLinking: false
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject) => {
        return swaggerObject;
    },
    transformSpecificationClone: true
});

fastify.register(registerRoutes);

fastify.addHook('onReady', async () => {
    await connectToDatabase();
});

fastify.addHook('onClose', async () => {
    await disconnectFromDatabase();
});

async function start() {
    try {
        const host = process.env.HOST || '0.0.0.0';
        const port = parseInt(process.env.PORT || '4000');

        await fastify.listen({
            port,
            host
        });

        console.log(`🚀 Servidor rodando em http://${host}:${port}`);
        console.log(`📚 Documentação disponível em http://${host}:${port}/docs`);
        console.log(`🏥 Health check em http://${host}:${port}/api/v1/health`);

    } catch (error) {
        fastify.log.error(error);
        process.exit(1);
    }
}

process.on('SIGINT', async () => {
    console.log('\n🛑 Recebido SIGINT, fechando servidor...');
    await fastify.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Recebido SIGTERM, fechando servidor...');
    await fastify.close();
    process.exit(0);
});

if (require.main === module) {
    start();
}

export default fastify;

