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

type Session = {
  conversationId: string;
  token: string;
  name: string;
  contact: string;
};

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
  return new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
        data: {
          conversationId: session.conversationId,
          token: session.token,
        },
      });

      return result.messages;
    },
  });

  const messages = thread.data ?? [];

  const replies = messages.filter(
    (message) => message.role !== "user",
  );

  const unread = open
    ? 0
    : Math.max(0, replies.length - seenCount);

  useEffect(() => {
    if (open) {
      setSeenCount(replies.length);
    }
  }, [open, replies.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, pending.length, open]);

  useEffect(() => {
    if (open && session) {
      inputRef.current?.focus();
    }
  }, [open, session]);

  const start = useMutation({
    mutationFn: async () => {
      const result = await startVisitorConversation({
        data: {
          name: name.trim(),
          contact: contact.trim(),
        },
      });

      return {
        ...result,
        name: name.trim(),
        contact: contact.trim(),
      } satisfies Session;
    },

    onSuccess: (next) => {
      setSession(next);

      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(next),
        );
      } catch {
        /* stockage indisponible */
      }
    },

    onError: () =>
      toast.error(
        "Impossible de démarrer la discussion. Réessayez.",
      ),
  });

  const send = useMutation({
    mutationFn: async (text: string) => {
      if (!session) {
        throw new Error("no session");
      }

      await sendVisitorMessage({
        data: {
          conversationId: session.conversationId,
          token: session.token,
          text,
        },
      });

      return text;
    },

    onMutate: (text: string) => {
      setPending((list) => [...list, text]);
    },

    onSettled: (_data, _error, text) => {
      setPending((list) =>
        list.filter((item) => item !== text),
      );
    },

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["visitor-thread"],
      }),

    onError: () =>
      toast.error(
        "Message non envoyé. Réessayez ou écrivez-nous sur WhatsApp.",
      ),
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
      {/* Bouton flottant */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={
          open
            ? "Fermer la discussion"
            : "Écrire à O'TERROIR"
        }
        className={cn(
          "fixed bottom-24 right-5 z-50 flex h-14 w-14",
          "items-center justify-center rounded-full",
          "border border-white/30",
          "bg-background/65 backdrop-blur-xl",
          "text-primary shadow-[0_15px_45px_-12px_rgba(0,0,0,0.35)]",
          "ring-1 ring-white/10",
          "transition-all duration-300",
          "hover:scale-105 hover:bg-background/80",
          "active:scale-95",
          "md:bottom-28 md:right-8",
        )}
      >
        <span className="absolute inset-0 rounded-full bg-primary/5" />

        {open ? (
          <X className="relative h-6 w-6" />
        ) : (
          <MessageCircle className="relative h-6 w-6" />
        )}

        {unread > 0 && (
          <span
            className={cn(
              "absolute -right-1 -top-1 grid h-6 w-6",
              "place-items-center rounded-full",
              "border-2 border-background/80",
              "bg-destructive text-xs font-semibold",
              "text-destructive-foreground shadow-md",
            )}
          >
            {unread}
          </span>
        )}
      </button>

      {/* Fenêtre de discussion */}
      {open && (
        <div
          className={cn(
            "fixed bottom-40 right-4 z-50",
            "flex h-[70vh] max-h-[560px]",
            "w-[calc(100vw-2rem)] max-w-sm flex-col",
            "overflow-hidden rounded-3xl",
            "border border-white/25",
            "bg-background/65 backdrop-blur-2xl",
            "shadow-[0_30px_90px_-25px_rgba(0,0,0,0.45)]",
            "ring-1 ring-white/10",
            "md:bottom-44 md:right-8",
          )}
        >
          {/* Header */}
          <div
            className={cn(
              "relative overflow-hidden",
              "border-b border-white/15",
              "bg-primary/85 backdrop-blur-xl",
              "px-5 py-4",
              "text-primary-foreground",
            )}
          >
            <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 left-8 h-24 w-24 rounded-full bg-gold/15 blur-2xl" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md">
                  <MessageCircle className="size-4" />
                </div>

                <div>
                  <p className="font-display text-lg leading-tight">
                    O'TERROIR by Stéphanie
                  </p>

                  <p className="mt-0.5 text-xs text-primary-foreground/75">
                    Écrivez-nous, Stéphanie vous répond ici même.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {!ready ? null : !session ? (
            /* Première connexion */
            <form
              onSubmit={(event) => {
                event.preventDefault();

                if (name.trim()) {
                  start.mutate();
                }
              }}
              className={cn(
                "flex flex-1 flex-col justify-center gap-4 p-5",
                "bg-background/25",
              )}
            >
              <div
                className={cn(
                  "rounded-2xl border border-white/20",
                  "bg-background/40 p-4",
                  "backdrop-blur-xl",
                )}
              >
                <p className="text-sm leading-6 text-muted-foreground">
                  Avant de commencer, dites-nous qui vous êtes.
                </p>
              </div>

              <Input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Votre nom"
                required
                className={cn(
                  "h-12 rounded-xl",
                  "border-white/20",
                  "bg-background/55",
                  "backdrop-blur-md",
                  "shadow-sm",
                  "focus-visible:border-primary",
                )}
              />

              <Input
                value={contact}
                onChange={(event) =>
                  setContact(event.target.value)
                }
                placeholder="Téléphone ou email (pour le suivi)"
                className={cn(
                  "h-12 rounded-xl",
                  "border-white/20",
                  "bg-background/55",
                  "backdrop-blur-md",
                  "shadow-sm",
                  "focus-visible:border-primary",
                )}
              />

              <Button
                type="submit"
                className="mt-1 h-12 rounded-xl shadow-lg"
                disabled={start.isPending}
              >
                {start.isPending
                  ? "Un instant…"
                  : "Démarrer la discussion"}
              </Button>
            </form>
          ) : (
            <>
              {/* Messages */}
              <div
                ref={scrollRef}
                className={cn(
                  "flex-1 space-y-3 overflow-y-auto",
                  "bg-background/20 px-4 py-4",
                  "[scrollbar-width:thin]",
                )}
              >
                {thread.isLoading && (
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      "rounded-2xl border border-white/15",
                      "bg-background/40 px-4 py-3",
                      "text-sm text-muted-foreground",
                      "backdrop-blur-md",
                    )}
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement…
                  </div>
                )}

                {!thread.isLoading &&
                  messages.length === 0 &&
                  pending.length === 0 && (
                    <div
                      className={cn(
                        "rounded-2xl border border-white/20",
                        "bg-background/45 px-4 py-3",
                        "text-sm leading-6",
                        "text-muted-foreground",
                        "backdrop-blur-xl",
                        "shadow-sm",
                      )}
                    >
                      Bonjour {session.name} 👋

                      <span className="mt-1 block">
                        Posez votre question : riz local, maïs
                        violet, liqueurs artisanales, marché à
                        domicile…
                      </span>
                    </div>
                  )}

                {messages.map((message) => {
                  const isUser = message.role === "user";

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        isUser
                          ? "justify-end"
                          : "justify-start",
                      )}
                    >
                      <div className="max-w-[85%]">
                        <div
                          className={cn(
                            "whitespace-pre-wrap rounded-2xl",
                            "border px-4 py-2.5",
                            "text-sm leading-relaxed",
                            "shadow-sm backdrop-blur-md",

                            isUser
                              ? [
                                  "border-primary/30",
                                  "bg-primary/85",
                                  "text-primary-foreground",
                                ]
                              : [
                                  "border-white/20",
                                  "bg-background/60",
                                  "text-foreground",
                                ],
                          )}
                        >
                          {message.content}
                        </div>

                        <p
                          className={cn(
                            "mt-1 px-1 text-[11px]",
                            "text-muted-foreground",
                            isUser && "text-right",
                          )}
                        >
                          {isUser
                            ? "Vous"
                            : "Stéphanie"}{" "}
                          · {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {pending.map((text, index) => (
                  <div
                    key={`pending-${index}`}
                    className="flex justify-end"
                  >
                    <div className="max-w-[85%]">
                      <div
                        className={cn(
                          "whitespace-pre-wrap rounded-2xl",
                          "border border-primary/20",
                          "bg-primary/60 px-4 py-2.5",
                          "text-sm leading-relaxed",
                          "text-primary-foreground",
                          "backdrop-blur-md",
                          "shadow-sm",
                        )}
                      >
                        {text}
                      </div>

                      <p className="mt-1 px-1 text-right text-[11px] text-muted-foreground">
                        Envoi…
                      </p>
                    </div>
                  </div>
                ))}

                {messages.length > 0 &&
                  replies.length === 0 &&
                  pending.length === 0 && (
                    <div
                      className={cn(
                        "flex items-center gap-1.5",
                        "rounded-xl border border-white/15",
                        "bg-background/35 px-3 py-2",
                        "text-[11px] text-muted-foreground",
                        "backdrop-blur-md",
                      )}
                    >
                      <Check className="h-3 w-3 text-primary" />
                      Message reçu — Stéphanie vous répond
                      dès que possible.
                    </div>
                  )}
              </div>

              {/* Zone de saisie */}
              <form
                onSubmit={submit}
                className={cn(
                  "flex items-center gap-2",
                  "border-t border-white/20",
                  "bg-background/50 p-3",
                  "backdrop-blur-xl",
                )}
              >
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  placeholder="Écrire un message…"
                  className={cn(
                    "h-11 rounded-xl",
                    "border-white/20",
                    "bg-background/60",
                    "backdrop-blur-md",
                    "shadow-sm",
                    "focus-visible:border-primary",
                  )}
                />

                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim()}
                  className={cn(
                    "size-11 shrink-0 rounded-xl",
                    "shadow-md",
                  )}
                  aria-label="Envoyer le message"
                >
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
