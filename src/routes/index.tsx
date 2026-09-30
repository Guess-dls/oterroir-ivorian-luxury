import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Mail,
  Menu,
  Phone,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/MediaImage";
import { ChatWidget } from "@/components/ChatWidget";
import { assetMap, useMediaUrl } from "@/lib/media";
import {
  photosQuery,
  postsQuery,
  productsQuery,
  videosQuery,
  type DbPhoto,
  type DbProduct,
} from "@/lib/content";
import heroImage from "@/assets/oterroir-hero.jpg";
import riceImage from "@/assets/riz-collection.jpg";
import cornImage from "@/assets/mais-violet.jpg";
import liqueurImage from "@/assets/liqueurs.jpg";

const BRAND_NAME = "O’TERROIR";
const BRAND_SUBTITLE = "by Stéphanie";
const BRAND_SLOGAN = "Le goût authentique de notre terroir.";

const WHATSAPP = "2250749939267";
const PHONE = "+2250749939267";
const EMAIL = "zelyagoh@gmail.com";

const DEFAULT_MESSAGE =
  "Bonjour O’TERROIR by Stéphanie 👋 Je souhaite avoir des informations sur vos produits.";

const whatsappUrl = (message = DEFAULT_MESSAGE) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;

const orderUrl = (name: string) =>
  whatsappUrl(
    `Bonjour O’TERROIR by Stéphanie 👋 Je souhaite commander : ${name}. Pouvez-vous me renseigner sur sa disponibilité ?`,
  );

const contactSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom.").max(80),
  email: z.string().trim().email("Adresse email invalide.").max(120),
  subject: z
    .string()
    .trim()
    .min(2, "Indiquez l’objet de votre demande.")
    .max(100),
  message: z.string().trim().min(5, "Votre message est trop court.").max(800),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: `${BRAND_NAME} ${BRAND_SUBTITLE} — ${BRAND_SLOGAN}`,
      },
      {
        name: "description",
        content:
          "Découvrez les produits locaux et artisanaux de O’TERROIR by Stéphanie en Côte d’Ivoire.",
      },
      {
        property: "og:title",
        content: `${BRAND_NAME} ${BRAND_SUBTITLE} — ${BRAND_SLOGAN}`,
      },
      {
        property: "og:description",
        content:
          "Une sélection de produits locaux et artisanaux de Côte d’Ivoire.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

const navLinks = [
  ["Accueil", "#accueil"],
  ["Nos Produits", "#produits"],
  ["Univers", "#univers"],
  ["Galerie", "#galerie"],
  ["Contact", "#contact"],
] as const;

function useProducts() {
  const { data, isLoading } = useQuery(productsQuery());

  return {
    products: data ?? [],
    isLoading,
  };
}

function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <a
      href="#accueil"
      aria-label={`${BRAND_NAME} — Accueil`}
      className={`leading-none ${
        inverse ? "text-primary-foreground" : "text-primary"
      }`}
    >
      <span className="font-display text-2xl font-bold tracking-tight">
        {BRAND_NAME}
      </span>

      <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.28em]">
        {BRAND_SUBTITLE}
      </span>
    </a>
  );
}

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-white/20 bg-background/65 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur-2xl ring-1 ring-white/10">
        <div className="flex h-[72px] items-center justify-between px-4 sm:px-5 lg:px-6">
          <Logo />

          <nav
            aria-label="Navigation principale"
            className="hidden items-center gap-1 rounded-full border border-white/15 bg-background/35 p-1 backdrop-blur-xl lg:flex"
          >
            {navLinks.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="group rounded-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/70 transition-all duration-300 hover:bg-primary/10 hover:text-primary"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <Button
              asChild
              variant="ghost"
              className="h-10 rounded-full border border-transparent px-4 text-foreground/75 hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
            >
              <a href={`tel:${PHONE}`}>
                <Phone />
                <span className="hidden xl:inline">Appeler</span>
              </a>
            </Button>

            <Button
              asChild
              className="h-10 rounded-full border border-primary/30 bg-primary/90 px-5 shadow-[0_8px_25px_-8px_hsl(var(--primary))] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary hover:shadow-[0_12px_30px_-8px_hsl(var(--primary))]"
            >
              <a href={whatsappUrl()} target="_blank" rel="noreferrer">
                <ShoppingBag />
                <span>WhatsApp</span>
              </a>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-full border border-white/15 bg-background/40 backdrop-blur-md hover:bg-primary/10 hover:text-primary lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>

        {open && (
          <div className="border-t border-white/15 bg-background/45 p-3 backdrop-blur-2xl lg:hidden">
            <nav
              aria-label="Navigation mobile"
              className="flex flex-col gap-1 rounded-xl border border-white/15 bg-background/30 p-2"
            >
              {navLinks.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-foreground/75 transition-all hover:bg-primary/10 hover:text-primary"
                >
                  {label}
                </a>
              ))}
            </nav>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-xl border-primary/25 bg-background/35 text-primary backdrop-blur-md hover:bg-primary/10"
              >
                <a href={`tel:${PHONE}`}>
                  <Phone />
                  Appeler
                </a>
              </Button>

              <Button
                asChild
                className="h-11 rounded-xl bg-primary/90 shadow-md"
              >
                <a href={whatsappUrl()} target="_blank" rel="noreferrer">
                  <ShoppingBag />
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function SectionHeading({
  eyebrow,
  title,
  light = false,
}: {
  eyebrow: string;
  title: string;
  light?: boolean;
}) {
  return (
    <div className="reveal mb-10">
      <p
        className={`mb-3 text-xs font-bold uppercase tracking-[0.24em] ${
          light ? "text-gold" : "text-primary"
        }`}
      >
        {eyebrow}
      </p>

      <h2
        className={`max-w-3xl font-display text-4xl font-semibold leading-[1.05] md:text-6xl ${
          light ? "text-primary-foreground" : "text-foreground"
        }`}
      >
        {title}
      </h2>
    </div>
  );
}

function Hero() {
  return (
    <section
      id="accueil"
      className="relative flex min-h-[100svh] items-end overflow-hidden pt-24"
    >
      <img
        src={heroImage}
        width={1920}
        height={1104}
        alt="Produits du terroir ivoirien"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-12 pt-32 lg:px-8 lg:pb-20">
        <div className="max-w-3xl rounded-[2rem] border border-white/20 bg-background/40 p-6 shadow-2xl shadow-deep/10 backdrop-blur-xl sm:p-8 lg:p-10">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-primary">
            {BRAND_NAME} {BRAND_SUBTITLE}
          </p>

          <h1 className="font-display text-5xl font-semibold leading-[0.98] text-foreground sm:text-6xl lg:text-8xl">
            {BRAND_SLOGAN}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-foreground/75 md:text-lg">
            Découvrez une sélection de produits locaux et artisanaux de Côte
            d’Ivoire, choisis avec soin pour leur authenticité et leur qualité.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 px-6 shadow-xl shadow-primary/20"
            >
              <a href="#produits">
                Découvrir nos produits
                <ArrowRight />
              </a>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-primary/40 bg-background/30 px-6 text-primary shadow-lg backdrop-blur-xl hover:bg-primary/10"
            >
              <a href={whatsappUrl()} target="_blank" rel="noreferrer">
                Commander sur WhatsApp
              </a>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {["Produits locaux", "Savoir-faire", "Authenticité"].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-full border border-primary/20 bg-background/35 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-earth backdrop-blur-md"
                >
                  {item}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    "Produits locaux",
    "Authenticité",
    "Savoir-faire",
    "Marché à domicile",
  ];

  return (
    <section
      aria-label="Nos engagements"
      className="relative z-10 bg-primary"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-5 py-4 md:grid-cols-4 lg:px-8">
        {items.map((item, index) => (
          <div
            key={item}
            className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 px-3 py-5 text-center backdrop-blur-md"
          >
            <span className="mb-1 block font-display text-xl text-gold">
              0{index + 1}
            </span>

            <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
              {item}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Universe() {
  return (
    <section
      id="univers"
      className="relative overflow-hidden bg-background py-24 md:py-32"
    >
      <div className="pointer-events-none absolute -left-32 top-20 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 size-72 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div className="reveal rounded-[2rem] border border-primary/10 bg-primary/5 p-7 backdrop-blur-xl md:p-10">
          <p className="font-display text-5xl font-medium leading-tight text-primary md:text-7xl">
            {BRAND_SLOGAN}
          </p>
        </div>

        <div className="reveal rounded-[2rem] border border-border/70 bg-card/50 p-7 shadow-xl backdrop-blur-xl md:p-10">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Notre univers
          </p>

          <h2 className="font-display text-3xl font-semibold leading-tight md:text-5xl">
            Les richesses du terroir ivoirien, autrement présentées.
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
            O’TERROIR by Stéphanie met en lumière des produits locaux et
            artisanaux sélectionnés avec soin. Chaque produit raconte une
            histoire, un savoir-faire et une origine.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: DbProduct }) {
  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/65 shadow-lg shadow-deep/5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-deep/10 reveal">
      <div className="relative h-60 overflow-hidden">
        <MediaImage
          path={product.image_url}
          fallback={assetMap[product.asset_key ?? "hero"]}
          objectPosition={product.image_position}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.06]"
        />

        <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/20 bg-deep/35 px-3 py-2 backdrop-blur-md">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground">
            {product.category}
          </p>
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-display text-3xl font-semibold">
          {product.name}
        </h3>

        <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
          {product.description}
        </p>

        <div className="mt-6 flex items-center justify-between gap-3">
          <strong className="text-sm text-earth">{product.price}</strong>

          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-primary/40 bg-background/30 text-primary backdrop-blur-xl hover:bg-primary/10"
          >
            <a
              href={orderUrl(product.name)}
              target="_blank"
              rel="noreferrer"
            >
              Commander
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}

function Catalogue() {
  const { products, isLoading } = useProducts();
  const [filter, setFilter] = useState("TOUS");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.category)
            .filter(Boolean),
        ),
      ),
    [products],
  );

  const filteredProducts =
    filter === "TOUS"
      ? products
      : products.filter((product) => product.category === filter);

  if (isLoading) {
    return (
      <section
        id="produits"
        className="relative overflow-hidden bg-muted py-24 md:py-32"
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="La sélection"
            title="Nos produits"
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[430px] animate-pulse rounded-[1.5rem] border border-border/60 bg-card/50 backdrop-blur-xl"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section
        id="produits"
        className="relative overflow-hidden bg-muted py-24 md:py-32"
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="La sélection"
            title="Nos produits"
          />

          <div className="rounded-[2rem] border border-border/60 bg-card/50 p-8 text-center shadow-xl backdrop-blur-xl">
            <p className="text-muted-foreground">
              Notre sélection de produits sera bientôt disponible.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="produits"
      className="relative overflow-hidden bg-muted py-24 md:py-32"
    >
      <div className="pointer-events-none absolute right-0 top-20 size-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="La sélection"
          title="Nos produits"
        />

        {categories.length > 0 && (
          <div
            className="mb-10 flex gap-2 overflow-x-auto pb-2"
            role="group"
            aria-label="Filtrer les produits"
          >
            {["TOUS", ...categories].map((category) => (
              <Button
                key={category}
                variant={filter === category ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(category)}
                className={
                  filter === category
                    ? "shrink-0 rounded-full px-4 shadow-lg shadow-primary/15"
                    : "shrink-0 rounded-full border-border/70 bg-background/45 px-4 backdrop-blur-xl"
                }
              >
                {category}
              </Button>
            ))}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedCategory({
  category,
  title,
  description,
  image,
  dark = false,
}: {
  category: string;
  title: string;
  description: string;
  image: string;
  dark?: boolean;
}) {
  const { products } = useProducts();

  const items = products.filter((product) => product.category === category);

  if (items.length === 0) return null;

  return (
    <section
      className={`relative overflow-hidden py-24 md:py-32 ${
        dark ? "bg-deep text-primary-foreground" : "bg-background"
      }`}
    >
      <div className="pointer-events-none absolute -right-32 top-1/3 size-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 lg:grid-cols-2 lg:px-8">
        <div
          className={`overflow-hidden rounded-[2rem] border p-2 shadow-2xl backdrop-blur-xl ${
            dark
              ? "border-primary-foreground/15 bg-primary-foreground/5"
              : "border-border/60 bg-card/40"
          }`}
        >
          <img
            src={image}
            loading="lazy"
            alt={title}
            className="aspect-[4/3] w-full rounded-[1.5rem] object-cover"
          />
        </div>

        <div
          className={`rounded-[2rem] border p-7 shadow-xl backdrop-blur-xl md:p-10 ${
            dark
              ? "border-primary-foreground/15 bg-primary-foreground/5"
              : "border-border/60 bg-card/45"
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            {category}
          </p>

          <h2
            className={`mt-4 font-display text-4xl font-semibold md:text-6xl ${
              dark ? "text-primary-foreground" : "text-foreground"
            }`}
          >
            {title}
          </h2>

          <p
            className={`mt-6 text-base leading-8 ${
              dark
                ? "text-primary-foreground/70"
                : "text-muted-foreground"
            }`}
          >
            {description}
          </p>

          <div
            className={`mt-7 divide-y overflow-hidden rounded-2xl border ${
              dark
                ? "divide-primary-foreground/10 border-primary-foreground/10 bg-primary-foreground/5"
                : "divide-border/60 border-border/60 bg-background/35"
            }`}
          >
            {items.map((product) => (
              <a
                key={product.id}
                href={orderUrl(product.name)}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center justify-between gap-4 px-4 py-4 transition-colors ${
                  dark
                    ? "hover:bg-primary-foreground/5 hover:text-gold"
                    : "hover:bg-primary/5 hover:text-primary"
                }`}
              >
                <span className="font-display text-xl">
                  {product.name}
                </span>

                <span
                  className={`shrink-0 text-xs font-semibold ${
                    dark ? "text-gold" : "text-earth"
                  }`}
                >
                  {product.price}
                </span>
              </a>
            ))}
          </div>

          <Button
            asChild
            className={`mt-7 ${
              dark
                ? "bg-gold text-deep hover:bg-gold/90"
                : ""
            }`}
          >
            <a
              href={whatsappUrl(
                `Bonjour O’TERROIR by Stéphanie 👋 Je souhaite découvrir votre sélection ${category}.`,
              )}
              target="_blank"
              rel="noreferrer"
            >
              Découvrir la sélection
              <ArrowRight />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function HomeMarket() {
  return (
    <section className="relative overflow-hidden bg-gold py-16 text-deep">
      <div className="pointer-events-none absolute -right-20 top-1/2 size-72 -translate-y-1/2 rounded-full bg-background/20 blur-3xl" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 md:flex-row md:items-center lg:px-8">
        <div className="rounded-[1.5rem] border border-deep/10 bg-background/10 p-5 backdrop-blur-md">
          <p className="text-xs font-bold uppercase tracking-[0.24em]">
            Marché à domicile
          </p>

          <h2 className="mt-2 font-display text-4xl font-semibold md:text-5xl">
            Le terroir vient à vous.
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-deep/75">
            Contactez-nous pour connaître les disponibilités, choisir vos
            produits et organiser votre commande.
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
          <Button
            asChild
            className="h-12 bg-deep text-primary-foreground shadow-xl hover:bg-deep/90"
          >
            <a href={whatsappUrl()} target="_blank" rel="noreferrer">
              Écrire sur WhatsApp
            </a>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-12 border-deep/30 bg-background/10 text-deep backdrop-blur-xl hover:bg-deep hover:text-primary-foreground"
          >
            <a href={`tel:${PHONE}`}>
              <Phone />
              Appeler
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function KnowHow() {
  const steps = [
    [
      "Sélection",
      "Choisir des produits locaux pour leur identité et leur qualité.",
    ],
    [
      "Valorisation",
      "Présenter chaque richesse avec soin, justesse et modernité.",
    ],
    [
      "Partage",
      "Faire découvrir le goût du terroir au plus près de vos envies.",
    ],
  ];

  return (
    <section className="relative overflow-hidden bg-background py-24 md:py-32">
      <div className="pointer-events-none absolute bottom-0 left-1/3 size-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Notre savoir-faire"
          title="De l’origine jusqu’à votre table."
        />

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map(([title, text], index) => (
            <div
              key={title}
              className="relative rounded-[1.5rem] border border-border/60 bg-card/45 p-7 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <span className="font-display text-4xl text-gold">
                0{index + 1}
              </span>

              <h3 className="mt-8 text-3xl font-semibold">{title}</h3>

              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  const { data } = useQuery(photosQuery());
  const photos: DbPhoto[] = data ?? [];
  const total = photos.length;
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null || total === 0) return;

    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);

      if (event.key === "ArrowRight") {
        setActive((current) => (current === null ? 0 : (current + 1) % total));
      }

      if (event.key === "ArrowLeft") {
        setActive((current) =>
          current === null ? 0 : (current - 1 + total) % total,
        );
      }
    };

    window.addEventListener("keydown", key);

    return () => window.removeEventListener("keydown", key);
  }, [active, total]);

  if (photos.length === 0) return null;

  const current = active === null ? null : photos[active];

  return (
    <section
      id="galerie"
      className="relative overflow-hidden bg-muted py-24 md:py-32"
    >
      <div className="pointer-events-none absolute -right-32 top-20 size-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Galerie"
          title="Matières, couleurs, origine."
        />

        <div className="grid auto-rows-[220px] grid-cols-2 gap-3 md:auto-rows-[280px] md:grid-cols-4">
          {photos.map((photo, index) => (
            <Button
              variant="ghost"
              key={photo.id}
              onClick={() => setActive(index)}
              aria-label={`Agrandir la photo ${index + 1}`}
              className={`group h-auto overflow-hidden rounded-2xl border border-border/50 bg-card/30 p-1 shadow-lg backdrop-blur-xl ${
                index % 5 === 0
                  ? "col-span-2 row-span-2"
                  : index % 5 === 3
                    ? "col-span-2"
                    : ""
              }`}
            >
              <MediaImage
                path={photo.image_url}
                alt={photo.alt_text}
                className="h-full w-full rounded-xl object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </Button>
          ))}
        </div>
      </div>

      {current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-deep/90 p-4 backdrop-blur-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Galerie plein écran"
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-5 top-5 rounded-xl border border-primary-foreground/10 bg-primary-foreground/10 text-primary-foreground backdrop-blur-xl hover:bg-primary-foreground/20"
            onClick={() => setActive(null)}
            aria-label="Fermer"
          >
            <X />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-3 rounded-xl border border-primary-foreground/10 bg-primary-foreground/10 text-primary-foreground backdrop-blur-xl md:left-8"
            onClick={() =>
              setActive(
                ((active ?? 0) - 1 + total) % total,
              )
            }
            aria-label="Photo précédente"
          >
            <ChevronLeft />
          </Button>

          <div className="max-h-[88vh] max-w-[88vw] rounded-[1.5rem] border border-primary-foreground/15 bg-primary-foreground/5 p-2 shadow-2xl backdrop-blur-xl">
            <MediaImage
              path={current.image_url}
              alt={current.alt_text}
              loading="eager"
              className="max-h-[84vh] max-w-[84vw] rounded-xl object-contain"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 rounded-xl border border-primary-foreground/10 bg-primary-foreground/10 text-primary-foreground backdrop-blur-xl md:right-8"
            onClick={() =>
              setActive(
                ((active ?? 0) + 1) % total,
              )
            }
            aria-label="Photo suivante"
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </section>
  );
}

function VideoPlayer({
  path,
  title,
}: {
  path: string;
  title: string;
}) {
  const url = useMediaUrl(path);
  const isYoutube = /youtu\.be|youtube\.com/i.test(path);
  const isVimeo = /vimeo\.com/i.test(path);

  if (isYoutube) {
    let src = path;

    if (path.includes("youtu.be/")) {
      const id = path.split("youtu.be/")[1]?.split(/[?&]/)[0];
      src = id ? `https://www.youtube.com/embed/${id}` : path;
    } else if (path.includes("watch?v=")) {
      const id = new URL(path).searchParams.get("v");
      src = id ? `https://www.youtube.com/embed/${id}` : path;
    }

    return (
      <div className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-card/30 p-1 shadow-xl backdrop-blur-xl">
        <iframe
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full rounded-xl border-0"
        />
      </div>
    );
  }

  if (isVimeo) {
    const match = path.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    const src = match
      ? `https://player.vimeo.com/video/${match[1]}`
      : path;

    return (
      <div className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-card/30 p-1 shadow-xl backdrop-blur-xl">
        <iframe
          src={src}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full rounded-xl border-0"
        />
      </div>
    );
  }

  if (!url) {
    return (
      <div className="aspect-video w-full animate-pulse rounded-[1.5rem] bg-muted" />
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-card/30 p-1 shadow-xl backdrop-blur-xl">
      <video
        src={url}
        controls
        preload="metadata"
        className="aspect-video w-full rounded-xl bg-deep object-cover"
      />
    </div>
  );
}

function Videos() {
  const { data } = useQuery(videosQuery());

  if (!data || data.length === 0) return null;

  return (
    <section
      id="videos"
      className="relative overflow-hidden bg-background py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading eyebrow="En images" title="Nos vidéos." />

        <div className="grid gap-8 md:grid-cols-2">
          {data.map((video) => (
            <article
              key={video.id}
              className="reveal rounded-[1.5rem] border border-border/60 bg-card/40 p-3 shadow-xl backdrop-blur-xl"
            >
              <VideoPlayer
                path={video.video_url}
                title={video.title}
              />

              <div className="p-3">
                <h3 className="font-display text-2xl font-semibold">
                  {video.title}
                </h3>

                {video.description && (
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {video.description}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Posts() {
  const { data } = useQuery(postsQuery());

  if (!data || data.length === 0) return null;

  return (
    <section
      id="actualites"
      className="relative overflow-hidden bg-muted py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Actualités"
          title="Les nouvelles du terroir."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {data.map((post) => (
            <article
              key={post.id}
              className="group overflow-hidden rounded-[1.5rem] border border-border/60 bg-card/55 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl reveal"
            >
              {post.image_url && (
                <div className="overflow-hidden p-2 pb-0">
                  <MediaImage
                    path={post.image_url}
                    alt={post.title}
                    className="h-52 w-full rounded-xl object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
              )}

              <div className="p-6">
                <time
                  dateTime={post.published_at}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary"
                >
                  {new Date(post.published_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </time>

                <h3 className="mt-2 font-display text-2xl font-semibold">
                  {post.title}
                </h3>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {post.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const parsed = contactSchema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      subject: form.get("subject"),
      message: form.get("message"),
    });

    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ??
          "Vérifiez les informations saisies.",
      );
      return;
    }

    setError("");

    const { name, email, subject, message } = parsed.data;

    window.open(
      whatsappUrl(
        `Bonjour O’TERROIR by Stéphanie 👋\n\nNom : ${name}\nEmail : ${email}\nObjet : ${subject}\nMessage : ${message}`,
      ),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const field =
    "h-12 w-full rounded-xl border border-border/60 bg-background/45 px-4 text-sm outline-none backdrop-blur-xl transition focus:border-primary focus:ring-2 focus:ring-primary/15";

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-background py-24 md:py-32"
    >
      <div className="pointer-events-none absolute left-0 top-1/3 size-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div className="rounded-[2rem] border border-border/60 bg-card/40 p-7 shadow-xl backdrop-blur-xl md:p-9">
          <SectionHeading
            eyebrow="Parlons terroir"
            title="Une question, une commande ?"
          />

          <p className="max-w-md leading-7 text-muted-foreground">
            Écrivez-nous directement ou envoyez votre demande via le
            formulaire. Nous vous répondrons sur WhatsApp.
          </p>

          <div className="mt-9 space-y-4">
            <a
              href={`tel:${PHONE}`}
              className="flex items-center gap-4 rounded-xl border border-border/50 bg-background/35 p-3 text-sm font-semibold backdrop-blur-xl transition hover:border-primary/30 hover:bg-primary/5"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-primary">
                <Phone className="size-4" />
              </span>
              +225 07 49 93 92 67
            </a>

            <a
              href={`mailto:${EMAIL}`}
              className="flex items-center gap-4 rounded-xl border border-border/50 bg-background/35 p-3 text-sm font-semibold backdrop-blur-xl transition hover:border-primary/30 hover:bg-primary/5"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-primary">
                <Mail className="size-4" />
              </span>
              {EMAIL}
            </a>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="grid gap-5 rounded-[2rem] border border-border/60 bg-muted/45 p-6 shadow-2xl backdrop-blur-2xl md:grid-cols-2 md:p-9"
        >
          <label className="text-xs font-bold uppercase tracking-wider">
            Nom
            <input
              name="name"
              maxLength={80}
              required
              className={`${field} mt-2`}
            />
          </label>

          <label className="text-xs font-bold uppercase tracking-wider">
            Email
            <input
              name="email"
              type="email"
              maxLength={120}
              required
              className={`${field} mt-2`}
            />
          </label>

          <label className="text-xs font-bold uppercase tracking-wider md:col-span-2">
            Objet
            <input
              name="subject"
              maxLength={100}
              required
              className={`${field} mt-2`}
            />
          </label>

          <label className="text-xs font-bold uppercase tracking-wider md:col-span-2">
            Message
            <textarea
              name="message"
              maxLength={800}
              required
              rows={5}
              className={`${field} mt-2 h-auto py-3`}
            />
          </label>

          {error && (
            <p
              className="text-sm text-destructive md:col-span-2"
              role="alert"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="h-12 shadow-lg shadow-primary/15 md:col-span-2"
          >
            Envoyer sur WhatsApp
            <ArrowRight />
          </Button>
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative overflow-hidden bg-deep text-primary-foreground">
      <div className="pointer-events-none absolute right-0 top-0 size-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-14 md:grid-cols-3 lg:px-8">
        <div className="rounded-[1.5rem] border border-primary-foreground/10 bg-primary-foreground/5 p-6 backdrop-blur-xl">
          <Logo inverse />

          <p className="mt-5 max-w-xs text-sm leading-6 text-primary-foreground/55">
            {BRAND_SLOGAN}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-primary-foreground/10 bg-primary-foreground/5 p-6 backdrop-blur-xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold">
            Explorer
          </p>

          {navLinks.slice(1).map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="mb-2 block text-sm text-primary-foreground/65 transition-colors hover:text-gold"
            >
              {label}
            </a>
          ))}

          <Link
            to="/admin"
            className="mt-2 block text-sm text-primary-foreground/45 transition-colors hover:text-gold"
          >
            Espace administration
          </Link>
        </div>

        <div className="rounded-[1.5rem] border border-primary-foreground/10 bg-primary-foreground/5 p-6 backdrop-blur-xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold">
            Nous contacter
          </p>

          <a
            href={`tel:${PHONE}`}
            className="mb-2 block text-sm text-primary-foreground/65 transition-colors hover:text-gold"
          >
            +225 07 49 93 92 67
          </a>

          <a
            href={`mailto:${EMAIL}`}
            className="block text-sm text-primary-foreground/65 transition-colors hover:text-gold"
          >
            {EMAIL}
          </a>
        </div>
      </div>

      <div className="relative border-t border-primary-foreground/10 px-5 py-5 text-center text-[11px] text-primary-foreground/45">
        © 2026 {BRAND_NAME} {BRAND_SUBTITLE}. Tous droits réservés.
      </div>
    </footer>
  );
}

function HomePage() {
  return (
    <div className="overflow-x-clip bg-background">
      <Header />

      <main>
        <Hero />
        <TrustBar />
        <Universe />
        <Catalogue />

        <FeaturedCategory
          category="RIZ LOCAL"
          title="La collection Riz Local"
          description="Une sélection de riz locaux présentés selon les disponibilités réelles de notre catalogue."
          image={riceImage}
        />

        <FeaturedCategory
          category="MAÏS"
          title="Maïs"
          description="Découvrez notre sélection autour du maïs et des produits qui en sont issus."
          image={cornImage}
        />

        <FeaturedCategory
          category="LIQUEURS"
          title="Liqueurs"
          description="Découvrez les créations artisanales disponibles dans notre catalogue."
          image={liqueurImage}
          dark
        />

        <HomeMarket />
        <KnowHow />
        <Gallery />
        <Videos />
        <Posts />
        <Contact />
      </main>

      <Footer />

      <a
        href={whatsappUrl()}
        target="_blank"
        rel="noreferrer"
        aria-label="Contacter O’TERROIR sur WhatsApp"
        className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full border border-primary-foreground/20 bg-primary text-primary-foreground shadow-2xl shadow-primary/25 transition-all duration-300 hover:-translate-y-1 hover:scale-105"
      >
        <Sparkles className="size-6" />
      </a>

      <ChatWidget />
    </div>
  );
}
