import { useEffect, useState } from 'react';
import { fileUrl } from './fileStore';

/** Resolves `{ url }` or `{ fileId }` (prototype uploads in IndexedDB) to a usable URL. */
export function useFileUrl(ref: { url?: string; fileId?: string } | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(ref?.url ?? null);
  useEffect(() => {
    let alive = true;
    if (ref?.url) setUrl(ref.url);
    else if (ref?.fileId) fileUrl(ref.fileId).then((u) => alive && setUrl(u), () => alive && setUrl(null));
    else setUrl(null);
    return () => {
      alive = false;
    };
  }, [ref?.url, ref?.fileId]);
  return url;
}
