import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2, Upload, Eye, ImageIcon, Video, FileText, MessageSquare, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaImage } from "@/components/MediaImage";
import { supabase } from "@/integrations/supabase/client";
import { assetMap, removeMedia, uploadMedia } from "@/lib/media";
import {
  photosQuery,
  postsQuery,
  productsQuery,
  videosQuery,
  type DbPhoto,
  type DbPost,
  type DbProduct,
  type DbVideo,
} from "@/lib/content";
import { conversationsQuery, conversationMessagesQuery, type ChatConversation } from "@/lib/chat";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Tableau de bord | O’TERROIR" },
      { name: "description", content: "Gestion des produits, photos, vidéos et publications de O’TERROIR by Stéphanie." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Tableau de bord O’TERROIR" },
      { property: "og:description", content: "Espace privé de gestion des contenus du site." },
    ],
  }),
  component: AdminPage,
});

const CATEGORIES = ["RIZ LOCAL", "MAÏS", "PRODUITS DU TERROIR", "LIQUEURS"];

function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
      return Boolean(data);
    },
  });
}

function MediaField({ value, onChange, folder, label }: { value: string | null; onChange: (path: string | null) => void; folder: string; label: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 p-3">
        {value ? <MediaImage path={value} alt="Aperçu" className="size-16 rounded-lg object-cover ring-1 ring-border" /> : <div className="grid size-16 place-items-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border"><Upload className="size-4" /></div>}
        <label className="cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
          {busy ? "Envoi…" : "Choisir un fichier"}
          <input
            type="file"
            className="hidden"
            accept="image/*,video/*"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setBusy(true);
              try {
                const path = await uploadMedia(file, folder);
                onChange(path);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Envoi impossible.");
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            Retirer
          </Button>
        )}
      </div>
    </div>
  );
}

function EditorDialog({ open, onOpenChange, title, onSubmit, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; onSubmit: () => Promise<void>; children: ReactNode }) {
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-border/70 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border/70 bg-muted/30 px-6 py-5">
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 px-6 py-6">{children}</div>
        <DialogFooter className="border-t border-border/70 bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSubmit();
                onOpenChange(false);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Enregistrement impossible.");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 gap-1 rounded-lg border border-border/60 bg-background p-1 shadow-sm">
      <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Modifier"><Pencil className="size-4" /></Button>
      <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Supprimer"><Trash2 className="size-4 text-destructive" /></Button>
    </div>
  );
}

type ProductDraft = Omit<DbProduct, "id"> & { id?: string };

