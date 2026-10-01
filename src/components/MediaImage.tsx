import { useMediaUrl } from "@/lib/media";

type Props = {
  path?: string | null | undefined;
  fallback?: string | undefined;
  alt: string;
  className?: string | undefined;
  objectPosition?: string | null | undefined;
  loading?: "lazy" | "eager" | undefined;
  width?: number | undefined;
  height?: number | undefined;
};

export function MediaImage({
  path,
  fallback,
  alt,
  className,
  objectPosition,
  loading = "lazy",
  width,
  height,
}: Props) {
  const resolved = useMediaUrl(path);
  const src = resolved ?? fallback;

  if (!src) {
    return (
      <div
        className={`bg-muted/70 ${className ?? ""}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      width={width}
      height={height}
      className={`block ${className ?? ""}`}
      style={objectPosition ? { objectPosition } : undefined}
    />
  );
}
