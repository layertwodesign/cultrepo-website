import { getImageProps } from "next/image";

/**
 * Serve CMS video posters through the same image optimizer/CDN as other site
 * images. Native <video poster> has no srcset, so select the correctly sized
 * 1x candidate rather than the default 2x URL. Shared with server preloads to
 * avoid duplicate requests. Local and non-CMS URLs retain their existing path.
 */
export function videoPoster(url: string | null | undefined, width: number): string | undefined {
  if (!url) return undefined;
  if (!/^https:\/\/[\w-]+\.graphassets\.com\//.test(url)) return url;
  const { props } = getImageProps({
    src: url,
    alt: "",
    width,
    height: Math.round(width * 9 / 16),
  });
  return props.srcSet?.split(", ")[0]?.split(" ")[0] ?? props.src;
}
