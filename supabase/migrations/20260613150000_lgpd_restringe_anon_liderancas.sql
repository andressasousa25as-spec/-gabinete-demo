-- Auditoria de conformidade LGPD (2026-06-13), Achado 2 (replicado do app real):
-- `liderancas` era legível por `anon` em todas as colunas (incluindo telefone).
-- O cadastro público só precisa de id, nome e bairro. Restringe via GRANT de coluna.
revoke select on public.liderancas from anon;
grant select (id, nome, bairro) on public.liderancas to anon;
