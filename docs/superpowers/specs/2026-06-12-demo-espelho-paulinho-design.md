# Demo espelho do app do Paulinho — Design

**Data:** 2026-06-12
**Objetivo:** atualizar o app demo (`gabinete-demo.vercel.app`, repo `-gabinete-demo`, banco Supabase `yemlhsidmlxzpqimewox`) para ser uma cópia rebrandeada do app real do Paulinho (`C:\Projetos\gabinete-digital-novo\gabinete-digital`), que é a versão mais evoluída do produto. O demo passa a mostrar ao cliente exatamente o que ele vai receber.

## Decisões (aprovadas pela Andressa)

1. **Estratégia:** substituir o código do demo pelo código do Paulinho (não portar feature a feature). Os componentes exclusivos do demo antigo (Dashboard único, MapaDemo, GestaoAdmins, CadastroEleitorDemo, PainelRastreamento, CentralRedesSociais, LocaisVotacao, LinkRastreavel, dados.js) são aposentados — o app novo cobre tudo.
2. **Marca:** "Deputado Demo", genérico. Sem foto (avatar de inicial). **Sem Linktree** (botão, canal de links rastreados e destino removidos no demo).
3. **Instagram editável:** o link do Instagram deixa de ser fixo no código e passa a vir de `config_candidato` (nova coluna `instagram_url`), editável pela tela ⚙️ Config do Candidato. Assim cada comprador entra com o perfil dele sem mexer em código.
4. **Cobrança:** continua **manual**, igual ao Paulinho — master ativa/renova/bloqueia pela tela 👑 Assinatura (TelaMaster). Mercado Pago fica fora de escopo (projeto futuro próprio).
5. **Contas:** MASTER = `andressa.sousa.25.as@gmail.com`; EQUIPE = reaproveitar `gabinetedigitaldigitalsf@gmail.com` (já existe no Auth do demo); CANDIDATO e ADM = contas novas de demonstração criadas via API admin (senha simples, definida na implementação e entregue à Andressa).
6. **Dados:** manter os fictícios existentes e completar (zona/seção faltantes, registro espelho de cada liderança em `eleitores`, coordenadas zeradas para re-geocodificação pelo mapa novo, licença ATIVA).

## Mudanças

### Código (repo `-gabinete-demo`, branch de trabalho → merge em `master`)
- Copiar o `src/` (+ config de build, testes, edge functions) do app do Paulinho por cima do demo.
- Rebrand: nome/cargo "Deputado Demo / Deputado Estadual — AP"; título "Gabinete Demo 2026"; mensagem de WhatsApp genérica; remover `paulinho-ramos.jpg` (avatar = círculo com inicial); URLs públicas (`#/cadastro`, `#/r/...`) usando `gabinete-demo.vercel.app`.
- Instagram: botão da Central de Comunicação e destino do LinkTracker leem `config_candidato.instagram_url` (fallback: desabilitado/placeholder se vazio); campo novo no modal ⚙️ Config.
- Remover Linktree por completo no demo.

### Banco demo (migrações via MCP Supabase)
- Criar `perfis_usuarios` (modelo do Paulinho: user_id, email, nome, perfil com CHECK incluindo MASTER, ativo) e popular com as 4 contas.
- Ajustar `eh_master()` para ler `perfis_usuarios.perfil = 'MASTER'`; `licenca_valida()` e portão `acesso_logado` já existem no demo (conferir cobertura de todas as tabelas usadas pelo app novo).
- Criar `rastreamento_links` (com `lideranca_id`) + RPC `registrar_clique_link` (SECURITY DEFINER, grant anon).
- Conferir/criar RPC `registrar_clique_midia` no padrão do Paulinho.
- `logs_atividades` no padrão novo (user_id, RLS `logs_select_master`/`logs_insert_logado`).
- `vw_mapa_eleitores` com `coalesce(endereco,logradouro)`/`coalesce(municipio,cidade)`, `security_invoker`, flag de liderança.
- `config_candidato`: garantir linha única + coluna `instagram_url`.
- Aposentar multi-tenant descartado: remover trigger `set_gabinete_id`, funções `meu_gabinete()`/afins e tabelas `membros`/`gabinetes`. Colunas `gabinete_id` podem ficar (inofensivas).
- Políticas anon das rotas públicas iguais às do Paulinho (insert eleitores, insert/select liderancas conforme o app).
- Deploy da edge function `gerir-usuarios` no projeto demo.

### Supabase Auth do demo (etapa guiada por painel — Andressa executa com orientação)
- Site URL = `https://gabinete-demo.vercel.app` + redirect `https://gabinete-demo.vercel.app/**`.
- SMTP personalizado = mesmas credenciais Brevo do Paulinho (host `smtp-relay.brevo.com`, porta 587, sender `nao-responda@gabinetedigitalsf.com.br`).

### Validação
- `npm run build` + vitest (suite do Paulinho: bairros, licenca, papeis, logAtividade).
- Login com as 4 contas → cada uma abre o painel certo; master vê 👑 e 👥.
- Mapa com pins corretos (re-geocodificação automática no primeiro open).
- Link público de cadastro e link rastreado funcionando com URLs do demo.
- Anon bloqueado (0 dados sem login).
- Push → Vercel publica → conferir em produção.

## Fora de escopo
- Qualquer mudança no app do Paulinho.
- Mercado Pago / cobrança automática (projeto futuro).
- Painel central de clientes.
- Templates de e-mail PT-BR (pendência separada, vale pros dois projetos).
