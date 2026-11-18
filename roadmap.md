# MenuVision — primeira entrega
## Pedidos pelo cardápio digital
- [ ] Após os pedidos: apresentar diagnóstico e plano da expansão SaaS do documento reenviado, sem implementar todos os módulos juntos.
- [ ] Publicação opcional do cardápio, carrinho e envio de pedidos sem cadastro do cliente.
- [ ] Acompanhamento pelo cliente e atualização de status pelo restaurante com isolamento de dados.
- [ ] Verificar envio, persistência e status na interface e executar testes.

- [x] Identidade visual e página inicial completa.
- [x] Cadastro, login, recuperação de senha e logout.
- [x] Perfis e restaurantes com isolamento de dados.
- [x] Painel inicial e configurações reais do restaurante.
- [x] Testes e verificação em computador e celular; login, salvamento, isolamento e logout confirmados com contas temporárias.

Entrega de e-mails de confirmação e recuperação não verificada em uma caixa de entrada real.

## Segunda etapa — sistema funcional
- [x] Cadastro com telefone e confirmação de senha; validação conferida na interface.
- [x] Pratos e categorias persistentes com acesso exclusivo do restaurante.
- [x] Fotografias protegidas, edição, ativação e exclusão com confirmação.
- [x] Menu completo e painel com contagens reais; áreas futuras identificadas como indisponíveis.
- [x] Login, persistência após sair e entrar, isolamento de leitura/escrita/fotos, exclusão e layout verificados com contas temporárias removidas após os testes.
- [ ] Concluir cadastro pelo link de confirmação e recuperação em uma caixa de entrada real. Bloqueio: não há caixa de testes disponível; o serviço rejeita domínios fictícios. Autenticação por e-mail e exigência de confirmação verificadas nas configurações reais.

## Planos semanais e diferenciação comercial
- [x] Configuração persistente de planos, recursos, limites e promoções; alterações privilegiadas, sem painel de gestão nesta entrega.
- [x] Cartões de preços semanais e instalação única, com disponibilidade real dos recursos.
- [x] Estrutura protegida para Mercado Pago, histórico, cancelamento e inadimplência, sem ativar cobrança; integração e webhooks ainda não configurados.
- [x] 19 testes passaram, incluindo valores e limites reais do catálogo e acesso anônimo negado aos registros financeiros; os três botões, recarga e layout no computador/celular foram verificados sem erros.

## Pagamentos Mercado Pago
- [x] Rejeitar notificações sem verificação configurada com resposta de autenticação, sem falha de servidor nem alteração financeira.
- [x] Conectar a conta recebedora do Mercado Pago.
- [x] Implementar cobrança da instalação e assinatura semanal, confirmação segura de pagamentos e acompanhamento pelo contratante.
- [ ] Verificar contratação completa no ambiente de testes e configurar notificações na versão publicada. Bloqueio: assinatura secreta das notificações ainda não fornecida e app não publicado; a contratação permanece bloqueada por segurança.

## Comida em realidade aumentada
- [ ] Visualizar o prato selecionado em 3D pela câmera do celular, posicionado no ambiente em escala real.
- [x] Conectar Tripo e implementar geração por foto, progresso persistente, armazenamento privado dos modelos e largura física em centímetros.
- [ ] Verificar geração completa com foto real e visualizador; conta atual não possui pratos com foto. Posicionamento e escala na câmera precisam de teste em celular compatível.

## Próximas etapas (fora desta entrega)
Cardápio público, QR Code, pedidos, Meshy AI, visualizador 3D/AR e Mercado Pago.