import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export async function connectToDatabase() {
    try {
        await prisma.$connect();
        console.log('✅ Conectado ao banco de dados PostgreSQL');
    } catch (error) {
        console.error('❌ Erro ao conectar ao banco de dados:', error);
    }
};

export async function disconnectFromDatabase() {
    try {
        await prisma.$disconnect();
        console.log('✅ Desconectado do banco de dados PostgreSQL');
    } catch (error) {
        console.error('❌ Erro ao desconectar do banco de dados:', error);
    }
};

export async function checkDatabaseConnection() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Conexão com o banco de dados está ativa');
    } catch (error) {
        console.error('❌ Erro ao verificar a conexão com o banco de dados:', error);
    }
};

export * from '@prisma/client';