import {
  placementG2DocumentId,
} from './privateModelReviewPlacementG2Context';
import type {
  NativePlacementG2Document,
  TrustedNativeG2WritePorts,
} from './privateModelReviewPlacementG2Persistence';

/**
 * Trusted SERVER-ONLY Google Docs API transport for the existing G2 document.
 * Credentials must come from a private server secret, never from the viewer.
 * This module deliberately exposes NO HTTP route or user-facing release gate.
 * Grant this service account access only to the existing G2 document.
 */
export type NativeG2ServiceAccount = {
  clientEmail: string;
  privateKeyPem: string;
};

export type NativeG2GoogleDocsOptions = {
  credentials: NativeG2ServiceAccount;
  fetcher?: typeof fetch;
  now?: () => number;
};

const documentUrl = 'https://docs.googleapis.com/v1/documents/' + encodeURIComponent(placementG2DocumentId);
const oauthUrl = 'https://oauth2.googleapis.com/token';
const docsScope = 'https://www.googleapis.com/auth/documents';
const serviceAccountPattern = /^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/;

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const encodeJson = (data: unknown): string =>
  toBase64Url(new TextEncoder().encode(JSON.stringify(data)));

const privateKeyBytes = (pem: string): Uint8Array => {
  if (
    !pem.startsWith('-----BEGIN PRIVATE KEY-----') ||
    !pem.endsWith('-----END PRIVATE KEY-----')
  ) throw new Error('G2_OAUTH_CREDENTIALS_MISSING');
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  try {
    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  } catch {
    throw new Error('G2_OAUTH_CREDENTIALS_INVALID');
  }
};

const validateServiceAccount = (value: NativeG2ServiceAccount | null | undefined): NativeG2ServiceAccount => {
  if (
    !value ||
    typeof value.clientEmail !== 'string' ||
    !serviceAccountPattern.test(value.clientEmail) ||
    typeof value.privateKeyPem !== 'string' ||
    !value.privateKeyPem.trim()
  ) throw new Error('G2_OAUTH_CREDENTIALS_MISSING');
  return value;
};

/**
 * Validate the complete single-paragraph append envelope, not just its prefix.
 * The native Docs transport is a second fail-closed boundary; the persistence
 * adapter separately proves target provenance and durable readback.
 */
const isScopedG2ObservationAppend = (text: unknown, revision: string): boolean => {
  if (typeof text !== 'string' || text.length > 32768) return false;
  const match = /^\nP137E_G2_REVIEW_OBSERVATION_V1 \| (P137E_G2_[A-Za-z0-9_-]{12,64}) \| (\{[^\r\n]*\})\n$/.exec(text);
  if (!match) return false;
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[2]);
  } catch {
    return false;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
  const record = parsed as Record<string, unknown>;
  const payload = record.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const review = payload as Record<string, unknown>;
  const anchor = review.anchor;
  if (!anchor || typeof anchor !== 'object' || Array.isArray(anchor)) return false;
  const target = anchor as Record<string, unknown>;
  return record.schema === 'P137E_G2_REVIEW_OBSERVATION_V1' &&
    record.recordId === match[1] &&
    record.sourceDocumentId === placementG2DocumentId &&
    record.sourceRevision === revision &&
    review.kind === 'P137E_G2_REVIEW_OBSERVATION' &&
    review.stage === 'WORK_TEST_ONLY' &&
    review.persisted === false &&
    review.humanReview === 'NOT_RUN' &&
    review.currentGeometry === false &&
    review.canonical === false &&
    review.asBuilt === false &&
    target.apartment === 'D' &&
    (target.floor === '1F' || target.floor === '2F') &&
    target.coordinateFrame === 'YLIS-G1-LOCAL' &&
    typeof target.targetId === 'string' && !!target.targetId.trim() &&
    Number.isFinite(target.xM) && Number.isFinite(target.yM) &&
    target.exactXY === false &&
    target.currentGeometry === false &&
    target.canonical === false &&
    target.asBuilt === false;
};

