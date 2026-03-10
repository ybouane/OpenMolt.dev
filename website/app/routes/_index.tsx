import React from 'react';
import type { MetaFunction } from 'react-router';
import { ALL_INTEGRATIONS } from '~/data/integrations';
import { CodeBlock } from '~/components/CodeBlock';

const SITE_TITLE = 'OpenMolt — The Programmatic Way to Build AI Agents';
const SITE_DESCRIPTION =
  'OpenMolt lets you build programmatic AI agents in Node.js that think, plan, and act using tools, integrations, and memory — directly from your codebase.';
const BANNER_URL = 'https://openmolt.dev/images/banner.png';

export const meta: MetaFunction = () => [
  { title: SITE_TITLE },
  { name: 'description', content: SITE_DESCRIPTION },

  // Open Graph
  { property: 'og:type', content: 'website' },
  { property: 'og:url', content: 'https://openmolt.dev/' },
  { property: 'og:title', content: SITE_TITLE },
  { property: 'og:description', content: SITE_DESCRIPTION },
  { property: 'og:image', content: BANNER_URL },
  { property: 'og:image:width', content: '1200' },
  { property: 'og:image:height', content: '630' },
  { property: 'og:site_name', content: 'OpenMolt' },

  // Twitter / X Card
  { name: 'twitter:card', content: 'summary_large_image' },
  { name: 'twitter:site', content: '@ybouane' },
  { name: 'twitter:title', content: SITE_TITLE },
  { name: 'twitter:description', content: SITE_DESCRIPTION },
  { name: 'twitter:image', content: BANNER_URL },
];

const FEATURES = [
  {
    icon: '🔐',
    title: 'Secure by Design',
    desc: 'Agents access only the scopes you grant. API credentials never leave your server. The LLM only sees tool names, never raw credentials.',
  },
  {
    icon: '🤖',
    title: 'Multi-Provider LLM',
    desc: 'Use OpenAI GPT-4o, Anthropic Claude, or Google Gemini with a unified model string format. Switch providers without changing your code.',
  },
  {
    icon: '🔌',
    title: '30+ Integrations',
    desc: 'Gmail, Slack, GitHub, Notion, Stripe, Discord, S3 and more — all ready to use out of the box with zero configuration.',
  },
  {
    icon: '📋',
    title: 'Structured Output',
    desc: 'Pass a Zod schema and get back a validated, typed object. No more parsing or validating LLM responses manually.',
  },
  {
    icon: '📅',
    title: 'Scheduling',
    desc: 'Schedule agents with interval or cron-style daily schedules. Perfect for recurring reports, automated workflows, and monitoring tasks.',
  },
  {
    icon: '🔄',
    title: 'Event-Driven',
    desc: 'Hook into every step of the reasoning loop. Observe tool calls, plan updates, LLM outputs, and results in real-time.',
  },
  {
    icon: '🧠',
    title: 'Memory',
    desc: 'Long-term and short-term memory stores with onUpdate callbacks. Agents can learn and remember across runs.',
  },
  {
    icon: '🛠️',
    title: 'Declarative Tools',
    desc: 'Define integrations as data — endpoint, auth template, and schema. No boilerplate HTTP code required.',
  },
];

const BENEFITS = [
  {
    icon: '🔒',
    title: 'Zero-Trust Security',
    desc: 'OpenMolt uses a scope-based permission model. Your API credentials are stored server-side and rendered into HTTP requests via Liquid templates — the LLM only receives the results of tool calls, never your raw API keys or tokens. Grant only the scopes each agent needs.',
  },
  {
    icon: '⚙️',
    title: 'Fully Configurable Agents',
    desc: 'Every aspect of an agent is configurable: instructions (or load from a file), model provider, model config (temperature, thinking mode, token limits), output schema, max steps, and per-integration scope restrictions. Build exactly the agent you need.',
  },
  {
    icon: '💾',
    title: 'Persistent Memory',
    desc: 'Agents maintain long-term and short-term memory stores. Provide an onUpdate callback to persist memory to a database or file. Agents can update their memory mid-run and carry context across multiple sessions.',
  },
  {
    icon: '⏰',
    title: 'Scheduling & Automation',
    desc: 'Schedule agents to run on an interval (e.g., every 20 minutes) or on a cron-style daily schedule with timezone support. Perfect for daily reports, monitoring, automated content publishing, and more.',
  },
];

