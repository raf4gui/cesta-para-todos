# Descobertas e Pesquisas: Cesta para Todos (findings.md)

## 🔍 Pesquisas Iniciais & Estratégia
Com base nas respostas de descoberta do usuário, traçamos a seguinte estratégia funcional para assegurar máxima confiabilidade técnica e experiência premium:

1. **Gestão de Dados Reativa no Banco**: 
   - A geração do código sequencial de protocolo (`CP-XXXXXX`) e a atualização/dedução do estoque dos produtos são executadas no PostgreSQL (Supabase) via triggers atômicos. Isso protege contra inconsistências causadas por perda de conexões de rede ou concorrência.
2. **Exclusão de Preço no Frontend de Clientes**:
   - Para obedecer à regra de que o cliente não visualiza preços, o frontend de catálogo nunca requisitará o campo `price` dos produtos ou cestas nas consultas públicas de usuários não autenticados (ou podemos usar as políticas de segurança de linha - RLS - do Supabase para retornar `null` no campo `price` para usuários não administradores).
3. **Link de WhatsApp Sem Fricção**:
   - A geração da URL é 100% dinâmica. O texto encode é estruturado de forma legível e humanizada para a atendente ler com facilidade as customizações efetuadas pelo usuário.
4. **Sem Cadastro de Clientes**:
   - O fluxo é direto. Nome e Telefone são coletados na etapa de confirmação, armazenados no banco com o pedido e usados no link do WhatsApp.

## ⚙️ Restrições & Requisitos
- **Estoque em Tempo Real**: Produtos com `stock <= 0` não podem ser selecionados para montagem.
- **Transições Rígidas**: Apenas transições lineares autorizadas de status ou transição instantânea para `CANCELADO` são permitidas.
- **Rastreamento de Pedido**: Timeline visual simples utilizando apenas o protocolo único gerado.
- **Autenticação Admin**: Apenas a administradora se autentica para obter acesso aos preços, estoque e controle dos pedidos.
- **Conectividade**: Nenhum script funcional roda até o link e handshake de API com o Supabase estarem totalmente testados.

## ⚡ Resultados do Handshake de Conexão (Fase 2)
- **Supabase Project Created**: `cesta-para-todos` (ref: `lnntzdncmdpjiescgwwj`, Region: `sa-east-1` São Paulo).
- **Tabelas Criadas & Verificadas**: `users`, `customers`, `brands`, `products`, `baskets`, `basket_items`, `orders`, `order_items`, `order_status_history`.
- **Validação de Triggers e Integridade**:
  1. **Protocolo Sequencial**: Criação de pedidos ativa o trigger que gera protocolos sequenciais incrementais (`CP-000001`).
  2. **Controle de Estoque Condicional**:
     - Criação do pedido com status `AGUARDANDO_CONTATO` mantém o estoque intacto.
     - Transição para o status `PAGAMENTO_CONFIRMADO` deduz automaticamente os itens do estoque de produtos.
     - Transição para o status `CANCELADO` realiza o estorno automático e restabelece a quantidade original no estoque.
  3. **Histórico Automatizado**: O histórico é populado de forma contínua com cada alteração de status (ex: `null` -> `AGUARDANDO_CONTATO` -> `PAGAMENTO_CONFIRMADO` -> `CANCELADO`).
  4. **Pristine State**: Todos os dados de teste foram apagados com sucesso, deixando a estrutura de banco de dados limpa e pronta para uso.