export const createNativeG2GoogleDocsPorts = (
  { credentials, fetcher = fetch, now = Date.now }: NativeG2GoogleDocsOptions,
): TrustedNativeG2WritePorts => {
  const accessToken = async (): Promise<string> => {
    const account = validateServiceAccount(credentials);
    const seconds = Math.floor(now() / 1000);
    if (!Number.isSafeInteger(seconds) || seconds <= 0) {
      throw new Error('G2_OAUTH_CLOCK_INVALID');
    }

    const header = encodeJson({ alg: 'RS256', typ: 'JWT' });
    const claims = encodeJson({
      iss: account.clientEmail,
      scope: docsScope,
      aud: oauthUrl,
      iat: seconds,
      exp: seconds + 600,
    });
    const unsigned = header + '.' + claims;
    let signature: ArrayBuffer;
    try {
      const keyBytes = privateKeyBytes(account.privateKeyPem);
      const key = await crypto.subtle.importKey(
        'pkcs8',
        new Uint8Array(keyBytes).buffer,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign'],
      );
      signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned),
      );
    } catch {
      throw new Error('G2_OAUTH_SIGNING_FAILED');
    }

    const assertion = unsigned + '.' + toBase64Url(new Uint8Array(signature));
    const response = await fetcher(oauthUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });
    if (!response.ok) throw new Error('G2_OAUTH_TOKEN_FAILED');

    let tokenResponse: unknown;
    try {
      tokenResponse = await response.json();
    } catch {
      throw new Error('G2_OAUTH_TOKEN_INVALID');
    }
    const token = tokenResponse as { access_token?: unknown; token_type?: unknown };
    if (
      typeof token?.access_token !== 'string' ||
      !token.access_token.trim() ||
      token.token_type !== 'Bearer'
    ) throw new Error('G2_OAUTH_TOKEN_INVALID');
    return token.access_token;
  };

  const getDocument: TrustedNativeG2WritePorts['getDocument'] = async () => {
    const bearer = await accessToken();
    const response = await fetcher(documentUrl + '?includeTabsContent=true', {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + bearer, Accept: 'application/json', 'Cache-Control': 'no-store' },
    });
    if (!response.ok) throw new Error('G2_NATIVE_READ_FAILED');

    let document: unknown;
    try {
      document = await response.json();
    } catch {
      throw new Error('G2_NATIVE_READ_INVALID');
    }
    const source = document as NativePlacementG2Document | null;
    const tab = source?.tabs?.[0];
    if (
      source?.documentId !== placementG2DocumentId ||
      typeof source.revisionId !== 'string' || !source.revisionId.trim() ||
      !Array.isArray(source.tabs) || source.tabs.length !== 1 ||
      typeof tab?.tabProperties?.tabId !== 'string' ||
      !tab.tabProperties.tabId.trim() ||
      !Array.isArray(tab.documentTab?.body?.content)
    ) return null;
    return source;
  };

  const batchUpdateDocument: TrustedNativeG2WritePorts['batchUpdateDocument'] = async (request) => {
    const [item] = request.requests ?? [];
    const text = item?.insertText?.text;
    if (
      request.documentId !== placementG2DocumentId ||
      !Array.isArray(request.requests) || request.requests.length !== 1 ||
      typeof request.writeControl?.requiredRevisionId !== 'string' ||
      !request.writeControl.requiredRevisionId.trim() ||
      typeof item?.insertText?.endOfSegmentLocation?.tabId !== 'string' ||
      !item.insertText.endOfSegmentLocation.tabId.trim() ||
      !isScopedG2ObservationAppend(text, request.writeControl.requiredRevisionId)
    ) throw new Error('G2_NATIVE_WRITE_SCOPE_DENIED');

    const bearer = await accessToken();
    const response = await fetcher(documentUrl + ':batchUpdate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + bearer,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('G2_NATIVE_WRITE_FAILED');
    // Only the separate getDocument/readRecord comparison can prove persistence.
    return undefined;
  };

  const nextRecordId = () => 'P137E_G2_' + crypto.randomUUID().replace(/-/g, '');

  return { getDocument, batchUpdateDocument, nextRecordId };
};
