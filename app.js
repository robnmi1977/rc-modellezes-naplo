// RC modellezés – statikus változat a claude.ai "RC modellezés" dashboardból.
// Az adatok a data/ mappából jönnek (pillanatkép), a számítások az eredeti dashboard logikáját követik.
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const num = (v) => v == null || v === '' ? null : +v;

// ---------- 1:10 ----------
const CARS10 = [
  {id: 'zs-srx2', pl: 'Zsombor', md: 'Serpent SRX2 Gen3', sp: '2WD buggy'},
  {id: 'zs-sdx4', pl: 'Zsombor', md: 'Serpent SDX4 Evo', sp: '4WD buggy'},
  {id: 'hu-srx2', pl: 'Huni', md: 'Serpent SRX2 Gen3', sp: '2WD buggy'},
  {id: 'hu-sdx4', pl: 'Huni', md: 'Serpent SDX4 Evo', sp: '4WD buggy'},
  {id: 'rob-srx4', pl: 'RoB', md: 'Serpent SRX4', sp: '4WD buggy'},
  {id: '4x-base', pl: 'RoB', md: 'Serpent 4X EVO Base', sp: '4WD túraautó', x4: 'base'},
  {id: '4x-light', pl: 'Huni', md: 'Serpent 4X EVO Light', sp: '4WD túraautó', x4: 'light'}
];
const NAV10 = ['zs-srx2', 'zs-sdx4', 'hu-srx2', 'hu-sdx4', '4x-light', 'rob-srx4', '4x-base'];
const CAR = {'zs-srx2': 'Zsombor · SRX2', 'zs-sdx4': 'Zsombor · SDX4', 'hu-srx2': 'Huni · SRX2', 'hu-sdx4': 'Huni · SDX4', 'rob-srx4': 'RoB · SRX4', '4x-base': 'RoB · 4X Base', '4x-light': 'Huni · 4X Light'};
const CAR_ORD = {'zs-srx2': 0, 'zs-sdx4': 1, 'hu-srx2': 2, 'hu-sdx4': 3, '4x-light': 4, 'rob-srx4': 5, '4x-base': 6};
const evType = (e) => /verseny/i.test(e) ? 'race' : /edzés/i.test(e) ? 'train' : /felkészülés/i.test(e) ? 'prep' : 'home';
const EV_LABEL = {race: 'Verseny', train: 'Edzés', prep: 'Felkészülés', home: 'Szerelés'};
const ev8Type = (t) => /verseny|race|\bMB\b|futam/i.test(t) ? 'race' : /edzés|teszt/i.test(t) ? 'train' : /felkész/i.test(t) ? 'prep' : 'home';
const EV8_LABEL = {race: 'Verseny', train: 'Edzés / teszt', prep: 'Felkészülés', home: 'Szerelés'};

const isDiff = (t) => {
  const ks = [...t.matchAll(/(?<![\d.,])\d{1,2}(?:[.,]\d)?\s?k(?![a-z])/gi)];
  return ks.some((k) => !/brake|drive|pwm|fq|freq/i.test(t.slice(Math.max(0, k.index - 12), k.index + k[0].length + 8))) ||
    (/diff/i.test(t) && /(?<![\d.])\d{1,2}\s?-\s?\d{1,2}\s?-\s?\d{1,2}(?![\d.])/.test(t));
};
const isShock = (t) => /(?<![\d.,])[3-9]\d[05](?![\d.,])(?!\s?(?:mm|g\b|kv|kw|mah|fok|°|lb))/i.test(t);

function parseLog(v) {
  const COLS = {2: 'zs-srx2', 3: 'zs-sdx4', 4: 'hu-srx2', 5: 'hu-sdx4', 6: 'rob-srx4', 7: 'linkek'};
  const pilot = v[0] || [], model = v[1] || [];
  model.forEach((m, c) => { if (c > 7 && /4\s*X/i.test(String(m || ''))) COLS[c] = /light/i.test(String(m)) ? '4x-light' : '4x-base'; });
  const rows = [];
  let date = '', event = '';
  v.forEach((r, i) => {
    if (i < 2) return;
    if (r[0]) { date = String(r[0]).trim(); event = String(r[1] || '').trim(); }
    Object.keys(COLS).forEach((c) => {
      const t = String(r[c] || '').trim();
      if (!t) return;
      rows.push({id: (i + 1) + '-' + COLS[c], row: i + 1, car: COLS[c], pilot: String(pilot[c] || '').trim(), model: String(model[c] || '').trim(),
        date: i === 2 ? '' : date, event: i === 2 ? '' : event, item: t, kind: +c === 7 ? 'link' : i === 2 ? 'alap' : 'szerviz'});
    });
  });
  return rows;
}

function calc10(log) {
  const s = log.filter((r) => r.kind === 'szerviz');
  const autok = CARS10.map(({id: car}) => {
    const c = s.filter((r) => r.car === car);
    const last = c.slice().sort((a, b) => b.row - a.row)[0];
    return {car, n: c.length, last_date: last ? last.date : '', last_event: last ? last.event : ''};
  });
  const ev = new Map();
  s.forEach((r) => { const k = r.date + '|' + r.event; if (!ev.has(k)) ev.set(k, {row: r.row, date: r.date, event: r.event, items: []}); ev.get(k).items.push(r); });
  const last = s.slice().sort((a, b) => b.row - a.row)[0] || {};
  const osszesito = {bejegyzes: s.length, esemeny: ev.size, verseny: [...ev.values()].filter((e) => /versenynap/i.test(e.event)).length, utolso: last.date || '', utolso_esemeny: last.event || ''};
  const esemenyek = [...ev.values()].sort((a, b) => b.row - a.row);
  const olaj = ['zs-srx2', 'zs-sdx4', 'hu-srx2', 'hu-sdx4', 'rob-srx4'].map((car) => {
    const dEv = new Set(), sEv = new Set(); let dl = null, sl = null;
    s.filter((r) => r.car === car).forEach((r) => {
      const k = r.date + '|' + r.event;
      if (isDiff(r.item)) { dEv.add(k); if (!dl || r.row > dl.row) dl = r; }
      if (isShock(r.item)) { sEv.add(k); if (!sl || r.row > sl.row) sl = r; }
    });
    const any = log.find((r) => r.car === car) || {};
    return {car, pilot: any.pilot || '', model: any.model || '', diff_n: dEv.size, diff_last: dl ? dl.date : '', shock_n: sEv.size, shock_last: sl ? sl.date : ''};
  });
  return {autok, osszesito, esemenyek, olaj};
}

