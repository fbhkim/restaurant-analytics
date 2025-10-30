# Restaurant Analytics Platform - Arquitetura

## Visão Geral

Esta plataforma foi desenvolvida especificamente para donos de restaurantes como Maria, que precisam de insights acessíveis sobre seus negócios sem conhecimento técnico. A solução transforma dados complexos de vendas em visualizações intuitivas e métricas acionáveis.

## Stack Tecnológica

### Por que React + FastAPI + Docker?

#### Frontend: React + TypeScript + Vite + Tailwind CSS

- **React**: Biblioteca madura com ecossistema robusto para interfaces interativas
- **TypeScript**: Tipagem forte reduz bugs e melhora a experiência de desenvolvimento
- **Vite**: Build tool rápido, ideal para desenvolvimento ágil
- **Tailwind CSS**: Framework CSS utilitário que acelera o desenvolvimento de UI responsiva
- **Chart.js**: Biblioteca leve e responsiva para visualizações, perfeita para dashboards

#### Backend: Python + FastAPI

- **FastAPI**: Framework moderno com tipagem automática, documentação auto-gerada e alta performance
- **Python**: Linguagem ideal para análise de dados com bibliotecas como Pandas
- **SQLAlchemy**: ORM robusto para queries complexas e seguras
- **Pydantic**: Validação automática de dados e serialização

#### Banco de Dados: PostgreSQL

- **PostgreSQL**: Banco relacional robusto com suporte a JSON e queries complexas
- **Latitude/Longitude**: Coordenadas simples para localização (removemos PostGIS para simplicidade)
- **Índices otimizados**: Performance sub-segundo mesmo com 392k+ registros reais

#### Infraestrutura: Docker + Docker Compose

- **Reprodutibilidade**: Ambiente idêntico em desenvolvimento e produção
- **Simplicidade**: Setup completo em 3 comandos
- **Isolamento**: Cada serviço em container separado

## Arquitetura de Dados

### Schema do Banco de Dados (Implementado)

```text
stores (lojas) - 3 lojas
├── id, name, address, city, state, postal_code
├── latitude, longitude (coordenadas simples)

customers (clientes) - 47.605 únicos
├── id, name, email, phone, address
├── latitude, longitude

products (produtos) - 22 produtos realistas
├── id, name, category, price, cost
├── Hambúrgueres (40% vendas), Pizzas (30%), Acompanhamentos (20%), Bebidas (10%)

orders (pedidos) - 392.448 registros
├── customer_id, store_id, order_date, status, channel
├── subtotal, tax_amount, delivery_fee, discount_amount, total_amount
├── delivery_time_minutes, rating
├── delivery_latitude, delivery_longitude
├── coupon_id

order_items (itens do pedido) - ~800k itens
├── order_id, product_id, quantity, unit_price, total_price
├── Customizações: 60% dos itens têm extras (R$ 2-8)

coupons (cupons) - 3 tipos
├── code, discount_type, discount_value, min_order_value
```

### Estratégia de Performance

#### 1. Índices Estratégicos

```sql
-- Índices principais para queries frequentes
CREATE INDEX idx_orders_store_date ON orders(store_id, order_date);
CREATE INDEX idx_orders_channel_date ON orders(channel, order_date);

-- Índices geoespaciais para análise de localização
CREATE INDEX idx_orders_delivery_location ON orders USING GIST(delivery_location);
```

#### 2. Views Materializadas

```sql
-- Agregações pré-calculadas para dashboards
CREATE MATERIALIZED VIEW daily_sales_summary AS
SELECT DATE(order_date), store_id, channel,
       COUNT(*) as total_orders,
       SUM(total_amount) as total_revenue
FROM orders GROUP BY 1,2,3;
```

#### 3. Query Dinâmica Segura

- Whitelist de métricas e dimensões válidas
- Sanitização rigorosa de parâmetros
- Limite máximo de 10k registros por query

## Arquitetura do Frontend

### Estrutura de Componentes

```text
src/
├── components/           # Componentes reutilizáveis
│   ├── Layout.tsx       # Layout principal com navegação
│   ├── MetricCard.tsx   # Cards de métricas com indicadores
│   ├── DataTable.tsx    # Tabela com ordenação e paginação
│   └── ChartVisualization.tsx # Gráficos interativos
├── pages/               # Páginas principais
│   ├── Dashboard.tsx    # Visão geral com insights rápidos
│   └── Analytics.tsx    # Explorador de dados customizável
├── contexts/            # Estado global
│   └── QueryContext.tsx # Estado das consultas
└── services/            # Comunicação com API
    └── api.ts           # Cliente HTTP tipado
```

### Padrões de Design

#### 1. Context API para Estado Global

- QueryContext gerencia filtros, métricas e dimensões
- Estado compartilhado entre Dashboard e Analytics

#### 2. Componentes Compostos

- MetricCard reutilizável com indicadores de mudança
- ChartVisualization com múltiplos tipos de gráfico

#### 3. Tipagem Forte

- Interfaces TypeScript para todas as APIs
- Validação em tempo de compilação

## Arquitetura do Backend

### Estrutura da API

```text
/api/
├── /query              # Endpoint principal para consultas dinâmicas
├── /quick-insights     # Métricas pré-calculadas para dashboard
├── /metadata          # Informações sobre métricas e filtros disponíveis
└── /health            # Health check
```

### Query Builder Seguro

