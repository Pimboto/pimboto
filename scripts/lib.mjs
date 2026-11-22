// Shared drawing kit for the profile panels.
// GitHub shows README SVGs as images: no scripts, no web fonts, no embedded bitmaps.
// So every letter is drawn as an outline taken from the font files at build time,
// and every animation is plain CSS inside the SVG.
//
// A Doc is either a flat plate or the tube of an old television. On the tube the
// glass bulges, so nothing is drawn where it was laid out: every point goes through `warp` first, which pulls
// the picture in toward the corners the way a curved screen does. Text rows bow,
// straight rules become arcs, and the scanlines curve with them.
//
// Animations only ever move in steps. A browser redraws the whole image, filters
// and all, each time a value changes, so a smooth 60-a-second drift would cost far
// more than a picture that ticks a few times a second, which is also what a tube does.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const load = (rel) => {
  const buf = fs.readFileSync(path.join(ROOT, rel));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};

export const FONTS = {
  osd: load('scripts/fonts/DepartureMono-Regular.otf'),
  mono: load('node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff'),
  monob: load('node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-800-normal.woff'),
};

/* the palette: one phosphor, from nearly off to white-hot */
export const C = {
  t0: '#1a4a33',
  t1: '#23804f',
  t2: '#35b874',
  t3: '#62f0a6',
  t4: '#c4ffe0',
  white: '#f1fff7',
  soft: '#8fb5a1',
  label: '#3aa56d',
  red: '#ff4a3d',
  chromaR: '#ff2d55',
  chromaC: '#22e0ff',
};

/* lightest to densest; the first is a blank */
export const RAMP = [' ', '.', ':', '-', '=', '+', '*', '#', '%', '@'];

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const n = (v) => +v.toFixed(1);

