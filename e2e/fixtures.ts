/**
 * Playwright test fixtures for EPMCDMETST-66352.
 *
 * Problem: The app uses MSW (Mock Service Worker) for API mocking. The service
 * worker registration request is dispatched at the BrowserContext level, not
 * the page level. This means page.route() cannot intercept it. Only
 * context.route() works for service worker script requests.
 *
 * Solution (withPassthroughMsw fixture):
 * Uses context.route to replace the real MSW service worker script with a
 * passthrough implementation that:
 *   1. Satisfies MSW startup handshake so worker.start() resolves and the
 *      React app renders normally.
 *   2. Does NOT intercept fetch events, so every API request goes through to
 *      the network layer where each test's page.route() handler can fire.
 */

import { test as base } from '@playwright/test'

export { expect } from '@playwright/test'

const MSW_PACKAGE_VERSION = '2.15.0'
const MSW_INTEGRITY_CHECKSUM = '03cb67ac84128e63d7cd722a6e5b7f1e'

// Minimal service worker that handles MSW startup but does not intercept fetch.
const PASSTHROUGH_SW_SCRIPT = [
  `const PACKAGE_VERSION = '${MSW_PACKAGE_VERSION}';`,
  `const INTEGRITY_CHECKSUM = '${MSW_INTEGRITY_CHECKSUM}';`,
  '',
  'self.addEventListener(\'install\', () => self.skipWaiting());',
  'self.addEventListener(\'activate\', event => event.waitUntil(self.clients.claim()));',
  '',
  'self.addEventListener(\'message\', async function(event) {',
  '  const clientId = Reflect.get(event.source || {}, \'id\');',
  '  if (!clientId || !self.clients) return;',
  '  const client = await self.clients.get(clientId);',
  '  if (!client) return;',
  '  switch (event.data) {',
  '    case \'KEEPALIVE_REQUEST\':',
  '      client.postMessage({ type: \'KEEPALIVE_RESPONSE\' });',
  '      break;',
  '    case \'INTEGRITY_CHECK_REQUEST\':',
  '      client.postMessage({',
  '        type: \'INTEGRITY_CHECK_RESPONSE\',',
  '        payload: { packageVersion: PACKAGE_VERSION, checksum: INTEGRITY_CHECKSUM },',
  '      });',
  '      break;',
  '    case \'MOCK_ACTIVATE\':',
  '      client.postMessage({',
  '        type: \'MOCKING_ENABLED\',',
  '        payload: { client: { id: client.id, frameType: client.frameType } },',
  '      });',
  '      break;',
  '    case \'CLIENT_CLOSED\':',
  '      break;',
  '    default:',
  '      break;',
  '  }',
  '});',
  '// No fetch event listener: requests flow through to network for page.route() interception.',
].join('\n')

export const test = base.extend<{
  withPassthroughMsw: void
}>({
  withPassthroughMsw: [
    async ({ context }, use) => {
      // Replace the real MSW SW at the context level so MSW startup succeeds
      // while keeping all API requests open for page.route() interception.
      await context.route('**/mockServiceWorker.js', route =>
        route.fulfill({
          status: 200,
          contentType: 'application/javascript; charset=utf-8',
          body: PASSTHROUGH_SW_SCRIPT,
        }))
      await use()
    },
    { auto: false },
  ],
})
