import React from 'react';
import type { MetaFunction } from 'react-router';
import { PLAYGROUND_INTEGRATIONS, MODELS } from '~/data/integrations';
import type { IntegrationMeta } from '~/data/integrations';
import { CodeBlock } from '~/components/CodeBlock';

const PLAYGROUND_TITLE = 'Playground — OpenMolt';
const PLAYGROUND_DESCRIPTION =
  'Configure and run OpenMolt AI agents live in your browser. Pick a model, add integrations, and test your agent without writing any code.';
const BANNER_URL = 'https://openmolt.dev/images/banner.png';

export const meta: MetaFunction = () => [
  { title: PLAYGROUND_TITLE },
  { name: 'description', content: PLAYGROUND_DESCRIPTION },

  // Open Graph
  { property: 'og:type', content: 'website' },
  { property: 'og:url', content: 'https://openmolt.dev/playground' },
  { property: 'og:title', content: PLAYGROUND_TITLE },
  { property: 'og:description', content: PLAYGROUND_DESCRIPTION },
  { property: 'og:image', content: BANNER_URL },
  { property: 'og:image:width', content: '1200' },
  { property: 'og:image:height', content: '630' },
  { property: 'og:site_name', content: 'OpenMolt' },

  // Twitter / X Card
  { name: 'twitter:card', content: 'summary_large_image' },
  { name: 'twitter:site', content: '@ybouane' },
  { name: 'twitter:title', content: PLAYGROUND_TITLE },
  { name: 'twitter:description', content: PLAYGROUND_DESCRIPTION },
  { name: 'twitter:image', content: BANNER_URL },
];

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────
interface SelectedIntegration {
  handle: string;
  credentials: Record<string, string>;
  scopes: string[];
}

interface ConsoleEntry {
  id: number;
  time: string;
  type: string;
  content: string;
}

type RunStatus = 'idle' | 'running' | 'done' | 'error';

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────
function formatTime(d: Date) {
  return d.toTimeString().slice(0, 8);
}

function providerFromModel(model: string): string {
  return model.split(':')[0] ?? 'openai';
}

function providerEnvVar(provider: string): string {
  const map: Record<string, string> = {
    openai: 'OPENMOLT_OPENAI_API_KEY',
    anthropic: 'OPENMOLT_ANTHROPIC_API_KEY',
    google: 'OPENMOLT_GOOGLE_API_KEY',
  };
  return map[provider] ?? 'OPENMOLT_API_KEY';
}

function providerLabel(provider: string): string {
  const map: Record<string, string> = {
    openai: 'OpenAI API Key',
    anthropic: 'Anthropic API Key',
    google: 'Google API Key',
  };
  return map[provider] ?? 'API Key';
}

function sanitizeInput(input: unknown): string {
  if (input === undefined || input === null) return '';
  const str = JSON.stringify(input, null, 2);
  return str.replace(/"([^"]*(?:key|token|secret|password|auth)[^"]*)":\s*"[^"]+"/gi, '"$1": "[REDACTED]"');
}

function IntegrationFallback({ name }: { name: string }) {
  return <div className="icon-fallback">{name.slice(0, 2).toUpperCase()}</div>;
}

function IntegrationLogo({ handle, name }: { handle: string; name: string }) {
  const [failed, setFailed] = React.useState(false);
  if (failed) return <IntegrationFallback name={name} />;
  return (
    <img
      src={`/images/integrations/${handle}.png`}
      alt={name}
      onError={() => setFailed(true)}
    />
  );
}