// ---------- 1:8 ----------
const Y8 = ['2026', '2025', '2024', '2023'];
function parse8(v, YEAR) {
  const s = (x) => String(x == null ? '' : x).replace(/\s+/g, ' ').trim();
  const h = v.findIndex((r) => (r || []).slice(1).filter((c) => /buggy|truggy/i.test(String(c || ''))).length >= 2);
  if (h < 0) return [];
  const cars = [];
  (v[h] || []).forEach((c, i) => {
    const t = s(c);
    if (i === 0 || !t) return;
    const p = t.split(' ');
    cars.push({i, car: YEAR + '-' + i, pilot: p[0], model: p.slice(1).join(' ').replace(/\s*E-?BUGGY$/i, '') || t});
  });
  const bIsCar = cars.some((c) => c.i === 1);
  const evs = []; let ev = null;
  const open = (date) => { ev = {k: evs.length + 1, date, labels: []}; evs.push(ev); };
  const out = [];
  for (let i = h + 1; i < v.length; i++) {
    const r = v[i] || [];
    const A = s(r[0]);
    if (/^20\d\d\s*[.\-]/.test(A)) open(A);
    else if (A) { if (!ev) open(''); ev.labels.push(A); }
    const B = bIsCar ? '' : s(r[1]);
    if (B) { if (!ev) open(''); ev.labels.push(B); }
    cars.forEach((c) => {
      const t = String(r[c.i] == null ? '' : r[c.i]).trim();
      if (!t) return;
      if (!ev) open('');
      out.push({id: (i + 1) + '-' + c.i, row: i + 1, ev, car: c.car, pilot: c.pilot, model: c.model, item: t});
    });
  }
  return out.map((o) => ({id: o.id, row: o.row, ev: o.ev.k, car: o.car, col: Number(o.car.split('-')[1]), pilot: o.pilot, model: o.model, date: o.ev.date, event: o.ev.labels.join(' · '), item: o.item}));
}
function calc8(rows) {
  const m = new Map();
  rows.forEach((r) => {
    const c = m.get(r.car) || {car: r.car, col: r.col, pilot: r.pilot, model: r.model, n: 0, last_row: 0, last_date: '', last_event: '', dEv: new Set(), sEv: new Set(), diff_last: '', diff_row: 0, shock_last: '', shock_row: 0};
    c.n += 1;
    if (r.row > c.last_row) { c.last_row = r.row; c.last_date = r.date; c.last_event = r.event; }
    if (isDiff(r.item)) { c.dEv.add(r.ev); if (r.row > c.diff_row) { c.diff_row = r.row; c.diff_last = r.date || r.event; } }
    if (isShock(r.item)) { c.sEv.add(r.ev); if (r.row > c.shock_row) { c.shock_row = r.row; c.shock_last = r.date || r.event; } }
    m.set(r.car, c);
  });
  const autok = [...m.values()].sort((a, b) => a.col - b.col).map((c) => ({...c, diff_n: c.dEv.size, shock_n: c.sEv.size}));
  const ev = new Map();
  rows.forEach((r) => { if (!ev.has(r.ev)) ev.set(r.ev, {ev: r.ev, date: r.date, event: r.event, items: []}); ev.get(r.ev).items.push(r); });
  const last = rows.slice().sort((a, b) => b.row - a.row)[0] || {};
  const osszesito = {bejegyzes: rows.length, esemeny: ev.size, verseny: [...ev.values()].filter((e) => /verseny|race|\bMB\b|futam/i.test(e.date + ' ' + e.event)).length, utolso: last.date || '', utolso_esemeny: last.event || ''};
  return {autok, osszesito, esemenyek: [...ev.values()].sort((a, b) => b.ev - a.ev)};
}

// ---------- Versenyek ----------
const RES_NAME = {rob: 'RoB', zs: 'Zsombor', hu: 'Hunor'};
const RES_COL = {'1/8': 'var(--rc-red)', '1/10': 'var(--rc-blue)'};
const resKpi = (rows) => {
  const r = rows.filter((x) => num(x.final_rank) != null);
  const g = r.map((x) => num(x.gap_pct)).filter((x) => x != null);
  return {starts: r.length, wins: r.filter((x) => num(x.final_rank) === 1).length, podiums: r.filter((x) => num(x.final_rank) <= 3).length,
    a_final_pct: r.length ? Math.round(r.filter((x) => x.final_group === 'A').length / r.length * 100) : 0,
    avg_gap: g.length ? +d3.mean(g).toFixed(2) : null, best_gap: g.length ? +d3.min(g).toFixed(2) : null};
};
const resAgg = (rows, keyf) => d3.groups(rows.filter((x) => num(x.final_rank) != null), keyf).map(([k, v]) => ({key: k, starts: v.length,
  avg_q: +(d3.mean(v, (x) => num(x.qualy_rank)) || 0).toFixed(1), avg_f: +d3.mean(v, (x) => num(x.final_rank)).toFixed(1),
  best_f: d3.min(v, (x) => num(x.final_rank)), wins: v.filter((x) => num(x.final_rank) === 1).length, podiums: v.filter((x) => num(x.final_rank) <= 3).length,
  avg_gap: +(d3.mean(v, (x) => num(x.gap_pct)) || 0).toFixed(2), best_lap: d3.min(v, (x) => num(x.my_best))}));
const resYear = (rows) => resAgg(rows, (x) => String(x.year) + ',' + x.scale).map((o) => ({...o, year: o.key.split(',')[0], scale: o.key.split(',')[1]}))
  .sort((a, b) => b.year.localeCompare(a.year) || a.scale.localeCompare(b.scale));
const resVenue = (rows) => resAgg(rows, (x) => x.venue + ',' + x.scale).map((o) => ({...o, venue: o.key.split(',')[0], scale: o.key.split(',')[1]}))
  .sort((a, b) => b.starts - a.starts);

// ---------- Templates ----------
const DOCS4X = `
  <h3 class="rc-h3">Manual</h3>
  <ul class="rc-docs">
    <li><span class="code">PDF</span><a href="https://drive.google.com/file/d/1vcmRZ83_ebR2xz6HfWjbe1hnvBaJ5VFt/view" target="_blank" rel="noopener noreferrer">Project 4X manual V1 (HR)</a><span class="mut">nagy felbontás · Google Drive</span></li>
    <li><span class="code">PDF</span><a href="https://drive.google.com/file/d/1MGPIHENy6RO2nB1XbQTl3EYL0aIxxJa2/view" target="_blank" rel="noopener noreferrer">Project 4X manual V1</a><span class="mut">kisebb fájl, telefonra · Google Drive</span></li>
  </ul>
  <h3 class="rc-h3">Setup és áttétel</h3>
  <ul class="rc-docs">
    <li><span class="code">PDF</span><a href="https://drive.google.com/file/d/1zC4SMlT9p5GmiU9ELLGtq0ARIAC2hhe0/view" target="_blank" rel="noopener noreferrer">Gyári alap setup · aszfalt</a><span class="mut">Google Drive</span></li>
    <li><span class="code">PDF</span><a href="https://drive.google.com/file/d/1Haf0lRetkptsJgnSaVYmy3XSGe31oHgN/view" target="_blank" rel="noopener noreferrer">Gyári alap setup · szőnyeg</a><span class="mut">Google Drive</span></li>
    <li><span class="code">PDF</span><a href="https://drive.google.com/file/d/1o3zp4geE0NadjzSTj9YD0L8wUNz28lSA/view" target="_blank" rel="noopener noreferrer">Kitölthető setup sheet</a><span class="mut">Google Drive</span></li>
    <li><span class="code">DOC</span><a href="https://docs.google.com/document/d/1y0g6yTQhB38fYZzBoRzcfRV378OKZfSxxPCclAfPlBA/edit" target="_blank" rel="noopener noreferrer">Áttételi táblázat · 21.5T motor</a><span class="mut">Google Docs</span></li>
  </ul>
  <h3 class="rc-h3">Első kardán · alkatrészek</h3>
  <ul class="rc-docs">
    <li class="part"><span class="code">SER401614</span><a href="https://2-speed.de/serpent-ser-401614-insert-double-joint-cardan-v2-2-ser401614-en" target="_blank" rel="noopener noreferrer">Insert double joint cardan V2 (2)</a><span class="mut">2-speed.de</span></li>
    <li class="part"><span class="code">SER401615</span><a href="https://2-speed.de/serpent-ser-401615-spring-set-double-joint-cardan-v2-5-5-ser401615-en" target="_blank" rel="noopener noreferrer">Spring set double joint cardan V2 (5+5)</a><span class="mut">2-speed.de</span></li>
    <li class="part"><span class="code">SER110221</span><a href="https://2-speed.de/serpent-ser-110221-pin-1-7x7-6-10-ser110221-en" target="_blank" rel="noopener noreferrer">Pin 1.7×7.6 (10)</a><span class="mut">2-speed.de</span></li>
  </ul>`;
const stat = (l, f, s, sm) => `<div class="rc-stat"><div class="l">${l}</div><div class="v${sm ? ' sm' : ''}" data-f="${f}">—</div><div class="s"${s == null ? ' data-f="utolso_esemeny"' : ''}>${s == null ? '—' : s}</div></div>`;
const OIL8 = 'Autónként hány eseménynél került diffi- és teleszkópolaj a naplóba. Diffi: K-ban megadott érték (5K, 7K, 10K), vagy „diff” mellett 10-10-5 alakú hármas; ESC-beállítás (brake, PWM drive) nem számít. Teló: 300–950 közötti, 0-ra vagy 5-re végződő szám (550-450, 700-600). Egy esemény egyszer számít.';

