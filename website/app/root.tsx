import React from 'react';
import type { LinksFunction, MetaFunction } from 'react-router';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import appCss from './app.css?url';

const DEFAULT_TITLE = 'OpenMolt — The Programmatic Way to Build AI Agents';
const DEFAULT_DESCRIPTION =
  'OpenMolt lets you build programmatic AI agents in Node.js that think, plan, and act using tools, integrations, and memory — directly from your codebase.';
const BANNER_URL = 'https://openmolt.dev/images/banner.png';

export const meta: MetaFunction = () => [
  { title: DEFAULT_TITLE },
  { name: 'description', content: DEFAULT_DESCRIPTION },
  { property: 'og:type', content: 'website' },
  { property: 'og:title', content: DEFAULT_TITLE },
  { property: 'og:description', content: DEFAULT_DESCRIPTION },
  { property: 'og:image', content: BANNER_URL },
  { property: 'og:image:width', content: '1200' },
  { property: 'og:image:height', content: '630' },
  { property: 'og:site_name', content: 'OpenMolt' },
  { name: 'twitter:card', content: 'summary_large_image' },
  { name: 'twitter:site', content: '@ybouane' },
  { name: 'twitter:title', content: DEFAULT_TITLE },
  { name: 'twitter:description', content: DEFAULT_DESCRIPTION },
  { name: 'twitter:image', content: BANNER_URL },
];

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: appCss },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'icon',
    type: 'image/png',
    href: '/images/logo.png',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#050810" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
