# Comparativo Interno (União Brasil) — Especificação de Design

**Data:** 2026-06-20
**Status:** aprovado para planejamento
**Escopo:** quadro comparativo dos votos do Paulinho vs. os adversários internos do União Brasil (nominata 2026 a deputado estadual), em cards de 2 por linha, com números reais do TSE onde houver e edição manual para o resto. Aplica-se aos DOIS apps (demo e Paulinho).

## 1. Objetivo

Mostrar ao deputado, num quadro visual, onde o Paulinho (4.880, Dep. Estadual 2022) está em relação aos 16 colegas de partido que disputam a mesma vaga — destacando os pesos-pesados internos. Base de números **auditável** (TSE), com edição para casos sem dado.

## 2. Origem dos dados (já no app — sem importação)

Os dados reais já estão embarcados:
- `src/candidatosTSE.js` (CANDIDATOS_TSE) — TSE 2022 (estadual e federal), com nome e total de votos.
- `src/vereadores2024.js` (VEREADORES_2024) — TSE 2024 (vereador Macapá/Santana), com nome e votos.

Em vez de calcular ao vivo (matching de nome é ruidoso — deu falsos positivos como "Paulinho Ramos"→"Paulinho do Cinema"), a lista é **semeada uma vez** numa tabela editável e revisada manualmente. Assim os números ficam estáveis e corrigíveis.

## 3. Modelo de dados

### `comparativo_internos`
- `id` uuid pk, `created_at`, `updated_at`
- `nome` text — nome de exibição
- `eh_nosso` boolean default false — marca o Paulinho (referência)
- `votos` int default 0 — votos da última eleição (editável)
- `cargo_ultima` text — ex.: 'Dep. Estadual 2022', 'Vereador Macapá 2024', 'Estreante'
- `abrangencia` text — 'Estado' | 'Município' | '—' (para contextualizar a comparação)
- `confirmado` boolean default false — true = número real do TSE; false = estreante/a confirmar
- `observacao` text
- `ordem` int default 0
- RLS: padrão do gabinete (`acesso_logado` gateado por licença).

### Seed inicial (17 — aplicado na migration)
Confirmados (`confirmado=true`):
| nome | votos | cargo_ultima | abrangencia |
|---|---|---|---|
| Paulinho Ramos (eh_nosso) | 4880 | Dep. Estadual 2022 | Estado |
| Roberto Góes | 6681 | Dep. Estadual 2022 | Estado |
| Rodolfo Vale | 5649 | Dep. Estadual 2022 | Estado |
| Jorge Amanajás | 5592 | Dep. Estadual 2022 | Estado |
| Aparecida Salomão | 4143 | Dep. Estadual 2022 | Estado |
| Joselyo Mais Saúde | 2668 | Vereador Macapá 2024 | Município |
| Faraó | 2413 | Vereador Macapá 2024 | Município |
| Alberto Negrão | 1803 | Vereador Macapá 2024 | Município |
| Engenheiro Ângelo | 1205 | Vereador Macapá 2024 | Município |

Estreantes (`confirmado=false`, votos=0, editável):
Bia Pombo (obs: assistente social, sem histórico), Beth Pelaes (obs: ex-prefeita de Pedra Branca do Amapari, 2 mandatos), Roseli Matos, Anderson Almeida (Santana), Gracilene Barros, Ana Souza (obs: esposa do prefeito de Vitória do Jari), Divino, Samuel (obs: a confirmar — possível "Samuel" PDT vereador 2024 com 3.088).

## 4. Componentes

### 4.1 Comparativo — `ComparativoInterno.jsx` (quadro)
- Botão novo no menu: "🏆 Comparativo Interno".
- **Card do Paulinho fixo no topo**, destacado em dourado (referência).
- Demais em **grid de 2 cards por linha** (`repeat(2, 1fr)` desktop; 1 no mobile estreito), ordenados por `votos` desc.
- Cada card: nome, votos (grande), `cargo_ultima` (selo), e a **diferença vs. Paulinho** (ex.: "+1.801" em vermelho se à frente, "−2.467" em verde se atrás), com barra proporcional.
- Selo de **abrangência** quando ≠ Estado (ex.: "Município — Macapá") avisando que não é comparação direta.
- Estreantes mostrados com "Estreante" no lugar dos votos.
- Exportar (Excel) o quadro.

### 4.2 Edição — `ComparativoInternoConfig.jsx`
- CRUD/edição da `comparativo_internos`: editar votos, cargo, abrangência, observação; adicionar/remover candidato; marcar `confirmado`. Restrito a candidato/adm/master.

## 5. Lógica (pura, testável)
- `src/lib/comparativo.js`: dado o array + o registro `eh_nosso`, retorna `{ referencia, lista_ordenada, diffs }` (diferença de cada um vs. referência). Testar agregação/diff/ordenação.

## 6. Comparabilidade (nota de analista)
Votos de **estadual 2022** (estado todo) são a régua direta do Paulinho. Votos de **vereador 2024** são de **um município** — exibidos com selo de abrangência para não induzir comparação 1:1. Não somar cargos diferentes.

## 7. Tratamento de erros
- Tabela vazia / sem `eh_nosso` definido → quadro mostra aviso "defina o candidato de referência".
- Edição com valor não numérico → validação no formulário.

## 8. Testes / verificação
- Unit (vitest): `comparativo.js` (ordenação, diff vs. referência, referência ausente).
- Manual: abrir o quadro (cards 2 por linha, Paulinho no topo), editar um voto e ver refletir, exportar; validar nos 2 apps.

## 9. Componentes isolados (resumo)
- `src/lib/comparativo.js` — lógica pura (testada).
- `ComparativoInterno.jsx` — quadro (cards 2/linha).
- `ComparativoInternoConfig.jsx` — edição.
- Migration: `comparativo_internos` + RLS + seed dos 17.

## 10. Fora de escopo
- Atualização automática a partir dos arquivos TSE (a lista é semeada e editada manualmente — decisão consciente, evita falso positivo de matching).
- Dados de prefeito/vice (Beth Pelaes) — não há base comparável; fica como observação.