function build110() {
  const nav = `<nav class="rc-nav" aria-label="Szakaszok"><button type="button" class="on" data-go="attekintes">Áttekintés</button>${NAV10.map((id) => `<button type="button" data-go="${id}">${CAR[id]}</button>`).join('')}</nav>`;
  const tiles = CARS10.map((c) => `<button type="button" class="rc-ct" data-go="${c.id}"><div class="pl">${c.pl}</div><div class="md">${c.md}</div><div class="sp">${c.sp}</div><div class="km"><span data-n="${c.id}">—</span><small>bejegyzés</small></div><div class="at" data-last="${c.id}">—</div></button>`).join('');
  const over = `<section class="rc-page" id="attekintes">
    <h2 class="rc-h">Szezon 2026</h2>
    <p class="rc-sub">Az 1:10-es Serpentek szerviznaplója egy helyen. A bejegyzés egy autó egy szerelési tétele, az esemény egy nap (verseny, edzés vagy otthoni szerelés).</p>
    <div class="rc-stats" id="st10">${stat('Bejegyzések', 'bejegyzes', 'az összes autón')}${stat('Események', 'esemeny', 'szerelési napok')}${stat('Versenynapok', 'verseny', 'WRH')}${stat('Utolsó esemény', 'utolso', null, true)}</div>
    <h3 class="rc-h3">Autók</h3><div class="rc-cars">${tiles}</div>
    <h3 class="rc-h3">Olajcserék</h3>
    <p class="rc-sub">Autónként hány eseménynél került diffi- és teleszkópolaj a naplóba. Diffi: K-ban megadott érték (15K, 20k-30k), vagy „diff” mellett 10-10-5 alakú hármas. Teló: 300–950 közötti, 0-ra vagy 5-re végződő szám (500-450, 800-600). Egy esemény egyszer számít.</p>
    <div class="rc-oil" id="oil10"></div>
    <h3 class="rc-h3">Idővonal</h3>
    <p class="rc-sub">Legfrissebb elöl. Piros: versenynap, sárga: edzés, kék: szezonra felkészülés, szürke: otthoni szerelés.</p>
    <div class="rc-tl" id="tl10"></div>
    <h3 class="rc-h3">Alkatrész linkek</h3>
    <div class="rc-panel rc-scroll"><table class="rc-tbl"><thead><tr><th>Dátum</th><th>Link</th></tr></thead><tbody id="links10"></tbody></table></div>
  </section>`;
  const pages = CARS10.map((c) => `<section class="rc-page" hidden id="${c.id}">
    <h2 class="rc-h">${c.pl} · ${c.md}</h2>
    <div class="rc-carhead"><span class="km"><span data-n="${c.id}">—</span><small>bejegyzés</small></span><span class="rc-sub">${c.sp} · utolsó: <span data-last="${c.id}">—</span></span></div>
    ${c.x4 ? DOCS4X : ''}
    <h3 class="rc-h3">Alap setup / megjegyzés</h3><div class="rc-setup" data-setup="${c.id}">—</div>
    <h3 class="rc-h3">Szerviztörténet</h3>
    <p class="rc-sub">Legfrissebb elöl.${c.x4 ? ` A táblázatban egy „SERPENT 4X EVO ${c.x4}” fejlécű oszlop sorai jelennek meg itt.` : ''}</p>
    <div class="rc-panel rc-scroll"><table class="rc-tbl"><thead><tr><th>Dátum</th><th>Esemény</th><th>Szerviz</th></tr></thead><tbody data-hist="${c.id}"></tbody></table></div>
  </section>`).join('');
  $('#s110').innerHTML = nav + over + pages + `<div class="rc-foot">A szerviztörténet az „1.10 buggy history 2026-” Google táblázat maintenance history lapjáról jön (pillanatkép). A dátum nélküli sorok az előttük lévő eseményhez tartoznak. A 4X EVO autók oszlopait a második sor fejléce alapján ismeri fel (H oszlop után).</div>`;
}

function build18() {
  const nav = `<nav class="rc-nav" aria-label="Évek">${Y8.map((y, i) => `<button type="button" data-y="${y}"${i ? '' : ' class="on"'}>${y}</button>`).join('')}</nav>`;
  const pages = Y8.map((y, i) => `<section class="rc-ypage" id="y${y}"${i ? ' hidden' : ''}>
    <h2 class="rc-h">1:8 · ${y} szezon</h2>
    <p class="rc-sub">Az év 1:8-as autói a táblázat fejléce szerint. A bejegyzés egy autó egy cellája, az esemény egy nap (verseny, edzés, teszt vagy otthoni szerelés).</p>
    <div class="rc-stats" data-st8="${y}">${stat('Bejegyzések', 'bejegyzes', 'az év összes autóján')}${stat('Események', 'esemeny', 'szerelési, edzés- és versenynapok')}${stat('Versenynapok', 'verseny', 'verseny, race, MB')}${stat('Utolsó esemény', 'utolso', null, true)}</div>
    <h3 class="rc-h3">Autók</h3><p class="rc-sub">Kattints egy autóra: lent az ő szerviztörténete jelenik meg.</p>
    <div class="rc-cars" data-cars8="${y}"></div>
    <h3 class="rc-h3">Olajcserék</h3><p class="rc-sub">${OIL8}</p>
    <div class="rc-oil" data-oil8="${y}"></div>
    <h3 class="rc-h3">Autó szerviztörténete</h3><p class="rc-sub">A kiválasztott autó bejegyzései, legfrissebb elöl.</p>
    <div class="rc-panel rc-scroll"><table class="rc-tbl"><thead><tr><th>Dátum</th><th>Esemény</th><th>Szerviz / setup</th></tr></thead><tbody data-tbl8="${y}"></tbody></table></div>
    <h3 class="rc-h3">Idővonal</h3><p class="rc-sub">Legfrissebb elöl. Piros: verseny, sárga: edzés vagy teszt, kék: felkészülés, szürke: otthoni szerelés.</p>
    <div class="rc-tl rc-tl8" data-tl8="${y}"></div>
  </section>`).join('');
  $('#s18').innerHTML = nav + pages + `<div class="rc-foot">Az 1:8-as napló az „1.8 buggy truggy history 2023-2024-2025-2026” Google táblázat évenkénti lapjairól jön (2026, 2025, 2024 TEKNO-SPT, SPT 2023; pillanatkép). Az autók a lap fejlécéből jönnek, a dátum nélküli sorok az előttük lévő eseményhez tartoznak.</div>`;
}

