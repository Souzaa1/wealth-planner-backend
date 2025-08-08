import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';

export async function authRoutes(fastify: FastifyInstance) {

    const tags = ['Auth'];

    fastify.post('/auth/register', {
        schema: {
            tags,
            summary: 'Registrar novo usuário',
            description: 'Cria uma nova conta de usuário com email, senha e role.',
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', description: 'Email do usuário' },
                    password: { type: 'string', minLength: 6, description: 'Senha do usuário (mínimo 6 caracteres)' },
                    role: { type: 'string', enum: ['ADVISOR', 'VIEWER'], default: 'VIEWER', description: 'Role do usuário (ADVISOR ou VIEWER)' }
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
                400: { $ref: 'ErrorResponse' },
                409: { $ref: 'ErrorResponse' }
            }
        }
    }, AuthController.register);

    fastify.post('/auth/login', {
        schema: {
            tags,
            summary: 'Login de usuário',
            description: 'Autentica um usuário e retorna um token JWT.',
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', description: 'Email do usuário' },
                    password: { type: 'string', description: 'Senha do usuário' }
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
                                token: { type: 'string', description: 'Token JWT de autenticação' },
                                user: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        email: { type: 'string' },
                                        role: { type: 'string' }
                                    }
                                }
                            }
                        },
                        message: { type: 'string' }
                    }
                },
                401: { $ref: 'ErrorResponse' },
                400: { $ref: 'ErrorResponse' }
            }
        }
    }, AuthController.login);

    fastify.get('/auth/profile', {
        preHandler: [authMiddleware],
        schema: {
            tags,
            summary: 'Obter perfil do usuário',
            description: 'Retorna os dados do usuário autenticado.',
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                userId: { type: 'string' },
                                email: { type: 'string' },
                                name: { type: 'string' },
                                role: { type: 'string' }
                            }
                        },
                        message: { type: 'string' }
                    }
                },
                401: { $ref: 'ErrorResponse' }
            }
        }
    }, AuthController.getProfile);
}