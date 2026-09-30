import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ChatConversation = {
  id: string;
  visitor_name: string;
  visitor_contact: string;
  is_read: boolean;
  is_archived: boolean;
  visitor_unread: number;
  last_message_at: string;
  created_at: string;
};

export type ChatMessageRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "admin";
  content: string;
  created_at: string;
};

export const conversationsQuery = () =>
  queryOptions({
    queryKey: ["chat_conversations"],
    queryFn: async (): Promise<ChatConversation[]> => {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select(
          "id, visitor_name, visitor_contact, is_read, is_archived, visitor_unread, last_message_at, created_at",
        )
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as ChatConversation[];
    },
  });

export const conversationMessagesQuery = (conversationId: string | null) =>
  queryOptions({
    queryKey: ["chat_messages", conversationId],
    enabled: Boolean(conversationId),
    queryFn: async (): Promise<ChatMessageRow[]> => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ChatMessageRow[];
    },
  });

export async function sendAdminReply(conversationId: string, text: string) {
  const { error } = await supabase
    .from("chat_messages")
    .insert({ conversation_id: conversationId, role: "admin", content: text });

  if (error) throw error;

  const { data: current } = await supabase
    .from("chat_conversations")
    .select("visitor_unread")
    .eq("id", conversationId)
    .maybeSingle();

  const { error: updateError } = await supabase
    .from("chat_conversations")
    .update({
      is_read: true,
      last_message_at: new Date().toISOString(),
      visitor_unread: (current?.visitor_unread ?? 0) + 1,
    })
    .eq("id", conversationId);

  if (updateError) throw updateError;
}
