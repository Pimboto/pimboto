// Draws every panel of the profile into assets/ and writes the README. Run: npm run build
import fs from 'node:fs';
import path from 'node:path';
import * as icons from 'simple-icons';
import { Doc, C, FONTS, RAMP, ROOT, rng, clamp, n, channel, write } from './lib.mjs';
import { stack, SITE, CONTACT } from './data/profile.mjs';

const W = 880;
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const tierOf = (v) => (v < 0.16 ? 0 : v < 0.34 ? 1 : v < 0.55 ? 2 : v < 0.78 ? 3 : 4);
const pad2 = (i) => String(i).padStart(2, '0');

/* ══ channel 1: the boot screen ════════════════════════════
   The name stands on a mountain of characters: dense under the
   letters, thinning to dashes and then single dots as the slope runs
   out to the edges. The picture itself is still. What moves are a few
   layers laid over it: some hot cells re-deal their glyph, a bright
   row climbs the slope and the letters flare when it arrives, and now
   and then the title tears apart for an instant. */
function hero() {
  const H = 562;
  const doc = new Doc(W, H, {
    title: 'PIMBO.DEV',
    desc: 'An old television, switched on. The name PIMBO.DEV stands on a mountain drawn in characters. Full-stack developer, Colombia, UTC-5.',
    bezel: 14, foot: 34, bulge: 22,
  });
  const { cx } = doc;
  const left = doc.sx + 46, right = doc.sx + doc.sw - 46, bottom = doc.sy + doc.sh;
  const r = rng(20261118);
  /* the slope stays green: white-hot is kept for the letters and the climbing row */
  const GREENS = [C.t0, C.t1, C.t2, C.t3, '#8df7bf'];

  const NAME = 'PIMBO.DEV', TITLE_Y = 262;
  const size = 548 / doc.width(NAME, { size: 1, font: 'osd' });
  const head = doc.headline(NAME, { x: cx, y: TITLE_Y, size, anchor: 'middle' });

  /* ── the mountain ── */
  const cw = 8.2, ch = 11.6, fs = 11;
  const cols = Math.floor(doc.sw / cw);
  const ox = doc.sx + (doc.sw - cols * cw) / 2;
  const y0 = TITLE_Y + 26;
  const rows = Math.ceil((bottom - y0) / ch) + 1;
  const hw0 = head.w / 2 + 2;
  const colNoise = Array.from({ length: cols }, () => r());
  /* a few columns run brighter from the top, a few are dark seams */
  const drip = colNoise.map(() => (r() < 0.3 ? 3 + Math.floor(r() * 9) : 0));
  const seam = colNoise.map(() => r() < 0.07);
  /* the captions in the bottom corners keep a clear box */
  const boxed = (x, y) => y > bottom - 58 && (x < left + 236 || x > right - 204);

  const still = [], dealA = [[], [], [], []], dealB = [[], [], []];
  const pulse = Array.from({ length: rows }, () => []);
  for (let row = 0; row < rows; row++) {
    const y = y0 + row * ch;
    const t = row / (rows - 1);
    /* a block as wide as the name for the first rows, then the slope flares out past the glass */
    const hw = hw0 + (W / 2 + 150 - hw0) * Math.pow(clamp((t - 0.1) / 0.9, 0, 1), 1.25);
    for (let col = 0; col < cols; col++) {
      const x = ox + (col + 0.5) * cw;
      if (boxed(x, y)) continue;
      const dx = Math.abs(x - cx);
      let v;
      if (dx < hw) {
        v = (0.2 + 0.8 * (1 - Math.pow(dx / hw, 1.1))) * (1 - 0.5 * t);
        if (dx < hw0) v += 0.22 * (1 - t) ** 2;
        v *= 0.72 + 0.5 * colNoise[col];
        if (drip[col] > row) v += 0.25 * (1 - row / drip[col]);
        if (seam[col]) v *= 0.35;
        v += (r() - 0.5) * 0.16;
      } else {
        /* past the slope: a thin field of dots, gone by the top of the screen */
        v = t > 0.2 && r() < 0.5 ? (0.06 + r() * 0.07) * clamp(1 - (dx - hw) / 300, 0, 1) : 0;
      }
      if (v < 0.035) continue;
      const idx = clamp(Math.floor(v * 9.6 + (r() - 0.5) * 1.2), 1, 9);
      const cell = { x, y, ch: RAMP[idx], fill: GREENS[tierOf(v)] };
      const u = r();
      if (v > 0.4 && u < 0.22) {
        dealA.forEach((d) => d.push({ ...cell, ch: RAMP[clamp(idx - 1 + Math.floor(r() * 4), 2, 9)] }));
      } else if (v > 0.4 && u < 0.4) {
        dealB.forEach((d) => d.push({ ...cell, ch: RAMP[clamp(idx - 1 + Math.floor(r() * 4), 2, 9)] }));
      } else {
        still.push(cell);
      }
      if (dx < hw && v > 0.14) pulse[row].push({ x, y, ch: RAMP[clamp(idx + 2, 4, 9)], fill: C.t4 });
    }
  }

  const STEP_A = 0.17, STEP_B = 0.23, RISE = 0.06, PULSE = 7;
  doc.style(
    /* two sets of hot cells re-deal on different clocks, so the flicker never reads as a loop */
    '.a,.b{visibility:hidden}.a0,.b0{visibility:visible}',
    `.a{animation:sa ${n(STEP_A * 4)}s steps(1) infinite}`,
    `.b{animation:sb ${n(STEP_B * 3)}s steps(1) infinite}`,
    '@keyframes sa{0%{visibility:visible}25%,100%{visibility:hidden}}',
    '@keyframes sb{0%{visibility:visible}33.3%,100%{visibility:hidden}}',
    `.p{opacity:0;animation:pu ${PULSE}s steps(1) infinite}`,
    '@keyframes pu{0%{opacity:.95}1.7%{opacity:.4}3.4%,100%{opacity:0}}',
    /* the row reaches the letters and they flare */
    `.tg{opacity:.5;animation:tg ${PULSE}s steps(1) ${n(rows * RISE)}s infinite}`,
    '@keyframes tg{0%{opacity:1}3%{opacity:.8}6%{opacity:.65}9%,100%{opacity:.5}}',
    /* the tear: colour fringes jump apart and the middle of the letters slips sideways */
    '.gr{animation:gr 9s steps(1) infinite}.gc{animation:gc 9s steps(1) infinite}.gm{animation:gm 9s steps(1) infinite}',
    '@keyframes gr{0%,96%,100%{transform:translate(-2.5px,0)}93%{transform:translate(-10px,0)}94.5%{transform:translate(5px,0)}}',
    '@keyframes gc{0%,96%,100%{transform:translate(2.5px,0)}93%{transform:translate(10px,0)}94.5%{transform:translate(-5px,0)}}',
    '@keyframes gm{0%,96%,100%{transform:none}93%{transform:translateX(18px)}94.5%{transform:translateX(-10px)}}',
    '.cur{animation:cur 1.1s steps(1) infinite}@keyframes cur{50%{opacity:0}}',
    '.rec{animation:rec 1.4s steps(1) infinite}@keyframes rec{50%{opacity:.15}}',
    /* the clock: a strip of digits behind a one-digit window */
    '.s1{animation:s1 10s steps(10) infinite}.s10{animation:s10 60s steps(6) infinite}',
    '@keyframes s1{to{transform:translateY(-280px)}}@keyframes s10{to{transform:translateY(-168px)}}',
    '.led{animation:led 3.2s steps(1) infinite}@keyframes led{92%{opacity:.35}}',
  );

  doc.add(`<g id="mtn">${doc.field(still, { size: fs })}</g>`);
  doc.add('<use href="#mtn" filter="url(#glow)" opacity=".5"/>');
  dealA.forEach((d, k) => doc.add(`<g class="a a${k}" style="animation-delay:${k ? n(-(4 - k) * STEP_A) : 0}s">${doc.field(d, { size: fs })}</g>`));
  dealB.forEach((d, k) => doc.add(`<g class="b b${k}" style="animation-delay:${k ? n(-(3 - k) * STEP_B) : 0}s">${doc.field(d, { size: fs })}</g>`));
  pulse.forEach((cells, row) => {
    if (cells.length) doc.add(`<g class="p" style="animation-delay:${n((rows - 1 - row) * RISE)}s">${doc.field(cells, { size: fs })}</g>`);
  });

  /* ── the title: glow, colour fringes, then the letters in three slices ── */
  const top = TITLE_Y - size * 0.8, cutA = TITLE_Y - size * 0.46, cutB = TITLE_Y - size * 0.24;
  doc.def(
    `<path id="ttl" d="${head.d}"/>`,
    `<clipPath id="k1"><rect x="0" y="${n(top)}" width="${W}" height="${n(cutA - top)}"/></clipPath>`,
    `<clipPath id="k2"><rect x="0" y="${n(cutA)}" width="${W}" height="${n(cutB - cutA)}"/></clipPath>`,
    `<clipPath id="k3"><rect x="0" y="${n(cutB)}" width="${W}" height="${n(size * 0.5)}"/></clipPath>`,
  );
  doc.add(
    `<use class="tg" href="#ttl" fill="${C.t3}" filter="url(#glow)"/>`,
    `<use class="gr" href="#ttl" fill="${C.chromaR}" stroke="${C.chromaR}" stroke-width="2.4" opacity=".8" transform="translate(-2.5 0)"/>`,
    `<use class="gc" href="#ttl" fill="${C.chromaC}" stroke="${C.chromaC}" stroke-width="2.4" opacity=".8" transform="translate(2.5 0)"/>`,
    `<g fill="${C.white}" stroke="${C.white}" stroke-width="2.4" stroke-linejoin="round">`,
    '<g clip-path="url(#k1)"><use href="#ttl"/></g>',
    '<g clip-path="url(#k2)"><g class="gm"><use href="#ttl"/></g></g>',
    '<g clip-path="url(#k3)"><use href="#ttl"/></g>',
    '</g>',
  );

  /* ── what the set prints over the picture ── */
  const OSD = '#8dffc0';
  const boot = '> BOOT';
  const bw = doc.width(boot, { size: 15, font: 'osd', ls: 1.6 });
  const clockW = doc.width('0:00:00', { size: 20, font: 'osd' });
  const liveW = doc.width('LIVE', { size: 20, font: 'osd', ls: 1.5 });
  const liveX = right - clockW - 22 - liveW;
  const osd = [
    doc.text('CH 01', { x: left, y: 78, size: 26, font: 'osd', fill: OSD, ls: 2 }),
    doc.text('LIVE', { x: liveX, y: 76, size: 20, font: 'osd', fill: OSD, ls: 1.5 }),
    doc.text('0:00:', { x: right - clockW, y: 76, size: 20, font: 'osd', fill: OSD }),
    doc.text(boot, { x: cx - bw / 2 - 8, y: top - 16, size: 15, font: 'osd', fill: OSD, ls: 1.6 }),
    doc.text('FULL-STACK DEVELOPER', { x: left, y: bottom - 32, size: 14, font: 'osd', fill: OSD, ls: 1.2 }),
    doc.text('COLOMBIA  UTC-5', { x: right, y: bottom - 32, size: 14, font: 'osd', fill: OSD, ls: 1.2, anchor: 'end' }),
  ];
  doc.add(`<g id="osd">${osd.join('')}</g>`, '<use href="#osd" filter="url(#haze)" opacity=".8"/>');
  doc.add(`<path class="cur" d="${doc.rect(cx + bw / 2 + 2, top - 29, 9, 14)}" fill="${OSD}"/>`);
  const [dotX, dotY] = doc.warp(liveX - 16, 69);
  doc.add(`<circle class="rec" cx="${n(dotX)}" cy="${n(dotY)}" r="5.5" fill="${C.red}"/>`);

  /* the two seconds digits sit behind a window; the strips move as one piece, so they are laid out straight */
  const digitW = doc.width('0', { size: 20, font: 'osd' });
  const sx0 = right - digitW * 2;
  const [wx, wy] = doc.warp(sx0, 76);
  const strip = (count, x, cls) => {
    let s = '';
    for (let i = 0; i <= count; i++) s += doc.text(String(i % count), { x, y: 76 + i * 28, size: 20, font: 'osd', fill: OSD, raw: true });
    return `<g class="${cls}">${s}</g>`;
  };
  doc.def(`<clipPath id="win"><rect x="${n(sx0 - 1)}" y="58" width="${n(digitW * 2 + 2)}" height="22"/></clipPath>`);
  doc.add(`<g transform="translate(${n(wx - sx0)} ${n(wy - 76)})"><g clip-path="url(#win)">${strip(6, sx0, 's10')}${strip(10, sx0 + digitW, 's1')}</g></g>`);

  /* ── the plastic under the glass: a maker's mark and a power light ── */
  const fy = H - 21;
  doc.top(
    doc.text('PIMBO.DEV', { x: 34, y: fy + 4, size: 11, font: 'osd', fill: '#4a544f', ls: 2.4, raw: true }),
    doc.text('POWER', { x: W - 58, y: fy + 4, size: 9, font: 'osd', fill: '#4a544f', ls: 1.6, anchor: 'end', raw: true }),
    `<circle cx="${W - 42}" cy="${fy}" r="7" fill="${C.t3}" opacity=".25" filter="url(#haze)"/>`,
    `<circle class="led" cx="${W - 42}" cy="${fy}" r="3.2" fill="${C.t3}"/>`,
    `<rect x="${W / 2 - 46}" y="${fy - 3}" width="92" height="6" rx="3" fill="#060807" stroke="#232a26"/>`,
  );
  return doc.render();
}

