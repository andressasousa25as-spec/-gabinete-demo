# Provisionar um novo cliente (Gabinete Digital)

1. Criar projeto Supabase novo (ou usar o do cliente).
2. Rodar as migrations (`supabase/migrations/`), incluindo `licenca_e_gate`.
3. Em Authentication > Users, convidar o e-mail do cliente (Invite user).
4. Inserir o membro: `insert into membros (user_id, papel, nome) values ('<uuid-do-convidado>','candidato','<nome>');`
5. Inserir seu master: convidar seu e-mail e `update membros set papel='master' ...`.
6. Licença já entra como `teste` + 7 dias. Ao receber pagamento, ativar pela Tela Master (+45 dias).
7. Apontar `.env` do deploy (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) para o projeto e publicar.
