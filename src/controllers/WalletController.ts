import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../models';
import { ApiResponse } from '../types';

const createWalletSchema = z.object({
    clientId: z.string().cuid('ID do cliente inválido'),
    assetClass: z.string().min(2, 'Classe de ativo deve ter pelo menos 2 caracteres'),
    percentage: z.number().min(0).max(100, 'Percentual deve estar entre 0 e 100'),
    currentValue: z.number().min(0, 'Valor atual deve ser positivo'),
    totalPatrimony: z.number().min(0, 'Patrimônio total deve ser positivo'),
    alignmentPercent: z.number().min(0).max(100, 'Percentual de alinhamento deve estar entre 0 e 100')
});

const updateWalletSchema = createWalletSchema.partial().omit({ clientId: true });

const walletFiltersSchema = z.object({
    clientId: z.string().cuid().optional(),
    assetClass: z.string().optional(),
    page: z.number().int().min(1).optional().default(1),
    limit: z.number().int().min(1).max(100).optional().default(10)
});

export class WalletController {

    static async create(request: FastifyRequest, reply: FastifyReply) {
        try {
            const data = createWalletSchema.parse(request.body);

            const client = await prisma.client.findUnique({
                where: { id: data.clientId }
            });

            if (!client) {
                return reply.status(404).send({
                    success: false,
                    error: 'Cliente não encontrado'
                } as ApiResponse);
            }

            const existingWallet = await prisma.wallet.findFirst({
                where: {
                    clientId: data.clientId,
                    assetClass: data.assetClass
                }
            });

            if (existingWallet) {
                return reply.status(409).send({
                    success: false,
                    error: 'Já existe uma entrada para esta classe de ativo'
                } as ApiResponse);
            }

            const wallet = await prisma.wallet.create({
                data: {
                    ...data,
                    percentage: data.percentage.toString(),
                    currentValue: data.currentValue.toString(),
                    totalPatrimony: data.totalPatrimony.toString(),
                    alignmentPercent: data.alignmentPercent.toString()
                },
                include: {
                    client: true
                }
            });

            return reply.status(201).send({
                success: true,
                data: wallet,
                message: 'Entrada de carteira criada com sucesso'
            } as ApiResponse);

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'Dados inválidos',
                    data: error.message
                } as ApiResponse);
            }

            console.error('Erro ao criar entrada de carteira:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async findAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const filters = walletFiltersSchema.parse(request.query);

            const where: any = {};
            if (filters.clientId) {
                where.clientId = filters.clientId;
            }
            if (filters.assetClass) {
                where.assetClass = { contains: filters.assetClass, mode: 'insensitive' };
            }

            const total = await prisma.wallet.count({ where });

            const wallets = await prisma.wallet.findMany({
                where,
                include: {
                    client: true
                },
                orderBy: {
                    percentage: 'desc'
                },
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit
            });

            return reply.send({
                success: true,
                data: wallets,
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

            console.error('Erro ao listar carteiras:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async findById(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };

            const wallet = await prisma.wallet.findUnique({
                where: { id },
                include: {
                    client: true
                }
            });

            if (!wallet) {
                return reply.status(404).send({
                    success: false,
                    error: 'Entrada de carteira não encontrada'
                } as ApiResponse);
            }

            return reply.send({
                success: true,
                data: wallet
            } as ApiResponse);

        } catch (error) {
            console.error('Erro ao buscar entrada de carteira:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async update(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const data = updateWalletSchema.parse(request.body);

            const existingWallet = await prisma.wallet.findUnique({
                where: { id }
            });

            if (!existingWallet) {
                return reply.status(404).send({
                    success: false,
                    error: 'Entrada de carteira não encontrada'
                } as ApiResponse);
            }

            if (data.assetClass) {
                const conflictingWallet = await prisma.wallet.findFirst({
                    where: {
                        clientId: existingWallet.clientId,
                        assetClass: data.assetClass,
                        id: { not: id }
                    }
                });

                if (conflictingWallet) {
                    return reply.status(409).send({
                        success: false,
                        error: 'Já existe uma entrada para esta classe de ativo'
                    } as ApiResponse);
                }
            }

            const updateData: any = { ...data };
            if (data.percentage) updateData.percentage = data.percentage.toString();
            if (data.currentValue) updateData.currentValue = data.currentValue.toString();
            if (data.totalPatrimony) updateData.totalPatrimony = data.totalPatrimony.toString();
            if (data.alignmentPercent) updateData.alignmentPercent = data.alignmentPercent.toString();

            const wallet = await prisma.wallet.update({
                where: { id },
                data: updateData,
                include: {
                    client: true
                }
            });

            return reply.send({
                success: true,
                data: wallet,
                message: 'Entrada de carteira atualizada com sucesso'
            } as ApiResponse);

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'Dados inválidos',
                    data: error.message
                } as ApiResponse);
            }

            console.error('Erro ao atualizar entrada de carteira:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }

    static async delete(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };

            const wallet = await prisma.wallet.findUnique({
                where: { id }
            });

            if (!wallet) {
                return reply.status(404).send({
                    success: false,
                    error: 'Entrada de carteira não encontrada'
                } as ApiResponse);
            }

            await prisma.wallet.delete({
                where: { id }
            });

            return reply.send({
                success: true,
                message: 'Entrada de carteira deletada com sucesso'
            } as ApiResponse);

        } catch (error) {
            console.error('Erro ao deletar entrada de carteira:', error);
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

            const wallets = await prisma.wallet.findMany({
                where: { clientId },
                include: {
                    client: true
                },
                orderBy: {
                    percentage: 'desc'
                }
            });

            const totalCurrentValue = wallets.reduce((sum, wallet) =>
                sum + Number(wallet.currentValue), 0
            );

            const totalPatrimony = wallets.reduce((sum, wallet) =>
                sum + Number(wallet.totalPatrimony), 0
            );

            const overallAlignment = totalPatrimony > 0
                ? (totalCurrentValue / totalPatrimony) * 100
                : 0;

            return reply.send({
                success: true,
                data: {
                    wallets,
                    summary: {
                        totalCurrentValue,
                        totalPatrimony,
                        overallAlignment: Math.round(overallAlignment * 100) / 100,
                        totalEntries: wallets.length
                    }
                }
            } as ApiResponse);

        } catch (error) {
            console.error('Erro ao buscar carteira do cliente:', error);
            return reply.status(500).send({
                success: false,
                error: 'Erro interno do servidor'
            } as ApiResponse);
        }
    }
}