```python
# Mapeamento de métricas válidas
AVAILABLE_METRICS = {
    "total_revenue": "SUM(o.total_amount)",
    "avg_ticket": "AVG(o.total_amount)",
    "unique_customers": "COUNT(DISTINCT o.customer_id)"
}

# Validação rigorosa
def build_safe_query(request: QueryRequest):
    # 1. Validar métricas contra whitelist
    # 2. Sanitizar filtros
    # 3. Construir SQL com parâmetros seguros
    # 4. Aplicar limites de performance
```

## Tradução de Dados Complexos em Insights

### Problema: Customizações Aninhadas

**Desafio**: Produtos têm customizações complexas (tamanho, extras, preparação)

**Solução**:

- JSONB no PostgreSQL para flexibilidade
- Agregações que extraem insights úteis
- Interface que mostra "Hambúrguer + Bacon" ao invés de JSON

### Problema: Múltiplos Canais

**Desafio**: Cada canal (iFood, Uber Eats, balcão) tem características diferentes

**Solução**:

- Métricas específicas por canal (tempo de entrega só para delivery)
- Comparações automáticas entre canais
- Alertas para anomalias por canal

### Problema: Dados Geográficos

**Desafio**: Localização de clientes e tempo de entrega por região

**Solução**:

- PostGIS para queries geoespaciais eficientes
- Agregação por bairro/região automaticamente
- Visualização de "regiões problemáticas"

## Dados Realistas Baseados na Arcca

### Padrões Temporais Implementados

**Intra-dia (baseado na documentação Arcca):**
- 00-06h: 2% das vendas
- 06-11h: 8% 
- 11-15h: 35% ⚡ (almoço)
- 15-19h: 10%
- 19-23h: 40% ⚡ (jantar)
- 23-24h: 5%

**Semanal:**
- Segunda: -20% vs média
- Terça: -10%
- Quarta: -5%
- Quinta: 0% (baseline)
- Sexta: +30%
- Sábado: +50% ⚡
- Domingo: +40%

### Distribuição por Canal (Real)

- **Presencial**: 40% (~157k vendas)
- **iFood**: 30% (~118k)
- **Rappi**: 15% (~59k)
- **Outros**: 15% (~59k)

### Tickets Médios Realistas

- **Presencial**: R$ 45-55 (média R$ 50)
- **iFood**: R$ 70-85 (média R$ 75)
- **Rappi**: R$ 65-80 (média R$ 70)
- **Geral**: R$ 70,26

### Produtos e Customizações

- **22 produtos** categorizados realisticamente
- **60% dos pedidos** têm customizações
- **Extras populares**: Bacon, Cheddar, Batata Extra
- **Remoções comuns**: Sem Cebola, Sem Molho

## Trade-offs Arquiteturais

### Flexibilidade vs Simplicidade

**Escolha**: Query builder dinâmico com whitelist de métricas

**Trade-off**:

- ✅ Flexibilidade para explorar dados
- ✅ Segurança contra SQL injection
- ❌ Não permite métricas completamente customizadas
- ❌ Requer manutenção da whitelist

### Performance vs Tempo Real

**Escolha**: Views materializadas + cache de 5 minutos

**Trade-off**:

- ✅ Queries sub-segundo mesmo com 500k registros
- ✅ Reduz carga no banco
- ❌ Dados podem estar 5 minutos defasados
- ❌ Requer job para refresh das views

### Usabilidade vs Poder

**Escolha**: Interface guiada com seletores visuais

**Trade-off**:

- ✅ Maria consegue usar sem treinamento
- ✅ Reduz erros de usuário
- ❌ Usuários avançados podem se sentir limitados
- ❌ Menos flexível que SQL direto

## Estratégias de Escalabilidade

### Banco de Dados

1. **Particionamento por data**: Tabela orders particionada por mês
2. **Read replicas**: Queries analíticas em replica dedicada
3. **Índices parciais**: Índices apenas em dados recentes

### Backend

1. **Cache Redis**: Cache de queries frequentes
2. **Background jobs**: Refresh de views materializadas
3. **Rate limiting**: Proteção contra abuso

### Frontend

1. **Lazy loading**: Componentes carregados sob demanda
2. **Virtual scrolling**: Tabelas com milhares de linhas
3. **Service worker**: Cache de dados estáticos

## Semântica de Restaurante

### Métricas Específicas do Domínio

**Não é**: "SELECT SUM(amount) FROM transactions"

**É**: "Receita total considerando descontos, taxas e cancelamentos"

**Não é**: "Average response time"

**É**: "Tempo médio de entrega (da confirmação até a porta do cliente)"

### Dimensões Relevantes

- **Temporal**: Hora do dia, dia da semana (padrões de consumo)
- **Geográfica**: Bairro, distância da loja (logística)
- **Produto**: Categoria, popularidade (gestão de estoque)
- **Canal**: iFood vs balcão (estratégia de marketing)

### Alertas Inteligentes

- Queda >20% na receita vs período anterior
- Tempo de entrega >60min em >10% dos pedidos
- Avaliação média <4.0 em qualquer loja
- Produto em falta há >24h

## Próximos Passos

### Funcionalidades Futuras

1. **Previsão de demanda**: ML para prever vendas
2. **Otimização de rotas**: Algoritmo para delivery
3. **Análise de sentimento**: NLP nos feedbacks
4. **Integração com PDV**: Dados em tempo real

### Melhorias Técnicas

1. **Testes automatizados**: Cobertura >80%
2. **CI/CD pipeline**: Deploy automático
3. **Monitoramento**: Logs estruturados e métricas
4. **Backup automatizado**: Estratégia de disaster recovery

---

Esta arquitetura foi pensada para resolver problemas reais de Maria, priorizando usabilidade sem sacrificar robustez técnica. Cada decisão foi tomada considerando o contexto específico de restaurantes e a necessidade de insights acionáveis para não-técnicos.