import React, { useEffect, useState, useRef } from 'react';

interface CodeBlockProps {
  code: string;
  lang?: string;
}

/**
 * Syntax-highlighted code block using Shiki (github-dark theme).
 * Falls back to plain <pre><code> during SSR and until the client loads Shiki.
 */
export function CodeBlock({ code, lang = 'typescript' }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Debounce so rapidly-changing code (playground) doesn't spam Shiki
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      let cancelled = false;
      import('shiki').then(({ codeToHtml }) => {
        codeToHtml(code, {
          lang,
          theme: 'github-dark',
          transformers: [
            {
              pre(node) {
                // Strip the inline background so our CSS stays in control
                if (node.properties) {
                  delete node.properties['style'];
                  delete node.properties['tabindex'];
                }
              },
            },
          ],
        }).then((highlighted) => {
          if (!cancelled) setHtml(highlighted);
        });
      });
      return () => {
        cancelled = true;
      };
    }, 150);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [code, lang]);

  if (!html) {
    return (
      <pre>
        <code>{code}</code>
      </pre>
    );
  }

  return <div className="shiki-wrapper" dangerouslySetInnerHTML={{ __html: html }} />;
}