// ──────────────────────────────────────────────────────────
// Code Generator
// ──────────────────────────────────────────────────────────
function generateCode(params: {
  name: string;
  instructions: string;
  model: string;
  selectedIntegrations: SelectedIntegration[];
  request: string;
}): string {
  const { name, instructions, model, selectedIntegrations, request } = params;
  const provider = providerFromModel(model);
  const envVar = providerEnvVar(provider);

  const integrationsCode = selectedIntegrations
    .map((si) => {
      const meta = PLAYGROUND_INTEGRATIONS.find((i) => i.handle === si.handle);
      if (!meta) return '';
      const scopesList = si.scopes.map((s) => `'${s}'`).join(', ');
      let credStr = '';
      if (meta.credentialType === 'bearer') {
        const firstKey = meta.credentialFields[0]?.key ?? 'apiKey';
        credStr = `{ type: 'bearer', config: { ${firstKey}: process.env.${si.handle.toUpperCase()}_API_KEY } }`;
      } else if (meta.credentialType === 'basic') {
        credStr = `{ type: 'basic', config: { username: process.env.${si.handle.toUpperCase()}_USERNAME, password: process.env.${si.handle.toUpperCase()}_PASSWORD } }`;
      } else {
        const fields = meta.credentialFields
          .map((f) => `${f.key}: process.env.${si.handle.toUpperCase()}_${f.key.toUpperCase()}`)
          .join(', ');
        credStr = `{ type: 'custom', config: { ${fields} } }`;
      }
      return `    {
      integration: '${si.handle}',
      credential: ${credStr},
      scopes: [${scopesList}],
    }`;
    })
    .filter(Boolean)
    .join(',\n');

  const integrationsSection = selectedIntegrations.length
    ? `  integrations: [\n${integrationsCode},\n  ],\n`
    : '';

  return `import OpenMolt from 'openmolt';

const om = new OpenMolt({
  llmProviders: {
    ${provider}: { apiKey: process.env.${envVar} },
  },
});

const agent = om.createAgent({
  name: '${name.replace(/'/g, "\\'")}',
  model: '${model}',
  instructions: \`${instructions.replace(/`/g, '\\`')}\`,
${integrationsSection}});

agent.on('tool:call', ({ tool }) =>
  console.log(\`[\${tool.integration}] \${tool.handle}\`)
);
agent.on('planUpdate', ({ plan }) => console.log('Plan:', plan));
agent.on('finish', ({ result }) => console.log('Done:', result));

const result = await agent.run('${request.replace(/'/g, "\\'")}');
console.log(result);
`;
}

