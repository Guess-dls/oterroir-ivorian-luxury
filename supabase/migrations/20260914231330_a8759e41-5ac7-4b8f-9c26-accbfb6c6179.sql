CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM public;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY "Admins can read all roles" ON public.user_roles;
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY "Admins can view all products" ON public.products;
DROP POLICY "Admins can manage products" ON public.products;
CREATE POLICY "Admins can view all products" ON public.products FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "Admins can view all photos" ON public.gallery_photos;
DROP POLICY "Admins can manage photos" ON public.gallery_photos;
CREATE POLICY "Admins can view all photos" ON public.gallery_photos FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage photos" ON public.gallery_photos FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "Admins can view all videos" ON public.videos;
DROP POLICY "Admins can manage videos" ON public.videos;
CREATE POLICY "Admins can view all videos" ON public.videos FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage videos" ON public.videos FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "Admins can view all posts" ON public.posts;
DROP POLICY "Admins can manage posts" ON public.posts;
CREATE POLICY "Admins can view all posts" ON public.posts FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage posts" ON public.posts FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing int;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT count(*) INTO existing FROM public.user_roles WHERE role = 'admin';
  IF existing > 0 THEN RETURN private.has_role(auth.uid(), 'admin'); END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.claim_admin() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;

CREATE POLICY "Anyone can read media files" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Admins can upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND private.has_role(auth.uid(), 'admin'));