function ProductsPanel() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery(productsQuery(true));
  const [draft, setDraft] = useState<ProductDraft | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["products"] });

  const save = async () => {
    if (!draft) return;
    const payload = {
      name: draft.name.trim(),
      category: draft.category,
      description: draft.description,
      price: draft.price,
      image_url: draft.image_url,
      asset_key: draft.asset_key,
      image_position: draft.image_position,
      sort_order: draft.sort_order,
      is_visible: draft.is_visible,
    };
    if (!payload.name) throw new Error("Le nom est obligatoire.");
    const { error } = draft.id
      ? await supabase.from("products").update(payload).eq("id", draft.id)
      : await supabase.from("products").insert(payload);
    if (error) throw error;
    toast.success("Produit enregistré.");
    refresh();
  };

  const remove = async (product: DbProduct) => {
    if (!confirm(`Supprimer « ${product.name} » ?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) { toast.error(error.message); return; }
    await removeMedia(product.image_url);
    toast.success("Produit supprimé.");
    refresh();
  };

  return (
    <div>
      <Button
        className="mb-5 rounded-xl shadow-sm"
        onClick={() =>
          setDraft({ name: "", category: "PRODUITS DU TERROIR", description: "", price: "Prix sur demande", image_url: null, asset_key: null, image_position: null, sort_order: (data.at(-1)?.sort_order ?? 0) + 10, is_visible: true })
        }
      >
        <Plus /> Ajouter un produit
      </Button>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
        {data.map((product) => (
          <div key={product.id} className="group flex items-center gap-4 border-b border-border/60 p-4 transition-colors last:border-0 hover:bg-muted/30 sm:p-5">
            <MediaImage path={product.image_url} fallback={assetMap[product.asset_key ?? "hero"]} objectPosition={product.image_position} alt={product.name} className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-border/70 sm:size-20" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{product.category}</p>
              <p className="truncate font-display text-lg font-semibold sm:text-xl">{product.name}</p>
              <p className="text-sm text-muted-foreground">{product.price}{!product.is_visible && " · masqué"}</p>
            </div>
            <RowActions onEdit={() => setDraft(product)} onDelete={() => remove(product)} />
          </div>
        ))}
        {data.length === 0 && <p className="p-6 text-sm text-muted-foreground">Aucun produit pour le moment.</p>}
      </div>

      {draft && (
        <EditorDialog open onOpenChange={(open) => !open && setDraft(null)} title={draft.id ? "Modifier le produit" : "Nouveau produit"} onSubmit={save}>
          <div className="space-y-2.5">
            <Label htmlFor="p-name">Nom</Label>
            <Input id="p-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="p-cat">Catégorie</Label>
            <select id="p-cat" className="h-10 w-full rounded-sm border border-border bg-background px-3 text-sm" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="p-price">Prix</Label>
            <Input id="p-price" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea id="p-desc" rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </div>
          <MediaField label="Photo" folder="products" value={draft.image_url} onChange={(path) => setDraft({ ...draft, image_url: path })} />
          <div className="space-y-2.5">
            <Label htmlFor="p-order">Ordre d’affichage</Label>
            <Input id="p-order" type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 p-3">
            <Switch id="p-visible" checked={draft.is_visible} onCheckedChange={(checked) => setDraft({ ...draft, is_visible: checked })} />
            <Label htmlFor="p-visible">Visible sur le site</Label>
          </div>
        </EditorDialog>
      )}
    </div>
  );
}

type PhotoDraft = Omit<DbPhoto, "id"> & { id?: string };

function PhotosPanel() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery(photosQuery(true));
  const [draft, setDraft] = useState<PhotoDraft | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["gallery_photos"] });

  const save = async () => {
    if (!draft) return;
    if (!draft.image_url) throw new Error("Choisissez une photo.");
    const payload = { image_url: draft.image_url, alt_text: draft.alt_text || "Photo O’TERROIR", sort_order: draft.sort_order, is_visible: draft.is_visible };
    const { error } = draft.id ? await supabase.from("gallery_photos").update(payload).eq("id", draft.id) : await supabase.from("gallery_photos").insert(payload);
    if (error) throw error;
    toast.success("Photo enregistrée.");
    refresh();
  };

  const remove = async (photo: DbPhoto) => {
    if (!confirm("Supprimer cette photo ?")) return;
    const { error } = await supabase.from("gallery_photos").delete().eq("id", photo.id);
    if (error) { toast.error(error.message); return; }
    await removeMedia(photo.image_url);
    toast.success("Photo supprimée.");
    refresh();
  };

  return (
    <div>
      <Button className="mb-5 rounded-xl shadow-sm" onClick={() => setDraft({ image_url: "", alt_text: "", sort_order: (data.at(-1)?.sort_order ?? 0) + 10, is_visible: true })}>
        <Plus /> Ajouter une photo
      </Button>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((photo) => (
          <div key={photo.id} className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm transition-shadow hover:shadow-md">
            <MediaImage path={photo.image_url} alt={photo.alt_text} className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
            <div className="flex items-center justify-between gap-2 border-t border-border/60 p-4">
              <p className="min-w-0 flex-1 truncate text-sm">{photo.alt_text}{!photo.is_visible && " · masquée"}</p>
              <RowActions onEdit={() => setDraft(photo)} onDelete={() => remove(photo)} />
            </div>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-muted-foreground">Aucune photo ajoutée : les photos d’origine du site restent affichées.</p>}
      </div>

      {draft && (
        <EditorDialog open onOpenChange={(open) => !open && setDraft(null)} title={draft.id ? "Modifier la photo" : "Nouvelle photo"} onSubmit={save}>
          <MediaField label="Photo" folder="gallery" value={draft.image_url || null} onChange={(path) => setDraft({ ...draft, image_url: path ?? "" })} />
          <div className="space-y-2.5">
            <Label htmlFor="g-alt">Légende / description</Label>
            <Input id="g-alt" value={draft.alt_text} onChange={(e) => setDraft({ ...draft, alt_text: e.target.value })} />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="g-order">Ordre d’affichage</Label>
            <Input id="g-order" type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 p-3">
            <Switch id="g-visible" checked={draft.is_visible} onCheckedChange={(checked) => setDraft({ ...draft, is_visible: checked })} />
            <Label htmlFor="g-visible">Visible sur le site</Label>
          </div>
        </EditorDialog>
      )}
    </div>
  );
}

type VideoDraft = Omit<DbVideo, "id"> & { id?: string };

function VideosPanel() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery(videosQuery(true));
  const [draft, setDraft] = useState<VideoDraft | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["videos"] });

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) throw new Error("Le titre est obligatoire.");
    if (!draft.video_url) throw new Error("Ajoutez un fichier vidéo ou un lien.");
    const payload = { title: draft.title.trim(), description: draft.description, video_url: draft.video_url, thumbnail_url: draft.thumbnail_url, sort_order: draft.sort_order, is_visible: draft.is_visible };
    const { error } = draft.id ? await supabase.from("videos").update(payload).eq("id", draft.id) : await supabase.from("videos").insert(payload);
    if (error) throw error;
    toast.success("Vidéo enregistrée.");
    refresh();
  };

  const remove = async (video: DbVideo) => {
    if (!confirm(`Supprimer « ${video.title} » ?`)) return;
    const { error } = await supabase.from("videos").delete().eq("id", video.id);
    if (error) { toast.error(error.message); return; }
    await removeMedia(video.video_url);
    await removeMedia(video.thumbnail_url);
    toast.success("Vidéo supprimée.");
    refresh();
  };

  return (
    <div>
      <Button className="mb-5 rounded-xl shadow-sm" onClick={() => setDraft({ title: "", description: "", video_url: "", thumbnail_url: null, sort_order: (data.at(-1)?.sort_order ?? 0) + 10, is_visible: true })}>
        <Plus /> Ajouter une vidéo
      </Button>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
        {data.map((video) => (
          <div key={video.id} className="group flex items-center gap-4 border-b border-border/60 p-4 transition-colors last:border-0 hover:bg-muted/30 sm:p-5">
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-semibold sm:text-xl">{video.title}</p>
              <p className="truncate text-sm text-muted-foreground">{video.video_url}{!video.is_visible && " · masquée"}</p>
            </div>
            <RowActions onEdit={() => setDraft(video)} onDelete={() => remove(video)} />
          </div>
        ))}
        {data.length === 0 && <p className="p-6 text-sm text-muted-foreground">Aucune vidéo pour le moment.</p>}
      </div>

      {draft && (
        <EditorDialog open onOpenChange={(open) => !open && setDraft(null)} title={draft.id ? "Modifier la vidéo" : "Nouvelle vidéo"} onSubmit={save}>
          <div className="space-y-2.5">
            <Label htmlFor="v-title">Titre</Label>
            <Input id="v-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="v-desc">Description</Label>
            <Textarea id="v-desc" rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </div>
          <MediaField label="Fichier vidéo" folder="videos" value={draft.video_url || null} onChange={(path) => setDraft({ ...draft, video_url: path ?? "" })} />
          <div className="space-y-2.5">
            <Label htmlFor="v-url">…ou lien YouTube / Vimeo</Label>
            <Input id="v-url" placeholder="https://youtu.be/…" value={draft.video_url.startsWith("http") ? draft.video_url : ""} onChange={(e) => setDraft({ ...draft, video_url: e.target.value })} />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="v-order">Ordre d’affichage</Label>
            <Input id="v-order" type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 p-3">
            <Switch id="v-visible" checked={draft.is_visible} onCheckedChange={(checked) => setDraft({ ...draft, is_visible: checked })} />
            <Label htmlFor="v-visible">Visible sur le site</Label>
          </div>
        </EditorDialog>
      )}
    </div>
  );
}

type PostDraft = Omit<DbPost, "id"> & { id?: string };

function PostsPanel() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery(postsQuery(true));
  const [draft, setDraft] = useState<PostDraft | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["posts"] });

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) throw new Error("Le titre est obligatoire.");
    const payload = { title: draft.title.trim(), body: draft.body, image_url: draft.image_url, is_published: draft.is_published, published_at: draft.published_at };
    const { error } = draft.id ? await supabase.from("posts").update(payload).eq("id", draft.id) : await supabase.from("posts").insert(payload);
    if (error) throw error;
    toast.success("Publication enregistrée.");
    refresh();
  };

  const remove = async (post: DbPost) => {
    if (!confirm(`Supprimer « ${post.title} » ?`)) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) { toast.error(error.message); return; }
    await removeMedia(post.image_url);
    toast.success("Publication supprimée.");
    refresh();
  };

  return (
    <div>
      <Button className="mb-5 rounded-xl shadow-sm" onClick={() => setDraft({ title: "", body: "", image_url: null, is_published: true, published_at: new Date().toISOString() })}>
        <Plus /> Ajouter une publication
      </Button>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
        {data.map((post) => (
          <div key={post.id} className="group flex items-center gap-4 border-b border-border/60 p-4 transition-colors last:border-0 hover:bg-muted/30 sm:p-5">
            {post.image_url && <MediaImage path={post.image_url} alt={post.title} className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-border/70 sm:size-20" />}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-semibold sm:text-xl">{post.title}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(post.published_at).toLocaleDateString("fr-FR")}{!post.is_published && " · brouillon"}
              </p>
            </div>
            <RowActions onEdit={() => setDraft(post)} onDelete={() => remove(post)} />
          </div>
        ))}
        {data.length === 0 && <p className="p-6 text-sm text-muted-foreground">Aucune publication pour le moment.</p>}
      </div>

      {draft && (
        <EditorDialog open onOpenChange={(open) => !open && setDraft(null)} title={draft.id ? "Modifier la publication" : "Nouvelle publication"} onSubmit={save}>
          <div className="space-y-2.5">
            <Label htmlFor="a-title">Titre</Label>
            <Input id="a-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="a-body">Texte</Label>
            <Textarea id="a-body" rows={6} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          </div>
          <MediaField label="Image" folder="posts" value={draft.image_url} onChange={(path) => setDraft({ ...draft, image_url: path })} />
          <div className="space-y-2.5">
            <Label htmlFor="a-date">Date</Label>
            <Input id="a-date" type="date" value={draft.published_at.slice(0, 10)} onChange={(e) => setDraft({ ...draft, published_at: new Date(e.target.value).toISOString() })} />
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 p-3">
            <Switch id="a-pub" checked={draft.is_published} onCheckedChange={(checked) => setDraft({ ...draft, is_published: checked })} />
            <Label htmlFor="a-pub">Publiée sur le site</Label>
          </div>
        </EditorDialog>
      )}
    </div>
  );
}

function MessagesPanel() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const { data: conversations = [], isLoading } = useQuery(conversationsQuery());
  const { data: messages = [] } = useQuery(conversationMessagesQuery(selected));

  const openConversation = async (conversation: ChatConversation) => {
    setSelected(conversation.id);
    if (!conversation.is_read) {
      const { error } = await supabase
        .from("chat_conversations")
        .update({ is_read: true })
        .eq("id", conversation.id);
      if (error) toast.error(error.message);
      else queryClient.invalidateQueries({ queryKey: ["chat_conversations"] });
    }
  };

  const removeConversation = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cette conversation ?")) return;
    const { error } = await supabase.from("chat_conversations").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (selected === id) setSelected(null);
    queryClient.invalidateQueries({ queryKey: ["chat_conversations"] });
    toast.success("Conversation supprimée");
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin" /></div>;

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
      <div className="space-y-2.5">
        <p className="text-sm text-muted-foreground">{conversations.length} conversation(s)</p>
        {conversations.length === 0 && (
          <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
            Aucun message pour le moment. Les messages envoyés depuis le chat du site arrivent ici.
          </p>
        )}
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`group flex items-start justify-between gap-2 rounded-2xl border p-4 shadow-sm transition-all ${selected === conversation.id ? "border-primary bg-primary/5 shadow-md" : "border-border/70 bg-background hover:bg-muted/30"}`}
          >
            <button type="button" className="flex-1 text-left" onClick={() => openConversation(conversation)}>
              <p className="font-medium">
                {conversation.visitor_name || "Visiteur"}
                {!conversation.is_read && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] uppercase text-primary-foreground">Nouveau</span>}
              </p>
              {conversation.visitor_contact && (
                <p className="text-xs text-muted-foreground">{conversation.visitor_contact}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(conversation.last_message_at).toLocaleString("fr-FR")}
              </p>
            </button>
            <Button variant="ghost" size="icon" onClick={() => removeConversation(conversation.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="min-h-[420px] rounded-2xl border border-border/70 bg-background p-5 shadow-sm">
        {!selected ? (
          <p className="text-sm text-muted-foreground">Sélectionnez une conversation pour lire les messages.</p>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`rounded-xl border border-border/60 p-3 ${message.role === "user" ? "bg-muted/30" : "bg-primary/5"}`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {message.role === "user" ? "Visiteur" : "Assistant"}
                </p>
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(message.created_at).toLocaleString("fr-FR")}
                </p>
              </div>
            ))}
            {messages.length === 0 && <p className="text-sm text-muted-foreground">Conversation vide.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: isAdmin, isLoading, refetch } = useIsAdmin();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted px-5">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-background p-8 text-center shadow-xl">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Accès réservé</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Votre compte n’a pas encore les droits d’administration. Si vous êtes la première personne à ouvrir cet espace, activez-les ci-dessous.
          </p>
          <Button
            className="mt-6 w-full"
            onClick={async () => {
              const { data, error } = await supabase.rpc("claim_admin");
              if (error || !data) {
                toast.error("Droits non accordés : un compte administrateur existe déjà.");
                return;
              }
              toast.success("Droits d’administration activés.");
              refetch();
            }}
          >
            Activer mes droits d’administration
          </Button>
          <Button variant="ghost" className="mt-3 w-full" onClick={signOut}>Se déconnecter</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/60">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">O’TERROIR</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Tableau de bord</h1>
            <p className="mt-1 text-sm text-muted-foreground">Gérez le contenu de votre site en toute simplicité.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-xl bg-background/80"><Link to="/"><Eye className="mr-2 size-4" />Voir le site</Link></Button>
            <Button variant="ghost" className="rounded-xl" onClick={signOut}>Se déconnecter</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-7 lg:px-8 lg:py-10">
        <Tabs defaultValue="produits">
          <TabsList className="mb-8 flex h-auto flex-wrap gap-1 rounded-2xl border border-border/70 bg-background p-1.5 shadow-sm">
            <TabsTrigger value="produits" className="gap-2 rounded-xl px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Package className="size-4" />Produits</TabsTrigger>
            <TabsTrigger value="photos" className="gap-2 rounded-xl px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><ImageIcon className="size-4" />Photos</TabsTrigger>
            <TabsTrigger value="videos" className="gap-2 rounded-xl px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Video className="size-4" />Vidéos</TabsTrigger>
            <TabsTrigger value="posts" className="gap-2 rounded-xl px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><FileText className="size-4" />Publications</TabsTrigger>
            <TabsTrigger value="messages" className="gap-2 rounded-xl px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><MessageSquare className="size-4" />Messages</TabsTrigger>
          </TabsList>
          <TabsContent value="produits" className="mt-0"><ProductsPanel /></TabsContent>
          <TabsContent value="photos" className="mt-0"><PhotosPanel /></TabsContent>
          <TabsContent value="videos" className="mt-0"><VideosPanel /></TabsContent>
          <TabsContent value="posts" className="mt-0"><PostsPanel /></TabsContent>
          <TabsContent value="messages" className="mt-0"><MessagesPanel /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
