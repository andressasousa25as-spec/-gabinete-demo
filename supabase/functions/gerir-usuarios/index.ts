import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ATRIBUIVEIS = ['EQUIPE', 'ADMIN'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const authHeader = req.headers.get('Authorization') || '';

  // Cliente com o JWT do chamador (para descobrir quem é)
  const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await asCaller.auth.getUser();
  const caller = userData?.user;
  if (!caller) return json({ error: 'Não autenticado' }, 401);

  // Cliente admin (service role)
  const admin = createClient(url, serviceKey);

  // Confere crachá: chamador precisa ser MASTER
  const { data: perfilCaller } = await admin
    .from('perfis_usuarios').select('perfil').eq('user_id', caller.id).maybeSingle();
  if (perfilCaller?.perfil !== 'MASTER') return json({ error: 'Apenas o Master pode gerir usuários' }, 403);

  const body = await req.json();
  const action = body.action;

  try {
    if (action === 'convidar') {
      const { email, nome, perfil } = body;
      if (!email || !nome) return json({ error: 'E-mail e nome obrigatórios' }, 400);
      if (!ATRIBUIVEIS.includes(perfil)) return json({ error: 'Papel inválido (use EQUIPE ou ADMIN)' }, 400);
      const redirectTo = body.redirectTo || undefined;
      const { data: inv, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
      if (invErr) return json({ error: 'Falha ao convidar: ' + invErr.message + ' (verifique se o e-mail/SMTP está configurado)' }, 400);
      const novoId = inv.user.id;
      const { error: pErr } = await admin.from('perfis_usuarios')
        .insert([{ user_id: novoId, email, nome, perfil, ativo: true }]);
      if (pErr) return json({ error: 'Convite enviado, mas falhou ao criar perfil: ' + pErr.message }, 400);
      return json({ ok: true, user_id: novoId });
    }

    if (action === 'bloquear' || action === 'reativar') {
      const { user_id } = body;
      if (!user_id) return json({ error: 'user_id obrigatório' }, 400);
      if (user_id === caller.id) return json({ error: 'Você não pode bloquear a si mesmo' }, 400);
      const { data: alvo } = await admin.from('perfis_usuarios').select('perfil').eq('user_id', user_id).maybeSingle();
      if (alvo?.perfil === 'MASTER' || alvo?.perfil === 'CANDIDATO') return json({ error: 'Master e Candidato são fixos' }, 400);
      await admin.from('perfis_usuarios').update({ ativo: action === 'reativar' }).eq('user_id', user_id);
      return json({ ok: true });
    }

    if (action === 'editar') {
      const { user_id, nome, perfil } = body;
      if (!user_id) return json({ error: 'user_id obrigatório' }, 400);
      if (user_id === caller.id) return json({ error: 'Você não pode editar a si mesmo aqui' }, 400);
      const { data: alvo } = await admin.from('perfis_usuarios').select('perfil').eq('user_id', user_id).maybeSingle();
      if (alvo?.perfil === 'MASTER' || alvo?.perfil === 'CANDIDATO') return json({ error: 'Master e Candidato são fixos' }, 400);
      const patch: Record<string, unknown> = {};
      if (nome) patch.nome = nome;
      if (perfil) {
        if (!ATRIBUIVEIS.includes(perfil)) return json({ error: 'Papel inválido' }, 400);
        patch.perfil = perfil;
      }
      if (Object.keys(patch).length === 0) return json({ error: 'Nada para atualizar' }, 400);
      await admin.from('perfis_usuarios').update(patch).eq('user_id', user_id);
      return json({ ok: true });
    }

    return json({ error: 'Ação desconhecida' }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}
