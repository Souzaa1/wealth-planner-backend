import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthPayload } from '../types';

declare module '@fastify/jwt' {
    interface FastifyRequestUser extends AuthPayload {}
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send({
                success: false,
                error: 'Token de acesso requerido'
            });
        }

        const token = authHeader.substring(7);

        const decoded = await request.jwtVerify<AuthPayload>();

        request.user = decoded;

    } catch (error) {
        return reply.status(401).send({
            success: false,
            error: 'Token inválido ou expirado'
        });
    }
}

export async function optionalAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
    try {
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const decoded = await request.jwtVerify<AuthPayload>();
            request.user = decoded;
        }
    } catch (error) {
        console.error('Erro ao verificar token opcional:', error);
        return reply.status(401).send({
            success: false,
            error: 'Token inválido ou expirado'
        });
    }
}

export function requireRole(roles: string[]) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        if (!request.user) {
            return reply.status(401).send({
                success: false,
                error: 'Autenticação requerida'
            });
        }

        const user = request.user as AuthPayload;
        if (!roles.includes(user.role)) {
            return reply.status(403).send({
                success: false,
                error: 'Permissão insuficiente'
            });
        }
    };
}

