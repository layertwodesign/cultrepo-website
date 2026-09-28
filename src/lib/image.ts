/**
 * Resized WebP for a Hygraph asset URL (https://<region>.graphassets.com/<env>/<handle>),
 * for places next/image can't reach, like a <video poster>. fit:max never upscales.
 * Any other URL (local /public files, other hosts) is returned unchanged.
 */
export function hygraphImage(url: string | null | undefined, width: number): string | undefined {
  if (!url) return undefined;
  const match = url.match(/^(https:\/\/[\w-]+\.graphassets\.com\/\w+)\/(\w+)$/);
  if (!match) return url;
  return `${match[1]}/resize=fit:max,width:${width}/output=format:webp/quality=value:75/${match[2]}`;
}