/* a seeded random, so a rebuild draws the same picture */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export class Doc {
  /* bezel: the plastic around the glass. foot: extra plastic under it, for a label.
     bulge: how far, in px, the glass pulls the picture in at the corners. flat: a plate, no tube. */
  constructor(w, h, { title, desc, bezel = 12, foot = 0, bulge = 16, flat = false }) {
    Object.assign(this, { w, h, title, desc, bezel, foot, flat });
    this.sx = bezel;
    this.sy = bezel;
    this.sw = w - bezel * 2;
    this.sh = h - bezel * 2 - foot;
    this.cx = this.sx + this.sw / 2;
    this.cy = this.sy + this.sh / 2;
    this.kx = flat ? 0 : Math.min(bulge / (this.sw / 2), 0.1);
    this.ky = flat ? 0 : Math.min(bulge / (this.sh / 2), 0.14);
    this.glyphs = new Map();
    this.defs = [];
    this.css = [];
    this.body = [];
    this.over = [];
  }

  /* the curve of the glass: the further a point sits from one axis, the more it is pulled toward the other */
  warp(x, y) {
    const u = (x - this.cx) / (this.sw / 2), v = (y - this.cy) / (this.sh / 2);
    return [this.cx + (x - this.cx) * (1 - this.kx * v * v), this.cy + (y - this.cy) * (1 - this.ky * u * u)];
  }

  /* a polyline through the glass: long runs are cut up so they bend instead of staying straight */
  wpath(points, closed = false) {
    let d = '';
    const emit = (x, y, first) => { const [a, b] = this.warp(x, y); d += `${first ? 'M' : 'L'}${n(a)} ${n(b)}`; };
    const count = closed ? points.length : points.length - 1;
    emit(points[0][0], points[0][1], true);
    for (let i = 0; i < count; i++) {
      const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length];
      const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 40));
      for (let k = 1; k <= steps; k++) {
        if (closed && i === count - 1 && k === steps) break;
        emit(x1 + ((x2 - x1) * k) / steps, y1 + ((y2 - y1) * k) / steps, false);
      }
    }
    return closed ? `${d}z` : d;
  }

  rect(x, y, w, h) { return this.wpath([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true); }
  line(x1, y1, x2, y2) { return this.wpath([[x1, y1], [x2, y2]]); }

  /* a rounded rectangle walked as points, then put through the glass: the outline of the tube */
  tube(grow = 0, radius = 34) {
    const x = this.sx - grow, y = this.sy - grow, w = this.sw + grow * 2, h = this.sh + grow * 2;
    const r = Math.min(radius + grow, h / 2 - 1);
    const pts = [];
    const side = (x1, y1, x2, y2) => { const s = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 22); for (let k = 0; k < s; k++) pts.push([x1 + ((x2 - x1) * k) / s, y1 + ((y2 - y1) * k) / s]); };
    const arc = (ax, ay, from) => { for (let k = 0; k < 7; k++) { const a = from + (k / 7) * (Math.PI / 2); pts.push([ax + Math.cos(a) * r, ay + Math.sin(a) * r]); } };
    side(x + r, y, x + w - r, y); arc(x + w - r, y + r, -Math.PI / 2);
    side(x + w, y + r, x + w, y + h - r); arc(x + w - r, y + h - r, 0);
    side(x + w - r, y + h, x + r, y + h); arc(x + r, y + h - r, Math.PI / 2);
    side(x, y + h - r, x, y + r); arc(x + r, y + r, Math.PI);
    return 'M' + pts.map(([px, py]) => this.warp(px, py).map(n).join(' ')).join('L') + 'z';
  }

  /* each letter outline is defined once and stamped wherever it is used */
  gid(fontKey, ch) {
    const key = fontKey + ch;
    let g = this.glyphs.get(key);
    if (!g) {
      const font = FONTS[fontKey];
      const glyph = font.charToGlyph(ch);
      if (glyph.index === 0 && ch !== ' ') throw new Error(`font "${fontKey}" has no glyph for "${ch}"`);
      g = { id: 'g' + this.glyphs.size.toString(36), d: glyph.getPath(0, 0, font.unitsPerEm).toPathData(0), adv: glyph.advanceWidth };
      this.glyphs.set(key, g);
    }
    return g;
  }

  width(str, { size, font = 'mono', ls = 0 }) {
    const f = FONTS[font];
    const s = size / f.unitsPerEm;
    let w = 0;
    for (const ch of str) w += f.charToGlyph(ch).advanceWidth * s + ls;
    return w - ls;
  }

  /* a run of text as stamped outlines, each letter set where the glass puts it.
     raw: laid out straight, for what sits on the plastic or moves as one piece */
  text(str, { x, y, size, font = 'mono', fill = C.t3, anchor = 'start', ls = 0, cls, style, opacity, raw = false }) {
    const f = FONTS[font];
    const s = size / f.unitsPerEm;
    const w = this.width(str, { size, font, ls });
    let px = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
    let out = '';
    for (const ch of str) {
      const g = this.gid(font, ch);
      if (ch !== ' ') {
        const [a, b] = raw ? [px, y] : this.warp(px, y);
        out += `<use href="#${g.id}" x="${Math.round(a / s)}" y="${Math.round(b / s)}"/>`;
      }
      px += g.adv * s + ls;
    }
    const attrs = `${cls ? ` class="${cls}"` : ''}${style ? ` style="${style}"` : ''}${opacity != null ? ` opacity="${opacity}"` : ''}`;
    return `<g transform="scale(${+s.toFixed(5)})" fill="${fill}"${attrs}>${out}</g>`;
  }

  /* display type as one path, every point of every letter bent by the glass */
  headline(str, { x, y, size, font = 'osd', anchor = 'start', ls = 0 }) {
    const f = FONTS[font];
    const w = this.width(str, { size, font, ls });
    let px = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    const x0 = px;
    const p = (a, b) => this.warp(a, b).map(n).join(' ');
    let d = '';
    for (const ch of str) {
      const glyph = f.charToGlyph(ch);
      for (const c of glyph.getPath(px, y, size).commands) {
        if (c.type === 'M' || c.type === 'L') d += `${c.type}${p(c.x, c.y)}`;
        else if (c.type === 'Q') d += `Q${p(c.x1, c.y1)} ${p(c.x, c.y)}`;
        else if (c.type === 'C') d += `C${p(c.x1, c.y1)} ${p(c.x2, c.y2)} ${p(c.x, c.y)}`;
        else d += 'z';
      }
      px += (glyph.advanceWidth * size) / f.unitsPerEm + ls;
    }
    return { d, w, x0 };
  }

  /* a field of characters: cells are { x, y, ch, fill }, x the cell's centre, y its baseline */
  field(cells, { size, font = 'monob' }) {
    const f = FONTS[font];
    const s = size / f.unitsPerEm;
    const byFill = new Map();
    for (const c of cells) {
      if (c.ch === ' ') continue;
      if (!byFill.has(c.fill)) byFill.set(c.fill, '');
      const g = this.gid(font, c.ch);
      const [a, b] = this.warp(c.x, c.y);
      byFill.set(c.fill, byFill.get(c.fill) + `<use href="#${g.id}" x="${Math.round((a - (g.adv * s) / 2) / s)}" y="${Math.round(b / s)}"/>`);
    }
    let out = '';
    for (const [fill, uses] of byFill) out += `<g fill="${fill}">${uses}</g>`;
    return `<g transform="scale(${+s.toFixed(5)})">${out}</g>`;
  }

  add(...parts) { this.body.push(...parts); }
  /* drawn on the plastic, above the glass */
  top(...parts) { this.over.push(...parts); }
  style(...rules) { this.css.push(...rules); }
  def(...parts) { this.defs.push(...parts); }

  render() {
    const { w, h } = this;
    const glyphDefs = [...this.glyphs.values()].map((g) => `<path id="${g.id}" d="${g.d}"/>`).join('');
    const head = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(this.title)}</title>