/* ══ channel 2: who is on air ═════════════════════════════
   The introduction, typed out by a terminal. Every letter has its own
   moment: it is off until the cursor reaches it, then stays lit until
   the next pass, when a short blank runs ahead of the cursor and the
   line is typed again. So the first pass writes on an empty screen and
   every later one reads as the tube refreshing the text. */
const ABOUT = [
  ['> whoami', "I'm Juan, a full-stack developer in Colombia."],
  ['> cat work.txt', 'I build web products end to end: interfaces, APIs and data, applied AI and deployment.'],
  ['> cat status.txt', 'I work remotely, in Spanish or English, with projects in production in Colombia, Mexico and the United States.'],
];

function wrap(text, max) {
  const lines = [''];
  for (const word of text.split(' ')) {
    const cur = lines[lines.length - 1];
    if (cur && cur.length + 1 + word.length > max) lines.push(word);
    else lines[lines.length - 1] = cur ? cur + ' ' + word : word;
  }
  return lines;
}

function about() {
  const left = 56, size = 15.5, lead = 25;
  const lines = [];
  for (const [prompt, answer] of ABOUT) {
    lines.push({ text: prompt, fill: C.label, gap: lines.length ? 12 : 0, pause: 0.35 });
    for (const line of wrap(answer, 76)) lines.push({ text: line, fill: C.white, gap: 0, pause: 0.12 });
  }
  const H = Math.round(118 + lines.length * lead + (ABOUT.length - 1) * 12 + 58);
  const doc = new Doc(W, H, { title: 'About', desc: ABOUT.map((pair) => pair[1]).join(' '), bulge: 18 });
  doc.add(channel(doc, { num: '02', label: 'ABOUT', note: 'OPEN TO WORK / REMOTE', y: 62 }));

  const font = FONTS.osd, s = size / font.unitsPerEm;
  const DT = 0.03, BLANK = 0.6;
  let t = 0.6, y = 118, endX = left, endY = y;
  const byFill = new Map();
  let cursors = '';
  for (const line of lines) {
    y += line.gap;
    t += line.pause;
    let x = left;
    for (const ch of line.text) {
      const g = doc.gid('osd', ch);
      if (ch !== ' ') {
        const [a, b] = doc.warp(x, y);
        byFill.set(line.fill, (byFill.get(line.fill) ?? '') + '<use class="ty" style="animation-delay:' + n(t * 100) / 100 + 's" href="#' + g.id + '" x="' + Math.round(a / s) + '" y="' + Math.round(b / s) + '"/>');
      }
      /* the cursor: a block that sits on each slot for the instant before its letter lands */
      cursors += '<path class="tc" style="animation-delay:' + n((t - DT) * 100) / 100 + 's" d="' + doc.rect(x, y - size * 0.78, g.adv * s, size * 0.98) + '"/>';
      x += g.adv * s;
      t += DT;
    }
    endX = x + 6;
    endY = y;
    y += lead;
  }
  const period = Math.ceil(t + 22);
  doc.style(
    '.ty,.tc{visibility:hidden}',
    '.ty{animation:ty ' + period + 's steps(1) infinite}',
    '@keyframes ty{0%{visibility:visible}' + n(((period - BLANK) / period) * 100) + '%,100%{visibility:hidden}}',
    '.tc{animation:tc ' + period + 's steps(1) infinite}',
    '@keyframes tc{0%{visibility:visible}' + (((DT * 2) / period) * 100).toFixed(3) + '%,100%{visibility:hidden}}',
    /* with motion turned off the text is simply there */
    '@media (prefers-reduced-motion: reduce){.ty{visibility:visible}}',
  );
  let text = '';
  for (const [fill, uses] of byFill) text += '<g fill="' + fill + '">' + uses + '</g>';
  doc.add(
    '<g id="say" transform="scale(' + +s.toFixed(5) + ')">' + text + '</g>',
    '<use href="#say" filter="url(#haze)" opacity=".55"/>',
    '<g fill="' + C.t3 + '">' + cursors + '</g>',
    /* typing done: the cursor rests after the last word */
    '<path class="ty" style="animation-delay:' + n(t * 100) / 100 + 's" d="' + doc.rect(endX, endY - size * 0.78, 9, size * 0.98) + '" fill="' + C.t3 + '"/>',
  );
  return doc.render();
}

