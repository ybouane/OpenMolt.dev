import React from 'react';
import type { LinksFunction } from 'react-router';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import appCss from './app.css?url';

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
