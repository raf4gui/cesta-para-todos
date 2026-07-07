# Procedimento Operacional Padrão: Controle de Estoque (inventory_flow_pop.md)

## 🎯 Objetivo
Definir as regras operacionais de estoque de produtos, reservas automáticas, validações de indisponibilidade e níveis de alerta para a administradora.

---

## 📦 Regras de Baixa e Estorno de Estoque

### 1. Estado de Espera (Não Operacional)
- Quando o pedido é registrado pelo cliente, ele assume o status inicial de `AGUARDANDO_CONTATO`.
- Nesse momento, **NENHUMA** baixa ou reserva de estoque física é realizada na tabela `products`.
- Isso evita que o estoque seja bloqueado por cliques não finalizados, carrinhos abandonados ou pedidos não qualificados no WhatsApp.

### 2. Baixa de Estoque (Transição Operacional)
- O estoque dos produtos comprados só será deduzido fisicamente quando o pedido atingir um dos seguintes status operacionais gerenciados pela administradora:
  - `PAGAMENTO_CONFIRMADO`
  - `EM_MONTAGEM`
  - `EM_ENTREGA`
  - `FINALIZADO`
- Essa baixa é processada de forma atômica no banco de dados via PostgreSQL Trigger. Se algum dos itens do pedido não tiver estoque suficiente no momento dessa transição, o banco lançará uma exceção e impedirá a mudança de status, informando o erro à administradora.

### 3. Estorno de Estoque
- Caso o pedido sofra um cancelamento (`CANCELADO`) ou regrida para um status não operacional (como `EM_NEGOCIACAO` ou `AGUARDANDO_CONTATO`), o estoque dos itens desse pedido é restabelecido automaticamente (soma-se a quantidade de volta ao estoque dos respectivos produtos).

---

## 🚫 Validação de Indisponibilidade (Filtro do Cliente)
- **Bloqueio no Catálogo**: Produtos que possuem estoque menor ou igual a zero (`stock <= 0`) **NÃO** podem ser disponibilizados no catálogo para customização pelo cliente.
- O frontend deve ativamente ocultar estes produtos ou marcá-los como desabilitados/indisponíveis de forma a impedir a seleção.

---

## ⚠️ Níveis de Alerta de Estoque
A interface do painel administrativo da administradora deve exibir indicadores visuais claros e alertas baseados nos níveis de estoque de cada produto:

1. **🔴 Estoque Zerado (`stock = 0`)**:
   - **Indicador**: Badge vermelho brilhante ("Fora de Estoque / Indisponível").
   - **Comportamento**: Produto é ocultado automaticamente do catálogo do cliente.
2. **🟡 Estoque Crítico (`0 < stock <= 3`)**:
   - **Indicador**: Alerta laranja piscante ("Atenção: Reposição Urgente").
   - **Comportamento**: Alerta visual no painel do administrador para reabastecimento imediato.
3. **🔵 Estoque Baixo (`3 < stock <= 8`)**:
   - **Indicador**: Texto amarelo ("Estoque Baixo").
   - **Comportamento**: Notificação simples na lista de produtos.