/* ══ channel 3: the stack ══════════════════════════════════
   Layers of labelled keys. A check runs across the keys one at a
   time, the way an old machine counts its memory. */
function stackPanel() {
  const count = stack.reduce((sum, g) => sum + g.tools.length, 0);
  const chipH = 28, gap = 6, fs = 12;
  const left = 54, chipsX = 240, maxX = W - 54;

  /* laid out once to know how tall the glass is, then drawn */
  const layout = (doc) => {
    let y = 106;
    const groups = stack.map((group) => {
      const top = y;
      let x = chipsX, rowY = y;
      const chips = group.tools.map(([name, slug]) => {
        const w = Math.ceil(8 + 13 + 7 + doc.width(name, { size: fs }) + 10);
        if (x + w > maxX) { x = chipsX; rowY += chipH + gap; }
        const chip = { name, slug, x, y: rowY, w };
        x += w + gap;
        return chip;
      });
      y = Math.max(rowY + chipH, top + 50) + 30;
      return { ...group, top, chips };
    });
    return { groups, height: y + 14 };
  };
  const probe = new Doc(W, 400, { title: '', desc: '' });
  const { height } = layout(probe);

  const doc = new Doc(W, height, {
    title: 'What runs in production',
    desc: stack.map((g) => `${g.title} ${g.note}: ${g.tools.map((t) => t[0]).join(', ')}.`).join(' '),
    bulge: 20,
  });
  const { groups } = layout(doc);
  const STEP = 0.16, period = n(count * STEP + 2.4);
  doc.style(
    `.lit{opacity:0;animation:lit ${period}s steps(1) infinite}`,
    `@keyframes lit{0%{opacity:1}${n((STEP * 100) / period)}%{opacity:.45}${n((STEP * 200) / period)}%,100%{opacity:0}}`,
  );
  doc.add(channel(doc, { num: '03', label: 'WHAT RUNS IN PRODUCTION', note: `${count} TOOLS / ${stack.length} LAYERS`, y: 62 }));

  let k = 0;
  const seen = new Set();
  groups.forEach((group, gi) => {
    const y = group.top;
    if (gi) doc.add(`<path d="${doc.line(left, y - 15, maxX, y - 15)}" stroke="${C.t0}" stroke-opacity=".8" fill="none"/>`);
    doc.add(
      doc.text(group.title, { x: left, y: y + 13, size: 13, font: 'osd', fill: C.t4, ls: 1 }),
      doc.text(group.note, { x: left, y: y + 30, size: 10.5, font: 'mono', fill: C.soft }),
    );
    let pips = '';
    group.tools.forEach((_, i) => { pips += doc.rect(left + i * 7, y + 40, 4, 7); });
    doc.add(
      `<path d="${pips}" fill="${C.t2}"/>`,
      doc.text(pad2(group.tools.length), { x: left + group.tools.length * 7 + 6, y: y + 47.5, size: 10, font: 'osd', fill: C.label }),
    );
    for (const chip of group.chips) {
      const box = doc.rect(chip.x + 0.5, chip.y + 0.5, chip.w - 1, chipH - 1);
      const [ix, iy] = doc.warp(chip.x + 8, chip.y + 7.5);
      let mark;
      if (chip.slug) {
        const icon = icons[`si${chip.slug[0].toUpperCase()}${chip.slug.slice(1)}`];
        if (!icon) throw new Error(`Simple Icons has no "${chip.slug}"`);
        if (!seen.has(chip.slug)) { seen.add(chip.slug); doc.def(`<path id="i-${chip.slug}" d="${icon.path}"/>`); }
        mark = `<use href="#i-${chip.slug}" transform="translate(${n(ix)} ${n(iy)}) scale(.5417)" fill="${C.t3}"/>`;
      } else {
        /* no logo to borrow: a plain marker */
        mark = `<path d="M${n(ix + 6.5)} ${n(iy + 1.5)}l5 5l-5 5l-5 -5z" fill="none" stroke="${C.t3}" stroke-width="1.4"/>`;
      }
      doc.add(
        `<path d="${box}" fill="#07120c" stroke="#1d4630"/>`,
        mark,
        doc.text(chip.name, { x: chip.x + 28, y: chip.y + 18.5, size: fs, fill: '#d3eede' }),
        `<path class="lit" style="animation-delay:${n(k * STEP)}s" d="${box}" fill="${C.t3}" fill-opacity=".18" stroke="${C.t4}"/>`,
      );
      k++;
    }
  });
  return doc.render();
}

