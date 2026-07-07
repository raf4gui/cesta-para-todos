# Constituição do Projeto: Cesta para Todos (gemini.md)

## 🎯 Visão Geral
Este documento define as regras comportamentais, esquemas de dados (schemas) e invariantes arquiteturais para o projeto SaaS/Catalógo "Cesta para Todos".

## 🛡️ Regras Comportamentais
1. **Omissão de Preço para Clientes**: O cliente final nunca deve visualizar os preços de produtos ou das cestas no catálogo. Toda a experiência visual é focada na customização dos produtos.
2. **Visibilidade do Administrador**: Os preços são de acesso exclusivo do administrador no painel administrativo centralizado.
3. **Estado Inicial do Pedido**: Todo pedido criado é registrado obrigatoriamente com o status `AGUARDANDO_CONTATO`.
4. **Fluxo Rígido de Status**: O status do pedido segue a seguinte sequência lógica:
   - `AGUARDANDO_CONTATO` ➔ `EM_NEGOCIACAO` ➔ `PAGAMENTO_CONFIRMADO` ➔ `EM_MONTAGEM` ➔ `EM_ENTREGA` ➔ `FINALIZADO`
   - O status pode transitar diretamente para `CANCELADO` a partir de qualquer estado intermediário.
5. **Histórico de Status**: Toda e qualquer transição de status de um pedido deve ser registrada automaticamente na tabela de histórico de status (`order_status_history`).
6. **Bloqueio de Indisponibilidade**: Produtos que possuem estoque menor ou igual a zero (`stock <= 0`) não podem ser exibidos como disponíveis nem ser selecionados para montagem de cestas.
7. **Regra de Estoque Inteligente**: O estoque **NÃO** sofre baixa automática quando um pedido for criado. O estoque somente será deduzido quando o pedido atingir um status operacional definido pela administradora (`PAGAMENTO_CONFIRMADO`, `EM_MONTAGEM`, `EM_ENTREGA` ou `FINALIZADO`). Caso o pedido saia de um status operacional de volta para não operacional (ex: mudado de `EM_MONTAGEM` para `CANCELADO` ou retornado para `EM_NEGOCIACAO`), a quantidade dos produtos deve ser estornada automaticamente ao estoque.
8. **Dados Obrigatórios do Cliente**: É obrigatório que o cliente informe seu **Nome** e **Telefone** na finalização do pedido. Não é exigido login nem criação de conta para clientes.
9. **Cesta Obrigatória**: Nenhum pedido pode ser gerado sem estar associado a pelo menos uma cesta de referência.
10. **Protocolo Único**: Cada pedido possui um protocolo de identificação único com padrão sequencial: `CP-XXXXXX` (ex: `CP-000001`).
11. **Modelo de Administração Simples**: Há apenas uma administradora. O painel administrativo é protegido por autenticação e não possui múltiplos perfis, cargos ou permissões avançadas.
12. **Rastreamento Público Direto**: O cliente pode consultar o status de seu pedido através de uma rota pública sem necessidade de login: `/rastreio/[codigo]` (ex: `/rastreio/CP-000001`).
13. **Integração Simplificada com WhatsApp**: Realizada exclusivamente via Deep Link (`https://wa.me/` ou similar). O sistema salva o pedido no banco, gera o protocolo único, e em seguida abre o link com o resumo do pedido estruturado de forma amigável.
14. **Simplicidade de Linguagem**: A interface do cliente deve usar termos simples, intuitivos e de fácil navegação, focada em inclusão digital para pessoas sem familiaridade técnica.

## 📐 Invariantes Arquiteturais
- **Arquitetura A.N.T. de 3 Camadas**:
  1. **Camada 1: Arquitetura (`architecture/`)**: POPs técnicos escritos em Markdown definindo objetivos, entradas, lógica e tratamento de erros.
  2. **Camada 2: Navegação**: Tomada de decisão e roteamento lógico de dados entre POPs e ferramentas (camada de raciocínio).
  3. **Camada 3: Ferramentas (`tools/`)**: Scripts determinísticos (Python/Node) atômicos e testáveis.
- **Protocolo V.L.A.E.G.**:
  - **V (Visão)**: Definição de entrada/saída e dados primários.
  - **L (Link)**: Conectividade, handshake e validação de APIs.
  - **A (Arquitetura)**: Separação de responsabilidades.
  - **E (Estilo)**: Refinamento visual premium e interface amigável.
  - **G (Gatilho)**: Implantação e automação estável.

## 💾 Esquemas de Dados (JSON & Database Schemas)

