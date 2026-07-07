# Procedimento Operacional Padrão: Painel Administrativo (admin_flow_pop.md)

## 🎯 Objetivo
Definir as ferramentas, capacidades e governança operacional para o Painel Administrativo da administradora da "Cesta para Todos".

---

## 🔑 Autenticação e Nível de Acesso
- O painel administrativo é acessível apenas através de `/admin` após login em `/login`.
- Apenas um perfil de **Acesso Total (Admin)** é suportado.
- Todas as operações críticas (criação de produtos, alteração de status e visualização de faturamento/preços) são de uso exclusivo dessa conta.

---

## 🛠️ Módulos e Funcionalidades do Dashboard

O painel administrativo é dividido nas seguintes seções:

### 1. Painel Principal (Dashboard)
- **Visão Geral**: Métricas rápidas como volume de pedidos pendentes, total de pedidos fechados, faturamento mensal (somatória dos preços das cestas fechadas) e taxa de conversão.
- **Lista de Pedidos Recentes**: Visualização imediata dos novos pedidos criados.

### 2. Pedidos (`/admin/pedidos`)
- **Filtros por Status**: Visualizar pedidos separados pelas etapas (`AGUARDANDO_CONTATO`, `EM_NEGOCIACAO`, etc.).
- **Visualizador de Detalhes**: Exibir produtos escolhidos pelo cliente na customização, dados de contato e timeline do histórico do pedido.
- **Ação de Transição de Status**: Select simples para mudar status com validação em tempo real e persistência no banco.

### 3. Estoque (`/admin/estoque`)
- **Controle de Saldo**: Edição rápida da quantidade disponível de cada produto.
- **Indicadores de Status**: Destaque para produtos "Indisponíveis", "Críticos" ou "Em Nível Saudável".

### 4. Produtos & Marcas (`/admin/produtos` e `/admin/marcas`)
- **CRUD de Marcas**: Adicionar ou renomear fabricantes/marcas.
- **CRUD de Produtos**: Nome, descrição, marca vinculada, imagem, preço (somente admin vê) e quantidade inicial de estoque. Suporte a `Soft Delete` (inativar sem apagar fisicamente).

### 5. Cestas (`/admin/cestas`)
- **CRUD de Cestas**: Nome, descrição, preço de venda, imagem e itens inclusos por padrão.
- **Customização de Itens**: Definição de quais produtos pertencem à cesta e quais são marcados como customizáveis pelo cliente.

### 6. Clientes (`/admin/clientes`)
- **Lista de Clientes**: Visualização rápida de todos os clientes que já realizaram solicitações (Nome, Telefone, quantidade de pedidos feitos).

---

## 📝 Registro de Logs Operacionais
Toda operação administrativa de mutação de dados críticos gera um registro estruturado no banco de dados para auditoria futura e rastreabilidade:
- **Criação / Edição de Produtos & Cestas**: Histórico de autoria.
- **Mudança de Status de Pedido**: Gravado na tabela `order_status_history`.
- **Cancelamento**: Registro do motivo do cancelamento associado ao log do pedido.