const USE_CASES = [
  {
    title: 'Daily Reporting',
    badge: 'Scheduling',
    desc: 'Schedule a Gemini agent to pull metrics from Stripe every morning, generate a summary, and post it to your Slack channel — automatically.',
  },
  {
    title: 'Content Pipeline',
    badge: 'Multi-step',
    desc: 'Describe your content strategy in natural language. An agent writes the blog post, generates images with DALL-E, and saves everything to disk.',
  },
  {
    title: 'Email Management',
    badge: 'Gmail',
    desc: 'Automatically draft replies to incoming emails based on your guidelines. Review drafts in Gmail before sending — no more starting from scratch.',
  },
  {
    title: 'GitHub Automation',
    badge: 'Dev Tools',
    desc: 'Triage issues, auto-label PRs, post release notes to Slack, and generate changelogs — all triggered by your existing CI/CD pipeline.',
  },
  {
    title: 'E-Commerce Ops',
    badge: 'Commerce',
    desc: 'Monitor Shopify orders, update inventory in Airtable, send order confirmations via Twilio, and report daily revenue to a Notion dashboard.',
  },
  {
    title: 'Customer Research',
    badge: 'Analytics',
    desc: 'Scrape product pages with browser-use, analyze competitors with web search, compile findings into a structured Notion database.',
  },
];

const HELLO_WORLD = `import OpenMolt from 'openmolt';

const om = new OpenMolt({
  llmProviders: {
    openai: { apiKey: process.env.OPENMOLT_OPENAI_API_KEY },
  },
});

const agent = om.createAgent({
  name: 'Comedian',
  model: 'openai:gpt-4o-mini',
  instructions: 'You are a witty stand-up comedian.',
});

const result = await agent.run('Tell me a joke!');
console.log(result);`;

