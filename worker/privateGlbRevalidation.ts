// Browser revalidation for authenticated viewer GLB downloads.
//
// The viewer GLBs are pinned by SHA-256, so the digest is a strong validator.
// `private, no-cache` lets only the signed-in viewer's own browser keep a copy
// (never a shared cache) and forces a revalidation on every use: Access still
// authenticates each request, and an unchanged model answers 304 without
// re-downloading the bytes. A changed model gets a new ETag and full body.

const SHA256_HEX = /^[0-9a-f]{64}$/;

export const PRIVATE_GLB_REVALIDATE_CACHE_CONTROL = 'private, no-cache';

export const privateGlbEtag = (sha256: string | undefined | null): string | null => {
  const normalized = sha256?.trim().toLowerCase() ?? '';
  return SHA256_HEX.test(normalized) ? `"sha256-${normalized}"` : null;
};

const opaqueTag = (value: string) => value.trim().replace(/^W\//i, '');

/** RFC 9110 If-None-Match (weak comparison) against one strong ETag. */
export const privateGlbIfNoneMatchHits = (request: Request, etag: string) => {
  const header = request.headers.get('If-None-Match');
  if (!header) return false;
  if (header.trim() === '*') return true;
  const target = opaqueTag(etag);
  return header.split(',').some((candidate) => opaqueTag(candidate) === target);
};

export const applyPrivateGlbRevalidation = (headers: Headers, etag: string) => {
  headers.set('Cache-Control', PRIVATE_GLB_REVALIDATE_CACHE_CONTROL);
  headers.set('ETag', etag);
};

/** 304 for an already-authenticated GET/HEAD whose cached copy is still current. */
export const privateGlbNotModified = (baseHeaders: Headers, etag: string, body?: ReadableStream | null) => {
  if (body) void body.cancel().catch(() => undefined);
  const headers = new Headers();
  for (const name of ['Referrer-Policy', 'X-Content-Type-Options', 'X-Robots-Tag']) {
    const value = baseHeaders.get(name);
    if (value) headers.set(name, value);
  }
  applyPrivateGlbRevalidation(headers, etag);
  return new Response(null, { status: 304, headers });
};
