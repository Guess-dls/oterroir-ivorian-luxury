import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Espace administration | O’TERROIR" },
      { name: "description", content: "Connexion à l’espace d’administration du site O’TERROIR by Stéphanie." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Espace administration O’TERROIR" },
      { property: "og:description", content: "Accès réservé à la gestion des produits, photos, vidéos et publications." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Compte créé. Vérifiez votre email pour confirmer votre adresse.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      await supabase.rpc("claim_admin");
      navigate({ to: "/admin", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-muted px-5 py-16">
      <div className="w-full max-w-md rounded-sm border border-border bg-background p-8">
        <Link to="/" className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          ← Retour au site
        </Link>
        <h1 className="mt-6 font-display text-4xl font-semibold">Espace administration</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin" ? "Connectez-vous pour gérer vos contenus." : "Créez votre compte administrateur."}
        </p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>
          <Button type="submit" className="h-12 w-full" disabled={loading}>
            {loading ? "Un instant…" : mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 text-sm text-primary underline"
        >
          {mode === "signin" ? "Première connexion ? Créer mon compte" : "J’ai déjà un compte"}
        </button>
      </div>
    </div>
  );
}
