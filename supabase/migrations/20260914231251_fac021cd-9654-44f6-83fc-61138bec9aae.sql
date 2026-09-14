CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can read their own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing int;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT count(*) INTO existing FROM public.user_roles WHERE role = 'admin';
  IF existing > 0 THEN RETURN public.has_role(auth.uid(), 'admin'); END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin')
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'PRODUITS DU TERROIR',
  description text NOT NULL DEFAULT '',
  price text NOT NULL DEFAULT 'Prix sur demande',
  image_url text,
  asset_key text,
  image_position text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visible products" ON public.products FOR SELECT USING (is_visible);
CREATE POLICY "Admins can view all products" ON public.products FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  alt_text text NOT NULL DEFAULT 'Photo O''TERROIR',
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_photos TO authenticated;
GRANT ALL ON public.gallery_photos TO service_role;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visible photos" ON public.gallery_photos FOR SELECT USING (is_visible);
CREATE POLICY "Admins can view all photos" ON public.gallery_photos FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage photos" ON public.gallery_photos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER gallery_photos_touch BEFORE UPDATE ON public.gallery_photos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  video_url text NOT NULL,
  thumbnail_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visible videos" ON public.videos FOR SELECT USING (is_visible);
CREATE POLICY "Admins can view all videos" ON public.videos FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage videos" ON public.videos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER videos_touch BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  image_url text,
  is_published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published posts" ON public.posts FOR SELECT USING (is_published);
CREATE POLICY "Admins can view all posts" ON public.posts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage posts" ON public.posts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER posts_touch BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.products (name, category, description, price, asset_key, image_position, sort_order) VALUES
('Riz Danané', 'RIZ LOCAL', 'Un riz local délicat, sélectionné pour son grain et son authenticité.', '3 500 FCFA · 5 kg', 'rice', '18% 20%', 10),
('Riz C10', 'RIZ LOCAL', 'Une variété ivoirienne polyvalente pour les recettes du quotidien.', '4 000 FCFA · 5 kg', 'rice', '50% 18%', 20),
('Riz rouge', 'RIZ LOCAL', 'Un grain rouge au caractère généreux et à la présence singulière.', '4 500 FCFA · 5 kg', 'rice', '84% 20%', 30),
('Riz violet', 'RIZ LOCAL', 'Une variété rare à la couleur profonde, pour une table remarquable.', '5 500 FCFA · 5 kg', 'rice', '18% 78%', 40),
('Riz brun', 'RIZ LOCAL', 'Un riz complet à la texture authentique, simplement valorisé.', '5 500 FCFA · 5 kg', 'rice', '50% 76%', 50),
('Riz noir', 'RIZ LOCAL', 'Un riz intense et élégant qui sublime les assiettes créatives.', '6 000 FCFA · 5 kg', 'rice', '84% 78%', 60),
('Poudre de maïs violet', 'MAÏS', 'Une poudre locale fine, authentique et inspirante en cuisine.', 'Prix sur demande', 'corn', NULL, 70),
('Cola de gorille', 'PRODUITS DU TERROIR', 'Une découverte traditionnelle issue de la richesse de notre terroir.', 'Prix sur demande', 'hero', '88% 60%', 80),
('Liqueur de bissap', 'LIQUEURS', 'Une création artisanale aux notes florales et à la robe rubis.', 'Prix sur demande', 'liqueur', '14% 45%', 90),
('Liqueur de tomi', 'LIQUEURS', 'Une expression originale et raffinée du fruit local.', 'Prix sur demande', 'liqueur', '39% 45%', 100),
('Liqueur de baobab', 'LIQUEURS', 'Une liqueur artisanale douce et singulière.', 'Prix sur demande', 'liqueur', '61% 45%', 110),
('Gingembre & herbes', 'LIQUEURS', 'Une composition vive aux herbes aromatiques soigneusement choisies.', 'Prix sur demande', 'liqueur', '40% 55%', 120),
('Liqueur aphrodisiaque', 'LIQUEURS', 'Une recette artisanale de caractère, réservée aux adultes.', '10 000 FCFA', 'liqueur', '88% 45%', 130),
('Liqueur digestive', 'LIQUEURS', 'Une création aromatique artisanale, réservée aux adultes.', '5 000 FCFA', 'liqueur', '67% 48%', 140);