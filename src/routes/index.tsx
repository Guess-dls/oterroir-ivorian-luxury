import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronLeft, ChevronRight, Mail, Menu, Phone, ShoppingBag, Sparkles, X } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/MediaImage";
import { ChatWidget } from "@/components/ChatWidget";
import { assetMap, useMediaUrl } from "@/lib/media";
import { photosQuery, postsQuery, productsQuery, videosQuery, type DbPhoto, type DbProduct } from "@/lib/content";
import { galleryImages, products as staticProducts, type ProductCategory } from "@/data/products";
import heroImage from "@/assets/oterroir-hero.jpg";
import riceImage from "@/assets/riz-collection.jpg";
import cornImage from "@/assets/mais-violet.jpg";
import liqueurImage from "@/assets/liqueurs.jpg";

const assetKeyFor = (image: string) =>
  image === riceImage ? "rice" : image === cornImage ? "corn" : image === liqueurImage ? "liqueur" : "hero";

const fallbackProducts: DbProduct[] = staticProducts.map((product, index) => ({
  id: product.id,
  name: product.name,
  category: product.category,
  description: product.description,
  price: product.price,
  image_url: null,
  asset_key: assetKeyFor(product.image),
  image_position: product.imagePosition ?? null,
  sort_order: index,
  is_visible: true,
}));

const fallbackPhotos: DbPhoto[] = galleryImages.map((image, index) => ({
  id: `static-${index}`,
  image_url: image,
  alt_text: ["Produits locaux ivoiriens", "Collection de riz locaux", "Maïs violet", "Liqueurs artisanales"][index] ?? "Photo O’TERROIR",
  sort_order: index,
  is_visible: true,
}));

function useProducts() {
  const { data } = useQuery(productsQuery());
  return data && data.length > 0 ? data : fallbackProducts;
}

const WHATSAPP = "2250749939267";
const DEFAULT_MESSAGE = "Bonjour O’TERROIR by Stéphanie 👋 Je souhaite avoir des informations sur vos produits.";
const whatsappUrl = (message = DEFAULT_MESSAGE) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
const orderUrl = (name: string) => whatsappUrl(`Bonjour O’TERROIR by Stéphanie 👋 Je souhaite commander : ${name}. Pouvez-vous me renseigner sur sa disponibilité ?`);

const contactSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom.").max(80),
  email: z.string().trim().email("Adresse email invalide.").max(120),
  subject: z.string().trim().min(2, "Indiquez l’objet de votre demande.").max(100),
  message: z.string().trim().min(5, "Votre message est trop court.").max(800),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Produits locaux ivoiriens | O’TERROIR" },
      { name: "description", content: "Découvrez les riz locaux, produits du terroir et liqueurs artisanales de O’TERROIR by Stéphanie en Côte d’Ivoire." },
      { property: "og:title", content: "O’TERROIR by Stéphanie — Le terroir, autrement" },
      { property: "og:description", content: "Une sélection premium de produits locaux et artisanaux de Côte d’Ivoire." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

const navLinks = [["Accueil", "#accueil"], ["Nos Produits", "#produits"], ["Univers", "#univers"], ["Galerie", "#galerie"], ["Contact", "#contact"]];
const filters: ("TOUS" | ProductCategory)[] = ["TOUS", "RIZ LOCAL", "MAÏS", "PRODUITS DU TERROIR", "LIQUEURS"];

function Logo({ inverse = false }: { inverse?: boolean }) {
  return <a href="#accueil" aria-label="O’TERROIR — Accueil" className={`leading-none ${inverse ? "text-primary-foreground" : "text-primary"}`}><span className="font-display text-2xl font-bold">O’TERROIR</span><span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.28em]">by Stéphanie</span></a>;
}

