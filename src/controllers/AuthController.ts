import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../models';
import { ApiResponse } from '../types';

const registerSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    name: z.string().min(1, 'Nome é obrigatório'),
    role: z.enum(['ADVISOR', 'VIEWER']).optional().default('VIEWER')
});

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
});

export class AuthController {
    static async register(request: FastifyRequest, reply: FastifyReply) {
        try {
            const data = registerSchema.parse(request.body);

            const existingUser = await prisma.user.findUnique({
                where: { email: data.email }
            });

            if (existingUser) {
                return reply.status(409).send({
                    success: false,
                    error: 'Email já registrado'
                } as ApiResponse);
            }

            const hashedPassword = await bcrypt.hash(data.password, 10);
            const user = await prisma.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    name: data.name,
                    role: data.role
                },
                select: { id: true, email: true, role: true, name: true }
            });

            return reply.status(201).send({
                success: true,
                data: user,
                message: 'Usuário registrado com sucesso'
            } as ApiResponse);

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'Dados inválidos',
                    data: error.message
                } as ApiResponse);
            }
            console.error('Erro ao registrar usuário:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async login(request: FastifyRequest, reply: FastifyReply) {
        try {
            const data = loginSchema.parse(request.body);

            const user = await prisma.user.findUnique({
                where: { email: data.email }
            });

            if (!user) {
                return reply.status(401).send({
                    success: false,
                    error: 'Credenciais inválidas'
                } as ApiResponse);
            }

            const isPasswordValid = await bcrypt.compare(data.password, user.password);

            if (!isPasswordValid) {
                return reply.status(401).send({
                    success: false,
                    error: 'Credenciais inválidas'
                } as ApiResponse);
            }

            const token = (request.server as any).jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                    name: user.name
                }
            );

            return reply.send({
                success: true,
                data: { token, user: { id: user.id, email: user.email, role: user.role } },
                message: 'Login realizado com sucesso'
            } as ApiResponse);

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'Dados inválidos',
                    data: error.message
                } as ApiResponse);
            }
            console.error('Erro ao fazer login:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async getProfile(request: FastifyRequest, reply: FastifyReply) {
        try {
            if (!request.user) {
                return reply.status(401).send({
                    success: false,
                    error: 'Não autenticado'
                } as ApiResponse);
            }

            return reply.send({
                success: true,
                data: request.user,
                message: 'Perfil do usuário'
            } as ApiResponse);

        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }
}