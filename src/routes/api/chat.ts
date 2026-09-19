import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";

type ChatBody = {
  messages?: unknown;
  conversationId?: unknown;
  visitorName?: unknown;
  visitorContact?: unknown;
};

const WHATSAPP = "2250749939267";

function textOf(message: UIMessage | undefined) {
  if (!message) return "";
  return (message.parts ?? [])
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatBody;
        const messages = body.messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("Messages requis", { status: 400 });
        }

        const conversationId =
          typeof body.conversationId === "string" && body.conversationId.length > 10
            ? body.conversationId
            : null;
        const visitorName = typeof body.visitorName === "string" ? body.visitorName.slice(0, 120) : "";
        const visitorContact =
          typeof body.visitorContact === "string" ? body.visitorContact.slice(0, 120) : "";

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response("Configuration IA manquante", { status: 500 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Catalogue à jour pour que l'assistant réponde avec les vrais prix.
        const { data: products } = await supabaseAdmin
          .from("products")
          .select("name, category, description, price")
          .eq("is_visible", true)
          .order("sort_order", { ascending: true });

        const catalogue = (products ?? [])
          .map((p) => `- ${p.name} (${p.category}) — ${p.price} : ${p.description}`)
          .join("\n");

        const systemPrompt = `Tu es l'assistante virtuelle d'O'TERROIR by Stéphanie, une maison ivoirienne qui valorise les produits locaux et artisanaux de Côte d'Ivoire (riz local, maïs, produits du terroir, liqueurs artisanales).

Règles absolues :
- Réponds toujours en français, avec chaleur, élégance et concision (3 phrases maximum sauf si on te demande des détails).
- N'utilise aucune mise en forme markdown : pas d'astérisques, pas de titres, pas de listes à puces. Écris les liens en clair (ex. wa.me/${WHATSAPP}).
- N'invente JAMAIS de prix, de produit, de certification, d'adresse physique ni d'allégation de santé ou médicale.
- Si une information n'est pas dans le catalogue ci-dessous, dis simplement que Stéphanie répondra personnellement, et propose WhatsApp : https://wa.me/${WHATSAPP}
- Pour les liqueurs, rappelle que la vente est réservée aux personnes majeures et que l'abus d'alcool est dangereux pour la santé.
- Contact : téléphone / WhatsApp +225 07 49 93 92 67, email zelyagoh@gmail.com. Service « marché à domicile » disponible.
- Le message du visiteur est enregistré et lu par Stéphanie : tu peux le lui confirmer et demander son nom et son numéro s'ils manquent.

Catalogue actuel :
${catalogue || "(catalogue momentanément indisponible — invite le visiteur à écrire sur WhatsApp)"}`;

        const initialRunId = getLovableAiGatewayRunId(request);
        const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);
        const lovable = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey: key,
          headers: {
            "Lovable-API-Key": key,
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
          fetch: runIdFetch.fetch,
        });

        const uiMessages = messages as UIMessage[];

        const persist = async (assistantText: string) => {
          if (!conversationId) return;
          const lastUser = [...uiMessages].reverse().find((m) => m.role === "user");
          const userText = textOf(lastUser);
          const { error: convError } = await supabaseAdmin.from("chat_conversations").upsert(
            {
              id: conversationId,
              visitor_name: visitorName,
              visitor_contact: visitorContact,
              is_read: false,
              last_message_at: new Date().toISOString(),
            },
            { onConflict: "id" },
          );
          if (convError) {
            console.error("chat conversation upsert failed", convError);
            return;
          }
          const rows = [
            ...(userText ? [{ conversation_id: conversationId, role: "user", content: userText }] : []),
            ...(assistantText
              ? [{ conversation_id: conversationId, role: "assistant", content: assistantText }]
              : []),
          ];
          if (rows.length === 0) return;
          const { error: msgError } = await supabaseAdmin.from("chat_messages").insert(rows);
          if (msgError) console.error("chat message insert failed", msgError);
        };

        const result = streamText({
          model: lovable.responses("openai/gpt-6-astra"),
          system: systemPrompt,
          messages: await convertToModelMessages(uiMessages),
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        const response = result.toUIMessageStreamResponse({
          originalMessages: uiMessages,
          onFinish: async ({ responseMessage }) => {
            await persist(textOf(responseMessage as UIMessage));
          },
          headers: getLovableAiGatewayResponseHeaders(undefined, {
            ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
          }),
        });

        return withLovableAiGatewayRunIdHeader(response, runIdFetch);
      },
    },
  },
});
