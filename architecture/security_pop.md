# Procedimento Operacional Padrão: Segurança e Controle de Acesso (security_pop.md)

## 🎯 Objetivo
Definir as barreiras de proteção cibernética, autenticação e políticas de segurança RLS (Row Level Security) para o ecossistema "Cesta para Todos".

---

## 🔒 Autenticação e Perfis

### 1. Autenticação Core
- A autenticação é provida exclusivamente pelo **Supabase Auth**.
- O login de administrador utiliza e-mail e senha por meio do módulo GoTrue do Supabase.

### 2. Perfil de Acesso
- O sistema adota um modelo de **Administradora Única**.
- Não são implementados múltiplos perfis, cargos, permissões avançadas, ou hierarquias complexas.
- Qualquer usuário autenticado com sucesso é considerado o administrador global com acesso total de escrita/leitura a todas as rotas e tabelas administrativas.

---

## 🛡️ Proteções e Middleware

### 1. Middleware Obrigatório
- Todas as rotas sob o prefixo `/admin/*` são protegidas a nível de servidor pelo Middleware do Next.js.
- O Middleware intercepta todas as requisições de página e rotas de API administrativas:
  - Verifica o token JWT de sessão ativa do Supabase.
  - Se o token for inválido, inexistente ou expirado, redireciona imediatamente para a página pública de login `/login`.
- Acesso à API interna sob `/api/admin/*` rejeita requisições não autenticadas com o status `HTTP 401 Unauthorized`.

### 2. Row Level Security (RLS) habilitado
- Todas as tabelas criadas no banco de dados devem ter o `Row Level Security` (RLS) **habilitado**.
- Nenhuma consulta ou inserção pública direta ao banco por clientes pode contornar as regras de acesso RLS.

---

## 📊 Políticas RLS por Tabela

As seguintes políticas RLS são aplicadas no PostgreSQL para garantir o controle rigoroso:

### 1. Tabela `customers` (Clientes)
- **Admin**: Acesso total de Leitura e Escrita (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
- **Público (Clientes não autenticados)**: Apenas permissão de `INSERT` (para registrar dados ao realizar o pedido). Não é permitido ler dados de outros clientes (`SELECT` negado).

### 2. Tabela `products` (Produtos)
- **Admin**: Acesso total de Leitura e Escrita.
- **Público**: Permissão de `SELECT` apenas para produtos onde `deleted_at is null` e `stock > 0` para exibição no catálogo. Campos confidenciais como `price` (preço) não são retornados nas consultas públicas ou são protegidos (ex: retornando null para usuários anônimos via políticas ou mapeamento do frontend).

### 3. Tabela `orders` (Pedidos)
- **Admin**: Acesso total de Leitura e Escrita.
- **Público**: Permissão de `INSERT` (para criação de pedido pelo cliente) e permissão de `SELECT` restrita à consulta por protocolo de rastreamento (filtro rigoroso `protocol = [codigo]`).

### 4. Tabela `order_items` & `order_status_history`
- **Admin**: Acesso total de Leitura e Escrita.
- **Público**: Permissão de `INSERT` para itens do pedido. Permissão de `SELECT` apenas se associado ao protocolo do pedido na consulta de rastreamento.
