# Configurador de Candidato (self-service) + genericização final — Design

**Data:** 2026-06-26
**Escopo:** SOMENTE o demo (`gabinete-demo-real`, branch `master`) — produto/template vendável. **O app do Paulinho NÃO é alterado.**

## Objetivo
Transformar o demo num produto replicável para vários candidatos: (B) um **configurador de candidato in-app** (busca a base TSE e grava a análise, sem precisar de dev) usável tanto pela vendedora (entrega configurada) quanto pelo próprio cliente; e (A) **terminar a genericização** das telas de análise para que nenhum dado fixo do Paulinho apareça e tudo se calcule pelo candidato configurado.

## Contexto atual
- `analise_candidato` (1 linha): `ano,cargo,nome,partido,numero,total,municipios(jsonb),zonas(jsonb),secoes(jsonb)`. RLS: leitura authenticated, escrita `eh_master()`.
- Lida via `src/lib/useCandidatoAnalise.js` (cache de módulo).
- Hoje populada por CLI (`scripts/importar-analise.mjs` + `scripts/extrairCandidato.mjs`) — tarefa de dev.
- `extrairCandidato(fonte, {nome,numero,ano,cargo,nomeExibicao,partido})` é função PURA (sem deps node) → roda no navegador. Produz `{ano,cargo,nome,partido,numero,total,municipios,zonas,secoes}` (secoes = rollup município×zona).
- `CANDIDATOS_TSE` (AP 2022, dep. estadual/federal) já está bundlado no app. Itens: `{nome,cargo,total,municipios,zonas,secoes}` (sem `numero`).
- Limite conhecido: base é só AP 2022; candidato de outro estado/estreante/vereador não está nela.

## A — Genericização final (só demo)
1. **Caminho da Vitória → "Líder" por município:** hoje `LIDER_ADVERSARIO` fixo (INACIO MONTEIRO/FRANCISCO PAULO). Passa a calcular o **maior votado de cada município** a partir de `CANDIDATOS_TSE` (dep. estadual). Genérico para qualquer candidato.
2. **Projeção → Score de Viabilidade:** `scoreViabilidade()` hoje tem 5 fatores, 3 com número/texto fixos do Paulinho/MDB.
   - **Calculados:** `base` (votos/QE) e `expansao` (derivado das seções/municípios de baixa penetração).
   - **Editáveis pelo master:** `crescimento`, `partido`, `digital` → notas inteiras guardadas em `config_candidato` (`score_crescimento`, `score_partido`, `score_digital`), com **descrições genéricas** (sem "MDB"/"+29% 2018").
   - `ProjecaoEstrategica` passa a **receber `config`** (hoje é `({onVoltar})`) para ler essas notas.

## B — Configurador de candidato (no ⚙️ Config, só master)
Nova seção "Candidato de análise (TSE)" dentro do modal Config do `DashboardCandidato`, visível só quando `ehMaster`.
- **Busca:** input por nome → filtra `CANDIDATOS_TSE` (cargo dep. estadual/federal) por substring (case-insensitive) → lista (nome · cargo · votos), limitada a ~20 resultados.
- **Seleção:** ao escolher, mostra campos **Nome de exibição** e **Partido** (pré-preenchidos do TSE, editáveis).
- **Aplicar análise:** chama `extrairCandidato(CANDIDATOS_TSE, {nome: <nome TSE exato>, ano:2022, nomeExibicao, partido})` no navegador → grava em `analise_candidato` (delete da linha existente + insert 1) via `supabase` (RLS master) → `window.location.reload()` para limpar o cache do `useCandidatoAnalise`.
- **Marcar como estreante / sem histórico:** botão que faz `delete from analise_candidato` → telas de análise mostram o aviso "indisponível" (já existe) e o resto do app funciona.
- **Estado atual:** mostra o candidato configurado hoje (nome · cargo · ano · votos) — já existe um resumo parecido no Config (master).
- **Mesma ferramenta** serve para a vendedora (na entrega) e para o cliente — depende só de quem está logado como master.

## Banco (só demo)
- `config_candidato`: `add column score_crescimento int`, `score_partido int`, `score_digital int` (nullable; default 0). Migração no banco demo (`yemlhsidmlxzpqimewox`).
- `analise_candidato`: já existe; sem alteração de schema.

## Organização de código
- Mover a função pura `extrairCandidato` para `src/lib/extrairCandidato.js` (fonte única). `scripts/extrairCandidato.mjs` re-exporta de lá (ou o script passa a importar de `../src/lib/extrairCandidato.js`), mantendo o CLI funcionando e os testes vitest existentes.
- Novo componente `src/components/ConfiguradorCandidato.jsx` (a seção de busca/seleção/aplicar), usado dentro do Config.

## Erros / bordas
- Busca sem resultado → "Nenhum candidato encontrado na base TSE 2022 (AP). Se for estreante, use 'sem histórico'."
- Falha de escrita (RLS/rede) → alerta com a mensagem do supabase; não recarrega.
- Após aplicar/limpar → reload obrigatório (cache de módulo do hook).

## Testes
- `extrairCandidato` mantém os testes vitest atuais (mover não pode quebrá-los).
- Novo teste para o "maior votado por município" (função pura do Caminho) e para o cálculo do score (fatores calculáveis).
- Build verde + 58+ testes.

## Fora de escopo
- Base TSE de outros estados/anos (continua só AP 2022).
- Lançamento manual de votos por município (estreante segue sem análise).
- Buscador por número (a base não tem `numero`).
- Qualquer alteração no app do Paulinho.
