# Wealth Planner Backend

Backend para sistema de planejamento financeiro multi family office desenvolvido com Node.js, TypeScript, Fastify e Prisma ORM.

## 🏗️ Arquitetura

O projeto segue o padrão **MVC (Model-View-Controller)** com as seguintes camadas:

- **Models**: Definições de dados usando Prisma ORM
- **Controllers**: Lógica de negócio e manipulação de requisições
- **Routes**: Definição de endpoints da API REST
- **Services**: Serviços especializados (projeção patrimonial, sugestões automáticas)
- **Middleware**: Autenticação JWT, tratamento de erros, CORS
- **Types**: Definições de tipos TypeScript

## 🚀 Tecnologias

- **Node.js 20** - Runtime JavaScript
- **TypeScript** - Tipagem estática
- **Fastify 4** - Framework web rápido e eficiente
- **Prisma ORM** - ORM moderno para PostgreSQL
- **PostgreSQL 15** - Banco de dados relacional
- **Zod** - Validação de schemas
- **JWT** - Autenticação baseada em tokens
- **Jest** - Framework de testes
- **ESLint** - Linter para qualidade de código
- **Swagger/OpenAPI** - Documentação automática da API

## 📁 Estrutura do Projeto

```
src/
├── controllers/          # Controladores MVC
│   ├── ClientController.ts
│   ├── GoalController.ts
│   ├── WalletController.ts
│   ├── EventController.ts
│   └── SimulationController.ts
├── models/              # Modelos de dados
│   └── index.ts
├── routes/              # Definição de rotas
│   ├── clientRoutes.ts
│   ├── goalRoutes.ts
│   ├── walletRoutes.ts
│   ├── eventRoutes.ts
│   ├── simulationRoutes.ts
│   └── index.ts
├── services/            # Serviços especializados
│   └── WealthProjectionService.ts
├── middleware/          # Middlewares
│   ├── auth.ts
│   └── errorHandler.ts
├── types/               # Definições de tipos
│   └── index.ts
├── utils/               # Utilitários
├── tests/               # Testes
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── setup.ts
└── server.ts            # Servidor principal
```

## 🗄️ Banco de Dados

### Entidades Principais

1. **Users** - Usuários do sistema (ADVISOR, VIEWER)
2. **Clients** - Clientes do family office
3. **Goals** - Metas financeiras dos clientes
4. **Wallets** - Carteiras e alocação de ativos
5. **Events** - Eventos financeiros (receitas, despesas, investimentos)
6. **Simulations** - Simulações de projeção patrimonial
7. **Insurances** - Seguros dos clientes

### Relacionamentos

- Um cliente pode ter múltiplas metas, carteiras, eventos, simulações e seguros
- Todas as entidades são vinculadas a um cliente específico
- Suporte a soft delete e auditoria com timestamps

## 🔧 Configuração e Instalação

### Pré-requisitos

- Node.js 20+
- PostgreSQL 15+
- npm ou yarn

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd wealth-planner-backend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Configure o banco de dados**
```bash
# Gerar cliente Prisma
npm run db:generate

# Executar migrações
npm run db:migrate

# Popular banco com dados de exemplo (opcional)
npm run db:seed
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

O servidor estará disponível em `http://localhost:4000`

## 📚 Documentação da API

A documentação interativa da API está disponível em:
- **Swagger UI**: `http://localhost:4000/docs`
- **Health Check**: `http://localhost:4000/api/v1/health`

### Principais Endpoints

#### Clientes
- `GET /api/v1/clients` - Listar clientes
- `POST /api/v1/clients` - Criar cliente
- `GET /api/v1/clients/:id` - Buscar cliente
- `PUT /api/v1/clients/:id` - Atualizar cliente
- `DELETE /api/v1/clients/:id` - Deletar cliente
- `GET /api/v1/clients/:id/alignment` - Calcular alinhamento

#### Metas
- `GET /api/v1/goals` - Listar metas
- `POST /api/v1/goals` - Criar meta
- `GET /api/v1/clients/:clientId/goals` - Metas por cliente

#### Carteiras
- `GET /api/v1/wallets` - Listar carteiras
- `POST /api/v1/wallets` - Criar entrada de carteira
- `GET /api/v1/clients/:clientId/wallet` - Carteira por cliente

#### Eventos
- `GET /api/v1/events` - Listar eventos
- `POST /api/v1/events` - Criar evento
- `GET /api/v1/clients/:clientId/events` - Eventos por cliente

#### Simulações
- `GET /api/v1/simulations` - Listar simulações
- `POST /api/v1/simulations` - Criar simulação
- `POST /api/v1/projections/generate` - Gerar projeção em tempo real

## 🧮 Motor de Projeção Patrimonial

O sistema inclui um motor avançado de projeção patrimonial que:

- Calcula crescimento composto mensal
- Considera eventos recorrentes (mensal, trimestral, anual) e únicos
- Projeta evolução patrimonial até 2060
- Gera sugestões automáticas de ajuste
- Categoriza alinhamento (Excelente > 90%, Bom 70-90%, Atenção 50-70%, Crítico < 50%)

### Exemplo de Uso

```typescript
const projection = WealthProjectionService.simulateWealthCurve({
  initialValue: 100000,
  interestRate: 0.04, // 4% ao ano
  events: clientEvents,
  projectionYears: 30
});
```

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Testes com watch mode
npm run test:watch

# Testes com coverage
npm run test:coverage

# Testes E2E
npm run test:e2e
```

### Cobertura de Testes

O projeto mantém cobertura mínima de 80% em:
- Branches
- Functions
- Lines
- Statements

## 🐳 Docker

### Desenvolvimento Local

```bash
# Construir imagem
docker build -t wealth-planner-backend .

# Executar container
docker run -p 4000:4000 --env-file .env wealth-planner-backend
```

### Docker Compose (Recomendado)

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: planner
      POSTGRES_PASSWORD: plannerpw
      POSTGRES_DB: plannerdb
    volumes:
      - pg_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: .
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://planner:plannerpw@db:5432/plannerdb
      NODE_ENV: production
    ports:
      - "4000:4000"

volumes:
  pg_data:
```

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Parar serviços
docker-compose down
```

## 🔒 Autenticação e Autorização

### Roles de Usuário

- **ADVISOR**: Acesso completo (CRUD em todas as entidades)
- **VIEWER**: Acesso somente leitura

### Autenticação JWT

```bash
# Login (endpoint a ser implementado)
POST /api/v1/auth/login
{
  "email": "advisor@wealthplanner.com",
  "password": "123456"
}

# Usar token nas requisições
Authorization: Bearer <jwt-token>
```

## 🚀 Deploy em Produção

### Variáveis de Ambiente Obrigatórias

```bash
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secret-key
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://your-frontend-domain.com
```

### Checklist de Deploy

- [ ] Configurar variáveis de ambiente
- [ ] Executar migrações do banco
- [ ] Configurar SSL/TLS
- [ ] Configurar rate limiting
- [ ] Configurar logs estruturados
- [ ] Configurar monitoramento
- [ ] Configurar backup do banco

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use TypeScript estrito
- Siga as regras do ESLint
- Mantenha cobertura de testes > 80%
- Documente APIs com Swagger
- Use commits semânticos

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

Para dúvidas ou suporte:
- Email: dev@wealthplanner.com
- Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

**Wealth Planner Backend** - Sistema de planejamento financeiro para multi family offices.

