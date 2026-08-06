import { DEFAULTS } from '@cursorkit/engine';
import { SITE_ORIGIN } from '@/lib/config';
import {
  CORE,
  EFFECT_CHUNKS,
  HOVER_CHUNKS,
  STYLE_CHUNKS,
} from '@/lib/embed-assets.generated';

/**
 * Serves a cursor bundle tailored to the query string.
 *
 * The whole library is ~26kb gzipped, which is far too much to ask of a site
 * that wants one cursor. So this route ships the engine core plus exactly the
 * one style and one click effect that were requested — typically under 10kb
 * gzipped, and never over 12.
 *
 * The response is a plain concatenation rather than a re-bundle: chunks are
 * pre-compiled IIFEs that register themselves against the core's global, so
 * assembling a configuration is string joining and nothing more. That is what
 * makes it cheap enough to run at the edge on every request.
 */

export const runtime = 'edge';
// Caching is expressed through the response's own Cache-Control rather than a
// route segment option: configuration lives entirely in the query string, so
// every distinct embed is already a distinct, independently cacheable URL and
// the CDN can hold it indefinitely.

const YEAR = 31536000;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const q = url.searchParams;

  const styleId = pick(q.get('style'), STYLE_CHUNKS, DEFAULTS.style);
  const effectId = pick(q.get('click'), EFFECT_CHUNKS, DEFAULTS.click);
  const hoverId = pick(q.get('hover'), HOVER_CHUNKS, DEFAULTS.hover);

  const body = [
    banner(styleId, effectId, hoverId),
    CORE,
    STYLE_CHUNKS[styleId],
    EFFECT_CHUNKS[effectId],
    HOVER_CHUNKS[hoverId],
    // Config is re-read at runtime from this script tag's own src, so query
    // params and `data-*` attributes are both honoured without the server
    // needing to serialise anything.
    'CursorKit.boot(CursorKit.readScriptOptions());',
  ].join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'text/javascript; charset=utf-8',
      // Immutable because the URL fully determines the bytes. A visitor who
      // changes one parameter simply requests a different, uncached URL.
      'cache-control': `public, max-age=3600, s-maxage=${YEAR}, immutable`,
      'access-control-allow-origin': '*',
      'cross-origin-resource-policy': 'cross-origin',
      'x-content-type-options': 'nosniff',
      'x-cursorkit-style': styleId,
      'x-cursorkit-click': effectId,
      'x-cursorkit-hover': hoverId,
    },
  });
}

/** Falls back to the default rather than 404ing — a typo should still give a cursor. */
function pick(requested: string | null, table: Record<string, string>, fallback: string): string {
  const id = (requested || '').trim();
  if (id && Object.prototype.hasOwnProperty.call(table, id)) return id;
  return Object.prototype.hasOwnProperty.call(table, fallback)
    ? fallback
    : Object.keys(table)[0];
}

const banner = (style: string, click: string, hover: string) =>
  `/*! CursorKit — ${style} + ${click} + ${hover} · ${SITE_ORIGIN} */`;