// ──────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────
export default function Playground() {
  // Form state
  const [agentName, setAgentName] = React.useState('Comedian');
  const [instructions, setInstructions] = React.useState('You are a witty stand-up comedian.');
  const [model, setModel] = React.useState('openai:gpt-4o-mini');
  const [apiKey, setApiKey] = React.useState('');
  const [request, setRequest] = React.useState('Tell me a joke!');
  const [integrationSearch, setIntegrationSearch] = React.useState('');
  const [selectedIntegrations, setSelectedIntegrations] = React.useState<SelectedIntegration[]>([]);

  // Console state
  const [activeTab, setActiveTab] = React.useState<'console' | 'code'>('console');
  const [consoleEntries, setConsoleEntries] = React.useState<ConsoleEntry[]>([]);
  const [status, setStatus] = React.useState<RunStatus>('idle');
  const [finalResult, setFinalResult] = React.useState<string | null>(null);
  const [codeCopied, setCodeCopied] = React.useState(false);

  // Refs
  const wsRef = React.useRef<WebSocket | null>(null);
  const consoleBottomRef = React.useRef<HTMLDivElement | null>(null);
  const entryIdRef = React.useRef(0);

  const provider = providerFromModel(model);

  // Auto-scroll console
  React.useEffect(() => {
    consoleBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleEntries]);

  // Cleanup WebSocket on unmount
  React.useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const addEntry = (type: string, content: string) => {
    const id = ++entryIdRef.current;
    const time = formatTime(new Date());
    setConsoleEntries((prev) => [...prev, { id, time, type, content }]);
  };

  const filteredIntegrations = PLAYGROUND_INTEGRATIONS.filter((i) =>
    i.name.toLowerCase().includes(integrationSearch.toLowerCase()) ||
    i.category.toLowerCase().includes(integrationSearch.toLowerCase())
  );

  const toggleIntegration = (integ: IntegrationMeta) => {
    setSelectedIntegrations((prev) => {
      const existing = prev.find((s) => s.handle === integ.handle);
      if (existing) {
        return prev.filter((s) => s.handle !== integ.handle);
      }
      const allScopes = Object.keys(integ.scopes);
      const initCredentials: Record<string, string> = {};
      for (const field of integ.credentialFields) {
        initCredentials[field.key] = '';
      }
      return [...prev, { handle: integ.handle, credentials: initCredentials, scopes: allScopes }];
    });
  };

  const updateCredential = (handle: string, key: string, value: string) => {
    setSelectedIntegrations((prev) =>
      prev.map((s) =>
        s.handle === handle ? { ...s, credentials: { ...s.credentials, [key]: value } } : s
      )
    );
  };

  const toggleScope = (handle: string, scope: string) => {
    setSelectedIntegrations((prev) =>
      prev.map((s) => {
        if (s.handle !== handle) return s;
        const has = s.scopes.includes(scope);
        return {
          ...s,
          scopes: has ? s.scopes.filter((sc) => sc !== scope) : [...s.scopes, scope],
        };
      })
    );
  };

  const runAgent = () => {
    if (status === 'running') return;
    setStatus('running');
    setConsoleEntries([]);
    setFinalResult(null);
    setActiveTab('console');

    addEntry('input', `> ${request}`);

    const ws = new WebSocket('ws://localhost:62052');
    wsRef.current = ws;

    ws.onopen = () => {
      const payload = {
        name: agentName,
        instructions,
        model,
        apiKey,
        integrations: selectedIntegrations.map((si) => {
          const meta = PLAYGROUND_INTEGRATIONS.find((i) => i.handle === si.handle);
          let credential: Record<string, unknown>;
          if (meta?.credentialType === 'bearer') {
            const firstKey = meta.credentialFields[0]?.key ?? 'apiKey';
            credential = { type: 'bearer', config: { [firstKey]: si.credentials[firstKey] ?? '' } };
          } else if (meta?.credentialType === 'basic') {
            const [f1, f2] = meta.credentialFields;
            credential = {
              type: 'basic',
              config: {
                username: f1 ? (si.credentials[f1.key] ?? '') : '',
                password: f2 ? (si.credentials[f2.key] ?? '') : '',
              },
            };
          } else {
            credential = { type: 'custom', config: { ...si.credentials } };
          }
          return {
            handle: si.handle,
            credential,
            scopes: si.scopes,
          };
        }),
        request,
      };
      ws.send(JSON.stringify(payload));
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as Record<string, unknown>;
        const type = msg.type as string;
        const data = msg.data as Record<string, unknown> | undefined;

        switch (type) {
          case 'connected':
            addEntry('connected', 'Connected to playground server');
            break;
          case 'planUpdate': {
            const plan = data?.plan;
            const planStr = Array.isArray(plan)
              ? plan.map((s: unknown) => {
                  if (typeof s === 'object' && s !== null) {
                    const step = s as Record<string, unknown>;
                    return `  • [${step.status ?? '?'}] ${step.name ?? step.tool ?? JSON.stringify(step)}`;
                  }
                  return `  • ${String(s)}`;
                }).join('\n')
              : JSON.stringify(plan, null, 2);
            addEntry('planUpdate', `Plan updated:\n${planStr}`);
            break;
          }
          case 'toolCall': {
            const integration = data?.integration as string;
            const handle = data?.handle as string;
            const input = data?.input;
            const inputStr = input !== undefined ? `\n  Input: ${sanitizeInput(input)}` : '';
            addEntry('toolCall', `[${integration}] ${handle}${inputStr}`);
            break;
          }
          case 'toolResponse': {
            const integration = data?.integration as string;
            const handle = data?.handle as string;
            addEntry('toolResponse', `[${integration}] ${handle} — response received`);
            break;
          }
          case 'llmOutput': {
            const usage = data?.usage as Record<string, number> | undefined;
            if (usage) {
              addEntry('llmOutput', `Tokens: ${usage.promptTokens ?? 0} prompt + ${usage.completionTokens ?? 0} completion = ${usage.totalTokens ?? 0} total`);
            } else {
              addEntry('llmOutput', 'LLM output received');
            }
            break;
          }
          case 'commandsQueued': {
            const count = data?.count as number;
            addEntry('llmOutput', `${count} command(s) queued`);
            break;
          }
          case 'finish': {
            const result = data?.result;
            const resultStr = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
            addEntry('finish', 'Agent finished successfully');
            setFinalResult(resultStr);
            setStatus('done');
            ws.close();
            break;
          }
          case 'error': {
            const message = data?.message as string ?? 'Unknown error';
            addEntry('error', `Error: ${message}`);
            setStatus('error');
            ws.close();
            break;
          }
          default:
            addEntry('llmOutput', `${type}: ${JSON.stringify(data)}`);
        }
      } catch {
        addEntry('error', `Failed to parse server message: ${event.data}`);
      }
    };

    ws.onerror = () => {
      addEntry('error', 'WebSocket connection error. Is the playground server running on port 62052?');
      setStatus('error');
    };

    ws.onclose = () => {
      setStatus((prev) => (prev === 'running' ? 'idle' : prev));
    };
  };

  const resetConsole = () => {
    setConsoleEntries([]);
    setFinalResult(null);
    setStatus('idle');
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const copyCode = () => {
    const code = generateCode({ name: agentName, instructions, model, selectedIntegrations, request });
    navigator.clipboard.writeText(code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  const statusClass = `status-badge status-${status}`;
  const statusLabel = {
    idle: 'Idle',
    running: 'Running',
    done: 'Done',
    error: 'Error',
  }[status];

  const generatedCode = generateCode({ name: agentName, instructions, model, selectedIntegrations, request });

  return (
    <>
      {/* ====== HEADER ====== */}
      <site-header>
        <a href="/" className="header-logo">
          <img src="/images/logo.png" alt="OpenMolt" />
          <span>OpenMolt</span>
        </a>
        <site-nav>
          <a href="/docs/">Documentation</a>
          <a href="https://github.com/ybouane/openmolt.dev" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="https://x.com/ybouane" target="_blank" rel="noopener noreferrer">
            Twitter
          </a>
        </site-nav>
      </site-header>

      {/* ====== PLAYGROUND ====== */}
      <playground-layout>
        {/* ── LEFT: CONFIG ── */}
        <playground-config>
          <div className="config-section-title">Agent</div>

          <config-group>
            <config-label>Agent Name</config-label>
            <input
              className="form-input"
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="My Agent"
            />
          </config-group>

          <config-group>
            <config-label>Instructions</config-label>
            <textarea
              className="form-input"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="You are a helpful AI assistant."
              rows={4}
            />
          </config-group>

          <div className="section-divider" />
          <div className="config-section-title">Model</div>

          <config-group>
            <config-label>Model</config-label>
            <select
              className="form-input"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </config-group>

          <config-group>
            <config-label>{providerLabel(provider)}</config-label>
            <input
              className="form-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your API key (not stored)"
              autoComplete="off"
            />
          </config-group>

          <div className="section-divider" />
          <div className="config-section-title">Integrations</div>

          <config-group>
            <integration-picker>
              <input
                className="form-input"
                type="text"
                value={integrationSearch}
                onChange={(e) => setIntegrationSearch(e.target.value)}
                placeholder="Search integrations..."
              />
              <integration-list>
                {filteredIntegrations.map((integ) => {
                  const isSelected = selectedIntegrations.some((s) => s.handle === integ.handle);
                  return (
                    <integration-option
                      key={integ.handle}
                      className={isSelected ? 'selected' : ''}
                      onClick={() => toggleIntegration(integ)}
                    >
                      <div className={`opt-check${isSelected ? ' checked' : ''}`}>
                        {isSelected ? '✓' : ''}
                      </div>
                      <div className="opt-logo">
                        <IntegrationLogo handle={integ.handle} name={integ.name} />
                      </div>
                      <span className="opt-name">{integ.name}</span>
                    </integration-option>
                  );
                })}
              </integration-list>
            </integration-picker>
          </config-group>

          {/* Selected integration details */}
          {selectedIntegrations.map((si) => {
            const meta = PLAYGROUND_INTEGRATIONS.find((i) => i.handle === si.handle);
            if (!meta) return null;
            return (
              <integration-details key={si.handle}>
                <div className="integration-detail-header">
                  <IntegrationLogo handle={meta.handle} name={meta.name} />
                  {meta.name}
                </div>

                {meta.credentialFields.map((field) => (
                  <config-group key={field.key} style={{ marginBottom: '0' }}>
                    <config-label>{field.label}</config-label>
                    <input
                      className="form-input"
                      type={field.type}
                      value={si.credentials[field.key] ?? ''}
                      onChange={(e) => updateCredential(si.handle, field.key, e.target.value)}
                      placeholder={field.placeholder}
                      autoComplete="off"
                    />
                  </config-group>
                ))}

                <div>
                  <config-label style={{ marginBottom: '8px', display: 'block' }}>Scopes</config-label>
                  <div className="scope-list">
                    {Object.entries(meta.scopes).map(([scopeKey, scopeDesc]) => (
                      <button
                        key={scopeKey}
                        className={`scope-item${si.scopes.includes(scopeKey) ? ' active' : ''}`}
                        onClick={() => toggleScope(si.handle, scopeKey)}
                        title={scopeDesc}
                        type="button"
                      >
                        {si.scopes.includes(scopeKey) ? '✓' : '+'} {scopeKey}
                      </button>
                    ))}
                  </div>
                </div>
              </integration-details>
            );
          })}

          <div className="section-divider" />
          <div className="config-section-title">Request</div>

          <config-group>
            <config-label>Input Request</config-label>
            <textarea
              className="form-input"
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="What should your agent do?"
              rows={4}
            />
          </config-group>

          <button
            className="run-btn"
            onClick={runAgent}
            disabled={status === 'running' || !request.trim() || !apiKey.trim()}
          >
            {status === 'running' ? '⏳ Running...' : '▶ Run Agent'}
          </button>
        </playground-config>

        {/* ── RIGHT: OUTPUT ── */}
        <playground-console>
          <div className="console-header">
            <div className="console-tabs">
              <button
                className={`console-tab${activeTab === 'console' ? ' active' : ''}`}
                onClick={() => setActiveTab('console')}
              >
                Console
              </button>
              <button
                className={`console-tab${activeTab === 'code' ? ' active' : ''}`}
                onClick={() => setActiveTab('code')}
              >
                Code
              </button>
            </div>
            <div className="console-actions">
              <div className={statusClass}>
                <div className="status-dot" />
                {statusLabel}
              </div>
              {activeTab === 'console' && (
                <button className="btn btn-secondary btn-sm" onClick={resetConsole}>
                  Reset
                </button>
              )}
              {activeTab === 'code' && (
                <button className={`btn btn-secondary btn-sm${codeCopied ? ' copied' : ''}`} onClick={copyCode}>
                  {codeCopied ? '✓ Copied' : 'Copy Code'}
                </button>
              )}
            </div>
          </div>

          {activeTab === 'console' ? (
            <>
              <console-output>
                {consoleEntries.length === 0 && status === 'idle' && (
                  <div style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', padding: '12px 0' }}>
                    Configure your agent and click &quot;Run Agent&quot; to start.
                  </div>
                )}
                {consoleEntries.map((entry) => {
                  const typeClass = `line-${entry.type.toLowerCase().replace(/:/g, '')}`;
                  return (
                    <console-line key={entry.id}>
                      <span className="line-time">{entry.time}</span>
                      <span className={`line-type ${typeClass}`}>{entry.type}</span>
                      <span className={`line-content ${typeClass}`}>{entry.content}</span>
                    </console-line>
                  );
                })}
                {status === 'running' && (
                  <console-spinner>Processing...</console-spinner>
                )}
                <div ref={consoleBottomRef} />
              </console-output>

              {finalResult !== null && (
                <div className="result-display">
                  <div className="result-label">Result</div>
                  <div className="result-content">{finalResult}</div>
                </div>
              )}
            </>
          ) : (
            <code-view>
              <div className="code-copy-bar">
                <span>TypeScript — ready to copy into your project</span>
              </div>
              <code-block>
                <CodeBlock code={generatedCode} />
              </code-block>
            </code-view>
          )}
        </playground-console>
      </playground-layout>
    </>
  );
}