<desc id="d">${esc(this.desc)}</desc>`;
    if (this.flat) {
      return `${head}
<style>
${this.css.join('\n')}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>
<defs>
${glyphDefs}
${this.defs.join('\n')}
</defs>
${this.body.join('\n')}
</svg>
`;
    }
    return `${head}
<style>
/* the picture slips sideways for a frame now and then: the horizontal hold letting go */
.hold{animation:hold 6.7s steps(1) infinite}
@keyframes hold{0%,62.4%,100%{transform:none}61%{transform:translateX(4px)}61.7%{transform:translateX(-3px)}}
/* a soft bright bar rolls down the tube */
.hum{animation:hum 8s steps(40) infinite}
@keyframes hum{from{transform:translateY(-160px)}to{transform:translateY(${h + 40}px)}}
/* the snow never sits still */
.snow{animation:snow .51s steps(1) infinite}
@keyframes snow{33%{transform:translate(-37px,23px)}66%{transform:translate(19px,-41px)}}
.flk{opacity:0;animation:flk 4.3s steps(1) infinite}
@keyframes flk{0%,9%,33%,59%,100%{opacity:0}7%{opacity:.03}31%{opacity:.02}58%{opacity:.045}}
${this.css.join('\n')}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>
<defs>
${glyphDefs}
<clipPath id="scr"><path d="${this.tube()}"/></clipPath>
<linearGradient id="bz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c211e"/><stop offset=".5" stop-color="#111412"/><stop offset="1" stop-color="#090b0a"/></linearGradient>
<radialGradient id="bg" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#0a130e"/><stop offset="1" stop-color="#020403"/></radialGradient>
<radialGradient id="vg" cx=".5" cy=".5" r=".72"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset=".84" stop-color="#000" stop-opacity=".42"/><stop offset="1" stop-color="#000" stop-opacity=".92"/></radialGradient>
<radialGradient id="gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".13"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<linearGradient id="hb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfffe0" stop-opacity="0"/><stop offset=".5" stop-color="#bfffe0" stop-opacity=".055"/><stop offset="1" stop-color="#bfffe0" stop-opacity="0"/></linearGradient>
<pattern id="sn" width="160" height="160" patternUnits="userSpaceOnUse">${snow()}</pattern>
<pattern id="mk" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="1" height="3" fill="#f00"/><rect x="1" width="1" height="3" fill="#0f0"/><rect x="2" width="1" height="3" fill="#00f"/></pattern>
<filter id="glow" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="haze" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>
${this.defs.join('\n')}
</defs>
<rect width="${w}" height="${h}" rx="26" fill="url(#bz)"/>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="25.5" fill="none" stroke="#2b322e"/>
<path d="${this.tube(5)}" fill="#010201"/>
<g clip-path="url(#scr)">
<rect x="${this.sx}" y="${this.sy}" width="${this.sw}" height="${this.sh}" fill="url(#bg)"/>
<g class="hold">
${this.body.join('\n')}
</g>
<path d="${this.scanlines()}" stroke="#000" stroke-width="1.25" opacity=".46" fill="none"/>
<rect x="${this.sx}" y="${this.sy}" width="${this.sw}" height="${this.sh}" fill="url(#mk)" opacity=".05"/>
<g class="snow"><rect x="${this.sx - 60}" y="${this.sy - 60}" width="${this.sw + 120}" height="${this.sh + 120}" fill="url(#sn)"/></g>
<g class="hum"><rect x="${this.sx}" y="0" width="${this.sw}" height="150" fill="url(#hb)"/></g>
<rect x="${this.sx}" y="${this.sy}" width="${this.sw}" height="${this.sh}" fill="url(#vg)"/>
<ellipse cx="${n(this.sx + this.sw * 0.27)}" cy="${n(this.sy + this.sh * 0.08)}" rx="${n(this.sw * 0.42)}" ry="${n(Math.max(60, this.sh * 0.3))}" fill="url(#gl)"/>
<rect class="flk" x="${this.sx}" y="${this.sy}" width="${this.sw}" height="${this.sh}" fill="#d9ffe9"/>
</g>
<path d="${this.tube(0.5)}" fill="none" stroke="#000" stroke-width="3" opacity=".8"/>
<path d="${this.tube(5)}" fill="none" stroke="#2a312d" stroke-opacity=".7"/>
${this.over.join('\n')}
</svg>
`;
  }

  /* one arc per line: a straight row seen through the glass is a parabola, which a single curve draws exactly */
  scanlines() {
    let d = '';
    const x0 = this.sx - 8, x1 = this.sx + this.sw + 8;
    const u = (x1 - this.cx) / (this.sw / 2);
    for (let y = this.sy - 6; y < this.sy + this.sh + 6; y += 3.2) {
      const edge = this.cy + (y - this.cy) * (1 - this.ky * u * u);
      d += `M${n(x0)} ${n(edge)}Q${n(this.cx)} ${n(2 * y - edge)} ${n(x1)} ${n(edge)}`;
    }
    return d;
  }
}

/* one tile of static: specks of a few sizes and strengths */
function snow() {
  const r = rng(404);
  let out = '';
  for (let i = 0; i < 420; i++) {
    const big = r() < 0.12;
    out += `<rect x="${Math.floor(r() * 160)}" y="${Math.floor(r() * 160)}" width="${big ? 2 : 1}" height="1" fill="#dfffee" opacity="${(0.05 + r() * r() * 0.3).toFixed(2)}"/>`;
  }
  return out;
}

export const write = (name, svg) => {
  const file = path.join(ROOT, 'assets', name);
  fs.writeFileSync(file, svg);
  return `${name} ${(svg.length / 1024).toFixed(1)}kB`;
};
