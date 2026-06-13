-- Telefone compartilhado por família (2026-06-13):
-- algumas famílias usam um único telefone para vários apoiadores. A constraint
-- UNIQUE(telefone) impedia cadastrar o mesmo número mais de uma vez (interno E
-- público). Removemos a trava de telefone do BANCO; a trava do LINK PÚBLICO
-- (CadastroPublico) continua agindo no app (checagem por telefone antes de inserir).
-- As travas de duplicata por nome e por (nome+telefone) permanecem.
alter table public.eleitores drop constraint if exists eleitores_telefone_unique;
