import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

// Chave pública VAPID (não é secreta — também usada no frontend).
const VAPID_PUBLIC = 'BO7PsJi1VschyhNiHC1x1Hd_eLEhg5Nm_FRj_Lfju04aGtF7ssnQ9TEYQVQYVPsURbCr3xLkYpn8yk-il-PTrko';
const clean = (v) => (v || '').replace(/\s/g, '');

Deno.serve(async (req) => {
  try {
    const { titulo, corpo, url, user_ids } = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    );
    webpush.setVapidDetails(
      (Deno.env.get('VAPID_SUBJECT') || 'mailto:contato@gabinetesf.com.br').trim(),
      VAPID_PUBLIC,
      clean(Deno.env.get('VAPID_PRIVATE_KEY')),
    );
    let q = supabase.from('push_subscriptions').select('*');
    if (Array.isArray(user_ids) && user_ids.length) q = q.in('user_id', user_ids);
    const { data: subs, error } = await q;
    if (error) throw error;
    const payload = JSON.stringify({ titulo, corpo, url: url || '/' });
    let enviados = 0;
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        enviados++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) await supabase.from('push_subscriptions').delete().eq('id', s.id);
      }
    }
    return new Response(JSON.stringify({ enviados }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ erro: String(e && e.message || e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
