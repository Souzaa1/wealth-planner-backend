import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const advisor = await prisma.user.upsert({
    where: { email: 'advisor@wealthplanner.com' },
    update: {},
    create: {
      email: 'advisor@wealthplanner.com',
      password: hashedPassword,
      role: 'ADVISOR'
    }
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@wealthplanner.com' },
    update: {},
    create: {
      email: 'viewer@wealthplanner.com',
      password: hashedPassword,
      role: 'VIEWER'
    }
  });

  console.log('✅ Usuários criados:', { advisor: advisor.email, viewer: viewer.email });

  const client1 = await prisma.client.upsert({
    where: { email: 'joao.silva@email.com' },
    update: {},
    create: {
      name: 'João Silva',
      email: 'joao.silva@email.com',
      age: 45,
      isActive: true,
      familyProfile: 'MODERATE'
    }
  });

  const client2 = await prisma.client.upsert({
    where: { email: 'maria.santos@email.com' },
    update: {},
    create: {
      name: 'Maria Santos',
      email: 'maria.santos@email.com',
      age: 38,
      isActive: true,
      familyProfile: 'AGGRESSIVE'
    }
  });

  const client3 = await prisma.client.upsert({
    where: { email: 'carlos.oliveira@email.com' },
    update: {},
    create: {
      name: 'Carlos Oliveira',
      email: 'carlos.oliveira@email.com',
      age: 52,
      isActive: true,
      familyProfile: 'CONSERVATIVE'
    }
  });

  console.log('✅ Clientes criados:', { 
    client1: client1.name, 
    client2: client2.name, 
    client3: client3.name 
  });

  await prisma.goal.createMany({
    data: [
      {
        clientId: client1.id,
        type: 'RETIREMENT',
        description: 'Aposentadoria confortável aos 65 anos',
        targetValue: '2000000.00',
        targetDate: new Date('2044-01-01')
      },
      {
        clientId: client1.id,
        type: 'EDUCATION',
        description: 'Educação universitária dos filhos',
        targetValue: '300000.00',
        targetDate: new Date('2030-01-01')
      },
      {
        clientId: client2.id,
        type: 'RETIREMENT',
        description: 'Aposentadoria aos 60 anos',
        targetValue: '1500000.00',
        targetDate: new Date('2046-01-01')
      },
      {
        clientId: client2.id,
        type: 'REAL_ESTATE',
        description: 'Compra de casa própria',
        targetValue: '800000.00',
        targetDate: new Date('2027-01-01')
      },
      {
        clientId: client3.id,
        type: 'RETIREMENT',
        description: 'Aposentadoria aos 67 anos',
        targetValue: '1800000.00',
        targetDate: new Date('2039-01-01')
      }
    ]
  });

  console.log('✅ Metas criadas');

  await prisma.wallet.createMany({
    data: [
      // Cliente 1 - João Silva
      {
        clientId: client1.id,
        assetClass: 'Renda Fixa',
        percentage: '40.00',
        currentValue: '200000.00',
        totalPatrimony: '500000.00',
        alignmentPercent: '85.00'
      },
      {
        clientId: client1.id,
        assetClass: 'Ações',
        percentage: '35.00',
        currentValue: '175000.00',
        totalPatrimony: '500000.00',
        alignmentPercent: '85.00'
      },
      {
        clientId: client1.id,
        assetClass: 'Fundos Imobiliários',
        percentage: '25.00',
        currentValue: '125000.00',
        totalPatrimony: '500000.00',
        alignmentPercent: '85.00'
      },
      {
        clientId: client2.id,
        assetClass: 'Ações',
        percentage: '60.00',
        currentValue: '180000.00',
        totalPatrimony: '300000.00',
        alignmentPercent: '92.00'
      },
      {
        clientId: client2.id,
        assetClass: 'Renda Fixa',
        percentage: '25.00',
        currentValue: '75000.00',
        totalPatrimony: '300000.00',
        alignmentPercent: '92.00'
      },
      {
        clientId: client2.id,
        assetClass: 'Criptomoedas',
        percentage: '15.00',
        currentValue: '45000.00',
        totalPatrimony: '300000.00',
        alignmentPercent: '92.00'
      },
      {
        clientId: client3.id,
        assetClass: 'Renda Fixa',
        percentage: '70.00',
        currentValue: '560000.00',
        totalPatrimony: '800000.00',
        alignmentPercent: '78.00'
      },
      {
        clientId: client3.id,
        assetClass: 'Ações',
        percentage: '20.00',
        currentValue: '160000.00',
        totalPatrimony: '800000.00',
        alignmentPercent: '78.00'
      },
      {
        clientId: client3.id,
        assetClass: 'Fundos Imobiliários',
        percentage: '10.00',
        currentValue: '80000.00',
        totalPatrimony: '800000.00',
        alignmentPercent: '78.00'
      }
    ]
  });

  console.log('✅ Carteiras criadas');

  await prisma.event.createMany({
    data: [
      {
        clientId: client1.id,
        type: 'INCOME',
        description: 'Salário mensal',
        value: '15000.00',
        frequency: 'MONTHLY',
        startDate: new Date('2024-01-01')
      },
      {
        clientId: client1.id,
        type: 'INVESTMENT',
        description: 'Investimento mensal',
        value: '5000.00',
        frequency: 'MONTHLY',
        startDate: new Date('2024-01-01')
      },
      {
        clientId: client1.id,
        type: 'EXPENSE',
        description: 'Gastos familiares',
        value: '8000.00',
        frequency: 'MONTHLY',
        startDate: new Date('2024-01-01')
      },
      {
        clientId: client2.id,
        type: 'INCOME',
        description: 'Salário mensal',
        value: '12000.00',
        frequency: 'MONTHLY',
        startDate: new Date('2024-01-01')
      },
      {
        clientId: client2.id,
        type: 'INVESTMENT',
        description: 'Investimento mensal',
        value: '4000.00',
        frequency: 'MONTHLY',
        startDate: new Date('2024-01-01')
      },
      {
        clientId: client2.id,
        type: 'BONUS',
        description: 'Bônus anual',
        value: '50000.00',
        frequency: 'ANNUALLY',
        startDate: new Date('2024-12-01')
      },
      {
        clientId: client3.id,
        type: 'INCOME',
        description: 'Salário mensal',
        value: '20000.00',
        frequency: 'MONTHLY',
        startDate: new Date('2024-01-01')
      },
      {
        clientId: client3.id,
        type: 'INVESTMENT',
        description: 'Investimento mensal',
        value: '3000.00',
        frequency: 'MONTHLY',
        startDate: new Date('2024-01-01')
      },
      {
        clientId: client3.id,
        type: 'EXPENSE',
        description: 'Gastos familiares',
        value: '12000.00',
        frequency: 'MONTHLY',
        startDate: new Date('2024-01-01')
      }
    ]
  });

  console.log('✅ Eventos criados');

  await prisma.insurance.createMany({
    data: [
      {
        clientId: client1.id,
        type: 'LIFE',
        coverage: '1000000.00',
        premium: '500.00',
        description: 'Seguro de vida familiar'
      },
      {
        clientId: client1.id,
        type: 'DISABILITY',
        coverage: '500000.00',
        premium: '300.00',
        description: 'Seguro invalidez'
      },
      {
        clientId: client2.id,
        type: 'LIFE',
        coverage: '800000.00',
        premium: '400.00',
        description: 'Seguro de vida'
      },
      {
        clientId: client3.id,
        type: 'LIFE',
        coverage: '1500000.00',
        premium: '600.00',
        description: 'Seguro de vida executivo'
      },
      {
        clientId: client3.id,
        type: 'PROPERTY',
        coverage: '2000000.00',
        premium: '800.00',
        description: 'Seguro residencial'
      }
    ]
  });

  console.log('✅ Seguros criados');

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

