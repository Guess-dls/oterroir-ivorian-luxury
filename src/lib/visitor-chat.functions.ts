import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const StartInput = z.object({
  name: z.string().trim().min(1).max(80),
  contact: z.string().trim().max(160),
});

const ThreadInput = z.object({
  conversationId: z.string().uuid(),
  token: z.string().uuid(),
});

const SendInput = ThreadInput.extend({
  text: z.string().trim().min(1).max(2000),
});

export type VisitorMessage = {
  id: string;
  role: "user" | "assistant" | "admin";
  content: string;
  created_at: string;
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertConversation(conversationId: string, token: string) {
  const db = await admin();
  const { data, error } = await db
    .from("chat_conversations")
    .select("id, access_token")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.access_token !== token) throw new Error("Conversation introuvable.");
  return db;
}

export const startVisitorConversation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => StartInput.parse(input))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row, error } = await db
      .from("chat_conversations")
      .insert({ visitor_name: data.name, visitor_contact: data.contact })
      .select("id, access_token")
      .single();
    if (error) throw new Error(error.message);
    return { conversationId: row.id, token: row.access_token };
  });

export const sendVisitorMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SendInput.parse(input))
  .handler(async ({ data }) => {
    const db = await assertConversation(data.conversationId, data.token);
    const { error } = await db
      .from("chat_messages")
      .insert({ conversation_id: data.conversationId, role: "user", content: data.text });
    if (error) throw new Error(error.message);
    const { error: updateError } = await db
      .from("chat_conversations")
      .update({ is_read: false, is_archived: false, last_message_at: new Date().toISOString() })
      .eq("id", data.conversationId);
    if (updateError) throw new Error(updateError.message);
    return { ok: true };
  });

export const fetchVisitorThread = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ThreadInput.parse(input))
  .handler(async ({ data }): Promise<{ messages: VisitorMessage[] }> => {
    const db = await assertConversation(data.conversationId, data.token);
    const { data: rows, error } = await db
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    await db.from("chat_conversations").update({ visitor_unread: 0 }).eq("id", data.conversationId);
    return { messages: (rows ?? []) as VisitorMessage[] };
  });
