import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ChatConversation = {
  id: string;
  visitor_name: string;
  visitor_contact: string;
  is_read: boolean;
  last_message_at: string;
  created_at: string;
};

export type ChatMessageRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export const conversationsQuery = () =>
  queryOptions({
    queryKey: ["chat_conversations"],
    queryFn: async (): Promise<ChatConversation[]> => {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
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
