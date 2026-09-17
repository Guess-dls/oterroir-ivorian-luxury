CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_name TEXT NOT NULL DEFAULT '',
  visitor_contact TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT false,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_conversation_idx ON public.chat_messages (conversation_id, created_at);

GRANT SELECT, UPDATE, DELETE ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;
GRANT SELECT, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage chat conversations" ON public.chat_conversations
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage chat messages" ON public.chat_messages
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_chat_conversations
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();