import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../models';
import { ApiResponse } from '../types';
import { WealthProjectionService } from '../services/WealthProjectionService';

const createSimulationSchema = z.object({
    clientId: z.string().cuid('ID do cliente inválido'),
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    initialValue: z.number().min(0, 'Valor inicial deve ser positivo'),
    interestRate: z.number().min(0).max(1, 'Taxa de juros deve estar entre 0 e 1 (0% a 100%)'),
    projectionYears: z.number().int().min(1).max(50, 'Anos de projeção deve estar entre 1 e 50')
});

const updateSimulationSchema = createSimulationSchema.partial().omit({ clientId: true });

const simulationFiltersSchema = z.object({
    clientId: z.string().cuid().optional(),
    page: z.number().int().min(1).optional().default(1),
    limit: z.number().int().min(1).max(100).optional().default(10)
});

const projectionRequestSchema = z.object({
    clientId: z.string().cuid('ID do cliente inválido'),
    initialValue: z.number().min(0, 'Valor inicial deve ser positivo'),
    interestRate: z.number().min(0).max(1, 'Taxa de juros deve estar entre 0 e 1').optional().default(0.04),
    projectionYears: z.number().int().min(1).max(50, 'Anos de projeção deve estar entre 1 e 50').optional().default(40)
});

export class SimulationController {

    static async create(request: FastifyRequest, reply: FastifyReply) {
        try {
            const data = createSimulationSchema.parse(request.body);

            const client = await prisma.client.findUnique({
                where: { id: data.clientId },
                include: {
                    events: true
                }
            });

            if (!client) {
                return reply.status(404).send({
                    success: false,
                    error: 'Cliente não encontrado'
                } as ApiResponse);
            }

            const eventsWithClient = client.events.map(event => ({
                ...event,
                client: client
            }));

            const projectionData = WealthProjectionService.simulateWealthCurve({
                initialValue: data.initialValue,
                interestRate: data.interestRate,
                events: eventsWithClient,
                projectionYears: data.projectionYears
            });

            const simulation = await prisma.simulation.create({
                data: {
                    ...data,
                    initialValue: data.initialValue.toString(),
                    interestRate: data.interestRate.toString(),
                    projectionData: projectionData as any
                },
                include: {
                    client: true
                }
            });

            return reply.status(201).send({
                success: true,
                data: simulation,
                message: 'Simulação criada com sucesso'
            } as ApiResponse);

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'Dados inválidos',
                    data: error.message
                } as ApiResponse);
            }

            console.error('Erro ao criar simulação:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async findAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const filters = simulationFiltersSchema.parse(request.query);

            const where: any = {};
            if (filters.clientId) {
                where.clientId = filters.clientId;
            }

            const total = await prisma.simulation.count({ where });

            const simulations = await prisma.simulation.findMany({
                where,
                include: {
                    client: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit
            });

            return reply.send({
                success: true,
                data: simulations,
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

            console.error('Erro ao listar simulações:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async findById(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };

            const simulation = await prisma.simulation.findUnique({
                where: { id },
                include: {
                    client: true
                }
            });

            if (!simulation) {
                return reply.status(404).send({
                    success: false,
                    error: 'Simulação não encontrada'
                } as ApiResponse);
            }

            return reply.send({
                success: true,
                data: simulation
            } as ApiResponse);

        } catch (error) {
            console.error('Erro ao buscar simulação:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async update(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const data = updateSimulationSchema.parse(request.body);

            const existingSimulation = await prisma.simulation.findUnique({
                where: { id },
                include: {
                    client: {
                        include: {
                            events: true
                        }
                    }
                }
            });

            if (!existingSimulation) {
                return reply.status(404).send({
                    success: false,
                    error: 'Simulação não encontrada'
                } as ApiResponse);
            }

            let projectionData = existingSimulation.projectionData;

            if (data.initialValue || data.interestRate || data.projectionYears) {
                const newInitialValue = data.initialValue || Number(existingSimulation.initialValue);
                const newInterestRate = data.interestRate || Number(existingSimulation.interestRate);
                const newProjectionYears = data.projectionYears || existingSimulation.projectionYears;


                const eventsWithClient = existingSimulation.client.events.map(event => ({
                    ...event,
                    client: existingSimulation.client
                }));

                projectionData = WealthProjectionService.simulateWealthCurve({
                    initialValue: newInitialValue,
                    interestRate: newInterestRate,
                    events: eventsWithClient,
                    projectionYears: newProjectionYears
                }) as any;
            }

            const updateData: any = { ...data };
            if (data.initialValue) updateData.initialValue = data.initialValue.toString();
            if (data.interestRate) updateData.interestRate = data.interestRate.toString();
            updateData.projectionData = projectionData;

            const simulation = await prisma.simulation.update({
                where: { id },
                data: updateData,
                include: {
                    client: true
                }
            });

            return reply.send({
                success: true,
                data: simulation,
                message: 'Simulação atualizada com sucesso'
            } as ApiResponse);

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'Dados inválidos',
                    data: error.message
                } as ApiResponse);
            }

            console.error('Erro ao atualizar simulação:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async delete(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };

            const simulation = await prisma.simulation.findUnique({
                where: { id }
            });

            if (!simulation) {
                return reply.status(404).send({
                    success: false,
                    error: 'Simulação não encontrada'
                } as ApiResponse);
            }

            await prisma.simulation.delete({
                where: { id }
            });

            return reply.send({
                success: true,
                message: 'Simulação deletada com sucesso'
            } as ApiResponse);

        } catch (error) {
            console.error('Erro ao deletar simulação:', error);
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

            const simulations = await prisma.simulation.findMany({
                where: { clientId },
                include: {
                    client: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return reply.send({
                success: true,
                data: simulations
            } as ApiResponse);

        } catch (error) {
            console.error('Erro ao buscar simulações do cliente:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async generateProjection(request: FastifyRequest, reply: FastifyReply) {
        try {
            const data = projectionRequestSchema.parse(request.body);

            const client = await prisma.client.findUnique({
                where: { id: data.clientId },
                include: {
                    events: true
                }
            });

            if (!client) {
                return reply.status(404).send({
                    success: false,
                    error: 'Cliente não encontrado'
                } as ApiResponse);
            }

            const eventsWithClient = client.events.map(event => ({
                ...event,
                client: client
            }));

            const projectionData = WealthProjectionService.simulateWealthCurve({
                initialValue: data.initialValue,
                interestRate: data.interestRate,
                events: eventsWithClient,
                projectionYears: data.projectionYears
            });

            return reply.send({
                success: true,
                data: {
                    projectionData,
                    parameters: {
                        initialValue: data.initialValue,
                        interestRate: data.interestRate,
                        projectionYears: data.projectionYears,
                        eventsCount: client.events.length
                    }
                }
            } as ApiResponse);

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'Dados inválidos',
                    data: error.message
                } as ApiResponse);
            }

            console.error('Erro ao gerar projeção:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }
}