function Header() {
  const [open, setOpen] = useState(false);
  return <header className="fixed inset-x-0 top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-md">
    <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
      <Logo />
      <nav aria-label="Navigation principale" className="hidden items-center gap-7 lg:flex">{navLinks.map(([label, href]) => <a key={href} href={href} className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/75 transition-colors hover:text-primary">{label}</a>)}</nav>
      <div className="hidden items-center gap-3 sm:flex"><Button asChild variant="outline" className="h-11 border-primary text-primary"><a href="tel:+2250749939267"><Phone />Appeler</a></Button><Button asChild className="h-11 bg-primary"><a href={whatsappUrl()} target="_blank" rel="noreferrer"><ShoppingBag />WhatsApp</a></Button></div>
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}>{open ? <X /> : <Menu />}</Button>
    </div>
    {open && <nav className="border-t border-border bg-background px-5 py-5 lg:hidden">{navLinks.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)} className="block border-b border-border py-3 text-sm font-semibold uppercase tracking-[0.1em]">{label}</a>)}<Button asChild className="mt-5 w-full"><a href={whatsappUrl()} target="_blank" rel="noreferrer">Commander sur WhatsApp</a></Button></nav>}
  </header>;
}

function SectionHeading({ eyebrow, title, light = false }: { eyebrow: string; title: string; light?: boolean }) {
  return <div className="mb-10 reveal"><p className={`mb-3 text-xs font-bold uppercase tracking-[0.24em] ${light ? "text-gold" : "text-primary"}`}>{eyebrow}</p><h2 className={`max-w-3xl font-display text-4xl font-semibold leading-[1.05] md:text-6xl ${light ? "text-primary-foreground" : "text-foreground"}`}>{title}</h2></div>;
}

function Hero() {
  return <section id="accueil" className="relative flex min-h-[92svh] items-end overflow-hidden pt-20">
    <img src={heroImage} width={1920} height={1104} alt="Sélection de riz locaux, maïs violet et produits du terroir ivoirien" className="absolute inset-0 h-full w-full object-cover object-center" />
    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/5" />
    <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 pt-24 lg:px-8 lg:pb-20"><div className="max-w-2xl">
      <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-primary">Produits du terroir ivoirien</p>
      <h1 className="font-display text-5xl font-semibold leading-[0.98] text-foreground sm:text-6xl lg:text-8xl">Le goût authentique de notre terroir.</h1>
      <p className="mt-6 max-w-xl text-base leading-7 text-foreground/75 md:text-lg">O’TERROIR by Stéphanie vous fait découvrir une sélection de produits locaux et artisanaux, choisis pour leur authenticité et leur qualité.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg" className="h-12 px-6"><a href="#produits">Découvrir nos produits<ArrowRight /></a></Button><Button asChild size="lg" variant="outline" className="h-12 border-primary bg-background/70 px-6 text-primary backdrop-blur"><a href={whatsappUrl()} target="_blank" rel="noreferrer">Commander sur WhatsApp</a></Button></div>
      <p className="mt-9 text-xs font-semibold uppercase tracking-[0.14em] text-earth">100% inspiration locale&nbsp; • &nbsp;Savoir-faire&nbsp; • &nbsp;Authenticité</p>
    </div></div>
  </section>;
}

function TrustBar() {
  return <section aria-label="Nos engagements" className="bg-primary text-primary-foreground"><div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-primary-foreground/15 px-5 py-7 md:grid-cols-4 lg:px-8">{["Produits locaux", "Authenticité", "Savoir-faire", "Marché à domicile"].map((item, index) => <div key={item} className="px-3 text-center"><span className="mb-1 block font-display text-xl text-gold">0{index + 1}</span><span className="text-[10px] font-bold uppercase tracking-[0.16em]">{item}</span></div>)}</div></section>;
}

function Universe() {
  return <section id="univers" className="bg-background py-24 md:py-32"><div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
    <div className="reveal"><p className="font-display text-5xl font-medium leading-tight text-primary md:text-7xl">« Le terroir,<br/><em className="text-gold">autrement.</em> »</p></div>
    <div className="reveal border-l border-gold/50 pl-7 md:pl-12"><p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-primary">Notre univers</p><h2 className="font-display text-3xl font-semibold leading-tight md:text-5xl">Des richesses locales présentées avec exigence.</h2><p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground">Nous mettons en lumière des ingrédients profondément ancrés en Côte d’Ivoire. Chaque produit est choisi pour son identité, puis présenté dans un esprit contemporain qui respecte son origine et celles et ceux qui le font vivre.</p></div>
  </div></section>;
}

