import { supabase } from './supabase';

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function ativarPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return { ok: false, motivo: 'sem suporte' };
  const chave = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!chave) return { ok: false, motivo: 'chave VAPID não configurada' };
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, motivo: 'permissão negada' };
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(chave),
  });
  const { data: { user } } = await supabase.auth.getUser();
  const json = sub.toJSON();
  await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    user_agent: navigator.userAgent,
  }, { onConflict: 'endpoint' });

  // Evita duplicatas: remove inscrições antigas do MESMO usuário + mesmo aparelho
  // (mesmo user_agent) que tenham endpoint diferente do atual.
  await supabase.from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('user_agent', navigator.userAgent)
    .neq('endpoint', json.endpoint);

  return { ok: true };
}
