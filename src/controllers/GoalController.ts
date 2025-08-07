import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../models';
import { ApiResponse, PaginatedResponse } from '../types';

const createGoalSchema = z.object({
    clientId: z.string().cuid('ID do cliente inválido'),
    type: z.enum(['RETIREMENT', 'SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM', 'EDUCATION', 'REAL_ESTATE', 'EMERGENCY_FUND']),
    description: z.string().min(5, 'Descrição deve ter pelo menos 5 caracteres'),
    targetValue: z.number().positive('Valor alvo deve ser positivo'),
    targetDate: z.string().datetime('Data alvo inválida').transform(date => new Date(date))
});

const updateGoalSchema = createGoalSchema.partial().omit({ clientId: true });

const goalFiltersSchema = z.object({
    clientId: z.string().cuid().optional(),
    type: z.string().optional(),
    page: z.number().int().min(1).optional().default(1),
    limit: z.number().int().min(1).max(100).optional().default(10)
});

export class GoalController {

    static async create(request: FastifyRequest, reply: FastifyReply) {
        try {
            const data = createGoalSchema.parse(request.body);

            const client = await prisma.client.findUnique({
                where: { id: data.clientId }
            });

            if (!client) {
                return reply.status(404).send({
                    success: false,
                    error: 'Cliente não encontrado'
                } as ApiResponse);
            }

            const goal = await prisma.goal.create({
                data: {
                    ...data,
                    targetValue: data.targetValue.toString()
                },
                include: {
                    client: true
                }
            });

            return reply.status(201).send({
                success: true,
                data: goal,
                message: 'Meta criada com sucesso'
            } as ApiResponse);

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'Dados inválidos',
                    data: error.message
                } as ApiResponse);
            }

            console.error('Erro ao criar meta:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async findAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const filters = goalFiltersSchema.parse(request.query);

            const where: any = {};
            if (filters.clientId) {
                where.clientId = filters.clientId;
            }
            if (filters.type) {
                where.type = filters.type;
            }

            const total = await prisma.goal.count({ where });

            const goals = await prisma.goal.findMany({
                where,
                include: {
                    client: true
                },
                orderBy: {
                    targetDate: 'asc'
                },
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit
            });

            return reply.send({
                success: true,
                data: goals,
                pagination: {
                    page: filters.page,
                    limit: filters.limit,
                    total,
                    totalPages: Math.ceil(total / filters.limit)
                }
            } as unknown as PaginatedResponse<typeof goals>);

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'Parâmetros inválidos',
                    data: error.message
                } as ApiResponse);
            }

            console.error('Erro ao listar metas:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async findById(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };

            const goal = await prisma.goal.findUnique({
                where: { id },
                include: {
                    client: true
                }
            });

            if (!goal) {
                return reply.status(404).send({
                    success: false,
                    error: 'Meta não encontrada'
                } as ApiResponse);
            }

            return reply.send({
                success: true,
                data: goal
            } as ApiResponse);

        } catch (error) {
            console.error('Erro ao buscar meta:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async update(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const data = updateGoalSchema.parse(request.body);

            const existingGoal = await prisma.goal.findUnique({
                where: { id }
            });

            if (!existingGoal) {
                return reply.status(404).send({
                    success: false,
                    error: 'Meta não encontrada'
                } as ApiResponse);
            }

            const updateData: any = { ...data };
            if (data.targetValue) {
                updateData.targetValue = data.targetValue.toString();
            }

            const goal = await prisma.goal.update({
                where: { id },
                data: updateData,
                include: {
                    client: true
                }
            });

            return reply.send({
                success: true,
                data: goal,
                message: 'Meta atualizada com sucesso'
            } as ApiResponse);

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'Dados inválidos',
                    data: error.message
                } as ApiResponse);
            }

            console.error('Erro ao atualizar meta:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async delete(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };

            const goal = await prisma.goal.findUnique({
                where: { id }
            });

            if (!goal) {
                return reply.status(404).send({
                    success: false,
                    error: 'Meta não encontrada'
                } as ApiResponse);
            }

            await prisma.goal.delete({
                where: { id }
            });

            return reply.send({
                success: true,
                message: 'Meta deletada com sucesso'
            } as ApiResponse);

        } catch (error) {
            console.error('Erro ao deletar meta:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async findByClient(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { clientId } = request.params as { clientId: string };

            const client = await prisma.client.findUnique({
                where: { id: clientId }
            });

            if (!client) {
                return reply.status(404).send({
                    success: false,
                    error: 'Cliente não encontrado'
                } as ApiResponse);
            }

            const goals = await prisma.goal.findMany({
                where: { clientId },
                include: {
                    client: true
                },
                orderBy: {
                    targetDate: 'asc'
                }
            });

            return reply.send({
                success: true,
                data: goals
            } as ApiResponse);

        } catch (error) {
            console.error('Erro ao buscar metas do cliente:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }
}