function Catalogue() {
  const allProducts = useProducts();
  const [filter, setFilter] = useState<(typeof filters)[number]>("TOUS");
  const visible = filter === "TOUS" ? allProducts : allProducts.filter((product) => product.category === filter);
  return <section id="produits" className="bg-muted py-24 md:py-32"><div className="mx-auto max-w-7xl px-5 lg:px-8">
    <SectionHeading eyebrow="La sélection" title="Les essentiels O’TERROIR" />
    <div className="mb-10 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filtrer les produits">{filters.map((item) => <Button key={item} variant={filter === item ? "default" : "outline"} size="sm" onClick={() => setFilter(item)} className="shrink-0 rounded-full px-4">{item}</Button>)}</div>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visible.map((product) => <article key={product.id} className="group overflow-hidden rounded-sm border border-border bg-card reveal"><div className="h-56 overflow-hidden"><MediaImage path={product.image_url} fallback={assetMap[product.asset_key ?? "hero"]} objectPosition={product.image_position} alt={product.name} className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]" /></div><div className="p-6"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{product.category}</p><h3 className="mt-2 text-3xl font-semibold">{product.name}</h3><p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{product.description}</p><div className="mt-6 flex items-center justify-between gap-3"><strong className="text-sm text-earth">{product.price}</strong><Button asChild size="sm" variant="outline" className="border-primary text-primary"><a href={orderUrl(product.name)} target="_blank" rel="noreferrer">Commander</a></Button></div></div></article>)}</div>
  </div></section>;
}

