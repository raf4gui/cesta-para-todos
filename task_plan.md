# Plano de Tarefas: Cesta para Todos (task_plan.md)

## 🗺️ Blueprint Técnico Refinado

### 💻 Stack Tecnológica
- **Frontend Framework**: Next.js (App Router), React, TypeScript.
- **Styling & UI**: Tailwind CSS + shadcn/ui para visual de alta qualidade e moderno.
- **Backend / API**: Next.js API Routes (rotas `/api/orders`, `/api/admin/...`), TypeScript.
- **Banco de Dados & Autenticação**: Supabase PostgreSQL + Supabase Auth (para a única administradora).
- **Integração WhatsApp**: Link Deep Link (`https://wa.me/` / `https://api.whatsapp.com/send?phone=...&text=...`), sem chatbot ou APIs pagas.

### 📁 Estrutura de Arquivos Planejada (Next.js + Supabase)
```plaintext
Site cesta para todos/
├── gemini.md                 # Constituição do Projeto e Schemas
├── task_plan.md              # Plano de Trabalho e Blueprint
├── findings.md               # Pesquisas e Credenciais
├── progress.md               # Diário de Bordo e Logs de Erros
├── .env.local                # Variáveis de ambiente locais (SUPABASE_URL, SUPABASE_SERVICE_ROLE, etc.)
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Layout raiz (Configuração de fontes Outfit/Inter e tema)
│   │   ├── page.tsx          # Catálogo de Cestas e Modal de Personalização (Cliente)
│   │   ├── rastreio/
│   │   │   └── [codigo]/
│   │   │       └── page.tsx  # Página Pública de Rastreamento (Sem Login, protocolo CP-XXXXXX)
│   │   ├── login/
│   │   │   └── page.tsx      # Tela de login da Administradora
│   │   └── admin/
│   │       ├── layout.tsx    # Painel administrativo protegido
│   │       ├── page.tsx      # Dashboard (Listagem de Pedidos, Mudança de Status e Histórico)
│   │       ├── produtos/
│   │       │   └── page.tsx  # CRUD de Produtos e Estoque
│   │       ├── marcas/
│   │       │   └── page.tsx  # CRUD de Marcas
│   │       └── cestas/
│   │           └── page.tsx  # CRUD de Cestas e associação de itens
│   ├── components/
│   │   ├── ui/               # Componentes do shadcn/ui
│   │   └── custom/           # Componentes customizados (Catálogo, Timeline, etc.)
│   ├── lib/
│   │   └── supabase.ts       # Inicialização do cliente Supabase
│   └── types/
│       └── index.ts          # Definições de tipos TypeScript
├── supabase/
│   ├── migrations/
│   │   └── 20260525000000_init_schema.sql  # Migração inicial com tabelas, triggers e sequências
│   └── config.toml           # Arquivo de configuração local se necessário
├── architecture/             # Camada 1: POPs de Execução
│   ├── db_migration.md       # POP para migração de banco de dados
│   └── order_flow.md         # POP para o fluxo de pedido e estoque
└── tools/                    # Camada 3: Scripts de Automação
    ├── db_setup.py           # Script Python para migração e criação de tabelas/triggers
    └── test_connection.py    # Script de Handshake para testes de conectividade
```

---

## 🔒 Regras de Negócio e Validações Obrigatórias

### 👥 Perfis de Acesso e Funcionalidades

#### O Cliente:
- **Pode**:
  - Visualizar a lista de cestas disponíveis.
  - Personalizar produtos e marcas da cesta selecionada.
  - Informar Nome e Telefone na conclusão.
  - Enviar pedido gerando protocolo e abrindo WhatsApp com resumo estruturado.
- **NÃO Pode**:
  - Visualizar preços de produtos ou cestas (catálogo focado estritamente em customização).
  - Realizar pagamentos online no site.
  - Criar conta ou fazer login.

#### A Administradora (Única):
- **Pode**:
  - Acessar o painel administrativo protegido por Supabase Auth.
  - Gerenciar produtos (incluindo preço e estoque).
  - Gerenciar marcas.
  - Gerenciar cestas básicas.
  - Controlar/atualizar níveis de estoque.
  - Visualizar clientes e pedidos recebidos.
  - Alterar status dos pedidos e acompanhar o histórico de transições.
- **Nota de Escopo**: Modelo de administração simples. Não há múltiplos perfis, cargos ou permissões avançadas.

