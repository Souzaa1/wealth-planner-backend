import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../models';
import {
    CreateClientData,
    UpdateClientData,
    ClientFilters,
    PaginationParams,
    ApiResponse,
    PaginatedResponse,
    AlignmentCategory
} from '../types';

const createClientSchema = z.object({
    name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caractere' }),
    email: z.string().email({ message: 'Email inválido' }),
    age: z.number().int().min(18, 'Idade mínima é 18 anos').max(120, 'Idade máxima é 120 anos'),
    isActive: z.boolean().optional().default(true),
    familyProfile: z.enum(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE', 'ULTRA_HIGH_NET_WORTH'])
});

const updateClientSchema = createClientSchema.partial();

const clientFiltersSchema = z.object({
    isActive: z.boolean().optional(),
    familyProfile: z.string().optional(),
    ageMin: z.number().int().optional(),
    ageMax: z.number().int().optional(),
    search: z.string().optional()
});

const paginationSchema = z.object({
    page: z.number().int().min(1).optional().default(1),
    limit: z.number().int().min(1).max(100).optional().default(10),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

export class ClientController {

    static async create(request: FastifyRequest, reply: FastifyReply) {

        try {

            const data = createClientSchema.parse(request.body);


            const existingClient = await prisma.client.findUnique({
                where: { email: data.email }
            });

            if (existingClient) {
                return reply.status(409).send({
                    success: false,
                    error: 'Email já está em uso'
                } as ApiResponse);
            };

            const client = await prisma.client.create({
                data,
                include: {
                    goals: true,
                    wallets: true,
                    events: true,
                    simulations: true,
                    insurances: true
                }
            });

            return reply.status(201).send({
                success: true,
                data: client,
                message: 'Cliente criado com sucesso'
            } as ApiResponse);

        } catch (error) {

            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'Dados inválidos',
                    data: error.message
                } as ApiResponse);
            };

            console.error('Erro ao criar cliente:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);

        }
    };

    static async findAll(request: FastifyRequest, reply: FastifyReply) {

        try {

            const filters = clientFiltersSchema.parse(request.query);
            const pagination = paginationSchema.parse(request.query);

            const where: any = {};

            if (filters.isActive !== undefined) {
                where.isActive = filters.isActive;
            };

            if (filters.familyProfile) {
                where.familyProfile = filters.familyProfile;
            };

            if (filters.ageMin || filters.ageMax) {
                where.age = {};
                if (filters.ageMin) where.age.gte = filters.ageMin;
                if (filters.ageMax) where.age.lte = filters.ageMax;
            };

            if (filters.search) {
                where.OR = [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { email: { contains: filters.search, mode: 'insensitive' } }
                ];
            };

            const total = await prisma.client.count({ where });

            const clients = await prisma.client.findMany({
                where,
                include: {
                    goals: true,
                    wallets: true,
                    events: true,
                    simulations: true,
                    insurances: true
                },
                orderBy: {
                    [pagination.sortBy]: pagination.sortOrder
                },
                skip: (pagination.page - 1) * pagination.limit,
                take: pagination.limit
            });

            return reply.send({
                success: true,
                data: clients,
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit,
                    total,
                    totalPages: Math.ceil(total / pagination.limit)
                }
            } as PaginatedResponse<typeof clients[number]>);

        } catch (error) {

            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'Parâmetros inválidos',
                    data: error.message
                } as ApiResponse);
            }

            console.error('Erro ao listar clientes:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);

        }
    };

    static async findById(request: FastifyRequest, reply: FastifyReply) {

        try {
            const { id } = request.params as { id: string };

            const client = await prisma.client.findUnique({
                where: { id },
                include: {
                    goals: true,
                    wallets: true,
                    events: true,
                    simulations: true,
                    insurances: true
                }
            });

            if (!client) {
                return reply.status(404).send({
                    success: false,
                    error: 'Cliente não encontrado'
                } as ApiResponse);
            }

            return reply.send({
                success: true,
                data: client
            } as ApiResponse);

        } catch (error) {
            console.error('Erro ao buscar cliente:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    };

    static async update(request: FastifyRequest, reply: FastifyReply) {

        try {
            const { id } = request.params as { id: string };
            const data = updateClientSchema.parse(request.body);

            const existingClient = await prisma.client.findUnique({
                where: { id }
            });

            if (!existingClient) {
                return reply.status(404).send({
                    success: false,
                    error: 'Cliente não encontrado'
                } as ApiResponse);
            }

            if (data.email) {
                const emailInUse = await prisma.client.findFirst({
                    where: {
                        email: data.email,
                        id: { not: id }
                    }
                });

                if (emailInUse) {
                    return reply.status(409).send({
                        success: false,
                        error: 'Email já está em uso'
                    } as ApiResponse);
                }
            }

            const client = await prisma.client.update({
                where: { id },
                data,
                include: {
                    goals: true,
                    wallets: true,
                    events: true,
                    simulations: true,
                    insurances: true
                }
            });

            return reply.send({
                success: true,
                data: client,
                message: 'Cliente atualizado com sucesso'
            } as ApiResponse);

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'Dados inválidos',
                    data: error.message
                } as ApiResponse);
            }

            console.error('Erro ao atualizar cliente:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    };

    static async delete(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };

            const client = await prisma.client.findUnique({
                where: { id }
            });

            if (!client) {
                return reply.status(404).send({
                    success: false,
                    error: 'Cliente não encontrado'
                } as ApiResponse);
            }

            await prisma.client.delete({
                where: { id }
            });

            return reply.send({
                success: true,
                message: 'Cliente deletado com sucesso'
            } as ApiResponse);

        } catch (error) {
            console.error('Erro ao deletar cliente:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    };

    static async getAlignment(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };

            const client = await prisma.client.findUnique({
                where: { id },
                include: {
                    wallets: true
                }
            });

            if (!client) {
                return reply.status(404).send({
                    success: false,
                    error: 'Cliente não encontrado'
                } as ApiResponse);
            }

            const currentPatrimony = client.wallets.reduce((sum, wallet) =>
                sum + Number(wallet.currentValue), 0
            );

            const plannedPatrimony = client.wallets.reduce((sum, wallet) =>
                sum + Number(wallet.totalPatrimony), 0
            );

            const alignmentPercent = plannedPatrimony > 0
                ? (currentPatrimony / plannedPatrimony) * 100
                : 0;

            let category: AlignmentCategory;
            if (alignmentPercent > 90) {
                category = AlignmentCategory.EXCELLENT;
            } else if (alignmentPercent >= 70) {
                category = AlignmentCategory.GOOD;
            } else if (alignmentPercent >= 50) {
                category = AlignmentCategory.WARNING;
            } else {
                category = AlignmentCategory.CRITICAL;
            }

            return reply.send({
                success: true,
                data: {
                    currentPatrimony,
                    plannedPatrimony,
                    alignmentPercent: Math.round(alignmentPercent * 100) / 100,
                    category
                }
            } as ApiResponse);

        } catch (error) {
            console.error('Erro ao calcular alinhamento:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

}