/* ══ channel 4: the signal ═════════════════════════════════
   A year of contributions, one character per day: the busier the day,
   the denser the glyph. A playhead walks the weeks. */
function signal(contrib) {
  const H = 322;
  const days = contrib.weeks.flat();
  const total = contrib.total.toLocaleString('en-US');
  let longest = 0, run = 0;
  for (const d of days) { run = d.count ? run + 1 : 0; longest = Math.max(longest, run); }
  const active = days.filter((d) => d.count).length;
  const best = Math.max(...days.map((d) => d.count));
  const doc = new Doc(W, H, {
    title: 'Signal',
    desc: `${total} contributions in the last 12 months. Longest streak ${longest} days, ${active} active days, ${best} on the busiest day.`,
    bulge: 18,
  });
  doc.add(channel(doc, { num: '04', label: 'SIGNAL', note: 'LAST 12 MONTHS', y: 62 }));

  const left = 54, gx = 112, gy = 130, px = 13.5, py = 15.5;
  /* GitHub's own levels are quartiles of the busiest day, and one huge day flattens the rest.
     Rank among the active days instead: each fifth of them gets its own glyph. */
  const ranked = days.filter((d) => d.count).map((d) => d.count).sort((a, b) => a - b);
  const level = (count) => (count ? 1 + Math.min(4, Math.floor((ranked.findIndex((c) => c >= count) / ranked.length) * 5)) : 0);
  const GLYPH = ['·', ':', '=', '+', '#', '@'];
  const INK = [C.t0, C.t1, C.t2, C.t2, C.t3, C.t4];
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const cells = [];
  let lastMonth = -1, lastLabel = -9;
  contrib.weeks.forEach((week, w) => {
    const month = new Date(`${week[0].date}T00:00:00Z`).getUTCMonth();
    if (month !== lastMonth && w - lastLabel > 2 && w < contrib.weeks.length - 1) {
      doc.add(doc.text(MONTHS[month], { x: gx + w * px - 5, y: gy - 22, size: 9.5, font: 'osd', fill: C.label, ls: 0.6 }));
      lastLabel = w;
    }
    lastMonth = month;
    for (const d of week) {
      const row = new Date(`${d.date}T00:00:00Z`).getUTCDay();
      cells.push({ x: gx + w * px, y: gy + row * py, ch: GLYPH[level(d.count)], fill: INK[level(d.count)] });
    }
  });
  ['MON', 'WED', 'FRI'].forEach((label, i) => doc.add(doc.text(label, { x: left, y: gy + (1 + i * 2) * py - 1, size: 9.5, font: 'osd', fill: C.label, ls: 0.6 })));
  doc.add(`<g id="sig">${doc.field(cells, { size: 12.5 })}</g>`, '<use href="#sig" filter="url(#haze)" opacity=".6"/>');

  const weeks = contrib.weeks.length;
  doc.style(`.ph{animation:ph ${n(weeks * 0.2)}s steps(${weeks}) infinite}@keyframes ph{to{transform:translateX(${n(weeks * px)}px)}}`);
  doc.add(`<g class="ph"><rect x="${n(gx - px / 2)}" y="${gy - 14}" width="${px}" height="${n(7 * py + 3)}" fill="${C.t3}" opacity=".16"/><rect x="${n(gx - px / 2)}" y="${gy - 17}" width="${px}" height="2" fill="${C.t4}"/></g>`);

  const stats = [[total, 'CONTRIBUTIONS'], [`${longest} D`, 'LONGEST STREAK'], [`${active}/${days.length}`, 'ACTIVE DAYS'], [String(best), 'BUSIEST DAY']];
  stats.forEach(([value, label], i) => {
    const x = left + i * 200;
    doc.add(
      doc.text(value, { x, y: gy + 134, size: 22, font: 'osd', fill: C.t4 }),
      doc.text(label, { x, y: gy + 150, size: 9.5, font: 'osd', fill: C.label, ls: 0.8 }),
    );
  });
  return doc.render();
}

