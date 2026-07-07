# Procedimento Operacional Padrão: Rastreamento Público (tracking_flow_pop.md)

## 🎯 Objetivo
Definir o fluxo de consulta pública do status dos pedidos pelos clientes, garantindo privacidade, facilidade de uso e linguagem acessível.

---

## 🔗 Estrutura de URL Pública
- O rastreamento de pedidos é feito via uma rota dinâmica pública no Next.js:
  `/rastreio/[codigo]`
- **Exemplo**: Acessar `/rastreio/CP-000001` carrega em tempo real o status correspondente a esse protocolo.
- **Sem Fricção / Sem Login**: O cliente **não** precisa realizar cadastro, e-mail de confirmação ou login para acessar o andamento do pedido. Basta ter o link do protocolo gerado.

---

## 🎨 Elementos Visuais e Timeline

A interface de rastreamento deve ser visualmente rica, utilizando uma timeline vertical/horizontal moderna com estados claros e micro-animações:

### Estados da Timeline:
1. **📥 Pedido Recebido** *(Mapeado para `AGUARDANDO_CONTATO`)*:
   - **Linguagem**: "Recebemos sua solicitação! Logo entraremos em contato."
2. **💬 Em Negociação** *(Mapeado para `EM_NEGOCIACAO`)*:
   - **Linguagem**: "Estamos conversando com você no WhatsApp para alinhar os detalhes."
3. **💳 Pagamento Confirmado** *(Mapeado para `PAGAMENTO_CONFIRMADO`)*:
   - **Linguagem**: "Obrigado! Identificamos o seu pagamento com sucesso."
4. **📦 Em Montagem** *(Mapeado para `EM_MONTAGEM`)*:
   - **Linguagem**: "Sua cesta está sendo montada com muito carinho e cuidado!"
5. **🚚 Em Entrega** *(Mapeado para `EM_ENTREGA`)*:
   - **Linguagem**: "Oba! Seu pedido já está a caminho do seu endereço."
6. **✅ Finalizado** *(Mapeado para `FINALIZADO`)*:
   - **Linguagem**: "Pedido entregue com sucesso! Agradecemos a preferência."

---

## 🔴 Tratamento de Cancelamento (`CANCELADO`)
- Se o status do pedido for alterado para `CANCELADO`, a timeline tradicional de progresso é substituída ou sobreposta por um banner vermelho elegante de alerta:
  - **Mensagem**: "Este pedido foi Cancelado. Caso tenha dúvidas, entre em contato conosco pelo WhatsApp."
- O estoque associado ao pedido é liberado imediatamente no banco, sem intervenção do cliente.
