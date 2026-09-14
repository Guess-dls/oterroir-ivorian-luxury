import { useMediaUrl } from "@/lib/media";

type Props = {
  path?: string | null;
  fallback?: string;
  alt: string;
  className?: string;
  objectPosition?: string | null;
  loading?: "lazy" | "eager";
  width?: number;
  height?: number;
};

export function MediaImage({ path, fallback, alt, className, objectPosition, loading = "lazy", width, height }: Props) {
  const resolved = useMediaUrl(path);
  const src = resolved ?? fallback;

  if (!src) {
    return <div className={`bg-muted ${className ?? ""}`} aria-hidden="true" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      width={width}
      height={height}
      className={className}
      style={objectPosition ? { objectPosition } : undefined}
    />
  );
}