/* ══ the two keys under the intro ══════════════════════════ */
function button(label, primary) {
  const w = 232, h = 52;
  const doc = new Doc(w, h, { title: label, desc: label, flat: true });
  const ink = primary ? '#04110a' : C.t4;
  const tw = doc.width(label, { size: 14, font: 'osd', ls: 1.4 });
  const x = (w - tw - 22) / 2;
  doc.def('<pattern id="ln" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".28"/></pattern>');
  doc.add(
    primary
      ? `<rect width="${w}" height="${h}" rx="14" fill="${C.t3}"/>`
      : `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="13" fill="#060a08" stroke="${C.t2}" stroke-width="1.5"/>`,
    doc.text(label, { x, y: 31, size: 14, font: 'osd', fill: ink, ls: 1.4 }),
    `<path d="M${n(x + tw + 10)} 31l9 -9m-7 0h7v7" fill="none" stroke="${ink}" stroke-width="1.8"/>`,
    `<rect width="${w}" height="${h}" rx="14" fill="url(#ln)"/>`,
  );
  return doc.render();
}

/* ══ sign-off ══════════════════════════════════════════════
   The station has gone off the air: snow, dealt three ways and cycled. */
function footer() {
  const H = 176;
  const doc = new Doc(W, H, { title: 'End of transmission', desc: 'End of transmission. More at pimbo.dev. Made in Colombia.', bulge: 16 });
  const cw = 8.2, ch = 11.6, cols = Math.floor(doc.sw / cw), rows = Math.ceil(doc.sh / ch);
  const ox = doc.sx + (doc.sw - cols * cw) / 2;
  const r = rng(77);
  doc.style(
    '.n{visibility:hidden}.n0{visibility:visible}',
    '.n{animation:sn .54s steps(1) infinite}@keyframes sn{0%{visibility:visible}33.3%,100%{visibility:hidden}}',
  );
  for (let k = 0; k < 3; k++) {
    const cells = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = ox + (col + 0.5) * cw, y = doc.sy + (row + 0.8) * ch;
        if (r() > 0.55 || (Math.abs(x - W / 2) < 216 && y > 52 && y < 126)) continue;
        const v = r() * r();
        cells.push({ x, y, ch: RAMP[1 + Math.floor(v * 8)], fill: v > 0.5 ? C.t2 : v > 0.2 ? C.t1 : C.t0 });
      }
    }
    doc.add(`<g class="n n${k}" style="animation-delay:${k ? n(-(3 - k) * 0.18) : 0}s">${doc.field(cells, { size: 11 })}</g>`);
  }
  doc.add(
    `<g id="eot">${doc.text('END OF TRANSMISSION', { x: W / 2, y: 92, size: 24, font: 'osd', fill: C.white, ls: 3, anchor: 'middle' })}</g>`,
    '<use href="#eot" filter="url(#haze)" opacity=".8"/>',
    doc.text('MORE AT PIMBO.DEV  /  MADE IN COLOMBIA', { x: W / 2, y: 116, size: 10.5, font: 'osd', fill: C.t3, ls: 1.2, anchor: 'middle' }),
  );
  return doc.render();
}

