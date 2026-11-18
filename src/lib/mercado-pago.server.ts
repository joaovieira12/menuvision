export async function mercadoRequest(path: string, apiKey: string, connectionKey: string, method = 'GET', body?: unknown, idempotencyKey?: string) {
  const response = await fetch(`https://connector-gateway.lovable.dev/udc_mercado_pago${path}`, {
    method, headers: { Authorization: `Bearer ${apiKey}`, 'X-Connection-Api-Key': connectionKey, 'Content-Type': 'application/json', ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const error = await response.text();
    // Provider responses can contain customer information. Do not expose or log those fields.
    let code = 'provider_error';
    try { const parsed = JSON.parse(error); code = String(parsed.error ?? parsed.type ?? code); } catch { /* non-JSON provider failure */ }
    throw new Error(`Mercado Pago [${response.status}]: ${code}. Não foi possível concluir a solicitação.`);
  }
  return response.json();
}
