# Procedimento Operacional Padrão: Banco de Dados (database_pop.md)

## 🎯 Objetivo
Definir as diretrizes de persistência, modelagem física e invariantes de dados para o projeto "Cesta para Todos".

---

## 💾 Fonte da Verdade
A única fonte da verdade da aplicação é o banco de dados **PostgreSQL hospedado no Supabase**.
- Nenhuma informação de estado crítico (como status do pedido, nível de estoque ou preços) deve ser armazenada localmente no frontend (ex: localStorage, sessionStorage, React Context efêmero) para tomadas de decisão.
- Toda consulta e mutação de dados é resolvida por meio da conexão direta ou chamadas à API integradas com o Supabase.

---

## 📊 Estrutura de Tabelas (Schema Físico)
O banco de dados relacional é composto pelas seguintes tabelas:

1. **`users`**: Registra as credenciais e dados dos administradores (conectados com o Supabase Auth).
2. **`customers`**: Cadastro simplificado de clientes (Nome, Telefone) coletado no momento do pedido.
3. **`brands`**: Marcas associadas aos produtos do catálogo.
4. **`products`**: Produtos disponíveis no sistema (possui controle de estoque, preço e status).
5. **`baskets`**: Cestas básicas padrão ofertadas no catálogo.
6. **`basket_items`**: Relação de itens que compõem cada cesta básica (produtos, quantidades e se são personalizáveis).
7. **`orders`**: Registro principal dos pedidos com o protocolo sequencial único.
8. **`order_items`**: Produtos e quantidades específicas selecionadas pelo cliente em seu pedido customizado.
9. **`order_status_history`**: Registro histórico imutável de todas as transições de status de cada pedido.

---

## 🛡️ Regras e Invariantes de Dados

### 1. Histórico Preservado Permanentemente
- Toda alteração de status de pedido deve obrigatoriamente gerar uma nova linha na tabela `order_status_history` contendo o status antigo, o novo status e a data/hora da alteração.
- Deleções físicas (`HARD DELETE`) na tabela `orders` ou `order_status_history` são estritamente **proibidas** em ambiente operacional.

### 2. Soft Delete para Produtos e Cestas
- Para evitar quebras de chaves estrangeiras em pedidos legados, produtos e cestas não devem sofrer deleção física (`HARD DELETE`) se houver relacionamento com pedidos ativos ou arquivados.
- É adicionada a coluna `deleted_at` (timestamp com fuso horário, nula por padrão) nas tabelas `products` e `baskets`.
- Quando um produto ou cesta for removido pela administradora:
  - Registra-se a data/hora atual no campo `deleted_at`.
  - Consultas públicas do catálogo devem filtrar automaticamente registros onde `deleted_at is null`.
  - Registros de pedidos antigos mantêm o vínculo físico íntegro.

### 3. Todas as Operações Passam Pelo Banco
- Qualquer operação de fluxo de estoque, geração de protocolo e histórico é resolvida diretamente no banco através dos triggers automáticos e funções em PL/pgSQL implementadas na migração inicial.