/* ══ the page itself ═══════════════════════════════════════
   The README is written from the same data as the panels. Every
   picture carries its content as alt text. */
function readme(contrib) {
  const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const tools = stack.map((g) => `${g.title.toLowerCase()}: ${g.tools.map((t) => t[0]).join(', ')}`).join('; ');
  return `<a href="${SITE}"><img src="assets/hero.svg" width="100%" alt="PIMBO.DEV. Full-stack developer, Colombia, UTC-5."></a>

<img src="assets/about.svg" width="100%" alt="${attr(ABOUT.map((pair) => pair[1]).join(' '))}">

<p>
  <a href="${SITE}"><img src="assets/btn-site.svg" height="44" alt="pimbo.dev"></a>
  <a href="${CONTACT}"><img src="assets/btn-talk.svg" height="44" alt="Let's talk"></a>
</p>

<img src="assets/stack.svg" width="100%" alt="${attr(`What runs in production. ${tools}.`)}">

<img src="assets/signal.svg" width="100%" alt="${contrib.total.toLocaleString('en-US')} contributions in the last 12 months, one character per day.">

<a href="${SITE}"><img src="assets/footer.svg" width="100%" alt="End of transmission. More at pimbo.dev. Made in Colombia."></a>
`;
}

const contrib = readJson('scripts/data/contrib.json');
fs.writeFileSync(path.join(ROOT, 'README.md'), readme(contrib));

const built = [
  write('hero.svg', hero()),
  write('about.svg', about()),
  write('stack.svg', stackPanel()),
  write('signal.svg', signal(contrib)),
  write('btn-site.svg', button('PIMBO.DEV', true)),
  write('btn-talk.svg', button("LET'S TALK", false)),
  write('footer.svg', footer()),
];
console.log(built.join('\n'));
