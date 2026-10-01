import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DbProduct = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  image_url: string | null;
  asset_key: string | null;
  image_position: string | null;
  sort_order: number;
  is_visible: boolean;
};

export type DbPhoto = {
  id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
  is_visible: boolean;
};

export type DbVideo = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  sort_order: number;
  is_visible: boolean;
};

export type DbPost = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  is_published: boolean;
  published_at: string;
};

export const productsQuery = (adminView = false) =>
  queryOptions({
    queryKey: ["products", adminView],
    queryFn: async (): Promise<DbProduct[]> => {
      let request = supabase
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true });

      if (!adminView) request = request.eq("is_visible", true);

      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as DbProduct[];
    },
  });

export const photosQuery = (adminView = false) =>
  queryOptions({
    queryKey: ["gallery_photos", adminView],
    queryFn: async (): Promise<DbPhoto[]> => {
      let request = supabase
        .from("gallery_photos")
        .select("*")
        .order("sort_order", { ascending: true });

      if (!adminView) request = request.eq("is_visible", true);

      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as DbPhoto[];
    },
  });

export const videosQuery = (adminView = false) =>
  queryOptions({
    queryKey: ["videos", adminView],
    queryFn: async (): Promise<DbVideo[]> => {
      let request = supabase
        .from("videos")
        .select("*")
        .order("sort_order", { ascending: true });

      if (!adminView) request = request.eq("is_visible", true);

      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as DbVideo[];
    },
  });

export const postsQuery = (adminView = false) =>
  queryOptions({
    queryKey: ["posts", adminView],
    queryFn: async (): Promise<DbPost[]> => {
      let request = supabase
        .from("posts")
        .select("*")
        .order("published_at", { ascending: false });

      if (!adminView) request = request.eq("is_published", true);

      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as DbPost[];
    },
  });
