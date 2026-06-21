# Apuração Paralela ao TSE — Especificação de Design (Fase 1)

**Data:** 2026-06-20
**Status:** aprovado para planejamento
**Escopo:** apuração paralela na noite da eleição via lançamento manual dos boletins de urna pelos fiscais, com foto-comprovante e painel de resultados em tempo real. Aplica-se aos DOIS apps (demo e Paulinho).

> **Faseamento (decisão consciente):**
> - **Fase 1 (este spec):** lançamento manual (nosso candidato + adversários) + foto do boletim + painel ao vivo. Robusto e à prova de falha para a noite de eleição.
> - **Fase 2 (spec futuro):** leitura automática do **QR Code do boletim de urna** (modelo Politique) — complexo, exige implementar o formato TSE de QR encadeado; construído e testado com calma antes de out/2026.
> - **Fase 3 (spec futuro):** ingestão do **feed oficial do TSE** para conferência/preenchimento.

## 1. Objetivo

Saber o resultado do candidato (e dos adversários) em minutos na noite da eleição, agregando os boletins de urna reportados pelos fiscais — sem depender da consolidação do TSE. Equivalente ao "apuração paralela, por local apurado" da Politique.

## 2. Pré-requisitos já existentes
- Tabelas `locais_votacao` (zona/seção/município) e dados eleitorais por seção — usadas para o fiscal escolher a seção numa lista.
- App PWA instalável + fila offline (`outbox`) + auth/perfis — reaproveitados.
- Supabase Storage (já usado em mídias) — para as fotos dos boletins.

## 3. Modelo de dados

### 3.1 `apuracao_candidatos` (configuração pré-eleição)
Lista dos candidatos acompanhados (o nosso + adversários).
- `id` uuid pk, `created_at`
- `nome` text (nome de urna)
- `numero` text
- `partido` text (opcional)
- `eh_nosso` boolean default false — marca o candidato do gabinete
- `ordem` int — ordem de exibição

### 3.2 `apuracao_secao` (lançamentos da noite)
Um registro por seção reportada.
- `id` uuid pk, `created_at`, `updated_at`
- `municipio` text, `zona` text, `secao` text
- `votos` jsonb — mapa `{ candidato_id: quantidade }` para cada candidato acompanhado
- `total_secao` int (opcional) — total de votos válidos da seção, se o fiscal informar
- `foto_url` text — comprovante (Storage)
- `reportado_por` uuid (auth.users), `reportado_nome` text
- `status` text default 'ok' check in ('ok','conferir') — 'conferir' quando uma substituição mudou os números

### 3.3 Anti-duplicidade
- **Constraint única `(municipio, zona, secao)`** no banco (garante 1 registro por seção).
- Antes de inserir, o app consulta se a seção já existe:
  - Não existe → `insert` normal (status 'ok').
  - Já existe → o app avisa ("seção já reportada por Fulano") e oferece **substituir** ou **cancelar**. Substituir = `update` do registro existente; os valores antigos vão para `logs_atividades`; se os números novos divergirem dos antigos, `status` vira 'conferir'.
- Offline: como não dá para checar duplicidade sem rede, o item vai para a fila e a checagem/merge ocorre na sincronização (se a seção já existir no banco, o item de fila vira substituição e marca 'conferir').

### 3.4 RLS
- `apuracao_candidatos` e `apuracao_secao`: padrão do gabinete — `acesso_logado` gateado por licença (`licenca_valida() OR eh_master()`), igual às demais tabelas de dados.
- Storage das fotos: bucket próprio `boletins`, leitura autenticada.

## 4. Componentes

### 4.1 Configuração — `ApuracaoConfig.jsx`
Tela (candidato/adm/master) para cadastrar/editar os candidatos acompanhados antes da eleição. CRUD simples sobre `apuracao_candidatos`.

### 4.2 Lançamento do fiscal — `ApuracaoLancamento.jsx`
- Mobile-first, dentro do app instalado.
- Fluxo: município → zona → seção (selects alimentados por `locais_votacao`); campos de votos (um por candidato acompanhado, na ordem); `total_secao` opcional; anexar **foto do boletim** (obrigatória); enviar.
- **Offline:** usa `gravarResiliente`/outbox — o lançamento (e o upload da foto) entram na fila e sincronizam ao reconectar; badge de pendências já existente mostra o estado.
- Anti-duplicidade conforme 3.3.
- Após enviar, mostra confirmação e limpa para o próximo.

### 4.3 Painel de resultados — `ApuracaoPainel.jsx`
- **Resumo ao vivo:** total do nosso candidato; ranking (nosso vs adversários, ordenado); **% apurado** = seções reportadas ÷ total de seções esperadas (do `locais_votacao`).
- **Por local apurado:** drill-down município → zona → bairro, com votos por candidato e % onde houver `total_secao`.
- **Tempo real:** assina mudanças de `apuracao_secao` via Supabase Realtime (fallback: polling a cada 15s).
- **Exportar:** Excel (reusa `xlsx` já no projeto).
- Itens com `status='conferir'` destacados.

## 5. Fluxo de dados
Fiscal lança no celular → `apuracao_secao` (direto se online, fila se offline) + foto no Storage → Realtime notifica o painel → painel reagrega totais e % apurado.

## 6. Tratamento de erros
- Upload de foto falha → lançamento entra na fila offline e tenta de novo; não perde o número.
- Seção duplicada → fluxo de substituição (3.3), nunca cria duplicado silencioso.
- Dados parciais (seção sem `total_secao`) → entram no total absoluto; o % por seção só aparece onde houver total.
- Número inválido (texto/negativo) → validação no formulário.

## 7. Testes / verificação
- Unit (vitest, lógica pura): função de **agregação** (somar votos por candidato a partir de uma lista de `apuracao_secao`), cálculo de **% apurado**, e resolução de **duplicidade**. Extrair essa lógica para `src/lib/apuracao.js` (testável sem banco).
- Manual: lançar seções (online e offline), conferir soma no painel, testar duplicidade, exportar.
- Aplicar/validar nos 2 bancos e 2 repos.

## 8. Componentes isolados (resumo)
- `src/lib/apuracao.js` — agregação, % apurado, duplicidade (puro, testado).
- `ApuracaoConfig.jsx` — CRUD candidatos acompanhados.
- `ApuracaoLancamento.jsx` — lançamento do fiscal (offline-aware).
- `ApuracaoPainel.jsx` — painel ao vivo (Realtime).
- Migration: `apuracao_candidatos`, `apuracao_secao`, bucket `boletins`, RLS.

## 9. Fora de escopo (Fase 1)
- Leitura de QR Code do boletim (Fase 2).
- Feed oficial do TSE (Fase 3).
- Mapa de calor da apuração (pode reusar o mapa depois).
- Roteamento/atribuição formal de fiscais por seção (qualquer logado pode lançar; registra-se quem foi).
