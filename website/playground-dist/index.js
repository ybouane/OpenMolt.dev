import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { z } from 'zod';
import OpenMolt from 'openmolt';
// ──────────────────────────────────────────────────────────
// Validation Schemas
// ──────────────────────────────────────────────────────────
const CredentialSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('bearer'),
        config: z.object({ apiKey: z.string().min(1) }),
    }),
    z.object({
        type: z.literal('basic'),
        config: z.object({
            username: z.string().min(1),
            password: z.string().min(1),
        }),
    }),
    z.object({
        type: z.literal('custom'),
        config: z.record(z.string()),
    }),
]);
const IntegrationConfigSchema = z.object({
    handle: z.string().min(1).max(50).regex(/^[a-zA-Z][a-zA-Z0-9]*$/),
    credential: CredentialSchema,
    scopes: z.union([z.literal('all'), z.array(z.string().min(1).max(50))]),
});
const PlaygroundRequestSchema = z.object({
    name: z.string().min(1).max(100).trim(),
    instructions: z.string().min(1).max(10000).trim(),
    model: z.enum([
        'openai:gpt-4o',
        'openai:gpt-4o-mini',
        'anthropic:claude-opus-4-6',
        'anthropic:claude-sonnet-4-6',
        'google:gemini-2.0-flash',
        'google:gemini-2.5-pro',
    ]),
    apiKey: z.string().min(1).max(500),
    integrations: z.array(IntegrationConfigSchema).max(10),
    request: z.string().min(1).max(5000).trim(),
});
// ──────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────
const ALLOWED_INTEGRATIONS = new Set([
    'notion',
    'fal',
    'googleCalendar',
    'gmail',
    'googleDrive',
    'googleSheets',
    'microsoftOutlook',
    'geminiMedia',
    'openaiImages',
    'discord',
    'slack',
    'telegram',
    'twitter',
    'twilio',
    'airtable',
    'youtube',
    'shopify',
    'stripe',
    'github',
    'dropbox',
    'httpRequest',
]);
const ALLOWED_ORIGINS = new Set([
    'http://localhost:62053',
    'https://openmolt.dev',
    'https://www.openmolt.dev',
]);
const PORT = 62052;
const HOST = 'localhost';
function send(ws, msg) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
    }
}
// ──────────────────────────────────────────────────────────
// Sanitize tool input — remove sensitive fields
// ──────────────────────────────────────────────────────────
function sanitizeToolInput(input) {
    const sanitized = {};
    for (const [k, v] of Object.entries(input)) {
        if (/key|token|secret|password|auth|credential/i.test(k)) {
            sanitized[k] = '[REDACTED]';
        }
        else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            sanitized[k] = sanitizeToolInput(v);
        }
        else {
            sanitized[k] = v;
        }
    }
    return sanitized;
}
// ──────────────────────────────────────────────────────────
// Build provider config from model string
// ──────────────────────────────────────────────────────────
function buildProviderConfig(model, apiKey) {
    const provider = model.split(':')[0];
    switch (provider) {
        case 'openai':
            return { openai: { apiKey } };
        case 'anthropic':
            return { anthropic: { apiKey } };
        case 'google':
            return { google: { apiKey } };
        default:
            return { openai: { apiKey } };
    }
}
// ──────────────────────────────────────────────────────────
// Convert validated credential to AgentCredential
// ──────────────────────────────────────────────────────────
function toAgentCredential(cred) {
    if (cred.type === 'bearer') {
        return { type: 'bearer', config: { apiKey: cred.config.apiKey } };
    }
    if (cred.type === 'basic') {
        return { type: 'basic', config: { username: cred.config.username, password: cred.config.password } };
    }
    // custom
    return { type: 'custom', config: cred.config };
}
// ──────────────────────────────────────────────────────────
// Handle a single playground session
// ──────────────────────────────────────────────────────────
async function handleSession(ws, req) {
    // Validate integrations are allowed
    for (const integ of req.integrations) {
        if (!ALLOWED_INTEGRATIONS.has(integ.handle)) {
            send(ws, {
                type: 'error',
                data: { message: `Integration '${integ.handle}' is not allowed in the playground.` },
            });
            return;
        }
    }
    // Build OpenMolt instance
    const om = new OpenMolt({
        llmProviders: buildProviderConfig(req.model, req.apiKey),
    });
    // Build integrations config
    const integrations = req.integrations.map((si) => ({
        integration: si.handle,
        credential: toAgentCredential(si.credential),
        scopes: si.scopes,
    }));
    // Create agent
    const agent = om.createAgent({
        name: req.name,
        model: req.model,
        instructions: req.instructions,
        integrations,
    });
    // Attach event listeners
    agent.on('planUpdate', ({ plan }) => {
        send(ws, { type: 'planUpdate', data: { plan } });
    });
    agent.on('tool:call', ({ tool }) => {
        send(ws, {
            type: 'toolCall',
            data: {
                integration: tool.integration,
                handle: tool.handle,
                input: sanitizeToolInput(tool.input),
            },
        });
    });
    agent.on('tool:response', ({ tool }) => {
        send(ws, {
            type: 'toolResponse',
            data: {
                integration: tool.integration,
                handle: tool.handle,
            },
        });
    });
    agent.on('llmOutput', ({ output }) => {
        send(ws, {
            type: 'llmOutput',
            data: { usage: output.usage },
        });
    });
    agent.on('commandsQueued', ({ commands }) => {
        send(ws, {
            type: 'commandsQueued',
            data: {
                count: commands.length,
                commands: commands.map((c) => ({ type: c.type ?? 'unknown' })),
            },
        });
    });
    // Run agent
    const result = await agent.run(req.request);
    send(ws, {
        type: 'finish',
        data: { result, status: 'success' },
    });
}
// ──────────────────────────────────────────────────────────
// HTTP Server + WebSocket Server
// ──────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ status: 'ok', service: 'openmolt-playground', port: PORT }));
    }
    else {
        res.writeHead(404);
        res.end('Not Found');
    }
});
const wss = new WebSocketServer({ noServer: true });
// Handle WebSocket upgrade with CORS-like origin check
server.on('upgrade', (request, socket, head) => {
    const origin = request.headers.origin ?? '';
    const host = request.headers.host ?? '';
    // Allow localhost on any port in dev mode
    const isAllowed = ALLOWED_ORIGINS.has(origin) ||
        host.startsWith('localhost') ||
        host.startsWith('127.0.0.1');
    if (!isAllowed) {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
wss.on('connection', (ws) => {
    console.log('[playground] New connection');
    // Send connected message immediately
    send(ws, { type: 'connected' });
    // Heartbeat
    ws.isAlive = true;
    ws.on('pong', () => {
        ws.isAlive = true;
    });
    let handled = false;
    ws.on('message', async (data) => {
        if (handled)
            return;
        handled = true;
        try {
            const raw = JSON.parse(data.toString());
            const parsed = PlaygroundRequestSchema.safeParse(raw);
            if (!parsed.success) {
                const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
                send(ws, { type: 'error', data: { message: `Invalid request: ${issues}` } });
                ws.close();
                return;
            }
            await handleSession(ws, parsed.data);
            ws.close();
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error('[playground] Error:', message);
            send(ws, { type: 'error', data: { message } });
            ws.close();
        }
    });
    ws.on('error', (err) => {
        console.error('[playground] WebSocket error:', err.message);
    });
    ws.on('close', () => {
        console.log('[playground] Connection closed');
    });
});
// Heartbeat interval
const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
        const ext = ws;
        if (!ext.isAlive) {
            ws.terminate();
            return;
        }
        ext.isAlive = false;
        ws.ping();
    });
}, 30000);
wss.on('close', () => {
    clearInterval(heartbeatInterval);
});
server.listen(PORT, HOST, () => {
    console.log(`[playground] Server listening on ws://${HOST}:${PORT}`);
    console.log(`[playground] Health check: http://${HOST}:${PORT}/`);
});
