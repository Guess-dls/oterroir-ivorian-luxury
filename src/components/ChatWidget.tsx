import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, X, Send, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  fetchVisitorThread,
  sendVisitorMessage,
  startVisitorConversation,
  type VisitorMessage,
} from "@/lib/visitor-chat.functions";

const STORAGE_KEY = "oterroir-chat-session";

type Session = { conversationId: string; token: string; name: string; contact: string };

function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    return parsed?.conversationId && parsed?.token ? parsed : null;
  } catch {
    return null;
  }
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function ChatWidget() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const [seenCount, setSeenCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSession(loadSession());
    setReady(true);
  }, []);

  const thread = useQuery({
    queryKey: ["visitor-thread", session?.conversationId],
    enabled: Boolean(session),
    refetchInterval: open ? 4000 : 15000,
    queryFn: async (): Promise<VisitorMessage[]> => {
      if (!session) return [];
      const result = await fetchVisitorThread({
        data: { conversationId: session.conversationId, token: session.token },
      });
      return result.messages;
    },
  });

  const messages = thread.data ?? [];
  const replies = messages.filter((message) => message.role !== "user");
  const unread = open ? 0 : Math.max(0, replies.length - seenCount);

  useEffect(() => {
    if (open) setSeenCount(replies.length);
  }, [open, replies.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, pending.length, open]);

  useEffect(() => {
    if (open && session) inputRef.current?.focus();
  }, [open, session]);

  const start = useMutation({
    mutationFn: async () => {
      const result = await startVisitorConversation({
        data: { name: name.trim(), contact: contact.trim() },
      });
      return { ...result, name: name.trim(), contact: contact.trim() } satisfies Session;
    },
    onSuccess: (next) => {
      setSession(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* stockage indisponible */
      }
    },
    onError: () => toast.error("Impossible de démarrer la discussion. Réessayez."),
  });

  const send = useMutation({
    mutationFn: async (text: string) => {
      if (!session) throw new Error("no session");
      await sendVisitorMessage({
        data: { conversationId: session.conversationId, token: session.token, text },
      });
      return text;
    },
    onMutate: (text: string) => setPending((list) => [...list, text]),
    onSettled: (_data, _error, text) => setPending((list) => list.filter((item) => item !== text)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["visitor-thread"] }),
    onError: () => toast.error("Message non envoyé. Réessayez ou écrivez-nous sur WhatsApp."),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    send.mutate(text);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Fermer la discussion" : "Écrire à O'TERROIR"}
        className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-primary shadow-xl transition hover:scale-105 md:bottom-28 md:right-8"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-destructive text-xs font-semibold text-destructive-foreground">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-40 right-4 z-50 flex h-[70vh] max-h-[560px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl md:bottom-44 md:right-8">
          <div className="bg-primary px-5 py-4 text-primary-foreground">
            <p className="font-display text-lg leading-tight">O'TERROIR by Stéphanie</p>
            <p className="text-xs opacity-80">Écrivez-nous, Stéphanie vous répond ici même.</p>
          </div>

          {!ready ? null : !session ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (name.trim()) start.mutate();
              }}
              className="flex flex-1 flex-col justify-center gap-3 p-5"
            >
              <p className="text-sm text-muted-foreground">
                Avant de commencer, dites-nous qui vous êtes.
              </p>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Votre nom" required />
              <Input
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="Téléphone ou email (pour le suivi)"
              />
              <Button type="submit" className="mt-1" disabled={start.isPending}>
                {start.isPending ? "Un instant…" : "Démarrer la discussion"}
              </Button>
            </form>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {thread.isLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
                  </div>
                )}
                {!thread.isLoading && messages.length === 0 && pending.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Bonjour {session.name} 👋 Posez votre question : riz local, maïs violet, liqueurs
                    artisanales, marché à domicile…
                  </p>
                )}
                {messages.map((message) => (
                  <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                    <div className="max-w-[85%]">
                      <div
                        className={cn(
                          "whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed",
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                        )}
                      >
                        {message.content}
                      </div>
                      <p className={cn("mt-1 text-[11px] text-muted-foreground", message.role === "user" && "text-right")}>
                        {message.role === "user" ? "Vous" : "Stéphanie"} · {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {pending.map((text, index) => (
                  <div key={`pending-${index}`} className="flex justify-end">
                    <div className="max-w-[85%]">
                      <div className="whitespace-pre-wrap rounded-2xl bg-primary/70 px-4 py-2 text-sm leading-relaxed text-primary-foreground">
                        {text}
                      </div>
                      <p className="mt-1 text-right text-[11px] text-muted-foreground">Envoi…</p>
                    </div>
                  </div>
                ))}
                {messages.length > 0 && replies.length === 0 && pending.length === 0 && (
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Check className="h-3 w-3" /> Message reçu — Stéphanie vous répond dès que possible.
                  </p>
                )}
              </div>

              <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-3">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Écrire un message…"
                />
                <Button type="submit" size="icon" disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