const RES_NOTES = {
  rob: `<p>Hátrány %: a legjobb köröd a nap (időmérő + döntők, minden csoport) leggyorsabb köréhez képest. A nyilvánvaló időmérő-hibákat kiszűrtem; a 2025-11-08-i Hudy-WRH 2. fordulón a 17,715-ös kör ilyen, ott az A-döntő legjobbja (18,735) a viszonyítás. Döntő futamok: helyezésed / indulók a három döntőfutamban. Medián kör és szórás %: a saját köreid a döntők rajtköre nélkül, a mediántól 10%-nál jobban eltérő körök kiszűrve.</p><p>Forrás: a MyRCM-en a két rendező fiók (Bognár Zoli / Rc Portál és Homokbödöge PAME RC) összes offroad versenye 2019-től, minden kategória, ahol a név szerepel. A MyRCM-ben Görcsönyként szereplő versenyek helyszíne a cím vagy a rendező klub pályája alapján van megadva, egyébként Szár. A 2021–2022-es homokbödögei rendezésű versenyek és a 2024-es SMSE Cup (Szekszárd) helyszíne becslés. A Bakonyerdő Kupáknál nincs mindig körlista. Az adatok a 2026-11-19-i MyRCM-állapotot mutatják.</p>`,
  zs: `<p>Ugyanaz a számítás, mint RoB-nál: hátrány % = legjobb köre a nap (időmérő + döntők, minden csoport) leggyorsabb köréhez képest; döntő futamok = helyezése / indulók; medián kör és szórás % a saját köreiből, bukások nélkül. Ahol több kategóriában indult egy napon (pl. 2WD és 4WD), mindegyik külön sor és külön rajt.</p><p>Forrás: a MyRCM két rendező fiókjának összes offroad versenye 2019-től. A 2019-es II. Bakonyerdő Kupánál csak a végső helyezés van meg. Az adatok a 2026-11-19-i MyRCM-állapotot mutatják.</p>`,
  hu: `<p>Ugyanaz a számítás, mint RoB-nál és Zsombornál. Kimaradt a 2023-06-10-i elmaradt szekszárdi forduló és a IX. Bakonyerdő Kupa, ahol csak időmérős helyezés van (döntő nélkül). Az adatok a 2026-11-19-i MyRCM-állapotot mutatják.</p>`
};
function buildRes(id, p) {
  const self = p === 'rob';
  const who = self ? 'RoB összes közzétett MyRCM-eredménye' : `Fekete ${RES_NAME[p]} összes közzétett MyRCM-eredménye`;
  const k = (l, f, s) => `<div class="rc-stat"><div class="l">${l}</div><div class="v" data-k="${f}">—</div><div class="s">${s}</div></div>`;
  const allCols = ['Dátum', 'Helyszín', 'Verseny', 'Osztály', 'Mezőny', 'Időmérő', 'Döntő', 'Végső', 'Döntő futamok', self ? 'Legjobb köröm' : 'Legjobb köre', 'Nap legjobbja', 'Hátrány s', 'Hátrány %', 'Medián kör', 'Szórás %', 'Győztes', 'TQ'];
  const sub = (a, b) => self ? a : b;
  $('#' + id).innerHTML = `<section class="rc-res-top">
    <h2 class="rc-h">Versenyeredmények · ${RES_NAME[p]}</h2>
    <p class="rc-sub">${who}, <span data-span>—</span> között. Átlagosan <b data-k="avg_gap">—</b>% a ${sub('hátrányod', 'hátránya')} a nap leggyorsabb körétől.</p>
    <div class="rc-stats">${k('Rajt', 'starts', 'kategóriánként számolva')}${k('Győzelem', 'wins', 'végső 1. hely')}${k('Dobogó', 'podiums', 'végső 1–3. hely')}${k('A-döntő', 'a_final_pct', 'a rajtok %-ában')}${k('Átl. hátrány %', 'avg_gap', sub('legjobb köröd vs. nap legjobbja', 'legjobb köre vs. nap legjobbja'))}${k('Nap leggyorsabb köre', 'fl_day', sub('ennyiszer futottad a kategória napi legjobb körét', 'ennyiszer futotta a kategória napi legjobb körét'))}${k('A-döntő leggyorsabb köre', 'fl_a', sub('ennyiszer volt tiéd az A-döntő legjobb köre', 'ennyiszer volt övé az A-döntő legjobb köre'))}
      <div class="rc-stat"><div class="l">Bajnoki cím</div><div class="v" data-bc="titles">—</div><div class="s" style="white-space:pre-line" data-bc-sub>—</div></div>
      <div class="rc-stat"><div class="l">Bajnoki dobogó</div><div class="v" data-bc="podiums">—</div><div class="s">bajnoki 1–3. hely</div></div></div>
  </section>
  <h3 class="rc-h3">Hol ${sub('végzel', 'végez')} a mezőnyben, évenként</h3>
  <p class="rc-sub">Évenként átlagosan a mezőny hány százalékát előzte meg a végeredményben: 100% = mindig győzött, 50% = középmezőny, 0% = mindig utolsó. Az oszlop alatt az átlagos helyezés és az átlagos indulószám (pl. Ø 5,2. / 18).</p>
  <div class="rc-panel"><div class="rc-chart" data-chart="yrpct"></div></div>
  <h3 class="rc-h3">Helycsere a döntőben</h3>
  <p class="rc-sub">Időmérős helyezés vs. végső helyezés: hányszor ${sub('léptél előre, estél vissza vagy maradtál', 'lépett előre, esett vissza vagy maradt')} ugyanott.</p>
  <div class="rc-stats" data-swap></div>
  <h3 class="rc-h3">Konzisztencia-trend</h3>
  <p class="rc-sub">A saját köridők szórása versenyenként (döntős rajtkör és bukások nélkül). Lent = egyenletesebb. A fehér vonal az utolsó 5 verseny mozgóátlaga.</p>
  <div class="rc-panel"><div class="rc-leg"><span><i style="background:var(--rc-red)"></i>1/8</span><span><i style="background:var(--rc-blue)"></i>1/10</span><span><i style="background:var(--rc-fg)"></i>Mozgóátlag (5)</span></div><div class="rc-chart" data-chart="cons"></div></div>
  <h3 class="rc-h3">Helyszín-erősség</h3>
  <p class="rc-sub">Pályánként átlagosan a mezőny hány százalékát előzte meg (100% = mindig győzött). Legerősebb pálya felül.</p>
  <div class="rc-panel"><div class="rc-chart" data-chart="vstr"></div></div>
  <div class="rc-grid2">
    <div><h3 class="rc-h3">Évenként</h3><div class="rc-panel rc-scroll"><table class="rc-tbl"><thead><tr><th>Év</th><th>Kategória</th><th>Rajt</th><th>Átl. időm.</th><th>Átl. végső</th><th>Legjobb</th><th>Győzelem</th><th>Dobogó</th><th>Hátrány %</th></tr></thead><tbody data-tb="year"></tbody></table></div></div>
    <div><h3 class="rc-h3">Helyszínenként</h3><div class="rc-panel rc-scroll"><table class="rc-tbl"><thead><tr><th>Helyszín</th><th>Kategória</th><th>Rajt</th><th>Átl. időm.</th><th>Átl. végső</th><th>Legjobb</th><th>Győzelem</th><th>Hátrány %</th><th>Legjobb kör</th></tr></thead><tbody data-tb="venue"></tbody></table></div></div>
  </div>
  <h3 class="rc-h3">Minden verseny</h3>
  <div class="rc-ctrl">
    <select data-f="scale" aria-label="Kategória"><option value="">Minden kategória</option><option value="1/8">1/8</option><option value="1/10">1/10</option></select>
    <select data-f="year" aria-label="Év"></select>
    <select data-f="venue" aria-label="Helyszín"></select>
  </div>
  <div class="rc-panel rc-scroll"><table class="rc-tbl"><thead><tr>${allCols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody data-tb="all"></tbody></table></div>
  <details class="rc-foot rc-note"><summary>Megjegyzések</summary>${RES_NOTES[p]}</details>`;
}

function buildBajn() {
  const head = '<thead><tr><th>Szezon</th><th>Kategória</th><th>Indulók</th><th>RoB</th><th>Zsombor</th><th>Hunor</th><th>Bajnok</th></tr></thead>';
  const ohead = '<thead><tr><th>Versenyző</th><th>Rajthoz állt</th><th>Időmérő top 3</th><th>Időmérő TQ</th><th>A-döntő</th><th>Dobogó</th><th>Végső 1.</th><th>Végső 2.</th><th>Végső 3.</th></tr></thead>';
  $('#sbajn').innerHTML = `<section class="rc-res-top">
    <h2 class="rc-h">Bajnokságok · szezon végi helyezések</h2>
    <p class="rc-sub">A MyRCM bajnoki értékelése szerint, a pontokkal. Pirossal kiemelve hármótok közül a legjobb, arany/ezüst/bronz színnel a dobogós helyek.</p>
  </section>
  <h3 class="rc-h3">Összesítő · RoB, Zsombor, Hunor</h3>
  <p class="rc-sub">Az összes MyRCM versenyből (2019–2026), kategóriánként számolt rajtok alapján. Időmérő = a kvalifikáció végső sorrendje (1. = TQ), végső = a nap végeredménye.</p>
  <h3 class="rc-h3" style="font-size:16px;margin-top:14px">1:8</h3>
  <div class="rc-panel rc-scroll"><table class="rc-tbl">${ohead}<tbody data-ossz="1/8"></tbody></table></div>
  <h3 class="rc-h3" style="font-size:16px;margin-top:14px">1:10</h3>
  <div class="rc-panel rc-scroll"><table class="rc-tbl">${ohead}<tbody data-ossz="1/10"></tbody></table></div>
  <h3 class="rc-h3">Egymás elleni mérleg</h3>
  <p class="rc-sub">Azok a versenyek, ahol ugyanabban az osztályban mindketten végső helyezést kaptatok: ki végzett előrébb.</p>
  <div class="rc-panel"><div class="rc-h2h" id="h2h"></div></div>
  <h3 class="rc-h3">Hol végeztetek a mezőnyben, évenként</h3>
  <p class="rc-sub">Évenként átlagosan a mezőny hány százalékát előzte meg a végeredményben: 100% = mindig győzött, 50% = középmezőny, 0% = mindig utolsó. Fent a jobb.</p>
  <div class="rc-panel"><div class="rc-leg"><span><i style="background:var(--rc-red)"></i>RoB</span><span><i style="background:var(--rc-yellow)"></i>Zsombor</span><span><i style="background:var(--rc-blue)"></i>Hunor</span></div><div class="rc-chart" id="evline"></div></div>
  <h3 class="rc-h3">1:10 WRH (téli szezon)</h3>
  <div class="rc-panel rc-scroll"><table class="rc-tbl">${head}<tbody data-bajn="WRH"></tbody></table></div>
  <h3 class="rc-h3">1:8 Offroad MB</h3>
  <div class="rc-panel rc-scroll"><table class="rc-tbl">${head}<tbody data-bajn="MB"></tbody></table></div>
  <details class="rc-foot rc-note"><summary>Megjegyzések</summary><p>Forrás: MyRCM Championship (Bognár Zoli rendező), 2023-tól; korábbi szezonok bajnoki értékelése nincs a MyRCM-en. Az „Indulók” a bajnoki táblán szereplő összes pilóta, aki legalább egy fordulón pontot szerzett. A 2026/27-es WRH- és Téli OB-szezon még nem szerepel. Az adatok a 2026-11-19-i állapotot mutatják.</p></details>`;
}

