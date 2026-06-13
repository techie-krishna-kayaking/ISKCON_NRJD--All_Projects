const clients = new Set();

/**
 * Add a new SSE response object to the registry.
 * @param {import('express').Response} res
 */
const addClient = (res) => {
  clients.add(res);
  console.log(`📡 SSE client connected. Total: ${clients.size}`);
};

/**
 * Remove a client (called on connection close).
 * @param {import('express').Response} res
 */
const removeClient = (res) => {
  clients.delete(res);
  console.log(`📡 SSE client disconnected. Total: ${clients.size}`);
};

/**
 * Push a named SSE event with a JSON payload to ALL connected clients.
 * @param {string} event  e.g. "new-request" | "request-resolved"
 * @param {object} data   Serialisable payload
 */
const pushEvent = (event, data = {}) => {
  if (clients.size === 0) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch (err) {
      // Client disconnected mid-write — clean up
      clients.delete(client);
    }
  }
};

module.exports = { addClient, removeClient, pushEvent };