### 📊 Esquema Físico de Banco de Dados (Supabase/PostgreSQL)
```sql
-- Habilitar UUID se necessário
create extension if not exists "uuid-ossp";

-- 1. Tabela de administradores (users)
-- Linkada ao auth.users do Supabase
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de clientes (customers)
create table customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Marcas (brands)
create table brands (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Produtos (products)
create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  brand_id uuid references brands(id) on delete set null,
  price numeric(10, 2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  description text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Cestas (baskets)
create table baskets (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Relação Cesta e Itens (basket_items)
create table basket_items (
  basket_id uuid references baskets(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  is_customizable boolean not null default true,
  primary key (basket_id, product_id)
);

-- Sequência para Protocolo de Pedidos
create sequence order_protocol_seq start 1;

-- 7. Pedidos (orders)
create table orders (
  id uuid primary key default uuid_generate_v4(),
  protocol text not null unique,
  customer_id uuid references customers(id) on delete restrict not null,
  basket_id uuid references baskets(id) on delete restrict not null,
  status text not null default 'AGUARDANDO_CONTATO' check (status in ('AGUARDANDO_CONTATO', 'EM_NEGOCIACAO', 'PAGAMENTO_CONFIRMADO', 'EM_MONTAGEM', 'EM_ENTREGA', 'FINALIZADO', 'CANCELADO')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Itens do Pedido (order_items)
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) on delete restrict not null,
  quantity integer not null check (quantity > 0)
);

-- 9. Histórico de Status (order_status_history)
create table order_status_history (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade not null,
  old_status text,
  new_status text not null,
  changed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- TRIGGERS E FUNÇÕES AUTOMÁTICAS (DETERMINÍSTICAS)
-- ==========================================

-- A. Geração Automática de Protocolo Sequencial (CP-XXXXXX)
create or replace function generate_order_protocol()
returns trigger as $$
begin
  new.protocol := 'CP-' || lpad(nextval('order_protocol_seq')::text, 6, '0');
  return new;
end;
$$ language plpgsql;

create trigger trg_generate_order_protocol
before insert on orders
for each row
execute function generate_order_protocol();

-- B. Histórico de Status Inicial
create or replace function handle_order_insert()
returns trigger as $$
begin
  insert into order_status_history (order_id, old_status, new_status)
  values (new.id, null, new.status);
  return new;
end;
$$ language plpgsql;

create trigger trg_handle_order_insert
after insert on orders
for each row
execute function handle_order_insert();

-- C. Mudança de Status e Dedução/Estorno Automático de Estoque
create or replace function handle_order_status_change()
returns trigger as $$
declare
  item record;
  is_old_operational boolean;
  is_new_operational boolean;
begin
  -- Registrar no histórico
  insert into order_status_history (order_id, old_status, new_status)
  values (new.id, old.status, new.status);

  -- Definir se os status antigo e novo são operacionais (com baixa de estoque)
  is_old_operational := old.status in ('PAGAMENTO_CONFIRMADO', 'EM_MONTAGEM', 'EM_ENTREGA', 'FINALIZADO');
  is_new_operational := new.status in ('PAGAMENTO_CONFIRMADO', 'EM_MONTAGEM', 'EM_ENTREGA', 'FINALIZADO');

  -- Transição de NÃO operacional para OPERACIONAL -> Deduzir Estoque
  if is_new_operational and not is_old_operational then
    for item in select product_id, quantity from order_items where order_id = new.id loop
      update products
      set stock = stock - item.quantity
      where id = item.product_id;

      if (select stock from products where id = item.product_id) < 0 then
        raise exception 'Produto com ID % possui estoque insuficiente.', item.product_id;
      end if;
    end loop;

  -- Transição de OPERACIONAL para NÃO operacional (ex: CANCELADO ou retorno para EM_NEGOCIACAO) -> Devolver Estoque
  elsif not is_new_operational and is_old_operational then
    for item in select product_id, quantity from order_items where order_id = new.id loop
      update products
      set stock = stock + item.quantity
      where id = item.product_id;
    end loop;
  end if;

  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_handle_order_status_change
before update on orders
for each row
execute function handle_order_status_change();
```

### 📥 Payload de Entrada (Criação de Pedido / API Route)
```json
{
  "client_name": "João Silva",
  "client_phone": "74999999999",
  "basket_id": "8b51d529-6be5-451e-b83c-1b5e1950b5f1",
  "items": [
    {
      "product_id": "4a51d529-6be5-451e-b83c-1b5e1950b5fa",
      "quantity": 1
    },
    {
      "product_id": "5b51d529-6be5-451e-b83c-1b5e1950b5fb",
      "quantity": 2
    }
  ]
}
```

### 📤 Payload de Saída (Pedido Registrado)
```json
{
  "id": "e951d529-6be5-451e-b83c-1b5e1950b5f5",
  "protocol": "CP-000001",
  "client_name": "João Silva",
  "client_phone": "74999999999",
  "basket_name": "Família",
  "items": [
    {
      "product_name": "Arroz Camil",
      "quantity": 1
    },
    {
      "product_name": "Feijão Kicaldo",
      "quantity": 2
    }
  ],
  "status": "AGUARDANDO_CONTATO",
  "whatsapp_url": "https://api.whatsapp.com/send?phone=5574999999999&text=Ol%C3%A1%2C%20gostaria%20de%20solicitar%20o%20pedido%20da%20cesta%20Fam%C3%ADlia.%20Itens%20selecionados%3A%0A-%20Arroz%20Camil%0A-%20Feij%C3%A3o%20Kicaldo%0A%0AProtocolo%3A%20CP-000001"
}
```

## 📋 Log de Manutenção
- **2026-05-25**: Inicialização da constituição do projeto.
- **2026-05-25**: Primeira revisão e atualização com base nas Perguntas de Descoberta.
- **2026-05-25**: Ajuste total e refinamento da arquitetura técnica para Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, nova modelagem física de tabelas (incluindo `customers` e `basket_items`), e a nova regra operacional para baixa/estorno de estoque.