### 📦 Fluxo Oficial de Pedidos e Controle de Estoque
- **Status Permitidos**: `AGUARDANDO_CONTATO` ➔ `EM_NEGOCIACAO` ➔ `PAGAMENTO_CONFIRMADO` ➔ `EM_MONTAGEM` ➔ `EM_ENTREGA` ➔ `FINALIZADO` (ou `CANCELADO` de forma direta a partir de qualquer estado).
- **Dedução do Estoque**: O estoque **NÃO** é deduzido na criação do pedido (que inicia em `AGUARDANDO_CONTATO`). Ele só será baixado quando o pedido atingir o status de `PAGAMENTO_CONFIRMADO` ou `EM_MONTAGEM`.
- **Estorno Automático**: Se o pedido for cancelado (`CANCELADO`) ou regredir de um status operacional para não operacional (ex: voltando para `EM_NEGOCIACAO`), as quantidades dos itens do pedido são estornadas (devolvidas) automaticamente ao estoque.
- **Garantia de Integridade**: Essa inteligência de transição e estoque é operada via PostgreSQL Triggers no Supabase.

---

## 🏁 Checklist de Marcos e Fases

### 🟢 Fase 0: Inicialização (Concluída)
- [x] Criar `gemini.md` (Constituição)
- [x] Criar `task_plan.md` (Plano de Trabalho)
- [x] Criar `findings.md` (Descobertas)
- [x] Criar `progress.md` (Progresso)
- [x] Obter respostas para as Perguntas de Descoberta
- [x] Definir e registrar o Esquema de Dados e Blueprint em `gemini.md` e `task_plan.md`

### 🏗️ Fase 1: V - Visão (e Lógica) (Concluída)
- [x] Definir JSON Data Schema de Entrada/Saída
- [x] Atualizar Blueprint técnico com a stack Next.js + React + TS + Tailwind + shadcn/ui
- [x] Definir explicitamente o fluxo de status, regras de estoque condicional e rastreio público
- [x] Obter aprovação do Blueprint Técnico

### ⚡ Fase 2: L - Link (Conectividade) (Concluída)
- [x] Validar e selecionar/criar o projeto no Supabase
- [x] Criar arquivo `.env.local` com credenciais (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.)
- [x] Criar arquivo `.env.example` com template de configurações
- [x] Desenvolver e aplicar migrations iniciais locais e remotas
- [x] Executar teste de conectividade e validar chaves do Supabase (Leitura, Escrita, Atualização, Consulta e Trigger de estoque verificados)

### ⚙️ Fase 3: A - Arquitetura (3 Camadas) (Concluída)
- [x] **Camada 1 (Arquitetura)**: Criar POPs técnicos na pasta `architecture/` (7 POPs criados com sucesso!)
- [x] Criar arquivo de migração inicial `.sql` com o schema relacional e triggers refinados na pasta `supabase/migrations/`
- [x] **Camada 3 (Ferramentas)**: Criar `tools/db_setup.py` e `tools/test_connection.py` no workspace
- [x] Executar o setup de banco de dados e verificar no Supabase se as tabelas, triggers e sequências foram criadas com sucesso
- [x] Validar de ponta a ponta as regras de negócio em banco (triggers de estoque, histórico e protocolos sequenciais)

#### 📝 Registro de Homologação da Arquitetura:
- ✓ Arquitetura em 3 camadas (A.N.T.) definida e documentada.
- ✓ Todos os 7 POPs operacionais criados com sucesso.
- ✓ Todos os fluxos críticos de negócio devidamente documentados.
- ✓ Mapa de Navegação da Área Pública e Administrativa estruturado.
- ✓ Regras de negócio, integridade de estoque e protocolos homologados diretamente no banco de dados.

### ✨ Fase 4: E - Estilo (UI/UX e Frontend Next.js) (PRÓXIMA FASE)
- [ ] Inicializar o projeto Next.js com as configurações de Tailwind e shadcn/ui no workspace
- [ ] Desenvolver componentes de UI premium (Outfit/Inter fonts, Glassmorphism, transições suaves)
- [ ] Desenvolver a interface pública do cliente (`src/app/page.tsx` para catálogo e modal de montagem)
- [ ] Desenvolver a rota pública de rastreamento (`src/app/rastreio/[codigo]/page.tsx`)
- [ ] Desenvolver a tela de Login da Administradora (`src/app/login/page.tsx`)
- [ ] Desenvolver o Dashboard Administrativo integrado (`src/app/admin/`) com gerenciamento de pedidos, produtos, estoque, marcas e cestas.
- [ ] Garantir o bloqueio total da exposição de preços aos clientes finais no catálogo e rotas de rastreamento

### 🛰️ Fase 5: G - Gatilho (Deploy e Entrega)
- [ ] Homologar o fluxo de baixa e estorno condicional de estoque
- [ ] Testar redirecionamento automático para WhatsApp via Deep Link wa.me
- [ ] Registrar logs de manutenção finais e estabilização do SaaS
