# Procedimento Operacional Padrão: Integração WhatsApp (whatsapp_flow_pop.md)

## 🎯 Objetivo
Padronizar a geração dinâmica de deep links para abertura automática do WhatsApp sem a necessidade de APIs pagas, intermediárias, oficiais ou chatbots.

---

## 📡 Premissas de Integração
- **Sem API Oficial (WhatsApp Cloud API)**: Não são usados webhooks de entrada nem conexões pagas ou dependentes de verificação de número comercial.
- **Sem Chatbots**: A interação é 100% humanizada entre o cliente e a administradora/atendente.
- **Link Direto (Deep Link)**: Utiliza puramente o padrão universal `https://wa.me/` ou `https://api.whatsapp.com/send`.

---

## 🗺️ Fluxo de Ação do Sistema

Quando o cliente clica em "Solicitar Pedido" no frontend:

1. **Persistência**: O formulário do cliente é validado no frontend e enviado para gravação no banco.
2. **Obtenção de Protocolo**: A API responde com o protocolo recém-criado (ex: `CP-000001`).
3. **Mapeamento de Conteúdo**: O frontend (ou backend) monta uma string contendo todas as variáveis formatadas.
4. **Encoding**: A string da mensagem é processada por um codificador URL (`encodeURIComponent()`).
5. **Redirecionamento**: O sistema chama o método `window.open(whatsappUrl, '_blank')` para iniciar a conversa.

---

## ✉️ Estrutura e Formato da Mensagem

A mensagem enviada no WhatsApp deve ser legível, organizada e amigável para a atendente. O padrão de texto a ser gerado é o seguinte:

```plaintext
Olá! Gostaria de solicitar o pedido da cesta: *[Nome da Cesta]*

*Meus Dados:*
- 👤 *Nome:* [Nome do Cliente]
- 📞 *Telefone:* [Telefone do Cliente]

*Itens Selecionados (Personalizados):*
- 🔹 [Qtd]x [Produto A] ([Marca A])
- 🔹 [Qtd]x [Produto B] ([Marca B])
- 🔹 [Qtd]x [Produto C] ([Marca C])

*Protocolo do Pedido:*
📌 *[CP-XXXXXX]*

---
_Acompanhe o andamento do meu pedido em:_
🔗 [URL_DOMINIO]/rastreio/[CP-XXXXXX]
```

### Exemplo de URL Gerada:
```plaintext
https://wa.me/5574999999999?text=Ol%C3%A1%2C%20gostaria%20de%20solicitar%20o%20pedido%20da%20cesta%20Fam%C3%ADlia...
```

- O número de telefone destino deve ser configurado como uma variável de ambiente no backend/frontend da administradora (`NEXT_PUBLIC_WHATSAPP_NUMBER`).
