// Stateless MCP Streamable HTTP requests; callers retain credentials in memory.
export function authHeaders(credential) {
  return typeof credential === 'string' ? { Authorization: `Bearer ${credential}` } : { 'X-CSRF-Token': credential.csrf };
}

export async function call(endpoint, token, method, params, signal) {
  let response;
  try {
    response = await fetch(`${endpoint}/mcp`, {
      method: 'POST', signal,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...authHeaders(token), 'MCP-Protocol-Version': '2025-06-18' },
      body: JSON.stringify({ jsonrpc: '2.0', id: crypto.randomUUID(), method, params }),
    });
  } catch (error) {
    if (error.name !== 'AbortError') error.outcomeUnknown = true;
    throw error;
  }
  if (!response.ok) {
    const error = new Error(response.status === 401 || response.status === 403 ? 'Authorization expired or was rejected. Reconnect or pair again.' : `Service returned ${response.status}`);
    error.status = response.status;
    error.outcomeUnknown = response.status >= 500;
    throw error;
  }
  let message;
  try { message = await response.json(); }
  catch (error) { error.outcomeUnknown = true; throw error; }
  if (message.error) throw new Error(message.error.message);
  if (message.result?.isError) throw new Error(message.result.content?.[0]?.text || 'Tool failed');
  return message.result;
}
