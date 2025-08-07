import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';

export async function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
    request.log.error(error);

    if (error.validation) {
        return reply.status(400).send({
            success: false,
            error: 'Dados de entrada inválidos',
            details: error.validation
        });
    }

    if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
        return reply.status(401).send({
            success: false,
            error: 'Token de autorização inválido'
        });
    }

    if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
        return reply.status(401).send({
            success: false,
            error: 'Token de autorização não fornecido'
        });
    }

    if (error.statusCode === 429) {
        return reply.status(429).send({
            success: false,
            error: 'Muitas requisições. Tente novamente em alguns minutos.'
        });
    }

    if (error.statusCode === 404) {
        return reply.status(404).send({
            success: false,
            error: 'Endpoint não encontrado'
        });
    }

    if (error.statusCode === 405) {
        return reply.status(405).send({
            success: false,
            error: 'Método HTTP não permitido'
        });
    }

    if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
        return reply.status(413).send({
            success: false,
            error: 'Payload muito grande'
        });
    }

    if (error.code === 'ETIMEDOUT') {
        return reply.status(408).send({
            success: false,
            error: 'Timeout da requisição'
        });
    }

    const statusCode = error.statusCode || 500;

    return reply.status(statusCode).send({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Erro interno do servidor'
            : error.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
}

