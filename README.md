# Restaurant Analytics Platform

Uma plataforma de analytics customizável para donos de restaurantes, transformando dados complexos em insights acessíveis para não técnicos.

## 🎯 Objetivo

Resolver as dores de Maria, dona de 3 restaurantes, que precisa responder perguntas como:

- "Qual produto vende mais na quinta à noite no iFood?"
- "Meu tempo de entrega piorou. Em quais regiões?"
- "Quais clientes compraram 3+ vezes mas não voltam há 30 dias?"

## 📊 Dados Realistas Implementados

- **392.448 pedidos** (6 meses de dados)
- **R$ 27.571.714** em receita total
- **47.605 clientes únicos**
- **22 produtos** com customizações
- **6 canais** de venda (presencial, iFood, Rappi, etc.)
- **Padrões temporais** realistas baseados na estrutura da Arcca

## 🚀 Quick Start - 2 Comandos

```bash
# 1. Suba os serviços
docker-compose up -d

# 2. Execute script de correção e teste
.\fix-and-test-top5.bat
```

**Acesse:**

- Frontend: <http://localhost:3000>
- API: <http://localhost:8000>
- Docs da API: <http://localhost:8000/docs>

## 🏗️ Arquitetura

### Stack Tecnológica

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Chart.js
- **Backend**: Python + FastAPI + SQLAlchemy + Pydantic
- **Banco**: PostgreSQL com coordenadas latitude/longitude
- **Infraestrutura**: Docker + Docker Compose

### Estrutura do Projeto

```text
restaurant-analytics/
├── frontend/                 # React App
├── backend/                  # FastAPI App
├── database/                # Configuração do DB
├── docker-compose.yml      # Orquestração dos serviços
└── ARCHITECTURE.md         # Documentação técnica detalhada
```

## 🎨 Funcionalidades Implementadas

### Dashboard Executivo

- **Métricas principais**: 392k pedidos, R$ 27M receita, ticket médio R$ 70
- **Comparação temporal**: Variações percentuais automáticas
- **Top 5 produtos**: Ranking por quantidade e receita
- **Performance por canal**: Presencial (40%), iFood (30%), Rappi (15%)

### Analytics Avançados

- **Padrões temporais**: Picos no almoço (11-15h) e jantar (19-23h)
- **Tickets por canal**: Presencial R$50, iFood R$75, Rappi R$65
- **Customizações**: 60% dos pedidos têm extras/modificações
- **Performance <1s**: Queries otimizadas com 392k registros

## 🔧 Instalação

### Pré-requisitos

- Docker Desktop
- Git

### Setup Rápido

```bash
docker-compose up -d
```

## 📚 Documentação

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Decisões arquiteturais detalhadas

## 🐛 Troubleshooting

### Scripts de Correção Automática

**Setup completo e teste:**
```bash
.\fix-and-test-top5.bat
```

**Gerar dados realistas:**
```bash
.\generate-realistic-data.bat
```

**Corrigir problemas de decimal:**
```bash
.\fix-decimal-error.bat
```

### Problemas Comuns

**Top 5 produtos não aparecem:**
```bash
# Verificar order_items
docker-compose exec postgres psql -U postgres -d restaurant_analytics -c "SELECT COUNT(*) FROM order_items;"

# Se zero, gerar dados
docker-compose exec backend python generate_data.py
```

**Containers não iniciam:**
```bash
docker-compose down -v
docker-compose up -d --build
```

**PostgreSQL não conecta:**
```bash
docker-compose restart postgres
Start-Sleep -Seconds 30
```

## 📄 Licença

MIT License

---

**🏗️ Arquitetura**: [Documentação técnica](./ARCHITECTURE.md)