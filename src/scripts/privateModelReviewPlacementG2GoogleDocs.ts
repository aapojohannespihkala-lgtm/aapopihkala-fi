import {
  placementG2DocumentId,
} from './privateModelReviewPlacementG2Context';
import { readNativeG2CurrentPlacementTargets } from './privateModelReviewPlacementG2CurrentCombined';

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
  /** Restrict the reader to Docs GET scope, including when write ports exist in the factory. */
  readOnly?: boolean;
  /** Total time for each OAuth/Docs response, including its JSON body. */
  requestTimeoutMs?: number;
};

const documentUrl = 'https://docs.googleapis.com/v1/documents/' + encodeURIComponent(placementG2DocumentId);
const oauthUrl = 'https://oauth2.googleapis.com/token';
const docsScope = 'https://www.googleapis.com/auth/documents';
const docsReadOnlyScope = 'https://www.googleapis.com/auth/documents.readonly';
const serviceAccountPattern = /^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/;

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const encodeJson = (data: unknown): string =>
  toBase64Url(new TextEncoder().encode(JSON.stringify(data)));

const privateKeyBytes = (pem: string): Uint8Array => {
  const normalizedPem = pem.trim();
  if (
    !normalizedPem.startsWith('-----BEGIN PRIVATE KEY-----') ||
    !normalizedPem.endsWith('-----END PRIVATE KEY-----')
  ) throw new Error('G2_OAUTH_CREDENTIALS_MISSING');
  const base64 = normalizedPem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
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

export const createNativeG2GoogleDocsPorts = (
  { credentials, fetcher = fetch, now = Date.now, readOnly = false, requestTimeoutMs = 15000 }: NativeG2GoogleDocsOptions,
): TrustedNativeG2WritePorts => {
  if (
    !Number.isSafeInteger(requestTimeoutMs) ||
    requestTimeoutMs <= 0 || requestTimeoutMs > 15000
  ) throw new Error('G2_NATIVE_TIMEOUT_INVALID');

  // The deadline covers headers AND body. Never retry a timed-out write: the
  // independent revision/readback contract must decide whether it persisted.
  const requestResponse = async (
    input: string,
    init: RequestInit,
    failed: string,
    invalid?: string,
  ): Promise<unknown> => {
    const controller = new AbortController();
    let response: Response | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const operation = (async () => {
      try {
        response = await fetcher(input, { ...init, signal: controller.signal });
      } catch {
        // A thrown fetch error may contain upstream URLs, tokens or runtime details.
        // Disclose only the fixed request stage. Never retry a G2 write: an
        // upstream POST might have committed even when the response was lost.
        if (controller.signal.aborted) throw new Error('G2_NATIVE_REQUEST_TIMEOUT');
        const code = input === oauthUrl ? 'G2_OAUTH_TOKEN_TRANSPORT_FAILED'
          : init.method === 'GET' ? 'G2_NATIVE_READ_TRANSPORT_FAILED'
          : 'G2_NATIVE_WRITE_TRANSPORT_FAILED';
        throw new Error(code);
      }
      if (controller.signal.aborted) throw new Error('G2_NATIVE_REQUEST_TIMEOUT');
      // Some Worker runtimes throw before I/O for redirect: 'error'. A
      // manual policy is portable but must never follow an OAuth or Docs
      // redirect, especially one carrying a signed JWT or Bearer token.
      if (response.type === 'opaqueredirect' ||
          (response.status >= 300 && response.status < 400)) {
        throw new Error(failed);
      }
      if (!response.ok) throw new Error(failed);
      if (invalid === undefined) return undefined;
      try { return await response.json(); }
      catch { throw new Error(invalid); }
    })();
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error('G2_NATIVE_REQUEST_TIMEOUT'));
        controller.abort();
      }, requestTimeoutMs);
    });
    try { return await Promise.race([operation, deadline]); }
    finally {
      clearTimeout(timer);
      controller.abort();
      // A body cancelled by the native fetch signal may already be locked.
      // Best-effort cleanup must not extend the request's deadline.
      if (response?.body && !response.body.locked) {
        void response.body.cancel().catch(() => undefined);
      }
    }
  };

  const accessToken = async (): Promise<string> => {
    const account = validateServiceAccount(credentials);
    const seconds = Math.floor(now() / 1000);
    if (!Number.isSafeInteger(seconds) || seconds <= 0) {
      throw new Error('G2_OAUTH_CLOCK_INVALID');
    }

    const header = encodeJson({ alg: 'RS256', typ: 'JWT' });
    const claims = encodeJson({
      iss: account.clientEmail,
      scope: readOnly ? docsReadOnlyScope : docsScope,
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
    const tokenResponse = await requestResponse(oauthUrl, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    }, 'G2_OAUTH_TOKEN_FAILED', 'G2_OAUTH_TOKEN_INVALID');
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
    const document = await requestResponse(documentUrl + '?includeTabsContent=true', {
      method: 'GET',
      redirect: 'manual',
      headers: { Authorization: 'Bearer ' + bearer, Accept: 'application/json', 'Cache-Control': 'no-store' },
    }, 'G2_NATIVE_READ_FAILED', 'G2_NATIVE_READ_INVALID');
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
    // No write JWT or HTTP request may be issued by a read-only transport.
    if (readOnly) throw new Error('G2_NATIVE_WRITE_SCOPE_DENIED');
    const [item] = request.requests ?? [];
    const text = item?.insertText?.text;
    if (
      request.documentId !== placementG2DocumentId ||
      !Array.isArray(request.requests) || request.requests.length !== 1 ||
      typeof request.writeControl?.requiredRevisionId !== 'string' ||
      !request.writeControl.requiredRevisionId.trim() ||
      typeof item?.insertText?.endOfSegmentLocation?.tabId !== 'string' ||
      !item.insertText.endOfSegmentLocation.tabId.trim() ||
      typeof text !== 'string' || text.length > 32768 ||
      !/^\nP137E_G2_REVIEW_OBSERVATION_V1 \| P137E_G2_[A-Za-z0-9_-]{12,64} \| \{/.test(text)
    ) throw new Error('G2_NATIVE_WRITE_SCOPE_DENIED');

    const bearer = await accessToken();
    await requestResponse(documentUrl + ':batchUpdate', {
      method: 'POST',
      redirect: 'manual',
      headers: {
        Authorization: 'Bearer ' + bearer,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify(request),
    }, 'G2_NATIVE_WRITE_FAILED');
    // Only the separate getDocument/readRecord comparison can prove persistence.
    return undefined;
  };

  const nextRecordId = () => 'P137E_G2_' + crypto.randomUUID().replace(/-/g, '');

  return { getDocument, batchUpdateDocument, nextRecordId };
};

/**
 * Server-only, read-only facade for five source-bound D1F current review identities.
 * It obtains the same native G2 revision once through the authenticated transport.
 * No write method or HTTP endpoint is exposed; null means nothing is selectable.
 */
export const createNativeG2CurrentReadOnlyAdapter = (options: Omit<NativeG2GoogleDocsOptions, 'readOnly'>) => {
  const { getDocument } = createNativeG2GoogleDocsPorts({ ...options, readOnly: true });
  return {
    readCurrentTargets: () => readNativeG2CurrentPlacementTargets(getDocument),
  };
};