// ---------- Rendering ----------
function fillStats(box, o) {
  $$('[data-f]', box).forEach((e) => { const v = o[e.dataset.f]; e.textContent = v == null || v === '' ? '—' : String(v); });
}
function timeline(box, events, typeOf, labels, carName, sortItems) {
  box.replaceChildren(...events.map((e) => {
    const t = typeOf(e);
    const c = mk('div', 'rc-ev ' + t);
    const top = mk('div', 'top');
    top.append(mk('span', 'rc-tag2 ' + t, labels[t]), mk('span', 'd', e.date || '—'), mk('span', 'e', e.event));
    const ul = mk('ul');
    e.items.slice().sort(sortItems).forEach((it) => { const li = mk('li'); li.append(mk('span', 'rc-car', carName(it)), mk('span', null, it.item)); ul.appendChild(li); });
    c.append(top, ul);
    return c;
  }));
}
function oilCards(box, rows) {
  box.replaceChildren(...rows.map((c) => {
    const b = mk('div', 'rc-oilc');
    const row = mk('div', 'rc-oilrow');
    [['Diffi olaj', c.diff_n, c.diff_last, 'df'], ['Teló olaj', c.shock_n, c.shock_last, 'sh']].forEach(([lab, n, last, cls]) => {
      const cell = mk('div'); const v = mk('div', 'v ' + cls, String(n)); v.appendChild(mk('small', null, '×'));
      cell.append(mk('div', 'l', lab), v, mk('div', 's', last ? 'utolsó: ' + last : '—')); row.appendChild(cell);
    });
    b.append(mk('div', 'pl', c.pilot), mk('div', 'md', c.model), row);
    return b;
  }));
}
function histRows(tb, rows) {
  tb.replaceChildren(...rows.map((r) => { const tr = mk('tr'); tr.append(mk('td', 'd', r.date || '—'), mk('td', 'mut', r.event), mk('td', 'w', r.item)); return tr; }));
}

function render110(log) {
  const c = calc10(log);
  fillStats($('#st10'), c.osszesito);
  c.autok.forEach((a) => {
    $$(`[data-n="${a.car}"]`).forEach((e) => { e.textContent = String(a.n); });
    $$(`[data-last="${a.car}"]`).forEach((e) => { e.textContent = a.last_date ? a.last_date + (a.last_event ? ' · ' + a.last_event : '') : '—'; });
  });
  oilCards($('#oil10'), c.olaj);
  timeline($('#tl10'), c.esemenyek, (e) => evType(e.event), EV_LABEL, (it) => CAR[it.car] || it.car,
    (a, b) => (CAR_ORD[a.car] ?? 9) - (CAR_ORD[b.car] ?? 9) || a.row - b.row);
  $('#links10').replaceChildren(...log.filter((r) => r.kind === 'link').sort((a, b) => a.row - b.row).map((r) => {
    const tr = mk('tr'); tr.appendChild(mk('td', 'd', r.date || '—'));
    const td = mk('td', 'w'); const m = r.item.match(/ser-?(\d{6})/i);
    if (/^https:\/\//i.test(r.item)) {
      const a = mk('a'); a.href = r.item; a.target = '_blank'; a.rel = 'noopener noreferrer';
      let host = ''; try { host = new URL(r.item).hostname; } catch (e) { host = ''; }
      a.textContent = (m ? 'SER' + m[1] + ' · ' : '') + (host || r.item); td.appendChild(a);
    } else td.textContent = r.item;
    tr.appendChild(td); return tr;
  }));
  CARS10.forEach(({id}) => {
    const al = log.filter((r) => r.car === id && r.kind === 'alap');
    $(`[data-setup="${id}"]`).textContent = al.length ? al.map((x) => x.item).join('\n') : '—';
    histRows($(`[data-hist="${id}"]`), log.filter((r) => r.car === id && r.kind === 'szerviz').sort((a, b) => b.row - a.row));
  });
}

const SEL8 = {};
function render8(y, rows) {
  const c = calc8(rows);
  fillStats($(`[data-st8="${y}"]`), c.osszesito);
  if (!c.autok.some((a) => a.car === SEL8[y]) && c.autok[0]) SEL8[y] = c.autok[0].car;
  const drawCars = () => {
    $(`[data-cars8="${y}"]`).replaceChildren(...c.autok.map((a) => {
      const b = mk('button', 'rc-ct' + (a.car === SEL8[y] ? ' sel' : '')); b.type = 'button';
      b.setAttribute('aria-pressed', a.car === SEL8[y] ? 'true' : 'false');
      const km = mk('div', 'km', String(a.n)); km.appendChild(mk('small', null, 'bejegyzés'));
      b.append(mk('div', 'pl', a.pilot), mk('div', 'md', a.model), km, mk('div', 'at', a.last_date ? a.last_date + (a.last_event ? ' · ' + a.last_event : '') : (a.last_event || '—')));
      b.addEventListener('click', () => { SEL8[y] = a.car; drawCars(); });
      return b;
    }));
    histRows($(`[data-tbl8="${y}"]`), rows.filter((r) => r.car === SEL8[y]).sort((a, b) => b.row - a.row));
  };
  drawCars();
  oilCards($(`[data-oil8="${y}"]`), c.autok);
  timeline($(`[data-tl8="${y}"]`), c.esemenyek, (e) => ev8Type(e.date + ' ' + e.event), EV8_LABEL, (it) => it.pilot + ' · ' + it.model, (a, b) => a.col - b.col || a.row - b.row);
}

function tip(box) {
  const t = mk('div', 'rc-rtip'); t.hidden = true; box.appendChild(t);
  return {
    show(e, lines) {
      t.replaceChildren(...lines.map((s) => mk('div', null, s))); t.hidden = false;
      const b = box.getBoundingClientRect();
      let x = e.clientX - b.left + 12; if (x + t.offsetWidth > b.width) x = e.clientX - b.left - t.offsetWidth - 12;
      t.style.left = Math.max(0, x) + 'px'; t.style.top = (e.clientY - b.top + 12) + 'px';
    },
    hide() { t.hidden = true; }
  };
}
const axisStyle = (g) => { g.select('.domain').remove(); g.selectAll('line').style('stroke', '#3a2525'); g.selectAll('text').style('fill', 'var(--rc-muted)').style('font-size', '11px'); };

const DRV_COL = {rob: 'var(--rc-red)', zs: 'var(--rc-yellow)', hu: 'var(--rc-blue)', RoB: 'var(--rc-red)', Zsombor: 'var(--rc-yellow)', Hunor: 'var(--rc-blue)'};
const fpct = (x) => { const f = num(x.final_rank), fl = num(x.field); return f == null || !fl ? null : fl > 1 ? (f - 1) / (fl - 1) * 100 : 0; };
const svgOf = (el, W, H, label) => d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', label);

