# Camada de Assinatura — Gabinete Digital (Plano B)

**Data:** 2026-06-11
**Status:** Aprovado (aguardando revisão da spec)

## Contexto

O Gabinete Digital é um CRM de gabinete político (React + Vite + Supabase, JavaScript/`.jsx`)
que a Andressa vende por assinatura. Modelo definido: **um app + um banco Supabase por
cliente** (multi-tenant descartado).

A Andressa tem lado político declarado e público. Por isso a arquitetura ("Plano B")
separa **controle de cobrança** de **acesso aos dados**: ela controla se a conta do cliente
está paga/ativa, mas **não acessa** os dados de eleitores nem a senha do cliente. Caso algum
cliente exija outra forma (banco próprio dele), reformula-se pontualmente.

Exceção: o gabinete do Paulinho (político que ela apoia e administra na campanha) — ali ela
é admin plena.

Este doc cobre a **camada de assinatura**: trava de licença no login + tela master para a
Andressa gerenciar + onboarding self-service do cliente. Implementa-se primeiro no **demo**
(`C:\Projetos\gabinete-demo-real`), depois replica no gabinete do Paulinho (app real 2026).

## Decisões de arquitetura

| Decisão | Escolha | Por quê |
|---|---|---|
| Onde mora a licença | **No banco de cada cliente** (Opção A) | 1–3 clientes hoje; sem ponto único de falha; migração futura barata. Central só quando ~8–10 clientes |
| Primeiro acesso do cliente | **Convite por e-mail** (Supabase) | Andressa nunca vê a senha; reforça "não acesso à base do cliente" |
| Como a Andressa controla | **Tela "Master" dentro do app** | Gerencia clicando, sem abrir o Supabase; visual igual ao Dashboard |
| Vencimento da assinatura | **Bloqueio total com aviso** | Dados intactos; alavanca de cobrança mais forte; master ainda entra |

## Modelo de dados (no banco de cada cliente)

Tabela `licenca` (linha única):

| campo | tipo | descrição |
|---|---|---|
| `status` | texto | `teste` / `ativo` / `vencido` |
| `validade` | date | até quando o acesso vale |
| `plano` | texto (nullable) | opcional; futuro Mercado Pago (ex: "mensal") |
| `atualizado_em` | timestamptz | log da última mudança |

Default ao provisionar: `status='teste'`, `validade = hoje + 7 dias` (teste grátis = **máx. 7 dias**).
Ao ativar (cliente pagou): renovação de **no mínimo 45 dias** (licença de uso).

Tabela `membros` ganha o papel `master` (só o login da Andressa). Hierarquia de papéis:
`master` (Andressa) > `candidato` / `adm` (cliente) > `equipe`.

## Trava no login (o "portão")

No `App.jsx`, após carregar a sessão e o papel, antes de abrir o Dashboard:

1. Lê a linha `licenca`.
2. Vencido = `validade < hoje` **OU** `status = 'vencido'`.
3. Vencido **E** usuário **não** é `master` → `TelaBloqueio` ("Assinatura vencida, entre em contato"). Dados intactos, só inacessíveis.
4. Usuário é `master` → entra sempre (mesmo vencido), para poder reativar.
5. Em dia → Dashboard normal.

**Reforço no banco (não só na tela):** as políticas RLS das tabelas de dados (eleitores,
anotações, etc.) só liberam `authenticated` quando a licença está válida **OU** o usuário é
master. Função auxiliar tipo `licenca_valida()` / `eh_master()` usada nas políticas. Assim a
trava não dá pra burlar pela API.

## Tela Master (visível só para `master`)

Item de menu escondido para quem é `master`. Mostra status atual + validade, com ações:

- **Ativar / renovar** → `status='ativo'` e estende `validade` (data digitada ou atalho "+45 dias"; mínimo 45 dias da licença de uso).
- **Bloquear agora** → `status='vencido'`.
- **Gerenciar usuários** do gabinete (criar / bloquear logins, definir papel) — reaproveitando
  `GestaoAdmins.jsx` existente.

Visual: mesmos componentes/estilo do Dashboard atual.

## Onboarding self-service (cliente novo)

1. Andressa provisiona o banco e cadastra o **e-mail** do cliente como `candidato` em `membros`.
2. Supabase dispara convite "crie sua senha" → cliente define a própria senha. Andressa nunca a vê.
3. Licença já entra como `teste` + 45 dias.

## Rotas públicas (corrigir quebra do lockdown)

`VisualizarMidia` e `CadastroPublico` voltam a funcionar com políticas `anon` **restritas por
token/id** presente na URL — leem/gravam apenas a linha daquele link, sem reabrir o banco.

## Escopo de código (demo primeiro)

- Tabela `licenca` + RLS no banco demo (`yemlhsidmlxzpqimewox`)
- Funções `licenca_valida()` / `eh_master()` + políticas RLS reforçadas
- `App.jsx` → checagem da trava
- `TelaBloqueio.jsx` (nova) + `TelaMaster.jsx` (nova)
- `LoginScreen.jsx` → ajuste de convite/recuperação de senha
- Políticas `anon` por token para `VisualizarMidia` e `CadastroPublico`
- Publicar na Vercel

## Testes (validar localmente antes de publicar)

- Login em dia → entra no Dashboard
- Licença vencida + usuário comum → `TelaBloqueio`
- Licença vencida + master → entra (consegue reativar)
- Reativar pela Tela Master → acesso volta
- `anon` direto na API de eleitores → barrado
- Rota pública por token → enxerga só a linha correta

## Próximo: gabinete do Paulinho

Após o demo validado e publicado: clonar repo `-digital` (banco 2026 `nhlidwbdjaapynbvyviy`),
aplicar a mesma camada, RLS `acesso_logado` + `licenca` no 2026, e **criar as contas reais do
Paulinho ANTES de publicar** para não trancar ninguém fora.

## Fora de escopo (depois)

- Integração Mercado Pago (cobrança automática)
- Painel central de licenças (só quando ~8–10 clientes justificarem)
