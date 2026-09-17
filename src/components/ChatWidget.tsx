import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "oterroir-chat";

type Visitor = { id: string; name: string; contact: string };

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadVisitor(): Visitor | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Visitor;
    if (parsed?.id && parsed?.name) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVisitor(loadVisitor());
    setReady(true);
  }, []);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          conversationId: visitor?.id,
          visitorName: visitor?.name ?? "",
          visitorContact: visitor?.contact ?? "",
        }),
      }),
    [visitor],
  );

  const { messages, sendMessage, status } = useChat({
    transport,
    onError: () =>
      toast.error("Le message n'a pas pu être envoyé. Merci de réessayer ou d'écrire sur WhatsApp."),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (open && visitor) inputRef.current?.focus();
  }, [open, visitor, busy]);

  const startChat = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    const next: Visitor = { id: newId(), name: name.trim(), contact: contact.trim() };
    setVisitor(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* stockage indisponible */
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    void sendMessage({ text });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Fermer la discussion" : "Discuter avec O'TERROIR"}
        className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-primary shadow-xl transition hover:scale-105 md:bottom-28 md:right-8"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-40 right-4 z-50 flex h-[70vh] max-h-[560px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl md:bottom-44 md:right-8">
          <div className="bg-primary px-5 py-4 text-primary-foreground">
            <p className="font-display text-lg leading-tight">O'TERROIR by Stéphanie</p>
            <p className="text-xs opacity-80">
              Posez votre question, votre message est transmis à Stéphanie.
            </p>
          </div>

          {!ready ? null : !visitor ? (
            <form onSubmit={startChat} className="flex flex-1 flex-col justify-center gap-3 p-5">
              <p className="text-sm text-muted-foreground">
                Avant de commencer, dites-nous qui vous êtes.
              </p>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Votre nom"
                required
              />
              <Input
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="Téléphone ou email (optionnel)"
              />
              <Button type="submit" className="mt-1">
                Démarrer la discussion
              </Button>
            </form>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Bonjour {visitor.name} 👋 Comment pouvons-nous vous aider ? Riz local, maïs violet,
                    liqueurs artisanales, marché à domicile…
                  </p>
                )}
                {messages.map((message) => {
                  const text = message.parts
                    .map((part) => (part.type === "text" ? part.text : ""))
                    .join("");
                  if (!text) return null;
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground",
                        )}
                      >
                        {text}
                      </div>
                    </div>
                  );
                })}
                {status === "submitted" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Rédaction…
                  </div>
                )}
              </div>

              <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-3">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Écrire un message…"
                  disabled={busy}
                />
                <Button type="submit" size="icon" disabled={busy || !input.trim()}>
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