function chartYrPct(el, data, p) {
  el.replaceChildren();
  const rows = d3.groups(data.filter((x) => fpct(x) != null), (x) => String(x.year))
    .map(([yr, v]) => ({yr, b: Math.round(100 - d3.mean(v, fpct)), ar: d3.mean(v, (x) => num(x.final_rank)), af: d3.mean(v, (x) => num(x.field)), n: v.length, w: v.filter((x) => num(x.final_rank) === 1).length, pod: v.filter((x) => num(x.final_rank) <= 3).length}))
    .sort((a, b) => a.yr.localeCompare(b.yr));
  if (!rows.length || !el.clientWidth) return;
  const W = el.clientWidth, H = 270, m = {t: 24, r: 16, b: 44, l: 46};
  const x = d3.scaleBand().domain(rows.map((r) => r.yr)).range([m.l, W - m.r]).padding(0.35);
  const y = d3.scaleLinear().domain([0, 100]).range([H - m.b, m.t]);
  const svg = svgOf(el, W, H, 'A mezőny hány százalékát előzte meg átlagosan, évenként');
  svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x)).call(axisStyle);
  svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat((v) => v + '%').tickSize(-(W - m.l - m.r))).call(axisStyle);
  const tp = tip(el);
  const g = svg.append('g').selectAll('g').data(rows).join('g');
  g.append('rect').attr('x', (r) => x(r.yr)).attr('width', x.bandwidth()).attr('y', (r) => y(Math.max(r.b, 1))).attr('height', (r) => H - m.b - y(Math.max(r.b, 1))).attr('rx', 3).style('fill', DRV_COL[p])
    .on('pointermove', (e, r) => tp.show(e, [r.yr + ': a mezőny ' + r.b + '%-át előzte meg', 'Átlagos helyezés: ' + r.ar.toFixed(1) + '. · átlag ' + Math.round(r.af) + ' induló', r.n + ' rajt · ' + r.w + ' győzelem · ' + r.pod + ' dobogó']))
    .on('pointerleave', () => tp.hide());
  g.append('text').attr('x', (r) => x(r.yr) + x.bandwidth() / 2).attr('y', (r) => y(Math.max(r.b, 1)) - 6).attr('text-anchor', 'middle').style('fill', 'var(--rc-fg)').style('font-size', '12px').style('font-weight', '700').text((r) => r.b + '%');
  g.append('text').attr('x', (r) => x(r.yr) + x.bandwidth() / 2).attr('y', H - m.b + 32).attr('text-anchor', 'middle').style('fill', 'var(--rc-muted)').style('font-size', '11px').text((r) => 'Ø ' + r.ar.toFixed(1) + '. / ' + Math.round(r.af));
}

function renderSwap(el, data) {
  const r = data.filter((x) => num(x.qualy_rank) != null && num(x.final_rank) != null).map((x) => ({...x, g: num(x.qualy_rank) - num(x.final_rank)}));
  const up = r.filter((x) => x.g > 0), dn = r.filter((x) => x.g < 0), eq = r.length - up.length - dn.length;
  const best = r.slice().sort((a, b) => b.g - a.g)[0], worst = r.slice().sort((a, b) => a.g - b.g)[0];
  const tile = (l, v, s) => { const t = mk('div', 'rc-stat'); t.append(mk('div', 'l', l), mk('div', 'v', v), mk('div', 's', s)); return t; };
  const where = (x) => x.date + ' · ' + x.venue + ' (' + x.qualy_rank + '. → ' + x.final_rank + '.)';
  el.replaceChildren(
    tile('Előrelépett', String(up.length), up.length ? 'összesen +' + d3.sum(up, (x) => x.g) + ' hely' : '–'),
    tile('Visszaesett', String(dn.length), dn.length ? 'összesen ' + d3.sum(dn, (x) => x.g) + ' hely' : '–'),
    tile('Ugyanott', String(eq), 'időmérő hely = végső hely'),
    tile('Legnagyobb előrelépés', best && best.g > 0 ? '+' + best.g : '–', best && best.g > 0 ? where(best) : ''),
    tile('Legnagyobb visszaesés', worst && worst.g < 0 ? String(worst.g) : '–', worst && worst.g < 0 ? where(worst) : ''));
}

function chartCons(el, data) {
  el.replaceChildren();
  const pd = d3.utcParse('%Y-%m-%d');
  const rows = data.filter((x) => num(x.consistency_pct) != null).map((x) => ({...x, dt: pd(String(x.date)), c: num(x.consistency_pct)})).filter((x) => x.dt).sort((a, b) => a.dt - b.dt);
  if (!rows.length || !el.clientWidth) return;
  rows.forEach((r, i) => { r.ma = d3.mean(rows.slice(Math.max(0, i - 4), i + 1), (x) => x.c); });
  const W = el.clientWidth, H = 280, m = {t: 12, r: 24, b: 26, l: 44};
  const x = d3.scaleUtc().domain(d3.extent(rows, (r) => r.dt)).nice().range([m.l, W - m.r]);
  const y = d3.scaleLinear().domain([0, d3.max(rows, (r) => r.c) * 1.1]).nice().range([H - m.b, m.t]);
  const svg = svgOf(el, W, H, 'Köridők szórása versenyenként, 5 versenyes mozgóátlaggal');
  svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(Math.max(2, Math.floor(W / 90))).tickFormat(d3.utcFormat('%Y.%m'))).call(axisStyle);
  svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat((v) => v + '%').tickSize(-(W - m.l - m.r))).call(axisStyle);
  const tp = tip(el);
  svg.append('g').selectAll('circle').data(rows).join('circle').attr('cx', (r) => x(r.dt)).attr('cy', (r) => y(r.c)).attr('r', 4).style('fill', (r) => RES_COL[r.scale] || 'var(--rc-gray)').attr('opacity', 0.75)
    .on('pointermove', (e, r) => tp.show(e, [r.date + ' · ' + r.venue, r.event + ' (' + r.class + ')', 'Szórás: ' + r.c.toFixed(2) + '% · medián kör: ' + r.median_lap, 'Végső hely: ' + r.final_rank + '/' + r.field]))
    .on('pointerleave', () => tp.hide());
  svg.append('path').datum(rows).attr('fill', 'none').style('stroke', 'var(--rc-fg)').attr('stroke-width', 2).attr('opacity', 0.85).style('pointer-events', 'none')
    .attr('d', d3.line().curve(d3.curveMonotoneX).x((r) => x(r.dt)).y((r) => y(r.ma)));
}

function chartVstr(el, data, p) {
  el.replaceChildren();
  const rows = d3.groups(data.filter((x) => fpct(x) != null), (x) => x.venue)
    .map(([v, a]) => ({v, p: Math.round(100 - d3.mean(a, fpct)), n: a.length, pod: a.filter((x) => num(x.final_rank) <= 3).length}))
    .sort((a, b) => b.p - a.p || b.n - a.n);
  if (!rows.length || !el.clientWidth) return;
  const W = el.clientWidth, rowH = 28, m = {t: 4, r: Math.min(230, W * 0.4), b: 24, l: Math.min(130, W * 0.25)};
  const H = m.t + m.b + rows.length * rowH;
  const x = d3.scaleLinear().domain([0, 100]).range([m.l, W - m.r]);
  const yy = (i) => m.t + i * rowH;
  const svg = svgOf(el, W, H, 'A mezőny hány százalékát előzte meg helyszínenként');
  svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(5).tickFormat((v) => v + '%').tickSize(-(H - m.t - m.b))).call(axisStyle);
  const g = svg.append('g').selectAll('g').data(rows).join('g');
  g.append('text').attr('x', m.l - 8).attr('y', (r, i) => yy(i) + rowH / 2).attr('dy', '0.35em').attr('text-anchor', 'end').style('fill', 'var(--rc-fg)').style('font-size', '12px').text((r) => r.v);
  g.append('rect').attr('x', m.l).attr('y', (r, i) => yy(i) + 5).attr('height', rowH - 10).attr('width', (r) => Math.max(2, x(r.p) - m.l)).attr('rx', 3).style('fill', DRV_COL[p]);
  g.append('text').attr('x', (r) => Math.max(x(r.p), m.l + 2) + 6).attr('y', (r, i) => yy(i) + rowH / 2).attr('dy', '0.35em').style('fill', 'var(--rc-muted)').style('font-size', '11px')
    .text((r) => r.p + '% megelőzve · ' + r.n + ' rajt · ' + r.pod + ' dobogó');
}

