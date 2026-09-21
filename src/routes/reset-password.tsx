import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe | O’TERROIR" },
      { name: "description", content: "Définir un nouveau mot de passe pour l’espace d’administration O’TERROIR by Stéphanie." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Nouveau mot de passe O’TERROIR" },
      { property: "og:description", content: "Réinitialisation du mot de passe administrateur." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Mot de passe mis à jour.");
      navigate({ to: "/admin", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Mise à jour impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-muted px-5 py-16">
      <div className="w-full max-w-md rounded-sm border border-border bg-background p-8">
        <Link to="/auth" className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          ← Retour à la connexion
        </Link>
        <h1 className="mt-6 font-display text-4xl font-semibold">Nouveau mot de passe</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ouvrez cette page depuis le lien reçu par email, puis choisissez votre nouveau mot de passe.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="new-password">Mot de passe</Label>
            <Input
              id="new-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="h-12 w-full" disabled={loading}>
            {loading ? "Un instant…" : "Enregistrer le mot de passe"}
          </Button>
        </form>
      </div>
    </div>
  );
}