function IntegrationFallback({ name }: { name: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  return <div className="icon-fallback">{initials}</div>;
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

export default function Index() {
  const [installCopied, setInstallCopied] = React.useState(false);
  const [codeCopied, setCodeCopied] = React.useState(false);

  const copyInstall = () => {
    navigator.clipboard.writeText('npm install openmolt').then(() => {
      setInstallCopied(true);
      setTimeout(() => setInstallCopied(false), 2000);
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(HELLO_WORLD).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  // Duplicate integrations for seamless scroll loop
  const doubled = [...ALL_INTEGRATIONS, ...ALL_INTEGRATIONS];

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
          <a href="/playground" className="btn btn-primary btn-sm">
            Try Playground
          </a>
        </site-nav>
      </site-header>

      {/* ====== HERO ====== */}
      <hero-section>
        <hero-content>
          <hero-logo>
            <img src="/images/logo.png" alt="OpenMolt" />
          </hero-logo>
          <hero-title>OpenMolt</hero-title>
          <hero-subtitle>The Programmatic Way to Build AI Agents</hero-subtitle>
          <hero-description>
            OpenMolt lets you build programmatic AI agents in Node.js that think, plan, and act using
            tools, integrations, and memory — directly from your codebase.
          </hero-description>
          <hero-actions>
            <a href="#quickstart" className="btn btn-primary">
              Quick Start
            </a>
            <a href="/docs/" className="btn btn-secondary">
              Documentation
            </a>
            <a href="/playground" className="btn btn-outline">
              Playground
            </a>
          </hero-actions>
        </hero-content>
      </hero-section>

      {/* ====== QUICKSTART ====== */}
      <quickstart-section id="quickstart">
        <div className="quickstart-inner">
          <section-header>
            <section-label>Get Started</section-label>
            <section-title>Get Started in Minutes</section-title>
            <section-description>
              Install the package and create your first AI agent with a few lines of code.
            </section-description>
          </section-header>

          <div className="code-wrapper">
            <div className="code-label">Install</div>
            <install-command>
              <span className="prompt">$</span>
              <span>npm install openmolt</span>
            </install-command>
            <button
              className={`copy-btn${installCopied ? ' copied' : ''}`}
              onClick={copyInstall}
              style={{ top: '36px' }}
              aria-label="Copy install command"
            >
              {installCopied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          <div className="code-wrapper">
            <div className="code-label">Hello World</div>
            <CodeBlock code={HELLO_WORLD} />
            <button
              className={`copy-btn${codeCopied ? ' copied' : ''}`}
              onClick={copyCode}
              aria-label="Copy code"
            >
              {codeCopied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </quickstart-section>

      {/* ====== FEATURES ====== */}
      <features-section>
        <section-header>
          <section-label>Capabilities</section-label>
          <section-title>Everything You Need</section-title>
          <section-description>
            A complete toolkit for building production-grade autonomous AI agents.
          </section-description>
        </section-header>
        <feature-grid>
          {FEATURES.map((f) => (
            <feature-card key={f.title}>
              <feature-icon>{f.icon}</feature-icon>
              <feature-title>{f.title}</feature-title>
              <feature-desc>{f.desc}</feature-desc>
            </feature-card>
          ))}
        </feature-grid>
      </features-section>

      {/* ====== INTEGRATIONS ====== */}
      <integrations-section>
        <section-header>
          <section-label>Integrations</section-label>
          <section-title>30+ Built-in Integrations</section-title>
          <section-description>
            Connect your agents to the tools your business already uses.
          </section-description>
        </section-header>
        <div className="integrations-slider">
          <integrations-track>
            {doubled.map((integ, idx) => (
              <integration-item key={`${integ.handle}-${idx}`}>
                <integration-icon>
                  <IntegrationLogo handle={integ.handle} name={integ.name} />
                </integration-icon>
                <integration-name>{integ.name}</integration-name>
              </integration-item>
            ))}
          </integrations-track>
        </div>
      </integrations-section>

      {/* ====== BENEFITS ====== */}
      <benefits-section>
        <div className="benefits-inner">
          <section-header>
            <section-label>Why OpenMolt</section-label>
            <section-title>Built for Production</section-title>
            <section-description>
              Designed with security, flexibility, and reliability at the core.
            </section-description>
          </section-header>
          <benefit-grid>
            {BENEFITS.map((b) => (
              <benefit-card key={b.title}>
                <benefit-icon>{b.icon}</benefit-icon>
                <div>
                  <h3>{b.title}</h3>
                  <p>{b.desc}</p>
                </div>
              </benefit-card>
            ))}
          </benefit-grid>
        </div>
      </benefits-section>

      {/* ====== USE CASES ====== */}
      <usecases-section>
        <div className="usecases-inner">
          <section-header>
            <section-label>Use Cases</section-label>
            <section-title>What Will You Build?</section-title>
            <section-description>
              From automation to content pipelines — agents that fit your workflow.
            </section-description>
          </section-header>
          <usecase-grid>
            {USE_CASES.map((u) => (
              <usecase-card key={u.title}>
                <usecase-badge>{u.badge}</usecase-badge>
                <h3>{u.title}</h3>
                <p>{u.desc}</p>
              </usecase-card>
            ))}
          </usecase-grid>
        </div>
      </usecases-section>

      {/* ====== FOOTER ====== */}
      <site-footer>
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">
                <img src="/images/logo.png" alt="OpenMolt" />
                <span>OpenMolt</span>
              </div>
              <p className="footer-tagline">Programmatic AI Agent System</p>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h4>Product</h4>
                <a href="/docs/">Documentation</a>
                <a href="/playground">Playground</a>
                <a href="#quickstart">Quick Start</a>
              </div>
              <div className="footer-col">
                <h4>Community</h4>
                <a
                  href="https://github.com/ybouane/openmolt.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
                <a
                  href="https://x.com/ybouane"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Twitter / X
                </a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} OpenMolt. Made in 🇨🇦 by <a href="https://x.com/ybouane" target="_blank">@ybouane</a>. <a href="https://github.com/ybouane/openmolt.dev/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a>
            </span>
            <span>Built for Node.js &amp; TypeScript</span>
          </div>
        </div>
      </site-footer>
    </>
  );
}
