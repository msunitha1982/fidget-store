// Stores uploaded files (STL models, photos) in IndexedDB so the prototype admin works
// without a backend. A real backend would return URLs instead; ModelSource / ProductImage
// accept either `url` or `fileId`.

const DB = 'fidget-store-files';
const STORE = 'files';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putFile(id: string, file: Blob) {
  await tx('readwrite', (s) => s.put(file, id));
}

export async function getFile(id: string): Promise<Blob | undefined> {
  return tx('readonly', (s) => s.get(id) as IDBRequest<Blob | undefined>);
}

export async function clearFiles() {
  await tx('readwrite', (s) => s.clear());
}

const urlCache = new Map<string, Promise<string>>();

/** Resolves a stored file to an object URL (cached per id). */
export function fileUrl(id: string): Promise<string> {
  let p = urlCache.get(id);
  if (!p) {
    p = getFile(id).then((blob) => {
      if (!blob) throw new Error('File not found');
      return URL.createObjectURL(blob);
    });
    p.catch(() => urlCache.delete(id));
    urlCache.set(id, p);
  }
  return p;
}
