import { createClient } from "npm:@supabase/supabase-js@2";
const url = Deno.env.get("SUPABASE_URL")!;
const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Método inválido" }, 405);
  try {
    const authorization = req.headers.get("Authorization") ?? "";
    const client = createClient(url, anon, {
      global: { headers: { Authorization: authorization } },
    });
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user) return json({ error: "Não autenticado" }, 401);
    const { messageId } = await req.json();
    if (typeof messageId !== "string")
      return json({ error: "Mensagem inválida" }, 400);
    // Consulta com RLS: exige concessão vigente e participação na sala.
    const { data: message, error } = await client
      .from("messages")
      .select("id,room_id,author_id,created_at")
      .eq("id", messageId)
      .single();
    if (error || !message || message.author_id !== user.id)
      return json({ error: "Acesso negado" }, 403);
    if (Date.now() - Date.parse(message.created_at) > 60000) {
      return json({ error: "Evento antigo" }, 400);
    }
    const { data: members, error: memberError } = await admin
      .from("room_members")
      .select("user_id")
      .eq("room_id", message.room_id)
      .neq("user_id", user.id);
    if (memberError) throw memberError;
    const recipients = (members ?? []).map((row) => row.user_id);
    if (!recipients.length) return json({ tickets: [] });
    const { data: tokens, error: tokenError } = await admin
      .from("push_tokens")
      .select("token")
      .in("user_id", recipients);
    if (tokenError) throw tokenError;
    const tickets = [];
    for (let offset = 0; offset < (tokens ?? []).length; offset += 100) {
      const batch = tokens!.slice(offset, offset + 100).map((row) => ({
        to: row.token,
        title: "Atualização no aplicativo",
        body: "Há uma nova interação. Entre para consultar.",
        sound: "default",
        channelId: "eventos",
        data: { type: "message" },
      }));
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });
      if (!response.ok) throw new Error("Provedor indisponível");
      const result = await response.json();
      tickets.push(...(result.data ?? []));
    }
    // Base de laboratório: persistência/consulta de receipts e idempotência são extensão.
    return json({ tickets });
  } catch {
    return json({ error: "Falha no envio; consulte os logs do backend" }, 500);
  }
});