function RiceCollection() {
  const rices = useProducts().filter((product) => product.category === "RIZ LOCAL");
  if (rices.length === 0) return null;
  return <section className="py-24 md:py-32"><div className="mx-auto grid max-w-7xl items-start gap-14 px-5 lg:grid-cols-2 lg:px-8"><div className="sticky top-28 overflow-hidden rounded-sm"><img src={riceImage} loading="lazy" width={1408} height={1104} alt="Collection de riz locaux ivoiriens" className="w-full object-cover" /></div><div><SectionHeading eyebrow="Collection Riz Local" title="Des grains, autant d’expressions du terroir." /><div className="divide-y divide-border border-y border-border">{rices.map((rice, index) => <a key={rice.id} href={orderUrl(rice.name)} target="_blank" rel="noreferrer" className="group grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5"><span className="text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><span className="font-display text-2xl font-semibold group-hover:text-primary">{rice.name}</span><span className="text-right text-sm font-semibold text-earth">{rice.price}</span></a>)}</div><p className="mt-6 text-sm text-muted-foreground">Autres formats et disponibilités : nous contacter.</p><Button asChild className="mt-6 h-12"><a href={whatsappUrl("Bonjour O’TERROIR by Stéphanie 👋 Je souhaite connaître les formats et disponibilités de votre collection de riz local.")} target="_blank" rel="noreferrer">Choisir mon riz sur WhatsApp<ArrowRight /></a></Button></div></div></section>;
}

function PurpleCorn() {
  return <section className="bg-violet py-20 text-accent-foreground md:py-28"><div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-8"><div className="reveal"><p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">Un ingrédient singulier</p><h2 className="mt-4 font-display text-5xl font-semibold md:text-7xl">Maïs Violet</h2><p className="mt-6 max-w-xl text-base leading-8 text-accent-foreground/75">Une poudre de maïs violet locale, intense par sa couleur et inspirante en cuisine. Une autre manière de découvrir un ingrédient authentique du terroir ivoirien.</p><div className="mt-7 flex flex-wrap gap-2">{["Local", "Authentique", "Culinaire"].map((tag) => <span key={tag} className="rounded-full border border-accent-foreground/30 px-4 py-2 text-xs uppercase tracking-[0.14em]">{tag}</span>)}</div><Button asChild className="mt-8 bg-gold text-deep hover:bg-gold/90"><a href={orderUrl("Poudre de maïs violet")} target="_blank" rel="noreferrer">Découvrir sur WhatsApp</a></Button></div><img src={cornImage} loading="lazy" width={1200} height={1408} alt="Poudre et épis de maïs violet" className="aspect-[4/5] max-h-[650px] w-full rounded-sm object-cover reveal" /></div></section>;
}

function GorillaCola() {
  return <section className="bg-background py-24"><div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-[1.15fr_0.85fr] lg:px-8"><div className="relative min-h-[430px] overflow-hidden rounded-sm"><img src={heroImage} loading="lazy" width={1920} height={1104} alt="Cola de gorille parmi des produits du terroir" className="absolute inset-0 h-full w-full object-cover object-right" /></div><div className="reveal"><p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Découverte traditionnelle</p><h2 className="mt-3 font-display text-5xl font-semibold md:text-6xl">Cola de gorille</h2><p className="mt-6 text-base leading-8 text-muted-foreground">Un produit emblématique qui raconte la diversité des ressources locales. Nous le proposons comme une découverte authentique du terroir, avec simplicité et respect de la tradition.</p><Button asChild variant="outline" className="mt-7 h-12 border-primary text-primary"><a href={orderUrl("Cola de gorille")} target="_blank" rel="noreferrer">Demander les disponibilités</a></Button></div></div></section>;
}

function Liqueurs() {
  const items = useProducts()
    .filter((product) => product.category === "LIQUEURS")
    .map((product) => [product.name.replace(/^Liqueur (de |d’)?/i, ""), product.price] as const);
  return <section className="bg-deep py-24 text-primary-foreground md:py-32"><div className="mx-auto max-w-7xl px-5 lg:px-8"><SectionHeading eyebrow="Créations artisanales" title="Liqueurs du terroir" light /><div className="grid items-stretch gap-8 lg:grid-cols-[1.2fr_0.8fr]"><img src={liqueurImage} loading="lazy" width={1408} height={1104} alt="Sélection de liqueurs artisanales au bissap, gingembre et baobab" className="h-full min-h-[480px] w-full rounded-sm object-cover" /><div className="border border-primary-foreground/15 p-7 md:p-9"><p className="mb-7 leading-7 text-primary-foreground/65">Des recettes artisanales qui révèlent les saveurs locales dans un registre généreux et élégant.</p><div className="divide-y divide-primary-foreground/15 border-y border-primary-foreground/15">{items.map(([name, price]) => <a key={name} href={orderUrl(`Liqueur ${name}`)} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 py-4 hover:text-gold"><span className="font-display text-xl">{name}</span><span className="text-xs font-semibold uppercase tracking-wider">{price}</span></a>)}</div><p className="mt-5 text-sm text-primary-foreground/60">Autres créations disponibles sur demande.</p><Button asChild className="mt-7 bg-gold text-deep hover:bg-gold/90"><a href={whatsappUrl("Bonjour O’TERROIR by Stéphanie 👋 Je souhaite découvrir vos liqueurs artisanales.")} target="_blank" rel="noreferrer">Découvrir la collection</a></Button></div></div><p className="mt-7 border-l-2 border-gold pl-4 text-xs leading-6 text-primary-foreground/65">La vente d’alcool est interdite aux mineurs. L’abus d’alcool est dangereux pour la santé. À consommer avec modération.</p></div></section>;
}

function HomeMarket() {
  return <section className="bg-gold py-16 text-deep"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 md:flex-row md:items-center lg:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.24em]">Marché à domicile</p><h2 className="mt-2 font-display text-4xl font-semibold md:text-5xl">Le terroir vient à vous.</h2><p className="mt-3 max-w-2xl leading-7 text-deep/75">Contactez-nous pour connaître les disponibilités, choisir vos produits et organiser votre commande.</p></div><div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row"><Button asChild className="h-12 bg-deep text-primary-foreground hover:bg-deep/90"><a href={whatsappUrl()} target="_blank" rel="noreferrer">Écrire sur WhatsApp</a></Button><Button asChild variant="outline" className="h-12 border-deep bg-transparent text-deep hover:bg-deep hover:text-primary-foreground"><a href="tel:+2250749939267"><Phone />Appeler</a></Button></div></div></section>;
}

function KnowHow() {
  const steps = [["Sélection", "Choisir des produits locaux pour leur identité et leur qualité."], ["Valorisation", "Présenter chaque richesse avec soin, justesse et modernité."], ["Partage", "Faire découvrir le goût du terroir au plus près de vos envies."]];
  return <section className="py-24 md:py-32"><div className="mx-auto max-w-7xl px-5 lg:px-8"><SectionHeading eyebrow="Notre savoir-faire" title="De l’origine jusqu’à votre table." /><div className="grid gap-0 md:grid-cols-3">{steps.map(([title, text], index) => <div key={title} className="relative border-t border-primary px-0 py-8 md:border-l md:border-t-0 md:px-8"><span className="font-display text-4xl text-gold">0{index + 1}</span><h3 className="mt-8 text-3xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p></div>)}</div></div></section>;
}

function Gallery() {
  const { data } = useQuery(photosQuery());
  const photos = data && data.length > 0 ? data : fallbackPhotos;
  const total = photos.length;
  const [active, setActive] = useState<number | null>(null);
  useEffect(() => { if (active === null || total === 0) return; const key = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); if (e.key === "ArrowRight") setActive((active + 1) % total); if (e.key === "ArrowLeft") setActive((active - 1 + total) % total); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [active, total]);
  const current = active === null ? null : photos[active];
  return <section id="galerie" className="bg-muted py-24 md:py-32"><div className="mx-auto max-w-7xl px-5 lg:px-8"><SectionHeading eyebrow="Galerie" title="Matières, couleurs, origine." /><div className="grid auto-rows-[220px] grid-cols-2 gap-3 md:auto-rows-[280px] md:grid-cols-4">{photos.map((photo, index) => <Button variant="ghost" key={photo.id} onClick={() => setActive(index)} aria-label={`Agrandir la photo ${index + 1}`} className={`h-auto overflow-hidden rounded-sm p-0 ${index % 5 === 0 ? "col-span-2 row-span-2" : index % 5 === 3 ? "col-span-2" : ""}`}><MediaImage path={photo.image_url} alt={photo.alt_text} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" /></Button>)}</div></div>{current && <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep/95 p-4" role="dialog" aria-modal="true" aria-label="Galerie plein écran"><Button variant="ghost" size="icon" className="absolute right-5 top-5 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setActive(null)} aria-label="Fermer"><X /></Button><Button variant="ghost" size="icon" className="absolute left-3 text-primary-foreground hover:bg-primary-foreground/10 md:left-8" onClick={() => setActive(((active ?? 0) - 1 + total) % total)} aria-label="Photo précédente"><ChevronLeft /></Button><MediaImage path={current.image_url} alt={current.alt_text} loading="eager" className="max-h-[85vh] max-w-[85vw] object-contain" /><Button variant="ghost" size="icon" className="absolute right-3 text-primary-foreground hover:bg-primary-foreground/10 md:right-8" onClick={() => setActive(((active ?? 0) + 1) % total)} aria-label="Photo suivante"><ChevronRight /></Button></div>}</section>;
}

function VideoPlayer({ path, title }: { path: string; title: string }) {
  const url = useMediaUrl(path);
  const embed = /youtu\.be|youtube\.com|vimeo\.com/i.test(path);
  if (embed) {
    const src = path.includes("youtu.be/") ? path.replace("youtu.be/", "www.youtube.com/embed/") : path.replace("watch?v=", "embed/");
    return <iframe src={src} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowFullScreen className="aspect-video w-full rounded-sm border-0" />;
  }
  if (!url) return <div className="aspect-video w-full animate-pulse rounded-sm bg-muted" />;
  return <video src={url} controls preload="metadata" className="aspect-video w-full rounded-sm bg-deep object-cover" />;
}

function Videos() {
  const { data } = useQuery(videosQuery());
  if (!data || data.length === 0) return null;
  return <section id="videos" className="bg-background py-24 md:py-32"><div className="mx-auto max-w-7xl px-5 lg:px-8"><SectionHeading eyebrow="En images" title="Nos vidéos." /><div className="grid gap-8 md:grid-cols-2">{data.map((video) => <article key={video.id} className="reveal"><VideoPlayer path={video.video_url} title={video.title} /><h3 className="mt-4 font-display text-2xl font-semibold">{video.title}</h3>{video.description && <p className="mt-2 text-sm leading-7 text-muted-foreground">{video.description}</p>}</article>)}</div></div></section>;
}

function Posts() {
  const { data } = useQuery(postsQuery());
  if (!data || data.length === 0) return null;
  return <section id="actualites" className="bg-muted py-24 md:py-32"><div className="mx-auto max-w-7xl px-5 lg:px-8"><SectionHeading eyebrow="Actualités" title="Les nouvelles du terroir." /><div className="grid gap-6 md:grid-cols-3">{data.map((post) => <article key={post.id} className="overflow-hidden rounded-sm border border-border bg-card reveal">{post.image_url && <MediaImage path={post.image_url} alt={post.title} className="h-52 w-full object-cover" />}<div className="p-6"><time dateTime={post.published_at} className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{new Date(post.published_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</time><h3 className="mt-2 font-display text-2xl font-semibold">{post.title}</h3><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{post.body}</p></div></article>)}</div></div></section>;
}

function Contact() {
  const [error, setError] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const parsed = contactSchema.safeParse({ name: form.get("name"), email: form.get("email"), subject: form.get("subject"), message: form.get("message") }); if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Vérifiez les informations saisies."); return; } setError(""); const { name, email, subject, message } = parsed.data; window.open(whatsappUrl(`Bonjour O’TERROIR by Stéphanie 👋\n\nNom : ${name}\nEmail : ${email}\nObjet : ${subject}\nMessage : ${message}`), "_blank", "noopener,noreferrer"); };
  const field = "h-12 w-full rounded-sm border border-border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";
  return <section id="contact" className="py-24 md:py-32"><div className="mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:px-8"><div><SectionHeading eyebrow="Parlons terroir" title="Une question, une commande ?" /><p className="max-w-md leading-7 text-muted-foreground">Écrivez-nous directement ou envoyez votre demande via le formulaire. Nous vous répondrons sur WhatsApp.</p><div className="mt-9 space-y-4"><a href="tel:+2250749939267" className="flex items-center gap-4 text-sm font-semibold"><span className="grid size-11 place-items-center bg-muted text-primary"><Phone className="size-4" /></span>+225 07 49 93 92 67</a><a href="mailto:zelyagoh@gmail.com" className="flex items-center gap-4 text-sm font-semibold"><span className="grid size-11 place-items-center bg-muted text-primary"><Mail className="size-4" /></span>zelyagoh@gmail.com</a></div></div><form onSubmit={submit} className="grid gap-5 bg-muted p-6 md:grid-cols-2 md:p-9"><label className="text-xs font-bold uppercase tracking-wider">Nom<input name="name" maxLength={80} required className={`${field} mt-2`} /></label><label className="text-xs font-bold uppercase tracking-wider">Email<input name="email" type="email" maxLength={120} required className={`${field} mt-2`} /></label><label className="text-xs font-bold uppercase tracking-wider md:col-span-2">Objet<input name="subject" maxLength={100} required className={`${field} mt-2`} /></label><label className="text-xs font-bold uppercase tracking-wider md:col-span-2">Message<textarea name="message" maxLength={800} required rows={5} className={`${field} mt-2 h-auto py-3`} /></label>{error && <p className="text-sm text-destructive md:col-span-2" role="alert">{error}</p>}<Button type="submit" className="h-12 md:col-span-2">Envoyer sur WhatsApp<ArrowRight /></Button></form></div></section>;
}

function Footer() {
  return <footer className="bg-deep text-primary-foreground"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-3 lg:px-8"><div><Logo inverse /><p className="mt-5 max-w-xs text-sm leading-6 text-primary-foreground/55">Produits locaux et artisanaux de Côte d’Ivoire, présentés autrement.</p></div><div><p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold">Explorer</p>{navLinks.slice(1).map(([label, href]) => <a key={href} href={href} className="mb-2 block text-sm text-primary-foreground/65 hover:text-gold">{label}</a>)}<Link to="/admin" className="mt-2 block text-sm text-primary-foreground/45 hover:text-gold">Espace administration</Link></div><div><p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold">Nous contacter</p><a href="tel:+2250749939267" className="mb-2 block text-sm text-primary-foreground/65">+225 07 49 93 92 67</a><a href="mailto:zelyagoh@gmail.com" className="block text-sm text-primary-foreground/65">zelyagoh@gmail.com</a></div></div><div className="border-t border-primary-foreground/10 px-5 py-5 text-center text-[11px] text-primary-foreground/45">© 2026 O’TERROIR by Stéphanie. Tous droits réservés.</div></footer>;
}

function HomePage() {
  return <div className="overflow-x-clip"><Header /><main><Hero /><TrustBar /><Universe /><Catalogue /><RiceCollection /><PurpleCorn /><GorillaCola /><Liqueurs /><HomeMarket /><KnowHow /><Gallery /><Videos /><Posts /><Contact /></main><Footer /><a href={whatsappUrl()} target="_blank" rel="noreferrer" aria-label="Contacter O’TERROIR sur WhatsApp" className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105"><Sparkles className="size-6" /></a></div>;
}