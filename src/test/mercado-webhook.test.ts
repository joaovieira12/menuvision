import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => options,
}));

import { Route } from '@/routes/api/public/mercado-pago';

const handler = (Route as unknown as {
  server: { handlers: { POST: (args: { request: Request }) => Promise<Response> } };
}).server.handlers.POST;

afterEach(() => vi.unstubAllEnvs());

describe('Mercado Pago notification authentication', () => {
  it('rejects notifications when verification is unconfigured without returning a server failure', async () => {
    vi.stubEnv('MERCADO_PAGO_WEBHOOK_SECRET', '');
    const response = await handler({ request: new Request('http://localhost/api/public/mercado-pago?data.id=123', {
      method: 'POST', body: JSON.stringify({ type: 'payment', data: { id: '123' } }),
    }) });
    expect(response.status).toBe(401);
  });

  it('rejects unsigned notifications even when verification is configured', async () => {
    vi.stubEnv('MERCADO_PAGO_WEBHOOK_SECRET', 'test-only-verifier');
    const response = await handler({ request: new Request('http://localhost/api/public/mercado-pago?data.id=123', { method: 'POST' }) });
    expect(response.status).toBe(401);
  });
});