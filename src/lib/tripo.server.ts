export async function tripoRequest(path: string, apiKey: string, connectionKey: string, body?: unknown) {
  const response = await fetch(`https://connector-gateway.lovable.dev/udc_tripo/v3${path}`, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${apiKey}`, 'X-Connection-Api-Key': connectionKey, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const json = await response.json();
  if (!response.ok || json.code !== 0) throw new Error(`Tripo [${response.status}/${json.code ?? 'error'}]: não foi possível concluir. Verifique sua chave e créditos Tripo.`);
  return json.data;
}
