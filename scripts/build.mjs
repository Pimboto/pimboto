// Draws every panel of the profile into assets/ and writes the README. Run: npm run build
import fs from 'node:fs';
import path from 'node:path';
import * as icons from 'simple-icons';
import { Doc, C, RAMP, ROOT, rng, clamp, n, write } from './lib.mjs';
import { stack, SITE, CONTACT } from './data/profile.mjs';

const W = 880;
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const tierOf = (v) => (v < 0.16 ? 0 : v < 0.34 ? 1 : v < 0.55 ? 2 : v < 0.78 ? 3 : 4);
const pad2 = (i) => String(i).padStart(2, '0');
/* times keep three decimals: rounded to a tenth, the deals of a flicker drift apart and leave holes */
const sec = (v) => +v.toFixed(3);

/* ══ the television: the boot screen ═══════════════════════
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
    `.a{animation:sa ${sec(STEP_A * 4)}s steps(1) infinite}`,
    `.b{animation:sb ${sec(STEP_B * 3)}s steps(1) infinite}`,
    '@keyframes sa{0%{visibility:visible}25%,100%{visibility:hidden}}',
    '@keyframes sb{0%{visibility:visible}33.3%,100%{visibility:hidden}}',
    `.p{opacity:0;animation:pu ${PULSE}s steps(1) infinite}`,
    '@keyframes pu{0%{opacity:.95}1.7%{opacity:.4}3.4%,100%{opacity:0}}',
    /* the row reaches the letters and they flare */
    `.tg{opacity:.5;animation:tg ${PULSE}s steps(1) ${sec(rows * RISE)}s infinite}`,
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
  dealA.forEach((d, k) => doc.add(`<g class="a a${k}" style="animation-delay:${k ? sec(-(4 - k) * STEP_A) : 0}s">${doc.field(d, { size: fs })}</g>`));
  dealB.forEach((d, k) => doc.add(`<g class="b b${k}" style="animation-delay:${k ? sec(-(3 - k) * STEP_B) : 0}s">${doc.field(d, { size: fs })}</g>`));
  pulse.forEach((cells, row) => {
    if (cells.length) doc.add(`<g class="p" style="animation-delay:${sec((rows - 1 - row) * RISE)}s">${doc.field(cells, { size: fs })}</g>`);
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

/* ══ the printout ══════════════════════════════════════════
   The introduction comes off a dot-matrix printer on green-bar paper:
   tractor holes down both edges, a torn perforation top and bottom.
   Each line is printed under a strip of paper the colour of its own
   bar; the strip slides right one letter at a time and the print head
   rides its edge. When the page is done it holds, then a fresh sheet
   is fed and printed again. */
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
  const ROW = 24, STRIP = 34, PAD = 22, size = 15.5;
  const PAPER = '#e7f3eb', BAR = '#d2e8da', INK = '#10301f', FAINT = '#3d8a61';
  const rows = [{ text: 'PIMBO.DEV // ABOUT.TXT', fill: FAINT, right: 'OPEN TO WORK / REMOTE', printed: true }, null];
  ABOUT.forEach(([prompt, answer], i) => {
    if (i) rows.push(null);
    rows.push({ text: prompt, fill: FAINT, pause: 0.35 });
    for (const line of wrap(answer, 76)) rows.push({ text: line, fill: INK, pause: 0.12 });
  });
  const H = PAD + rows.length * ROW + PAD;
  const doc = new Doc(W, H, { title: 'About', desc: ABOUT.map((pair) => pair[1]).join(' '), flat: true });
  const x0 = STRIP + 24, x1 = W - STRIP - 24;
  const cw = doc.width('0', { size, font: 'osd' });
  /* bars two lines deep, the way the paper comes */
  const band = (k) => (Math.floor(k / 2) % 2 ? BAR : PAPER);
  const top = (k) => PAD + k * ROW;

  /* ── the sheet: torn along the perforation, punched down both edges ── */
  let edge = 'M0 5';
  for (let x = 0; x < W; x += 8) edge += `L${x + 4} 0L${Math.min(W, x + 8)} 5`;
  edge += `L${W} ${H - 5}`;
  for (let x = W; x > 0; x -= 8) edge += `L${x - 4} ${H}L${Math.max(0, x - 8)} ${H - 5}`;
  edge += 'z';
  let holes = '';
  for (let y = 16; y < H - 8; y += 24) holes += `<circle cx="17" cy="${y}" r="4.6"/><circle cx="${W - 17}" cy="${y}" r="4.6"/>`;
  const speck = rng(31);
  let fibre = '';
  for (let i = 0; i < 90; i++) fibre += `<rect x="${Math.floor(speck() * 120)}" y="${Math.floor(speck() * 120)}" width="${1 + Math.floor(speck() * 3)}" height="1" fill="#2b5a41" opacity="${(0.03 + speck() * 0.06).toFixed(2)}"/>`;
  doc.def(
    `<mask id="sheet"><path d="${edge}" fill="#fff"/><g fill="#000">${holes}</g></mask>`,
    `<pattern id="fb" width="120" height="120" patternUnits="userSpaceOnUse">${fibre}</pattern>`,
    `<clipPath id="ta"><rect x="${x0 - 2}" y="0" width="${x1 - x0 + 4}" height="${H}"/></clipPath>`,
  );
  let bars = '';
  rows.forEach((_, k) => { if (band(k) === BAR) bars += `<rect x="0" y="${top(k)}" width="${W}" height="${ROW}"/>`; });

  /* ── the lines, and the clock they are printed on ── */
  const DT = 0.03, HOLD = 16, FEED = 1.2;
  let t = 0.9, text = '', covers = '', keys = '', head = '';
  const typed = [];
  rows.forEach((row, k) => {
    if (!row) return;
    const y = top(k) + 17;
    text += doc.text(row.text, { x: x0, y, size, font: 'osd', fill: row.fill });
    if (row.right) text += doc.text(row.right, { x: x1, y, size: 11, font: 'osd', fill: row.fill, anchor: 'end', ls: 0.8 });
    if (row.printed) return;
    t += row.pause;
    const count = [...row.text].length;
    typed.push({ k, count, from: t, to: t + count * DT });
    t += count * DT;
  });
  const period = Math.ceil(t + HOLD + FEED);
  const pc = (time) => +((time / period) * 100).toFixed(3);
  const reset = pc(period - FEED);
  typed.forEach((row, i) => {
    const w = +(row.count * cw).toFixed(2);
    covers += `<rect class="cv" style="animation-name:cv${i}" x="${x0 - 2}" y="${top(row.k)}" width="${x1 - x0 + 4}" height="${ROW}" fill="${band(row.k)}"/>`;
    keys += `@keyframes cv${i}{0%,100%{visibility:visible;transform:none}${pc(row.from)}%{transform:none;animation-timing-function:steps(${row.count})}${pc(row.to)}%{transform:translateX(${w}px)}${reset}%{transform:none}}`;
    const y = top(row.k) - top(typed[0].k);
    head += `${pc(row.from)}%{transform:translate(0,${y}px);animation-timing-function:steps(${row.count})}${pc(row.to)}%{transform:translate(${w}px,${y}px)}`;
  });
  doc.style(
    /* with motion turned off the strips stay away and the page is simply printed */
    '.cv,.hd{visibility:hidden}',
    `.cv{animation-duration:${period}s;animation-timing-function:steps(1);animation-iteration-count:infinite}`,
    keys,
    `.hd{animation:hd ${period}s steps(1) infinite}`,
    `@keyframes hd{0%,100%{visibility:visible;transform:none}${head}${reset}%{transform:none}}`,
  );
  doc.add(
    '<g mask="url(#sheet)">',
    `<rect width="${W}" height="${H}" fill="${PAPER}"/>`,
    `<g fill="${BAR}">${bars}</g>`,
    `<rect width="${W}" height="${H}" fill="url(#fb)"/>`,
    `<path d="M${STRIP} 0V${H}M${W - STRIP} 0V${H}" stroke="#9cbfab" stroke-dasharray="2 4" fill="none"/>`,
    text,
    `<g clip-path="url(#ta)">${covers}<rect class="hd" x="${x0}" y="${top(typed[0].k) + 4}" width="${n(cw)}" height="16" fill="${INK}"/></g>`,
    '</g>',
    `<path d="${edge}" fill="none" stroke="#a9c7b6"/>`,
  );
  return doc.render();
}

/* ── hardware shared by the rack and the analyzer ── */
function screw(x, y, turn) {
  const a = (turn * Math.PI) / 180, dx = Math.cos(a) * 3, dy = Math.sin(a) * 3;
  return `<circle cx="${x}" cy="${y}" r="4.2" fill="#0a0c0b" stroke="#353d39"/><path d="M${n(x - dx)} ${n(y - dy)}L${n(x + dx)} ${n(y + dy)}" stroke="#3d4642" stroke-width="1.2"/>`;
}
const PLATE = '<linearGradient id="pn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#181c1a"/><stop offset="1" stop-color="#0e1110"/></linearGradient>';
const BLUR = '<filter id="haze" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter>';
const led = (x, y, cls = '') => `<circle cx="${x}" cy="${y}" r="7" fill="${C.t3}" opacity=".22" filter="url(#haze)"/><circle${cls} cx="${x}" cy="${y}" r="3" fill="${C.t3}"/>`;

/* ══ the rack ══════════════════════════════════════════════
   The stack is a rack of modules, one per layer, each a row of
   backlit keys. A check runs across the keys one at a time, the way
   an old machine counts its memory. */
function stackPanel() {
  const count = stack.reduce((sum, g) => sum + g.tools.length, 0);
  const RAIL = 24, HEAD = 56, GAP = 3, keyH = 28, gap = 6, fs = 12;
  const left = 54, keysX = 246, maxX = W - 50;
  const doc = new Doc(W, 100, {
    title: 'What runs in production',
    desc: stack.map((g) => `${g.title} ${g.note}: ${g.tools.map((t) => t[0]).join(', ')}.`).join(' '),
    flat: true,
  });

  let y = 6 + HEAD + GAP;
  const modules = stack.map((group) => {
    const top = y;
    let x = keysX, rowY = top + 17;
    const keys = group.tools.map(([name, slug]) => {
      const w = Math.ceil(8 + 13 + 7 + doc.width(name, { size: fs }) + 10);
      if (x + w > maxX) { x = keysX; rowY += keyH + gap; }
      const key = { name, slug, x, y: rowY, w };
      x += w + gap;
      return key;
    });
    const height = Math.max(rowY + keyH + 17 - top, 82);
    y += height + GAP;
    return { ...group, top, height, keys };
  });
  const H = y + 3;
  doc.h = H;

  const STEP = 0.16, period = sec(count * STEP + 2.4);
  doc.style(
    `.lit{opacity:0;animation:lit ${period}s steps(1) infinite}`,
    `@keyframes lit{0%{opacity:1}${sec((STEP * 100) / period)}%{opacity:.45}${sec((STEP * 200) / period)}%,100%{opacity:0}}`,
    '.pw{animation:pw 3.2s steps(1) infinite}@keyframes pw{92%{opacity:.35}}',
  );
  doc.def(PLATE, BLUR);
  const turn = rng(8);
  const panel = (py, ph) => [
    `<rect x="${RAIL}" y="${py}" width="${W - RAIL * 2}" height="${ph}" rx="3" fill="url(#pn)"/>`,
    `<rect x="${RAIL + 2}" y="${py}" width="${W - RAIL * 2 - 4}" height="1" fill="#2f3733"/>`,
    screw(RAIL + 12, py + 12, turn() * 180), screw(W - RAIL - 12, py + 12, turn() * 180),
    screw(RAIL + 12, py + ph - 12, turn() * 180), screw(W - RAIL - 12, py + ph - 12, turn() * 180),
  ].join('');

  /* ── the frame and its rails ── */
  let slots = '';
  for (let sy = 14; sy < H - 10; sy += 22) slots += `<rect x="8" y="${sy}" width="8" height="5" rx="2.5"/><rect x="${W - 16}" y="${sy}" width="8" height="5" rx="2.5"/>`;
  doc.add(
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="#060807" stroke="#262d29"/>`,
    `<g fill="#000" stroke="#1d2421">${slots}</g>`,
  );

  /* ── the top unit: what this rack is ── */
  const tag = 'STACK';
  const tw = doc.width(tag, { size: 19, font: 'osd', ls: 1.5 });
  doc.add(
    panel(6, HEAD),
    led(left + 3, 6 + HEAD / 2, ' class="pw"'),
    doc.text(tag, { x: left + 18, y: 6 + HEAD / 2 + 7, size: 19, font: 'osd', fill: C.t3, ls: 1.5 }),
    doc.text('WHAT RUNS IN PRODUCTION', { x: left + 18 + tw + 18, y: 6 + HEAD / 2 + 5, size: 13, font: 'osd', fill: C.t4, ls: 1.4 }),
    doc.text(`${count} TOOLS / ${stack.length} LAYERS`, { x: maxX, y: 6 + HEAD / 2 + 5, size: 11, font: 'osd', fill: C.label, ls: 0.8, anchor: 'end' }),
  );

  let k = 0;
  const seen = new Set();
  for (const mod of modules) {
    const { top } = mod;
    let bar = '', dark = '';
    for (let i = 0; i < 16; i++) {
      const seg = `<rect x="${left + i * 7}" y="${top + 55}" width="5" height="7"/>`;
      if (i < mod.tools.length) bar += seg; else dark += seg;
    }
    doc.add(
      panel(top, mod.height),
      doc.text(mod.title, { x: left, y: top + 29, size: 13, font: 'osd', fill: C.t4, ls: 1 }),
      doc.text(mod.note, { x: left, y: top + 45, size: 10.5, font: 'mono', fill: C.soft }),
      `<g fill="#16271d">${dark}</g><g fill="${C.t2}">${bar}</g>`,
      doc.text(pad2(mod.tools.length), { x: left + 16 * 7 + 5, y: top + 62.5, size: 10, font: 'osd', fill: C.label }),
    );
    for (const key of mod.keys) {
      let mark;
      if (key.slug) {
        const icon = icons[`si${key.slug[0].toUpperCase()}${key.slug.slice(1)}`];
        if (!icon) throw new Error(`Simple Icons has no "${key.slug}"`);
        if (!seen.has(key.slug)) { seen.add(key.slug); doc.def(`<path id="i-${key.slug}" d="${icon.path}"/>`); }
        mark = `<use href="#i-${key.slug}" transform="translate(${key.x + 8} ${key.y + 7.5}) scale(.5417)" fill="${C.t3}"/>`;
      } else {
        /* no logo to borrow: a plain marker */
        mark = `<path d="M${key.x + 14.5} ${key.y + 9}l5 5l-5 5l-5 -5z" fill="none" stroke="${C.t3}" stroke-width="1.4"/>`;
      }
      doc.add(
        `<rect x="${key.x + 0.5}" y="${key.y + 0.5}" width="${key.w - 1}" height="${keyH - 1}" rx="4" fill="#08100c" stroke="#1f3d2d"/>`,
        `<rect x="${key.x + 3}" y="${key.y + 1.5}" width="${key.w - 6}" height="1" fill="#3a6a50" opacity=".45"/>`,
        mark,
        doc.text(key.name, { x: key.x + 28, y: key.y + 18.5, size: fs, fill: '#d3eede' }),
        `<rect class="lit" style="animation-delay:${sec(k * STEP)}s" x="${key.x + 0.5}" y="${key.y + 0.5}" width="${key.w - 1}" height="${keyH - 1}" rx="4" fill="${C.t3}" fill-opacity=".2" stroke="${C.t4}"/>`,
      );
      k++;
    }
  }
  return doc.render();
}

/* ══ the analyzer ══════════════════════════════════════════
   A year of contributions on a spectrum analyzer: one band per week,
   green up to amber up to red, with the totals on seven-segment
   readouts underneath. Only the top light of each band flickers. */
const SEGMENTS = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abfgcd' };
function sevenSeg(value, x, y) {
  const w = 15, h = 28, t = 3.2, half = h / 2;
  const shape = {
    a: [2.5, 0, w - 5, t], d: [2.5, h - t, w - 5, t], g: [2.5, half - t / 2, w - 5, t],
    f: [0, 2.5, t, half - 4], b: [w - t, 2.5, t, half - 4], e: [0, half + 1.5, t, half - 4], c: [w - t, half + 1.5, t, half - 4],
  };
  let on = '', off = '';
  [...String(value)].forEach((digit, i) => {
    for (const [name, [sx, sy, sw, sh]] of Object.entries(shape)) {
      const r = `<rect x="${n(x + i * 21 + sx)}" y="${n(y + sy)}" width="${n(sw)}" height="${n(sh)}" rx="1"/>`;
      if (SEGMENTS[digit].includes(name)) on += r; else off += r;
    }
  });
  return { on, off, width: String(value).length * 21 - 6 };
}

function signal(contrib) {
  const H = 332, ROWS = 12;
  const days = contrib.weeks.flat();
  let longest = 0, run = 0;
  for (const d of days) { run = d.count ? run + 1 : 0; longest = Math.max(longest, run); }
  const active = days.filter((d) => d.count).length;
  const best = Math.max(...days.map((d) => d.count));
  const doc = new Doc(W, H, {
    title: 'Signal',
    desc: `${contrib.total.toLocaleString('en-US')} contributions in the last 12 months. Longest streak ${longest} days, ${active} active days, ${best} on the busiest day.`,
    flat: true,
  });
  const AMBER = '#ffc247';
  doc.def(PLATE, BLUR, '<linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".07"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></linearGradient>');
  doc.style(
    '.pw{animation:pw 3.2s steps(1) infinite}@keyframes pw{92%{opacity:.35}}',
    /* the top lights flicker in four groups, each on its own clock */
    ...[0.9, 1.3, 1.7, 2.3].map((p, i) => `.pk${i}{animation:pk ${p}s steps(1) ${sec(-i * 0.37)}s infinite}`),
    '@keyframes pk{62%{opacity:.3}}',
  );

  /* ── the faceplate ── */
  doc.add(
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="url(#pn)" stroke="#262d29"/>`,
    `<rect x="12" y="1" width="${W - 24}" height="1" fill="#333b37"/>`,
    screw(15, 15, 30), screw(W - 15, 15, 110), screw(15, H - 15, 75), screw(W - 15, H - 15, 150),
    led(41, 33, ' class="pw"'),
    doc.text('SIGNAL', { x: 56, y: 40, size: 19, font: 'osd', fill: C.t3, ls: 1.5 }),
    doc.text('CONTRIBUTIONS PER WEEK', { x: 56 + doc.width('SIGNAL', { size: 19, font: 'osd', ls: 1.5 }) + 18, y: 38, size: 13, font: 'osd', fill: C.t4, ls: 1.4 }),
    doc.text('LAST 12 MONTHS', { x: W - 38, y: 38, size: 11, font: 'osd', fill: C.label, ls: 0.8, anchor: 'end' }),
  );

  /* ── the display ── */
  const wx = 30, wy = 56, ww = W - 60, wh = 176;
  const weeks = contrib.weeks.map((week) => week.reduce((sum, d) => sum + d.count, 0));
  const peak = Math.max(...weeks);
  const pitch = 15, segW = 10, segH = 9, rowPitch = 12;
  const gx = wx + (ww - (weeks.length * pitch - (pitch - segW))) / 2;
  const base = wy + wh - 16;
  const ink = (row) => (row >= ROWS - 2 ? C.red : row >= ROWS - 4 ? AMBER : row >= 5 ? C.t3 : C.t2);
  const lit = new Map(), tops = ['', '', '', ''];
  let dark = '';
  const pick = rng(53);
  weeks.forEach((total, w) => {
    /* one busy week would flatten the rest, so the scale is compressed */
    const level = total ? clamp(Math.ceil(ROWS * Math.pow(total / peak, 0.55)), 1, ROWS) : 0;
    for (let row = 0; row < ROWS; row++) {
      const r = `<rect x="${n(gx + w * pitch)}" y="${base - segH - row * rowPitch}" width="${segW}" height="${segH}" rx="1.5" fill="${ink(row)}"/>`;
      if (row >= level) dark += r;
      else if (row === level - 1) tops[Math.floor(pick() * 4)] += r;
      else lit.set(ink(row), (lit.get(ink(row)) ?? '') + r);
    }
  });
  doc.add(
    `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="7" fill="#020403" stroke="#000" stroke-width="2"/>`,
    `<rect x="${wx - 1.5}" y="${wy - 1.5}" width="${ww + 3}" height="${wh + 3}" rx="8.5" fill="none" stroke="#2c3430"/>`,
    `<g opacity=".1">${dark}</g>`,
    `<g id="bars">${[...lit.values()].join('')}${tops.map((t, i) => `<g class="pk${i}">${t}</g>`).join('')}</g>`,
    '<use href="#bars" filter="url(#haze)" opacity=".55"/>',
    `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="7" fill="url(#gs)"/>`,
  );
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  let lastMonth = -1, lastLabel = -9;
  contrib.weeks.forEach((week, w) => {
    const month = new Date(`${week[0].date}T00:00:00Z`).getUTCMonth();
    if (month !== lastMonth && w - lastLabel > 2 && w < contrib.weeks.length - 1) {
      doc.add(doc.text(MONTHS[month], { x: gx + w * pitch, y: base + 11, size: 8.5, font: 'osd', fill: C.label, ls: 0.6 }));
      lastLabel = w;
    }
    lastMonth = month;
  });

  /* ── the readouts ── */
  const stats = [[contrib.total, 'CONTRIBUTIONS'], [longest, 'DAY STREAK'], [active, 'ACTIVE DAYS'], [best, 'BUSIEST DAY']];
  let on = '', off = '';
  stats.forEach(([value, label], i) => {
    const x = 30 + i * 212, y = 252;
    const seg = sevenSeg(value, x + 11, y + 10);
    on += seg.on;
    off += seg.off;
    doc.add(
      `<rect x="${x}" y="${y}" width="${seg.width + 22}" height="48" rx="5" fill="#020403" stroke="#2c3430"/>`,
      doc.text(label, { x: x + seg.width + 32, y: y + 28, size: 9.5, font: 'osd', fill: C.label, ls: 0.8 }),
    );
  });
  doc.add(
    `<g fill="#0d2217">${off}</g><g id="num" fill="${C.t3}">${on}</g><use href="#num" filter="url(#haze)" opacity=".6"/>`,
  );
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

/* ══ sign-off: the test card ═══════════════════════════════
   What a station leaves on screen when it goes off the air, set in
   characters: eight bars, each filled with one glyph of the ramp,
   densest to faintest. A bright row runs down it. */
function footer() {
  const H = 150, BARS = 8;
  const doc = new Doc(W, H, { title: 'End of transmission', desc: 'End of transmission. More at pimbo.dev. Made in Colombia.', flat: true });
  const cw = 8.2, ch = 11.6, size = 11;
  const cols = Math.floor((W - 28) / cw), rows = Math.floor((H - 22) / ch);
  const ox = (W - cols * cw) / 2, oy = (H - rows * ch) / 2;
  const INK = [C.t4, C.t3, C.t3, C.t2, C.t2, C.t1, C.t1, C.t0];
  const still = [], pulse = Array.from({ length: rows }, () => []);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = ox + (col + 0.5) * cw, y = oy + (row + 0.8) * ch;
      if (Math.abs(x - W / 2) < 214 && row >= 3 && row < rows - 3) continue;
      const bar = Math.min(BARS - 1, Math.floor((col / cols) * BARS));
      still.push({ x, y, ch: RAMP[9 - bar], fill: INK[bar] });
      pulse[row].push({ x, y, ch: RAMP[9 - bar], fill: C.white });
    }
  }
  const FALL = 0.09, period = sec(rows * FALL + 4.5);
  doc.def(BLUR);
  doc.style(
    `.p{opacity:0;animation:pu ${period}s steps(1) infinite}`,
    `@keyframes pu{0%{opacity:.9}${sec((FALL * 100) / period)}%{opacity:.35}${sec((FALL * 200) / period)}%,100%{opacity:0}}`,
  );
  doc.add(
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="#040706" stroke="#262d29"/>`,
    doc.field(still, { size }),
  );
  pulse.forEach((cells, row) => doc.add(`<g class="p" style="animation-delay:${sec(row * FALL)}s">${doc.field(cells, { size })}</g>`));
  doc.add(
    `<g id="eot">${doc.text('END OF TRANSMISSION', { x: W / 2, y: H / 2 + 2, size: 24, font: 'osd', fill: C.white, ls: 3, anchor: 'middle' })}</g>`,
    '<use href="#eot" filter="url(#haze)" opacity=".8"/>',
    doc.text('MORE AT PIMBO.DEV  /  MADE IN COLOMBIA', { x: W / 2, y: H / 2 + 26, size: 10.5, font: 'osd', fill: C.t3, ls: 1.2, anchor: 'middle' }),
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
