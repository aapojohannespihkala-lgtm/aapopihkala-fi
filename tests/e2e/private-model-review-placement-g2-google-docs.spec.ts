import { expect, test } from '@playwright/test';
import { placementG2DocumentId } from '../../src/scripts/privateModelReviewPlacementG2Context';
import type { TrustedNativeG2WritePorts } from '../../src/scripts/privateModelReviewPlacementG2Persistence';
import {
  createNativeG2GoogleDocsPorts,
  type NativeG2ServiceAccount,
} from '../../src/scripts/privateModelReviewPlacementG2GoogleDocs';

// Normal Google-exported PKCS8 PEM has a final line ending; exercise it everywhere.
const makeAccount = async (): Promise<NativeG2ServiceAccount> => {
  const pair = await crypto.subtle.generateKey({
    name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256',
  }, true, ['sign', 'verify']) as CryptoKeyPair;
  const key = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  return {
    clientEmail: 'g2-private-test@example-project.iam.gserviceaccount.com',
    privateKeyPem: '-----BEGIN PRIVATE KEY-----\n' +
      btoa(Array.from(key, (byte) => String.fromCharCode(byte)).join('')) +
      '\n-----END PRIVATE KEY-----\n',
  };
};

const rawDocument = (revisionId = 'REV_G2_1') => ({
  documentId: placementG2DocumentId,
  revisionId,
  tabs: [{ tabProperties: { tabId: 't.0' }, documentTab: { body: {
    content: [{ paragraph: { elements: [{ textRun: { content: 'R989 - existing G2 source\n' } }] } }],
  } } }],
});

test('server-only OAuth RS256 requests exact Docs scope, pinned identity and native one-tab G2', async () => {
  const account = await makeAccount();
  let calls = 0;
  const ports = createNativeG2GoogleDocsPorts({
    credentials: account, now: () => 1_800_000_000_000,
    fetcher: async (input, init) => {
      calls++;
      if (calls === 1) {
        expect(String(input)).toBe('https://oauth2.googleapis.com/token');
        expect(init?.method).toBe('POST');
        const params = new URLSearchParams(init?.body as string);
        expect(params.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
        const jwt = params.get('assertion')!.split('.');
        expect(jwt).toHaveLength(3);
        const base64 = jwt[1].replace(/-/g, '+').replace(/_/g, '/');
        const claims = JSON.parse(atob(base64));
        expect(claims).toMatchObject({
          iss: account.clientEmail, scope: 'https://www.googleapis.com/auth/documents',
          aud: 'https://oauth2.googleapis.com/token', iat: 1_800_000_000, exp: 1_800_000_600,
        });
        const key = await crypto.subtle.importKey('pkcs8',
          Uint8Array.from(atob(account.privateKeyPem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '')),
            (char) => char.charCodeAt(0)),
          { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
        );
        expect(key.type).toBe('private');
        return Response.json({ access_token: 'secret-test-bearer', token_type: 'Bearer' });
      }
      expect(String(input)).toBe('https://docs.googleapis.com/v1/documents/' +
        placementG2DocumentId + '?includeTabsContent=true');
      expect(init?.method).toBe('GET');
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer secret-test-bearer');
      return Response.json(rawDocument());
    },
  });
  expect(await ports.getDocument()).toEqual(rawDocument());
  expect(calls).toBe(2);
  expect(ports.nextRecordId()).toMatch(/^P137E_G2_[a-f0-9]{32}$/);
  expect(ports.nextRecordId()).not.toBe(ports.nextRecordId());
});

test('native batchUpdate is exact G2-only, revision guarded and not a persisted ack', async () => {
  const account = await makeAccount();
  const calls: string[] = [];
  const request: Parameters<TrustedNativeG2WritePorts['batchUpdateDocument']>[0] = {
    documentId: placementG2DocumentId,
    requests: [{
      insertText: { endOfSegmentLocation: { tabId: 't.0' },
        text: '\nP137E_G2_REVIEW_OBSERVATION_V1 | P137E_G2_TESTRECORD_0001 | {"schema":"test"}\n' },
    }],
    writeControl: { requiredRevisionId: 'G2_REAL_REV_1' },
  };
  const ports = createNativeG2GoogleDocsPorts({
    credentials: account,
    fetcher: async (input, init) => {
      calls.push(String(input));
      if (String(input).endsWith('/token')) {
        return Response.json({ access_token: 'server-only', token_type: 'Bearer' });
      }
      expect(String(input)).toBe('https://docs.googleapis.com/v1/documents/' +
        placementG2DocumentId + ':batchUpdate');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(init?.body as string)).toEqual(request);
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer server-only');
      return Response.json({ documentId: placementG2DocumentId, replies: [{}] });
    },
  });
  expect(await ports.batchUpdateDocument(request)).toBeUndefined();
  expect(calls).toHaveLength(2);
  await expect(ports.batchUpdateDocument({ ...request,
    documentId: 'WRONG_DOC' as typeof placementG2DocumentId,
  })).rejects.toThrow('G2_NATIVE_WRITE_SCOPE_DENIED');
  await expect(ports.batchUpdateDocument({ ...request,
    writeControl: { requiredRevisionId: '' },
  })).rejects.toThrow('G2_NATIVE_WRITE_SCOPE_DENIED');
  await expect(ports.batchUpdateDocument({ ...request,
    requests: [{ insertText: {
      endOfSegmentLocation: { tabId: 't.0' }, text: '\nCANONICAL_CHANGE\n',
    } }],
  })).rejects.toThrow('G2_NATIVE_WRITE_SCOPE_DENIED');
  expect(calls).toHaveLength(2);
});

