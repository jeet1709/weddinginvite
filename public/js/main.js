(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const state = { config: null };

  const FESTIVITY_ICONS = {
    haldi: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="24" cy="24" r="4" fill="currentColor" stroke="none"/><circle cx="24" cy="12" r="5"/><circle cx="34" cy="18" r="5"/><circle cx="34" cy="30" r="5"/><circle cx="24" cy="36" r="5"/><circle cx="14" cy="30" r="5"/><circle cx="14" cy="18" r="5"/></svg>`,
    mehndi: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M24 6 C40 14 40 34 24 42 C8 34 8 14 24 6 Z"/><path d="M24 12 V36" stroke-linecap="round"/><path d="M24 18 C28 20 28 24 24 26" stroke-linecap="round"/><path d="M24 26 C20 28 20 32 24 34" stroke-linecap="round"/></svg>`,
    sangeet: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><circle cx="16" cy="34" r="5" fill="currentColor" stroke="none"/><circle cx="34" cy="30" r="5" fill="currentColor" stroke="none"/><path d="M21 34 V12 L39 8 V26" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    wedding: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 30 Q24 40 40 30" stroke-linecap="round"/><ellipse cx="24" cy="28" rx="16" ry="5"/><path d="M24 22 C21 18 21 14 24 10 C27 14 27 18 24 22 Z" fill="currentColor" stroke="none"/></svg>`,
    default: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="24" cy="24" r="4" fill="currentColor" stroke="none"/><circle cx="24" cy="12" r="5"/><circle cx="34" cy="18" r="5"/><circle cx="34" cy="30" r="5"/><circle cx="24" cy="36" r="5"/><circle cx="14" cy="30" r="5"/><circle cx="14" cy="18" r="5"/></svg>`,
  };

  async function loadConfig() {
    const res = await fetch('config/wedding.config.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Could not load wedding.config.json');
    return res.json();
  }

  function applyTheme(theme = {}) {
    const root = document.documentElement;
    if (theme.primaryColor) root.style.setProperty('--color-primary', theme.primaryColor);
    if (theme.accentColor) root.style.setProperty('--color-accent', theme.accentColor);
    if (theme.deepColor) root.style.setProperty('--color-deep', theme.deepColor);
    if (theme.backgroundColor) root.style.setProperty('--color-bg', theme.backgroundColor);
    if (theme.surfaceColor) root.style.setProperty('--color-surface', theme.surfaceColor);
    if (theme.textColor) root.style.setProperty('--color-text', theme.textColor);
  }

  function formatDisplayDate(dateStr, opts) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, opts || { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function to24h(timeStr) {
    if (!timeStr) return '00:00:00';
    const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(timeStr.trim());
    if (!m) return '00:00:00';
    let [, h, min, ap] = m;
    h = parseInt(h, 10);
    if (ap) {
      ap = ap.toUpperCase();
      if (ap === 'PM' && h !== 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
    }
    return `${String(h).padStart(2, '0')}:${min}:00`;
  }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function escapeAttr(str) { return escapeHtml(str); }

  function buildMapUrl(query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  /* ============ Hero ============ */
  function populateHero(cfg) {
    const { couple, hero, wedding } = cfg;
    document.title = `${couple.bride.name} & ${couple.groom.name} — We're Getting Married`;

    // Roundels are small circles: strip spaces so "A & S" renders as "A&S"
    // and stays on one line inside the ring.
    const monogramFull = couple.monogram || `${couple.bride.name} & ${couple.groom.name}`;
    const monogramCompact = (couple.monogram || `${couple.bride.name[0]}&${couple.groom.name[0]}`).replace(/\s+/g, '');

    $('#doorMonogram').textContent = monogramCompact;
    $('#navMonogram').textContent = monogramFull;
    $('#heroPreTitle').textContent = hero.preTitle || '';

    $('#brideName').textContent = couple.bride.name;
    $('#groomName').textContent = couple.groom.name;
    $('#brideParents').textContent = couple.bride.parents || '';
    $('#groomParents').textContent = couple.groom.parents || '';

    $('#heroTagline').textContent = hero.tagline || '';
    $('#heroDate').textContent = wedding.displayDate || formatDisplayDate(wedding.date);

    $('#glanceWhen').textContent = formatDisplayDate(wedding.date, { day: 'numeric', month: 'long', year: 'numeric' });
    $('#glanceWhere').textContent = [wedding.venueName, wedding.venueCity].filter(Boolean).join(', ');

    const directionsUrl = buildMapUrl(wedding.mapQuery || wedding.address || wedding.venueName);
    $('#heroDirectionsBtn').href = directionsUrl;
    $('#rsvpDirectionsBtn').href = directionsUrl;

    $('#footerNames').textContent = `${couple.bride.name} & ${couple.groom.name}`;
    $('#footerHashtag').textContent = couple.hashtag || '';
    if (!couple.hashtag) $('#footerHashtag').hidden = true;
    $('#footerBlessing').textContent = hero.blessingLine || '';
    if (!hero.blessingLine) $('#footerBlessing').hidden = true;
  }

  function populateStory(cfg) {
    const hasStory = cfg.story && cfg.story.trim();
    const photo = cfg.couple && cfg.couple.photo;

    if (hasStory) $('#storyText').textContent = cfg.story;
    else $('#storyText').hidden = true;

    if (photo) {
      const img = $('#couplePhoto');
      img.src = photo;
      img.alt = `${cfg.couple.bride.name} and ${cfg.couple.groom.name}`;
      $('#photoCard').hidden = false;
      const caption = cfg.couple.photoCaption || '';
      $('#photoCaption').textContent = caption;
      if (!caption) $('#photoCaption').hidden = true;
    }

    // Show the section if either the story text or the photo is present.
    if (hasStory || photo) $('#story').hidden = false;
  }

  /* ============ Festivities: flip cards ============ */
  function populateFestivities(cfg) {
    const wrap = $('#festivityCards');
    const items = (cfg.schedule || []).slice().sort((a, b) => {
      const da = new Date(`${a.date}T${to24h(a.time)}`);
      const db = new Date(`${b.date}T${to24h(b.time)}`);
      return da - db;
    });

    wrap.innerHTML = items.map((item, i) => {
      const icon = FESTIVITY_ICONS[item.id] || FESTIVITY_ICONS.default;
      const dateLabel = formatDisplayDate(item.date, { weekday: 'long', day: 'numeric', month: 'long' });
      return `
        <div class="festivity-card" data-index="${i}" tabindex="0" role="button" aria-label="${escapeAttr(item.title)} — tap to reveal details">
          <div class="festivity-card-inner">
            <div class="festivity-card-face festivity-card-front">
              <div class="festivity-icon">${icon}</div>
              <p class="festivity-title">${escapeHtml(item.title || '')}</p>
              ${item.subtitle ? `<p class="festivity-subtitle">${escapeHtml(item.subtitle)}</p>` : ''}
              <p class="festivity-date">${escapeHtml(dateLabel)}</p>
              <p class="festivity-tap-hint">Tap to reveal</p>
            </div>
            <div class="festivity-card-face festivity-card-back">
              <p class="festivity-back-title">${escapeHtml(item.title || '')}</p>
              <p class="festivity-back-row"><strong>When</strong>${escapeHtml(dateLabel)} · ${escapeHtml(item.time || '')}</p>
              ${item.location ? `<p class="festivity-back-row"><strong>Where</strong>${escapeHtml(item.location)}</p>` : ''}
              ${item.dressCode ? `<p class="festivity-back-row"><strong>Dress Code</strong>${escapeHtml(item.dressCode)}</p>` : ''}
              ${item.quote ? `<p class="festivity-quote">${escapeHtml(item.quote)}</p>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    $$('.festivity-card', wrap).forEach((card) => {
      const toggle = () => card.classList.toggle('is-flipped');
      card.addEventListener('click', toggle);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  function populateAccommodations(cfg) {
    const list = cfg.accommodations || [];
    if (!list.length) return;
    $('#accommodationList').innerHTML = list.map((a) => `
      <div class="accommodation-item">
        <h4>${escapeHtml(a.name || '')}</h4>
        ${a.notes ? `<p>${escapeHtml(a.notes)}</p>` : ''}
        ${a.link ? `<a href="${escapeAttr(a.link)}" target="_blank" rel="noopener">Book now</a>` : ''}
      </div>
    `).join('');
    $('#accommodations').hidden = false;
  }

  function populateRegistry(cfg) {
    const reg = cfg.registry;
    if (!reg || !reg.enabled) return;
    $('#registryNote').textContent = reg.note || '';
    $('#registryLinks').innerHTML = (reg.links || []).map((l) => `
      <a href="${escapeAttr(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label || 'View Registry')}</a>
    `).join('');
    $('#registry').hidden = false;
  }

  /* ============ RSVP (Google Form) ============ */
  function populateRsvpSection(cfg) {
    const rsvp = cfg.rsvp || {};
    if (!rsvp.enabled || !rsvp.googleFormUrl) {
      $('#rsvp').hidden = true;
      return;
    }

    if (rsvp.deadline) {
      $('#rsvpDeadline').textContent = `Kindly respond by ${formatDisplayDate(rsvp.deadline)}`;
    }

    $('#rsvpOpenLink').href = rsvp.googleFormUrl;

    const fallback = $('#rsvpCallFallback');
    if (rsvp.contactPhone) {
      const telHref = `tel:${rsvp.contactPhone.replace(/[^+\d]/g, '')}`;
      fallback.innerHTML = `Prefer to call? <a href="${escapeAttr(telHref)}">Call ${escapeHtml(rsvp.contactName || 'us')}</a>`;
    } else {
      fallback.hidden = true;
    }
  }
  /* ============ Invitation opening: carved doors ============ */
  const svgUrl = (svg) => `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;

  /* ---- Jali: a fine pierced lattice, tiled across each door leaf ---- */
  function buildJaliSvg() {
    const S = 46; // tile size
    const g = 'rgba(233,208,138,0.30)';
    const gs = 'rgba(233,208,138,0.16)';
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <g fill="none" stroke="${g}" stroke-width="0.9">
    <path d="M23 2 L44 23 L23 44 L2 23 Z"/>
    <path d="M23 11 L35 23 L23 35 L11 23 Z"/>
  </g>
  <g fill="none" stroke="${gs}" stroke-width="0.7">
    <path d="M0 0 L11 11 M46 0 L35 11 M0 46 L11 35 M46 46 L35 35"/>
    <circle cx="23" cy="23" r="3.2"/>
  </g>
  <g fill="${g}">
    <circle cx="23" cy="2" r="1"/><circle cx="44" cy="23" r="1"/>
    <circle cx="23" cy="44" r="1"/><circle cx="2" cy="23" r="1"/>
  </g>
</svg>`.trim();
  }

  /* ---- Pelmet: a scalloped, engraved valance above the doorway ---- */
  function buildValanceSvg() {
    const W = 68;
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 60" width="${W}" height="60">
  <defs>
    <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e9d08a"/><stop offset="46%" stop-color="#c9a227"/><stop offset="100%" stop-color="#8a6614"/>
    </linearGradient>
  </defs>
  <!-- band with a scalloped lower edge -->
  <path d="M0 0 H${W} V15 A${W / 2} 15 0 0 1 0 15 Z" fill="url(#vg)"/>
  <path d="M0 5.5 H${W}" stroke="rgba(26,5,11,0.35)" stroke-width="1"/>
  <!-- pendant drop at each scallop junction -->
  <g fill="url(#vg)">
    <path d="M0 15 v11" stroke="url(#vg)" stroke-width="1.6"/>
    <circle cx="0" cy="29" r="3.4"/>
    <path d="M${W} 15 v11" stroke="url(#vg)" stroke-width="1.6"/>
    <circle cx="${W}" cy="29" r="3.4"/>
  </g>
  <!-- small teardrop under the scallop -->
  <path d="M${W / 2} 30 q4 5 0 10 q-4 -5 0 -10 z" fill="url(#vg)"/>
</svg>`.trim();
  }

  function setupDoorArt(cfg) {
    const intro = (cfg && cfg.intro) || {};

    // jali lattice on both leaves, pelmet above the doorway
    $('#introScreen').style.setProperty('--jali', svgUrl(buildJaliSvg()));
    const valance = $('#doorValance');
    if (valance) valance.style.backgroundImage = svgUrl(buildValanceSvg());

    // Title is set as a lockup — names in tracked caps, "weds" in italic —
    // rather than one run of script type.
    const couple = cfg && cfg.couple;
    const titleEl = $('#doorTitle');
    if (couple) {
      titleEl.innerHTML =
        `${escapeHtml(couple.bride.name)}<em>${escapeHtml(intro.joiner || 'weds')}</em>${escapeHtml(couple.groom.name)}`;
    } else if (intro.title) {
      titleEl.textContent = intro.title;
    }

    if (intro.eyebrow) $('#doorEyebrow').textContent = intro.eyebrow;
    if (intro.tapHint) $('#tapHint').textContent = intro.tapHint;
  }

  /* ---- Hanging toran: a repeating tile of leaves and marigolds ----
     Beads are spaced tighter than their diameter so each strand reads as a
     continuous strung garland rather than a row of loose dots. */
  function buildGarlandSvg() {
    const W = 300;
    const H = 165;
    const DIP = 58;
    const cordY = (t) => 6 + Math.sin(Math.PI * t) * DIP;

    const MARIGOLD = ['#f4a300', '#ff8c1a', '#ffc93c', '#ef7a12'];

    // a layered marigold: outer petals + lighter heart
    const flower = (x, y, r, c) =>
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${c}"/>` +
      `<circle cx="${x.toFixed(1)}" cy="${(y - r * 0.22).toFixed(1)}" r="${(r * 0.5).toFixed(1)}" fill="#fff3d2" opacity="0.42"/>`;

    const leafPair = (x, y) =>
      `<path d="M${x} ${y} q-9 7 -2 15 q8 -4 2 -15 z" fill="#1f7a3d"/>` +
      `<path d="M${x} ${y} q9 7 2 15 q-8 -4 -2 -15 z" fill="#2f9c4f"/>`;

    let parts = '';

    // leaf pairs sitting on the cord
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      parts += leafPair(t * W, cordY(t) + 1);
    }

    // hanging strands
    const stops = [0.08, 0.2, 0.32, 0.44, 0.5, 0.56, 0.68, 0.8, 0.92];
    stops.forEach((t, i) => {
      const x = t * W;
      const y = cordY(t);
      const len = i === 4 ? 92 : 40 + ((i * 17) % 44);
      parts += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y + len).toFixed(1)}" stroke="#1f7a3d" stroke-width="1.5"/>`;

      const step = 7.2;
      const n = Math.floor(len / step);
      for (let b = 0; b < n; b++) {
        const by = y + 7 + b * step;
        const r = 4.8 - (b / n) * 1.5;
        parts += flower(x, by, r, MARIGOLD[(i + b) % MARIGOLD.length]);
      }
      // mango leaf finial
      parts += `<path d="M${x} ${(y + len).toFixed(1)} q7 9 0 19 q-7 -10 0 -19 z" fill="#1f7a3d"/>`;
    });

    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <path d="M0 6 Q${W / 2} ${6 + DIP * 1.28} ${W} 6" fill="none" stroke="#14532d" stroke-width="4"/>
  ${parts}
</svg>`.trim();
  }

  /* ---- Kalash: brass pot, mango-leaf fan and coconut ----
     Leaves are drawn first and radiate from the rim; the coconut is laid over
     their bases so it nestles into the fan instead of floating above it. */
  function buildKalashSvg() {
    const leafAngles = [-74, -52, -30, -10, 10, 30, 52, 74];
    const leaves = leafAngles
      .map((a, i) => {
        const shade = i % 2 ? '#2f9c4f' : '#1f7a3d';
        return `<g transform="rotate(${a})"><path d="M0 0 q-8 -22 0 -44 q8 22 0 44 z" fill="${shade}"/><path d="M0 -2 V-40" stroke="rgba(255,255,255,0.28)" stroke-width="1"/></g>`;
      })
      .join('');

    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 185" width="120" height="185">
  <defs>
    <linearGradient id="pot" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffe9a8"/><stop offset="34%" stop-color="#e8b449"/><stop offset="72%" stop-color="#c0871d"/><stop offset="100%" stop-color="#8f5d0e"/>
    </linearGradient>
    <radialGradient id="nut" cx="36%" cy="30%" r="72%">
      <stop offset="0%" stop-color="#b07a41"/><stop offset="100%" stop-color="#6f4520"/>
    </radialGradient>
  </defs>

  <!-- mango-leaf fan springing from the rim -->
  <g transform="translate(60,74)">${leaves}</g>

  <!-- coconut nestled into the fan -->
  <ellipse cx="60" cy="46" rx="18" ry="21" fill="url(#nut)"/>
  <path d="M60 25 q6 -9 1 -12 q-7 4 -1 12 z" fill="#6f4520"/>
  <ellipse cx="53" cy="39" rx="5.5" ry="6.5" fill="#c08b52" opacity="0.55"/>

  <!-- rim, neck, body -->
  <path d="M26 74 h68 l-8 13 H34 z" fill="url(#pot)"/>
  <path d="M30 74 h60" stroke="#fff3d2" stroke-width="2" opacity="0.5"/>
  <rect x="41" y="87" width="38" height="7" fill="url(#pot)"/>
  <path d="M41 94 q-28 24 -22 54 q7 32 41 32 q34 0 41 -32 q6 -30 -22 -54 z" fill="url(#pot)"/>
  <path d="M46 100 q-20 20 -17 45" stroke="#fff3d2" stroke-width="3" opacity="0.35" fill="none"/>

  <!-- kalava thread + motif -->
  <path d="M20 128 q40 13 80 0" fill="none" stroke="#c1121f" stroke-width="5"/>
  <path d="M21 138 q39 12 78 0" fill="none" stroke="#fff3d2" stroke-width="2" opacity="0.6"/>
  <circle cx="60" cy="155" r="9" fill="none" stroke="#7a4a08" stroke-width="2"/>
  <path d="M55 155 h10 M60 150 v10" stroke="#7a4a08" stroke-width="2"/>

  <!-- foot -->
  <path d="M42 178 h36 l-5 7 H47 z" fill="#8f5d0e"/>
</svg>`.trim();
  }

  function setupHeroDecor() {
    const g = $('#heroGarland');
    if (g) g.style.backgroundImage = svgUrl(buildGarlandSvg());

    const kalash = svgUrl(buildKalashSvg());
    [$('#heroKalashLeft'), $('#heroKalashRight')].forEach((el) => {
      if (el) el.style.backgroundImage = kalash;
    });
  }

  /* ============ Cusped (multifoil) Mughal arch ============ */
  // Walks a semicircle and joins the sample points with small arcs that bulge
  // inward, producing the scalloped arch head of the reference invitation.
  function buildArchPath(cx, cy, R, lobes) {
    const pt = (k) => {
      const deg = 180 - (180 * k) / lobes;
      const rad = (deg * Math.PI) / 180;
      return [cx + R * Math.cos(rad), cy - R * Math.sin(rad)];
    };
    const p0 = pt(0);
    const p1 = pt(1);
    const chord = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const r = chord * 0.62;

    let d = `M ${p0[0].toFixed(1)} ${p0[1].toFixed(1)}`;
    for (let k = 1; k <= lobes; k++) {
      const [x, y] = pt(k);
      // sweep-flag 0 = cusp curves into the opening
      d += ` A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 0 ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  }

  function buildArchSvg() {
    const W = 400;
    const H = 210;
    const cy = H - 5;
    const outer = buildArchPath(200, cy, 200, 9);
    const inner = buildArchPath(200, cy, 188, 9);
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
  <defs>
    <linearGradient id="archGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe9a8"/><stop offset="45%" stop-color="#f4a300"/><stop offset="100%" stop-color="#c68a12"/>
    </linearGradient>
    <linearGradient id="archCream" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffefb"/><stop offset="100%" stop-color="#fffdf6"/>
    </linearGradient>
  </defs>
  <path d="${outer} L 400 ${H} L 0 ${H} Z" fill="url(#archCream)"/>
  <path d="${outer}" fill="none" stroke="url(#archGold)" stroke-width="6" stroke-linejoin="round"/>
  <path d="${inner}" fill="none" stroke="rgba(244,163,0,0.55)" stroke-width="1.6"/>
</svg>`.trim();
  }

  function setupHeroArch() {
    const host = $('#heroCardArch');
    if (!host) return;
    host.insertAdjacentHTML('afterbegin', buildArchSvg());
  }

  function setupGanesh(cfg) {
    const src = (cfg && cfg.branding && cfg.branding.ganeshLogo) || '';
    $$('.ganesh-mark').forEach((el) => {
      if (!src) { el.hidden = true; return; }
      el.innerHTML = `<img src="${escapeAttr(src)}" alt="Shri Ganesha" />`;
    });
  }

  function setupDoor() {
    const screen = $('#introScreen');
    const doorway = $('#doorway');
    const tapHint = $('#tapHint');
    const siteContent = $('#siteContent');
    let opened = false;

    function open() {
      if (opened) return;
      opened = true;
      tapHint.style.opacity = '0';
      doorway.classList.add('is-open');

      setTimeout(() => {
        document.body.classList.add('intro-open');
        siteContent.classList.add('is-visible');
      }, 1000);

      setTimeout(() => screen.classList.add('is-hidden'), 1150);
      setTimeout(() => screen.remove(), 2600);
    }

    screen.addEventListener('click', open);
    screen.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  }

  /* ============ Scroll reveal ============ */
  function setupScrollReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach((el) => io.observe(el));
  }

  /* ============ Countdown ============ */
  function setupCountdown(cfg) {
    const { wedding } = cfg;
    if (wedding.countdownLabel) $('#countdownKicker').textContent = wedding.countdownLabel;

    const target = new Date(`${wedding.date}T${to24h(wedding.time)}`);
    const els = { d: $('#cdDays'), h: $('#cdHours'), m: $('#cdMinutes'), s: $('#cdSeconds') };

    function tick() {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        els.d.textContent = els.h.textContent = els.m.textContent = els.s.textContent = '00';
        clearInterval(timer);
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      els.d.textContent = String(days).padStart(2, '0');
      els.h.textContent = String(hours).padStart(2, '0');
      els.m.textContent = String(minutes).padStart(2, '0');
      els.s.textContent = String(seconds).padStart(2, '0');
    }

    tick();
    const timer = setInterval(tick, 1000);
  }

  /* ============ Add to calendar ============ */
  function downloadIcs({ title, date, time, location, description, filename }) {
    const startDate = date.replace(/-/g, '');
    const timeStr = to24h(time).slice(0, 5).replace(':', '');
    const startDateTime = `${startDate}T${timeStr}00`;

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DTSTART:${startDateTime}`,
      `LOCATION:${location || ''}`,
      `DESCRIPTION:${description || ''}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function setupAddToCalendar(cfg) {
    const { wedding, couple } = cfg;
    const handler = () => {
      downloadIcs({
        title: `${couple.bride.name} & ${couple.groom.name}'s Wedding`,
        date: wedding.date,
        time: wedding.time,
        location: [wedding.venueName, wedding.address].filter(Boolean).join(', '),
        description: "We're getting married! Join us to celebrate.",
        filename: `${couple.bride.name}-${couple.groom.name}-wedding.ics`,
      });
    };
    $('#addToCalendarBtn').addEventListener('click', handler);
    const rsvpBtn = $('#rsvpAddCalendarBtn');
    if (rsvpBtn) rsvpBtn.addEventListener('click', handler);
  }

  /* ============ Live falling petals ============ */
  function setupPetals() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const field = $('#petalField');
    const colors = ['#c8941f', '#a52a2a', '#e0a13a', '#c25a4a'];
    const COUNT = window.innerWidth < 600 ? 10 : 16;

    function spawnPetal(el) {
      const startX = Math.random() * 100;
      const drift = (Math.random() - 0.5) * 160;
      const spin = 260 + Math.random() * 200;
      const duration = 9 + Math.random() * 7;
      const delay = Math.random() * duration;
      const size = 10 + Math.random() * 10;
      const color = colors[Math.floor(Math.random() * colors.length)];

      el.style.left = `${startX}%`;
      el.style.setProperty('--drift', `${drift}px`);
      el.style.setProperty('--spin', `${spin}deg`);
      el.style.animationDuration = `${duration}s`;
      el.style.animationDelay = `-${delay}s`;
      el.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 20 20"><path d="M10 1 C16 4 16 12 10 19 C4 12 4 4 10 1 Z" fill="${color}"/></svg>`;
    }

    for (let i = 0; i < COUNT; i++) {
      const petal = document.createElement('div');
      petal.className = 'petal';
      spawnPetal(petal);
      field.appendChild(petal);
    }
  }

  async function init() {
    try {
      const cfg = await loadConfig();
      state.config = cfg;
      applyTheme(cfg.theme);
      populateHero(cfg);
      populateStory(cfg);
      populateFestivities(cfg);
      populateAccommodations(cfg);
      populateRegistry(cfg);
      populateRsvpSection(cfg);
      setupCountdown(cfg);
      setupAddToCalendar(cfg);
      setupDoorArt(cfg);
      setupGanesh(cfg);
    } catch (err) {
      console.error(err);
      // Config failed to load — still draw the door so the page is openable.
      setupDoorArt(null);
    }
    setupHeroArch();
    setupHeroDecor();
    setupDoor();
    setupScrollReveal();
    setupPetals();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
