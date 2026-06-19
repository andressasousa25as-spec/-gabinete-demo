# App PWA "Gabinete SF" — Especificação de Design

**Data:** 2026-06-19
**Status:** aprovado para planejamento
**Escopo:** transformar o Gabinete Digital (web) em aplicativo instalável (PWA) com notificações push. Aplica-se aos DOIS repositórios/apps (demo e Paulinho).

> Feature irmã (fora deste spec): **apuração paralela ao TSE** — terá especificação própria.
> Fora de escopo agora: WhatsApp em massa/automação (pago, fica para a fase de campanha).

---

## 1. Objetivo

Dar ao Gabinete a percepção e os recursos de um "app de verdade", igualando o app da Politique, sem reescrever para nativo:
- Ícone na tela inicial, abertura em tela cheia (sem barra do navegador), splash screen.
- Funcionamento parcial offline.
- Notificações push no celular.

Reaproveita 100% do código React+Vite+Supabase existente.

## 2. Identidade visual

- **Nome do app:** Gabinete SF
- **Paleta (base Grupo BS):** fundo azul-marinho profundo `#0E2236`; dourado `#CBA15C` (brilho `#E7CC8A` → bronze `#9C6B2E`).
- **Ícone:** monograma "SF" dourado sobre azul-marinho, com traço dourado inferior (conceito A). Borda dourada sutil só na versão grande.
- **Theme color** (barra de status): `#0E2236`.
- Entregáveis de ícone: `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` (com margem de segurança ~20% para recorte Android), `apple-touch-icon.png` (180px). Provisórios gerados a partir do conceito aprovado; substituíveis depois.

## 3. Arquitetura

### 3.1 PWA base
- Adicionar `vite-plugin-pwa` (Workbox) em cada repo.
- `manifest`: name "Gabinete SF", short_name "Gabinete SF", display `standalone`, background_color e theme_color `#0E2236`, ícones acima.
- Service worker com **precache** da app shell (build assets) — gerado automaticamente.
- Botão **"Instalar app"** dentro do sistema, exibido quando o evento `beforeinstallprompt` estiver disponível (Android/desktop). Em iOS, instrução "Compartilhar → Adicionar à Tela de Início".

### 3.2 Offline
- App shell: precache (abre sem internet).
- Dados de leitura: runtime caching `NetworkFirst` para chamadas GET ao Supabase REST (última versão quando offline).
- Gravações (insert/update/delete): exigem rede; sem conexão, exibir aviso "sem conexão" e não falhar silenciosamente.
- Mapbox: sem cache (online apenas).

### 3.3 Push (Web Push + VAPID)
- **Chaves VAPID:** par gerado por ambiente. Pública em env do frontend (`VITE_VAPID_PUBLIC_KEY`); privada nos **secrets do Supabase** (nunca no código/git).
- **Tabela nova `push_subscriptions`:** `id`, `user_id` (FK auth.users), `endpoint` (unique), `p256dh`, `auth`, `user_agent`, `created_at`. RLS no padrão do gabinete (`acesso_logado` gateado por licença) + o usuário só vê/gerencia a própria assinatura.
- **Fluxo de assinatura (frontend):** ao abrir o app instalado, pedir permissão; se concedida, `PushManager.subscribe` com a chave pública e salvar a assinatura na tabela (upsert por endpoint).
- **Envio (Edge Function `send-push`):** recebe `{titulo, corpo, url, destinatarios}`; lê assinaturas; dispara Web Push (lib `web-push` com VAPID). Remove assinaturas inválidas (410/404).

### 3.4 Gatilhos dos 4 avisos
Como o modelo é **um banco por cliente**, "equipe/todos" = todos os usuários do gabinete.

| Aviso | Gatilho | Destinatários |
|---|---|---|
| Nova demanda | trigger `AFTER INSERT` em `demandas` → chama `send-push` via `pg_net` | equipe (exceto criador) |
| Demanda atrasada | `pg_cron` diário: `prazo < hoje` e `status NOT IN ('Resolvida','Cancelada')` | responsável se preenchido; senão equipe |
| Novo cadastro de eleitor | trigger `AFTER INSERT` em `eleitores` quando origem = público | equipe |
| Lembrete de reunião | `pg_cron`: reuniões com `data` em janela (ex: 24h e 1h antes) | equipe |
| Aviso manual (broadcast) | nova tela (candidato/admin) → chama `send-push` | todos |

- Extensões necessárias no Supabase: `pg_cron` e `pg_net`.
- Nova tela de **broadcast**: campo título + mensagem + botão enviar; restrita a perfis candidato/adm/master; registra no `logs_atividades`.

## 4. Limitação conhecida (iOS)
Web Push no iPhone exige iOS ≥ 16.4 **e** app instalado na tela inicial. Sem instalar, iPhone não recebe push (resto do app funciona normal). Android/desktop sem restrição. Limitação da Apple — a documentar para os usuários.

## 5. Componentes (unidades isoladas)
- `pwa` config (vite-plugin-pwa) — manifest + service worker. Depende de: assets de ícone.
- `usePushSubscription` (hook) — pede permissão, assina, salva/remove em `push_subscriptions`. Depende de: supabase, VITE_VAPID_PUBLIC_KEY.
- Botão `InstalarAppButton` — captura `beforeinstallprompt`, dispara instalação.
- Tela `Broadcast` — UI de aviso manual. Depende de: Edge Function `send-push`.
- Edge Function `send-push` — envio Web Push. Depende de: tabela `push_subscriptions`, secret VAPID.
- Migrations: `push_subscriptions` (+RLS), triggers, jobs `pg_cron`.

## 6. Testes / verificação
1. Build + Lighthouse PWA (instalável).
2. Android: instalar, validar ícone SF / tela cheia / splash.
3. Offline: modo avião abre e navega.
4. Push: conceder permissão e validar os 4 avisos (incl. broadcast) chegando.
5. Repetir nos dois apps (demo + Paulinho).

## 7. Riscos / decisões
- Sem sincronização offline de gravações (YAGNI). Reavaliar se houver demanda real de uso em campo sem sinal.
- Push depende de `pg_cron`/`pg_net` habilitados nos dois projetos Supabase.
- Aplicar tudo em DOIS repos (espelho) e DOIS bancos — verificar paridade.