test('unconfigured identity, failed OAuth and wrong G2 document fail closed', async () => {
  const account = await makeAccount();
  const bad = createNativeG2GoogleDocsPorts({
    credentials: { ...account, clientEmail: 'user@example.com' },
    fetcher: async () => { throw new Error('must not call network'); },
  });
  await expect(bad.getDocument()).rejects.toThrow('G2_OAUTH_CREDENTIALS_MISSING');

  const denied = createNativeG2GoogleDocsPorts({
    credentials: account, fetcher: async () => Response.json({ error: 'unauthorized' }, { status: 403 }),
  });
  await expect(denied.getDocument()).rejects.toThrow('G2_OAUTH_TOKEN_FAILED');

  const mismatch = createNativeG2GoogleDocsPorts({
    credentials: account, fetcher: async (input) => String(input).endsWith('/token')
      ? Response.json({ access_token: 'test-only', token_type: 'Bearer' })
      : Response.json({ ...rawDocument(), documentId: 'WRONG_DOC' }),
  });
  expect(await mismatch.getDocument()).toBeNull();
});

test('missing tab, non-Bearer OAuth token, and failed guarded Docs write never count as success', async () => {
  const account = await makeAccount();
  const noTab = createNativeG2GoogleDocsPorts({
    credentials: account, fetcher: async (input) => String(input).endsWith('/token')
      ? Response.json({ access_token: 'test-only', token_type: 'Bearer' })
      : Response.json({ ...rawDocument(), tabs: [] }),
  });
  expect(await noTab.getDocument()).toBeNull();

  const wrongTokenType = createNativeG2GoogleDocsPorts({
    credentials: account, fetcher: async () =>
      Response.json({ access_token: 'a-token', token_type: 'token' }),
  });
  await expect(wrongTokenType.getDocument()).rejects.toThrow('G2_OAUTH_TOKEN_INVALID');

  const failedWrite = createNativeG2GoogleDocsPorts({
    credentials: account, fetcher: async (input) => String(input).endsWith('/token')
      ? Response.json({ access_token: 'test-only', token_type: 'Bearer' })
      : Response.json({ error: 'revision conflict' }, { status: 409 }),
  });
  await expect(failedWrite.batchUpdateDocument({
    documentId: placementG2DocumentId,
    requests: [{ insertText: {
      endOfSegmentLocation: { tabId: 't.0' },
      text: '\nP137E_G2_REVIEW_OBSERVATION_V1 | P137E_G2_TESTRECORD_0001 | {"schema":"test"}\n',
    } }],
    writeControl: { requiredRevisionId: 'STALEREV' },
  })).rejects.toThrow('G2_NATIVE_WRITE_FAILED');
});
