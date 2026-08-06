'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The embed tag, with a copy button.
 *
 * Highlighting is done by splitting the tag on its own structure rather than
 * running a syntax highlighter — it is always a script tag with a URL, and
 * three regexes beat a 30kb dependency for one line of markup.
 */
export function CopyLine({ value, label = 'Embed tag' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard can be blocked by permissions policy; the text is selectable
      // either way, so fall through to the same confirmation.
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-rule px-3 py-2">
        <span className="eyebrow">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-dim transition-colors hover:text-signal"
          data-cursor-label={copied ? 'Copied' : 'Copy'}
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <pre className="code border-0 bg-transparent">
        <code>{highlight(value)}</code>
      </pre>
    </div>
  );
}

/** Splits `<script src="...?a=b&c=d"></script>` into coloured spans. */
function highlight(tag: string) {
  const m = tag.match(/^(<script src=")([^"?]*)(\?[^"]*)?("><\/script>)$/);
  if (!m) return tag;
  const [, open, url, query = '', close] = m;
  const parts = query
    ? query
        .slice(1)
        .split('&')
        .map((pair, i) => {
          const [k, v = ''] = pair.split('=');
          return (
            <span key={k + i}>
              <span className="tok-tag">{i === 0 ? '?' : '&'}</span>
              <span className="tok-attr">{k}</span>
              <span className="tok-tag">=</span>
              <span className="tok-str">{v}</span>
            </span>
          );
        })
    : null;

  return (
    <>
      <span className="tok-tag">{open}</span>
      <span>{url}</span>
      {parts}
      <span className="tok-tag">{close}</span>
    </>
  );
}