const fill = (tb, rows, cols) => tb.replaceChildren(...rows.map((r) => {
  const tr = mk('tr');
  cols.forEach(([f, cls, fmt]) => { const v = r[f]; tr.appendChild(mk('td', cls, v == null || v === '' ? '–' : (fmt ? fmt(v) : String(v)))); });
  return tr;
}));
const f1 = (v) => (+v).toFixed(1), f2 = (v) => (+v).toFixed(2), f3 = (v) => (+v).toFixed(3);

const RES = {};
function renderRes(id, p, data, bajn) {
  const box = $('#' + id);
  RES[id] = {p, data};
  const kpi = resKpi(data);
  kpi.fl_day = data.filter((x) => num(x.gap_pct) === 0).length;
  kpi.fl_a = data.filter((x) => x.final_group === 'A' && num(x.my_f_best) != null && num(x.a_final_best) != null && num(x.my_f_best) <= num(x.a_final_best)).length;
  const won = (lim) => bajn.filter((r) => num(r[p + '_rank']) != null && num(r[p + '_rank']) <= lim).sort((a, b) => String(b.season).localeCompare(String(a.season)));
  $('[data-bc="titles"]', box).textContent = String(won(1).length);
  $('[data-bc="podiums"]', box).textContent = String(won(3).length);
  $('[data-bc-sub]', box).textContent = won(1).length ? won(1).map((r) => r.series + ' ' + r.season + ' · ' + r.category).join('\n') : 'még nincs';
  renderSwap($('[data-swap]', box), data);
  $$('[data-k]', box).forEach((e) => { const v = kpi[e.dataset.k]; e.textContent = v == null ? '—' : (e.dataset.k === 'avg_gap' ? (+v).toFixed(2) : String(v)); });
  const ds = data.map((x) => x.date).sort();
  $('[data-span]', box).textContent = ds.length ? ds[0] + ' – ' + ds[ds.length - 1] : '—';
  fill($('[data-tb="year"]', box), resYear(data), [['year', 'd'], ['scale', 'mut'], ['starts', 'd'], ['avg_q', 'd', f1], ['avg_f', 'd', f1], ['best_f', 'd'], ['wins', 'd'], ['podiums', 'd'], ['avg_gap', 'd', f2]]);
  fill($('[data-tb="venue"]', box), resVenue(data), [['venue', 'd'], ['scale', 'mut'], ['starts', 'd'], ['avg_q', 'd', f1], ['avg_f', 'd', f1], ['best_f', 'd'], ['wins', 'd'], ['avg_gap', 'd', f2], ['best_lap', 'd', f3]]);
  const opts = (sel, label, vals) => { sel.replaceChildren(new Option(label, ''), ...vals.map((v) => new Option(v, v))); };
  opts($('select[data-f="year"]', box), 'Minden év', [...new Set(data.map((x) => x.year))].sort().reverse());
  opts($('select[data-f="venue"]', box), 'Minden helyszín', [...new Set(data.map((x) => x.venue))].sort());
  const drawAll = () => {
    const sc = $('select[data-f="scale"]', box).value, yr = $('select[data-f="year"]', box).value, vn = $('select[data-f="venue"]', box).value;
    const rows = data.filter((x) => (!sc || x.scale === sc) && (!yr || x.year === yr) && (!vn || x.venue === vn)).sort((a, b) => b.date.localeCompare(a.date) || a.class.localeCompare(b.class));
    fill($('[data-tb="all"]', box), rows, [['date', 'd'], ['venue', 'd'], ['event', 'mut'], ['class', 'mut'], ['field', 'd'], ['qualy_rank', 'd'], ['final_group', 'd'], ['final_rank', 'd'], ['final_heats', 'd'], ['my_best', 'd'], ['day_best', 'd'], ['gap_s', 'd'], ['gap_pct', 'd'], ['median_lap', 'd'], ['consistency_pct', 'd'], ['winner', 'mut'], ['tq', 'mut']]);
  };
  $$('select', box).forEach((s) => s.addEventListener('change', drawAll));
  drawAll();
}
function drawCharts(id) {
  const box = $('#' + id); if (!box || box.hidden) return;
  if (id === 'sbajn') { if (BAJN_DATA) chartEvline($('#evline'), BAJN_DATA); return; }
  if (!RES[id]) return;
  const {p, data} = RES[id];
  chartYrPct($('[data-chart="yrpct"]', box), data, p);
  chartCons($('[data-chart="cons"]', box), data);
  chartVstr($('[data-chart="vstr"]', box), data, p);
}

