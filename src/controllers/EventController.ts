import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../models';
import { ApiResponse } from '../types';

const createEventSchema = z.object({
    clientId: z.string().cuid('ID do cliente inválido'),
    type: z.enum(['INCOME', 'EXPENSE', 'INVESTMENT', 'WITHDRAWAL', 'BONUS', 'INHERITANCE', 'LOAN']),
    description: z.string().optional(),
    value: z.number().positive('Valor deve ser positivo'),
    frequency: z.enum(['ONCE', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']),
    startDate: z.string().datetime('Data de início inválida').transform(date => new Date(date)),
    endDate: z.string().datetime('Data de fim inválida').transform(date => new Date(date)).optional()
});

const updateEventSchema = createEventSchema.partial().omit({ clientId: true });

const eventFiltersSchema = z.object({
    clientId: z.string().cuid().optional(),
    type: z.string().optional(),
    frequency: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.number().int().min(1).optional().default(1),
    limit: z.number().int().min(1).max(100).optional().default(10)
});

export class EventController {

    static async create(request: FastifyRequest, reply: FastifyReply) {
        try {
            const data = createEventSchema.parse(request.body);

            const client = await prisma.client.findUnique({
                where: { id: data.clientId }
            });

            if (!client) {
                return reply.status(404).send({
                    success: false,
                    error: 'Cliente não encontrado'
                } as ApiResponse);
            }

            if (data.endDate && data.endDate <= data.startDate) {
                return reply.status(400).send({
                    success: false,
                    error: 'Data de fim deve ser posterior à data de início'
                } as ApiResponse);
            }

            const event = await prisma.event.create({
                data: {
                    ...data,
                    value: data.value.toString()
                },
                include: {
                    client: true
                }
            });

            return reply.status(201).send({
                success: true,
                data: event,
                message: 'Evento criado com sucesso'
            } as ApiResponse);

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'Dados inválidos',
                    data: error.message
                } as ApiResponse);
            }

            console.error('Erro ao criar evento:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async findAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const filters = eventFiltersSchema.parse(request.query);

            const where: any = {};
            if (filters.clientId) {
                where.clientId = filters.clientId;
            }
            if (filters.type) {
                where.type = filters.type;
            }
            if (filters.frequency) {
                where.frequency = filters.frequency;
            }
            if (filters.startDate || filters.endDate) {
                where.startDate = {};
                if (filters.startDate) where.startDate.gte = new Date(filters.startDate);
                if (filters.endDate) where.startDate.lte = new Date(filters.endDate);
            }

            const total = await prisma.event.count({ where });

            const events = await prisma.event.findMany({
                where,
                include: {
                    client: true
                },
                orderBy: {
                    startDate: 'desc'
                },
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit
            });

            return reply.send({
                success: true,
                data: events,
                pagination: {
                    page: filters.page,
                    limit: filters.limit,
                    total,
                    totalPages: Math.ceil(total / filters.limit)
                }
            } as ApiResponse);

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'Parâmetros inválidos',
                    data: error.message
                } as ApiResponse);
            }

            console.error('Erro ao listar eventos:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async findById(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };

            const event = await prisma.event.findUnique({
                where: { id },
                include: {
                    client: true
                }
            });

            if (!event) {
                return reply.status(404).send({
                    success: false,
                    error: 'Evento não encontrado'
                } as ApiResponse);
            }

            return reply.send({
                success: true,
                data: event
            } as ApiResponse);

        } catch (error) {
            console.error('Erro ao buscar evento:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async update(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const data = updateEventSchema.parse(request.body);

            const existingEvent = await prisma.event.findUnique({
                where: { id }
            });

            if (!existingEvent) {
                return reply.status(404).send({
                    success: false,
                    error: 'Evento não encontrado'
                } as ApiResponse);
            }

            const startDate = data.startDate || existingEvent.startDate;
            const endDate = data.endDate || existingEvent.endDate;

            if (endDate && endDate <= startDate) {
                return reply.status(400).send({
                    success: false,
                    error: 'Data de fim deve ser posterior à data de início'
                } as ApiResponse);
            }

            const updateData: any = { ...data };
            if (data.value) {
                updateData.value = data.value.toString();
            }

            const event = await prisma.event.update({
                where: { id },
                data: updateData,
                include: {
                    client: true
                }
            });

            return reply.send({
                success: true,
                data: event,
                message: 'Evento atualizado com sucesso'
            } as ApiResponse);

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'Dados inválidos',
                    data: error.message
                } as ApiResponse);
            }

            console.error('Erro ao atualizar evento:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async delete(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };

            const event = await prisma.event.findUnique({
                where: { id }
            });

            if (!event) {
                return reply.status(404).send({
                    success: false,
                    error: 'Evento não encontrado'
                } as ApiResponse);
            }

            await prisma.event.delete({
                where: { id }
            });

            return reply.send({
                success: true,
                message: 'Evento deletado com sucesso'
            } as ApiResponse);

        } catch (error) {
            console.error('Erro ao deletar evento:', error);
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

            const events = await prisma.event.findMany({
                where: { clientId },
                include: {
                    client: true
                },
                orderBy: {
                    startDate: 'desc'
                }
            });

            const totalIncome = events
                .filter(event => ['INCOME', 'BONUS', 'INHERITANCE'].includes(event.type))
                .reduce((sum, event) => sum + Number(event.value), 0);

            const totalExpenses = events
                .filter(event => ['EXPENSE', 'WITHDRAWAL', 'LOAN'].includes(event.type))
                .reduce((sum, event) => sum + Number(event.value), 0);

            const totalInvestments = events
                .filter(event => event.type === 'INVESTMENT')
                .reduce((sum, event) => sum + Number(event.value), 0);

            return reply.send({
                success: true,
                data: {
                    events,
                    summary: {
                        totalEvents: events.length,
                        totalIncome,
                        totalExpenses,
                        totalInvestments,
                        netFlow: totalIncome - totalExpenses
                    }
                }
            } as ApiResponse);

        } catch (error) {
            console.error('Erro ao buscar eventos do cliente:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }
}

