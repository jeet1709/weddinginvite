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

    $('#envMonogram').textContent = monogramCompact;
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

    // The invitation video already carries names/date/venue as a finished
    // animated card. Autoplay-muted-loop starts as soon as the source is
    // set — it can run behind the envelope intro screen with no visible or
    // audible effect, so there's nothing to gate on "after the letter
    // opens" beyond the envelope itself no longer covering it.
    const video = $('#heroVideo');
    const videoFrame = $('.hero-video-frame');
    if (video && hero.videoUrl) {
      video.src = hero.videoUrl;
    } else if (videoFrame) {
      videoFrame.hidden = true;
    }
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
  /* ============ Invitation opening: X-fold envelope ============ */

  /* ---- Rose spray, embossed on the side flaps only ----
     A filled silhouette (not stroke-only line art) reads as an engraving
     when rim-lit — the earlier stroked circles read as a schematic flower
     icon rather than a rose. Built from overlapping almond petals in two
     rings plus a stem and a pair of leaves, all in `currentColor` so one
     CSS colour change carries the whole gilding transition. */
  function buildRoseSpray() {
    const petal = (len, w) =>
      `M50 38 C${50 - w} ${38 - len * 0.55}, ${50 - w} ${38 - len}, 50 ${38 - len - 4} ` +
      `C${50 + w} ${38 - len}, ${50 + w} ${38 - len * 0.55}, 50 38 Z`;

    const outerPetal = petal(24, 9);
    const innerPetal = petal(15, 6.5);

    let outer = '';
    for (let i = 0; i < 6; i++) {
      outer += `<path d="${outerPetal}" transform="rotate(${i * 60} 50 38)"/>`;
    }
    let inner = '';
    for (let i = 0; i < 5; i++) {
      inner += `<path d="${innerPetal}" transform="rotate(${i * 72 + 20} 50 38)" opacity="0.92"/>`;
    }

    return `
<svg viewBox="0 0 100 150" fill="currentColor" stroke="none">
  <path d="M50 60 C48 78 47 98 49 122" fill="none" stroke="currentColor" stroke-width="1.6" opacity="0.85"/>
  <path d="M49 88 C40 84 32 86 25 94 C33 92 41 93 49 98 Z" opacity="0.85"/>
  <path d="M49 104 C58 99 66 100 74 107 C65 106 57 108 49 114 Z" opacity="0.85"/>
  <g>${outer}</g>
  <g>${inner}</g>
  <circle cx="50" cy="38" r="4.5"/>
</svg>`.trim();
  }
  const ROSE_SPRAY = buildRoseSpray();

  // Confined to the two side flaps, arranged as a loose descending vine —
  // matching the reference, where the top and bottom flaps carry no
  // ornament at all and only the sides are embossed.
  const SPRIG_LAYOUT = [
    { x: 22, y: 27, s: 20, r: -14, mirror: false },
    { x: 16, y: 50, s: 24, r: -6, mirror: false },
    { x: 21, y: 73, s: 19, r: -18, mirror: false },
    { x: 78, y: 27, s: 20, r: 14, mirror: true },
    { x: 84, y: 50, s: 24, r: 6, mirror: true },
    { x: 79, y: 73, s: 19, r: 18, mirror: true },
  ];

  function setupEnvelopeArt(cfg) {
    const intro = (cfg && cfg.intro) || {};

    // Stagger by distance from the seal so the gilding visibly travels
    // outward from the ignition point, same logic as the light itself.
    // Rendered into two separate containers — one nested in each side
    // flap's own wrap — so the roses physically travel with their flap as
    // it opens, rather than staying pinned to a spot the flap has left.
    const withDist = SPRIG_LAYOUT.map((p) => ({
      ...p,
      d: Math.hypot(p.x - 50, (p.y - 42) * 0.9),
    }));
    const maxD = Math.max(...withDist.map((p) => p.d));

    const renderSprig = (p) => {
      const delay = 0.25 + (p.d / maxD) * 0.55;
      const scaleX = p.mirror ? -1 : 1;
      return `<span class="env-sprig" style="
        left:${p.x}%; top:${p.y}%;
        width:${p.s}vmin; height:${p.s}vmin;
        --rot:${p.r}deg;
        transform:translate(-50%,-50%) rotate(${p.r}deg) scaleX(${scaleX});
        transition-delay:${delay.toFixed(2)}s">${ROSE_SPRAY}</span>`;
    };

    const fieldLeft = $('#envFiligreeLeft');
    const fieldRight = $('#envFiligreeRight');
    if (fieldLeft) fieldLeft.innerHTML = withDist.filter((p) => !p.mirror).map(renderSprig).join('');
    if (fieldRight) fieldRight.innerHTML = withDist.filter((p) => p.mirror).map(renderSprig).join('');

    const couple = cfg && cfg.couple;
    if (couple) {
      $('#doorTitle').innerHTML =
        `${escapeHtml(couple.bride.name)}<em>${escapeHtml(intro.joiner || 'weds')}</em>${escapeHtml(couple.groom.name)}`;
    }
    if (intro.eyebrow) $('#doorEyebrow').textContent = intro.eyebrow;
    if (intro.tapHint) $('#tapHint').textContent = intro.tapHint;
  }

  /* ---- Background music ----
     Silent no-op unless config.intro.musicUrl is set — this repo ships no
     audio file (see README: sourcing a properly licensed track is a
     decision for the site owner, not something to embed sight-unseen).
     play() is called synchronously inside the click handler, in the same
     tick as the user gesture, which is what lets browsers allow audio to
     start unmuted without a prior interaction. */
  function setupIntroAudio(cfg) {
    const intro = (cfg && cfg.intro) || {};
    const audio = $('#introMusic');
    const toggle = $('#muteToggle');
    if (!audio || !intro.musicUrl) return null;

    audio.src = intro.musicUrl;
    audio.volume = 0.55;

    let muted = false;
    try { muted = localStorage.getItem('weddinginvite:muted') === 'true'; } catch { /* ignore */ }
    audio.muted = muted;

    if (toggle) {
      toggle.hidden = false;
      toggle.dataset.muted = String(muted);
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        muted = !muted;
        audio.muted = muted;
        toggle.dataset.muted = String(muted);
        try { localStorage.setItem('weddinginvite:muted', String(muted)); } catch { /* ignore */ }
      });
    }
    return audio;
  }

  /* ---- Opening sequence ----
     ignite → beam pours down through the lower fold only → a brief hold at
     full light → the envelope dissolves through a contained bloom, with the
     invitation already in place underneath. Paced deliberately slower than
     a typical CSS reveal — the hold beat is what keeps it from feeling
     rushed or "snappy" in the way cheaper transitions do. */
  function setupEnvelope(music) {
    const screen = $('#introScreen');
    const siteContent = $('#siteContent');
    if (!screen) return;
    let opened = false;

    function open() {
      if (opened) return;
      opened = true;

      if (music) music.play().catch(() => { /* autoplay declined; silent */ });

      // The `autoplay` attribute is unreliable once a video's `src` is set
      // dynamically after page load (which populateHero() does, since the
      // URL comes from config) — several mobile browsers only honour
      // autoplay reliably when it's driven by an actual user gesture, and
      // otherwise fall back to showing a native play button, leaving the
      // video paused on its first frame until tapped. This click on the
      // envelope IS that gesture, so play() is called explicitly from
      // inside this same handler rather than trusting the attribute alone.
      // `.muted` is set as a JS property (not just the HTML attribute) —
      // Safari in particular checks the live property when deciding
      // whether to honour autoplay-without-permission.
      const heroVideo = $('#heroVideo');
      if (heroVideo) {
        heroVideo.muted = true;
        heroVideo.play().catch(() => { /* autoplay declined; silent */ });
      }

      // Seal cracks (~0-0.85s) → the closed envelope's gold trim fades fast
      // (~0-0.3s) → all four flaps unfold in a bloom-like stagger, top
      // first, then the sides, then bottom (~0.3-2.74s) → sparks race each
      // crease as its flap starts moving (~0.3-2.22s) → a brief hold, then
      // at 3.0s #introScreen itself starts to fade at the same moment the
      // site content is revealed. Both need to move together: #introScreen
      // carries its own near-black background at z-index 1000 over the
      // *entire* viewport, so if it fades on a separate, later schedule
      // from what's happening inside it, the site briefly shows through to
      // nothing but that black backdrop — a dead gap between "envelope's
      // gone" and "screen's gone".
      screen.classList.add('is-opening');

      setTimeout(() => {
        document.body.classList.add('intro-open');
        siteContent.classList.add('is-visible');
        screen.classList.add('is-hidden');
      }, 3000);

      setTimeout(() => screen.remove(), 4200);
    }

    screen.addEventListener('click', open);
    screen.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  }






  function setupGanesh(cfg) {
    const src = (cfg && cfg.branding && cfg.branding.ganeshLogo) || '';
    $$('.ganesh-mark').forEach((el) => {
      if (!src) { el.hidden = true; return; }
      el.innerHTML = `<img src="${escapeAttr(src)}" alt="Shri Ganesha" />`;
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
    let music = null;
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
      setupEnvelopeArt(cfg);
      setupGanesh(cfg);
      music = setupIntroAudio(cfg);
    } catch (err) {
      console.error(err);
      // Config failed to load — still draw the door so the page is openable.
      setupEnvelopeArt(null);
    }
    setupEnvelope(music);
    setupScrollReveal();
    setupPetals();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