function champCell(tr, rk, best, pts) {
  const td = mk('td', 'd rc-champ' + (rk != null && rk === best ? ' best' : '') + (rk === 1 ? ' gold' : rk === 2 ? ' silver' : rk === 3 ? ' bronze' : ''), rk == null ? '–' : rk + '.');
  if (rk != null && pts != null) td.appendChild(mk('small', null, ' ' + pts + ' p'));
  tr.appendChild(td);
}
let BAJN_DATA = null;
function evRows(D) {
  const out = new Map();
  Object.keys(D).forEach((k) => D[k].forEach((x) => {
    const v = fpct(x); if (v == null) return;
    const y = String(x.year); if (!out.has(y)) out.set(y, {year: y});
    const o = out.get(y); (o['_' + k] = o['_' + k] || []).push(v);
  }));
  return [...out.values()].sort((a, b) => a.year.localeCompare(b.year)).map((o) => {
    const r = {year: o.year};
    ['rob', 'zs', 'hu'].forEach((k) => { const a = o['_' + k]; r[k] = a ? 100 - Math.round(d3.mean(a)) : null; r[k + '_n'] = a ? a.length : 0; });
    return r;
  });
}
function chartEvline(el, D) {
  el.replaceChildren();
  const rows = evRows(D);
  if (!rows.length || !el.clientWidth) return;
  const W = el.clientWidth, H = 300, m = {t: 16, r: 40, b: 28, l: 46};
  const x = d3.scalePoint().domain(rows.map((r) => r.year)).range([m.l + 12, W - m.r]);
  const y = d3.scaleLinear().domain([0, 100]).range([H - m.b, m.t]);
  const svg = svgOf(el, W, H, 'A mezőny hány százalékát előzték meg átlagosan évenként; fent a jobb');
  svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x)).call(axisStyle);
  svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat((v) => v + '%').tickSize(-(W - m.l - m.r))).call(axisStyle);
  const tp = tip(el);
  ['rob', 'zs', 'hu'].forEach((k) => {
    const rr = rows.filter((r) => r[k] != null);
    svg.append('path').datum(rr).attr('fill', 'none').style('stroke', DRV_COL[k]).attr('stroke-width', 2).attr('d', d3.line().x((r) => x(r.year)).y((r) => y(r[k])));
    svg.append('g').selectAll('circle').data(rr).join('circle').attr('cx', (r) => x(r.year)).attr('cy', (r) => y(r[k])).attr('r', 5).style('fill', DRV_COL[k])
      .on('pointermove', (e, r) => tp.show(e, [RES_NAME[k] + ' · ' + r.year, 'A mezőny ' + r[k] + '%-át előzte meg', r[k + '_n'] + ' rajt']))
      .on('pointerleave', () => tp.hide());
  });
  const wrap = mk('div', 'rc-scroll');
  const tb = mk('table', 'rc-tbl'); tb.style.minWidth = '0'; tb.style.marginTop = '10px';
  const hr = tb.createTHead().insertRow();
  ['', ...rows.map((r) => r.year)].forEach((t) => hr.appendChild(mk('th', null, t)));
  const bd = tb.createTBody();
  ['rob', 'zs', 'hu'].forEach((k) => {
    const tr = bd.insertRow();
    const c0 = mk('td', 'd rc-champ', RES_NAME[k]); c0.style.color = DRV_COL[k]; tr.appendChild(c0);
    rows.forEach((r) => { const c = mk('td', 'd', r[k] == null ? '–' : r[k] + '%'); c.title = r[k + '_n'] + ' rajt'; tr.appendChild(c); });
  });
  wrap.appendChild(tb); el.appendChild(wrap);
}
function renderH2h(el, D) {
  const I = {};
  Object.keys(D).forEach((k) => { I[k] = new Map(D[k].filter((x) => num(x.final_rank) != null).map((x) => [String(x.date) + '|' + x.class, x])); });
  el.replaceChildren(...[['Zsombor', 'RoB'], ['Zsombor', 'Hunor'], ['Hunor', 'RoB']].map(([a, b]) => {
    let c = 0, wa = 0, wb = 0, last = '';
    I[a].forEach((ra, key) => { const rb = I[b].get(key); if (!rb) return; c++; if (num(ra.final_rank) < num(rb.final_rank)) wa++; else if (num(rb.final_rank) < num(ra.final_rank)) wb++; if (String(ra.date) > last) last = String(ra.date); });
    const row = mk('div', 'row');
    const nm = (who, w, right) => { const s = mk('div', 'nm' + (right ? ' r' : '')); const bb = mk('b', null, String(w)); bb.style.color = DRV_COL[who]; s.append(bb, document.createTextNode(who)); return s; };
    const bar = mk('div', 'bar'); const tot = wa + wb || 1;
    [[a, wa], [b, wb]].forEach(([who, w]) => { const sp = mk('span'); sp.style.width = (w / tot * 100) + '%'; sp.style.background = DRV_COL[who]; bar.appendChild(sp); });
    row.append(nm(a, wa, false), bar, nm(b, wb, true), mk('div', 'cap', c + ' közös futam' + (last ? ' · utolsó: ' + last : '')));
    return row;
  }));
}
function renderBajn(bajn, rob, zs, hu) {
  const cnt = (name, rows) => {
    const f = rows.filter((x) => num(x.final_rank) != null);
    const q = (k) => rows.filter((x) => num(x.qualy_rank) === k).length;
    const p = (k) => f.filter((x) => num(x.final_rank) === k).length;
    return {driver: name, starts: f.length, q1: q(1), q_pod: q(1) + q(2) + q(3), f1: p(1), f2: p(2), f3: p(3), f_pod: p(1) + p(2) + p(3), a_final: f.filter((x) => x.final_group === 'A').length};
  };
  const cols = ['starts', 'q_pod', 'q1', 'a_final', 'f_pod', 'f1', 'f2', 'f3'];
  $$('[data-ossz]').forEach((tb) => {
    const sc = tb.dataset.ossz;
    const ossz = [cnt('RoB', rob.filter((x) => x.scale === sc)), cnt('Zsombor', zs.filter((x) => x.scale === sc)), cnt('Hunor', hu.filter((x) => x.scale === sc))];
    const best = {}; cols.forEach((k) => { best[k] = d3.max(ossz, (r) => r[k]); });
    tb.replaceChildren(...ossz.map((r) => {
      const tr = mk('tr'); tr.appendChild(mk('td', 'd rc-champ', r.driver));
      cols.forEach((k) => tr.appendChild(mk('td', 'd rc-champ' + (r[k] === best[k] && r[k] > 0 ? ' best' : '') + (k === 'f1' || k === 'q1' ? ' gold' : k === 'f2' ? ' silver' : k === 'f3' ? ' bronze' : ''), String(r[k]))));
      return tr;
    }));
  });
  BAJN_DATA = {rob, zs, hu};
  renderH2h($('#h2h'), {RoB: rob, Zsombor: zs, Hunor: hu});
  $$('[data-bajn]').forEach((tb) => {
    const grp = tb.dataset.bajn;
    tb.replaceChildren(...bajn.filter((r) => String(r.key || '').split('-')[0] === grp).map((r) => {
      const tr = mk('tr');
      tr.append(mk('td', 'd', String(r.season)), mk('td', 'mut', String(r.category)), mk('td', 'd', String(r.field)));
      const ranks = ['rob', 'zs', 'hu'].map((k) => num(r[k + '_rank']));
      const b = d3.min(ranks.filter((x) => x != null));
      ['rob', 'zs', 'hu'].forEach((k, i) => champCell(tr, ranks[i], b, r[k + '_pts']));
      const fam = ranks.includes(1);
      tr.appendChild(mk('td', fam ? 'rc-champ gold best' : 'mut', (fam ? '🏆 ' : '') + r.winner + ' (' + r.winner_pts + ' p)'));
      return tr;
    }));
  });
}

// ---------- Navigation ----------
const PAGES10 = ['attekintes', ...CARS10.map((c) => c.id)];
function showSec(id) {
  $$('.rc-sec').forEach((s) => { s.hidden = s.id !== id; });
  $$('.rc-sw button').forEach((b) => b.classList.toggle('on', b.dataset.sec === id));
  drawCharts(id);
}
function showPage10(id) {
  $$('#s110 .rc-page').forEach((p) => { p.hidden = p.id !== id; });
  $$('#s110 .rc-nav button').forEach((b) => b.classList.toggle('on', b.dataset.go === id));
}
function showYear(y) {
  $$('.rc-ypage').forEach((p) => { p.hidden = p.id !== 'y' + y; });
  $$('#s18 .rc-nav button').forEach((b) => b.classList.toggle('on', b.dataset.y === y));
}
const setHash = (h) => history.replaceState(null, '', '#' + h);
function route(h) {
  if (PAGES10.includes(h)) { showSec('s110'); showPage10(h); }
  else if (/^y\d{4}$/.test(h) && Y8.includes(h.slice(1))) { showSec('s18'); showYear(h.slice(1)); }
  else if (['s110', 's18', 'sres', 'sresz', 'sresh', 'sbajn'].includes(h)) showSec(h);
}
function wireNav() {
  $$('.rc-sw button').forEach((b) => b.addEventListener('click', () => { showSec(b.dataset.sec); setHash(b.dataset.sec); }));
  $$('#s110 [data-go]').forEach((b) => b.addEventListener('click', () => { showPage10(b.dataset.go); setHash(b.dataset.go); window.scrollTo(0, 0); }));
  $$('#s18 [data-y]').forEach((b) => b.addEventListener('click', () => { showYear(b.dataset.y); setHash('y' + b.dataset.y); }));
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => ['sres', 'sresz', 'sresh', 'sbajn'].forEach(drawCharts), 150); });
}

// ---------- Boot ----------
async function boot() {
  build110(); build18(); buildRes('sres', 'rob'); buildRes('sresz', 'zs'); buildRes('sresh', 'hu'); buildBajn(); wireNav();
  const j = (f) => fetch('data/' + f, {cache: 'no-cache'}).then((r) => { if (!r.ok) throw new Error(f + ': ' + r.status); return r.json(); });
  const c = (f) => fetch('data/' + f, {cache: 'no-cache'}).then((r) => { if (!r.ok) throw new Error(f + ': ' + r.status); return r.text(); }).then(d3.csvParse);
  try {
    const [meta, log, y26, y25, y24, y23, rob, zs, hu, bajn] = await Promise.all([j('meta.json'), j('log.json'), j('y2026.json'), j('y2025.json'), j('y2024.json'), j('y2023.json'),
      c('myrcm_rob.csv'), c('myrcm_zsombor.csv'), c('myrcm_hunor.csv'), c('bajnoksag.csv')]);
    render110(parseLog(log.values));
    [[y26, '2026'], [y25, '2025'], [y24, '2024'], [y23, '2023']].forEach(([d, y]) => render8(y, parse8(d.values, y)));
    renderRes('sres', 'rob', rob, bajn); renderRes('sresz', 'zs', zs, bajn); renderRes('sresh', 'hu', hu, bajn);
    renderBajn(bajn, rob, zs, hu);
    $('#snap').textContent = 'Statikus pillanatkép · szerviznaplók: ' + meta.sheets_snapshot + ' · MyRCM eredmények: ' + meta.myrcm_snapshot;
  } catch (e) {
    $('#snap').textContent = 'Nem sikerült betölteni az adatokat: ' + e.message;
  }
  route(location.hash.slice(1));
}
boot();
