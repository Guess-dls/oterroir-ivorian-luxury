import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import heroImage from "@/assets/oterroir-hero.jpg";
import riceImage from "@/assets/riz-collection.jpg";
import cornImage from "@/assets/mais-violet.jpg";
import liqueurImage from "@/assets/liqueurs.jpg";

export const assetMap: Record<string, string> = {
  hero: heroImage,
  rice: riceImage,
  corn: cornImage,
  liqueur: liqueurImage,
};

export const BUCKET = "media";

const isExternal = (value: string) =>
  /^https?:\/\//i.test(value) || value.startsWith("/") || value.startsWith("data:");

const cache = new Map<string, string>();

export async function resolveMediaUrl(path?: string | null): Promise<string | null> {
  if (!path) return null;
  if (isExternal(path)) return path;

  const cached = cache.get(path);
  if (cached) return cached;

  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  if (data?.signedUrl) {
    cache.set(path, data.signedUrl);
    return data.signedUrl;
  }

  return null;
}

export function useMediaUrl(path?: string | null): string | null {
  const [url, setUrl] = useState<string | null>(() =>
    path && isExternal(path) ? path : null,
  );

  useEffect(() => {
    let active = true;

    if (!path) {
      setUrl(null);
      return;
    }

    if (isExternal(path)) {
      setUrl(path);
      return;
    }

    resolveMediaUrl(path).then((value) => {
      if (active) setUrl(value);
    });

    return () => {
      active = false;
    };
  }, [path]);

  return url;
}

export const IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp";
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function validateImageFile(file: File) {
  if (!IMAGE_TYPES.includes(file.type.toLowerCase())) {
    throw new Error(
      `« ${file.name} » : format non pris en charge (JPG, PNG ou WebP uniquement).`,
    );
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`« ${file.name} » est trop volumineuse (8 Mo maximum).`);
  }
}

export async function uploadMedia(file: File, folder: string): Promise<string> {
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()
    : "bin";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600" });

  if (error) throw error;
  return path;
}

export async function removeMedia(path?: string | null) {
  if (!path || isExternal(path)) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
