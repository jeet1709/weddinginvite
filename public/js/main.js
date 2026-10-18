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

  // "4–5 December 2026" across the whole schedule (falls back to the
  // wedding date alone). Same month → one month name; otherwise both.
  function formatDateRange(schedule, wedding) {
    const dates = (schedule || []).map((s) => s.date).filter(Boolean);
    if (wedding && wedding.date) dates.push(wedding.date);
    if (!dates.length) return '';
    dates.sort();
    const parse = (d) => new Date(`${d}T00:00:00`);
    const a = parse(dates[0]);
    const b = parse(dates[dates.length - 1]);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return '';
    const month = (d) => d.toLocaleDateString('en-GB', { month: 'long' });
    if (a.getTime() === b.getTime()) return `${a.getDate()} ${month(a)} ${a.getFullYear()}`;
    if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
      return `${a.getDate()}–${b.getDate()} ${month(b)} ${b.getFullYear()}`;
    }
    return `${a.getDate()} ${month(a)} – ${b.getDate()} ${month(b)} ${b.getFullYear()}`;
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

    const monogramFull = couple.monogram || `${couple.bride.name} & ${couple.groom.name}`;

    $('#navMonogram').textContent = monogramFull;
    const monoImg = cfg.branding && cfg.branding.monogramImage;
    if (monoImg) $('#navMonogram').innerHTML = `<img src="${escapeAttr(monoImg)}" alt="${escapeAttr(monogramFull)}" />`;
    $('#heroPreTitle').textContent = hero.preTitle || '';

    $('#brideName').textContent = couple.bride.name;
    $('#groomName').textContent = couple.groom.name;
    $('#brideParents').textContent = couple.bride.parents || '';
    $('#groomParents').textContent = couple.groom.parents || '';

    if (hero.invocation) $('#heroInvocation').textContent = hero.invocation;
    $('#heroTagline').textContent = hero.tagline || '';
    $('#heroDate').textContent = formatDateRange(cfg.schedule, wedding) || wedding.displayDate || '';
    $('#heroPlace').textContent = hero.place || '';
    if (hero.ctaLabel) $('#heroCta').firstChild.textContent = `${hero.ctaLabel} `;

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
    // `story` is a string or an array of lines. Each line renders on its
    // own row; a "Question? Answer." line is split so the answer can be
    // set apart from the question.
    const lines = (Array.isArray(cfg.story) ? cfg.story : [cfg.story || ''])
      .map((l) => String(l).trim()).filter(Boolean);
    const hasStory = lines.length > 0;
    const photo = cfg.couple && cfg.couple.photo;

    if (hasStory) {
      $('#storyText').innerHTML = lines.map((line) => {
        const m = /^(.*?\?)\s+(.+)$/.exec(line);
        return m
          ? `<span class="story-line"><span class="story-q">${escapeHtml(m[1])}</span> <span class="story-a">${escapeHtml(m[2])}</span></span>`
          : `<span class="story-line">${escapeHtml(line)}</span>`;
      }).join('');
    } else {
      $('#storyText').hidden = true;
    }

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
      const hasPalette = Array.isArray(item.palette) && item.palette.length > 0;
      const label = `
              <p class="festivity-title">${escapeHtml(item.title || '')}</p>
              ${item.subtitle ? `<p class="festivity-subtitle">${escapeHtml(item.subtitle)}</p>` : ''}
              <p class="festivity-date">${escapeHtml(dateLabel)}</p>
              <p class="festivity-tap-hint">Tap to reveal</p>`;
      // With `art`, the front is the full, uncropped 9:16 scene; its title
      // sits in the blank band the illustration leaves for text —
      // `artText` says which end that band is at, `artTone` whether it's
      // light or dark so the type can contrast with it.
      const front = item.art
        ? `<div class="festivity-card-face festivity-card-front has-art art-text-${item.artText === 'top' ? 'top' : 'bottom'} art-tone-${item.artTone === 'dark' ? 'dark' : 'light'}">
              <img class="festivity-art" src="${escapeAttr(item.art)}" alt="" loading="lazy" />
              <div class="festivity-art-label">${label}</div>
            </div>`
        : `<div class="festivity-card-face festivity-card-front">
              <div class="festivity-icon">${icon}</div>${label}
            </div>`;
      return `
        <div class="festivity-card${item.art ? ' has-art' : ''}" data-index="${i}" tabindex="0" role="button" aria-label="${escapeAttr(item.title)} — tap to reveal details">
          <div class="festivity-card-inner">
            ${front}
            <div class="festivity-card-face festivity-card-back">
              <p class="festivity-back-title">${escapeHtml(item.title || '')}</p>
              <p class="festivity-back-row"><strong>When</strong>${escapeHtml(dateLabel)} · ${escapeHtml(item.time || '')}</p>
              ${item.location ? `<p class="festivity-back-row"><strong>Where</strong>${escapeHtml(item.location)}</p>` : ''}
              ${item.dressCode || hasPalette ? `<div class="festivity-back-row"><strong>Dress Code</strong>${item.dressCode ? escapeHtml(item.dressCode) : ''}${hasPalette ? `<div class="festivity-palette" role="list" aria-label="Colour palette">${item.palette.map((c) => `<span class="palette-dot" role="listitem" title="${escapeAttr(c.name || '')}" aria-label="${escapeAttr(c.name || c.color)}" style="background:${escapeAttr(c.color)}"></span>`).join('')}</div>` : ''}</div>` : ''}
              ${item.quote ? `<p class="festivity-quote">${escapeHtml(item.quote)}</p>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
    wrap.classList.toggle('has-art', items.some((item) => item.art));

    // "Two Days of Celebration" etc. — counted from the distinct dates, so it
    // follows the schedule instead of being hardcoded.
    const days = new Set(items.map((item) => item.date)).size;
    const words = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'];
    if (days) $('#festivitiesKicker').textContent = `${words[days] || days} Day${days > 1 ? 's' : ''} of Celebration`;

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

  /* ============ How to reach (journey route) ============ */
  const TRAVEL_ICONS = {
    plane: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
    train: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-4 0-8 .5-8 4v9.5A3.5 3.5 0 0 0 7.5 19L6 20.5v.5h2.2l2-2h3.6l2 2H18v-.5L16.5 19a3.5 3.5 0 0 0 3.5-3.5V6c0-3.5-3.6-4-8-4zM7.5 17a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM11 10H6V6h5v4zm2 0V6h5v4h-5zm3.5 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>`,
    car: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01A1.5 1.5 0 0 0 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8l-2.08-5.99zM6.5 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 11l1.5-4.5h11L19 11H5z"/></svg>`,
    pin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>`,
  };

  function populateTravel(cfg) {
    const t = cfg.travel;
    const navLink = $('a[data-nav-optional="travel"]');
    if (!t || !t.start) { if (navLink) navLink.hidden = true; return; }
    const icon = (name) => `<span class="itin-icon" aria-hidden="true">${TRAVEL_ICONS[name] || TRAVEL_ICONS.pin}</span>`;
    const pad = (n) => String(n).padStart(2, '0');

    if (t.kicker) $('#travelKicker').textContent = t.kicker;
    // the heading is optional: leave `title` out to show just the kicker
    $('#travelTitle').textContent = t.title || '';
    $('#travelTitle').hidden = !t.title;

    const step = (n, iconName, body) => `
      <li class="itin-step">
        <span class="itin-marker">${icon(iconName)}</span>
        <div class="itin-body"><span class="itin-no">${pad(n)}</span>${body}</div>
      </li>`;
    const line = (o) => `
      <span class="itin-title">${escapeHtml(o.title || '')}</span>
      ${o.detail ? `<span class="itin-detail">${escapeHtml(o.detail)}</span>` : ''}`;

    const opts = t.options || [];
    let html = step(1, t.start.icon, line(t.start));
    if (opts.length) {
      html += step(2, opts[0].icon, opts.map((o, i) => `
        ${i ? '<span class="itin-or">or</span>' : ''}
        <div class="itin-option">${line(o)}</div>`).join(''));
    }
    $('#travelRoute').innerHTML = html;

    const a = t.arriveBy || {};
    if (a.time) {
      const d = a.date ? formatDisplayDate(a.date, { weekday: 'long', day: 'numeric', month: 'long' }) : '';
      $('#travelArrive').innerHTML = `
        <span class="itin-arrive-label">${escapeHtml(a.label || 'Please arrive by')}</span>
        <span class="itin-arrive-when">${escapeHtml(a.time)}${d ? ` <span class="itin-dot">·</span> ${escapeHtml(d)}` : ''}</span>`;
      $('#travelArrive').hidden = false;
    }
    $('#travel').hidden = false;
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
    } else {
      $('#rsvpDeadline').hidden = true;
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

    // Pause while the tab isn't visible (switched away, minimised, screen
    // locked) and resume from where it left off once it's visible again —
    // music playing on in a backgrounded tab is a surprise for the visitor
    // and a pointless battery/data drain. `hasStarted` only flips true once
    // playback has actually begun (the envelope's been tapped), so this
    // never triggers a bare autoplay attempt before that gesture.
    let hasStarted = false;
    audio.addEventListener('play', () => { hasStarted = true; });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (!audio.paused) audio.pause();
      } else if (hasStarted && audio.paused) {
        audio.play().catch(() => { /* ignore */ });
      }
    });

    return audio;
  }

  /* ---- Opening overlay ----
     js/invitation-overlay.js draws the tap-to-open envelope. Music starts
     inside the tap itself (the gesture that unlocks audio); the site is
     revealed at the moment the overlay starts fading, so the homepage
     cross-fades in underneath it rather than appearing after a gap. */
  function setupOpening(cfg, music) {
    const siteContent = $('#siteContent');
    const reveal = () => {
      window.scrollTo(0, 0);
      document.body.classList.add('intro-open');
      siteContent.classList.add('is-visible');
    };
    if (!window.InvitationOverlay) { reveal(); return; }

    const couple = (cfg && cfg.couple) || null;
    const intro = (cfg && cfg.intro) || {};
    window.InvitationOverlay.show({
      ganesha: cfg && cfg.branding && cfg.branding.ganeshLogo,
      monogram: couple && couple.monogram,
      sealImage: cfg && cfg.branding && cfg.branding.sealImage,
      names: couple && `${couple.bride.name} & ${couple.groom.name}`,
      tagline: intro.tagline,
      headline: intro.headline,
      tapHint: intro.tapHint,
      buttonLabel: intro.buttonLabel,
      onTap: () => { if (music) music.play().catch(() => { /* autoplay declined; silent */ }); },
      onReveal: reveal,
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
  /* ============ Scratch to reveal the countdown ============
     A gold foil drawn on a <canvas> over the countdown. Scratching erases
     it (destination-out strokes); once about half is cleared the rest fades
     away. Enter/Space on the focused foil reveals it outright, and the
     countdown underneath stays in the DOM for screen readers throughout. */
  function setupScratch() {
    const canvas = $('#scratchFoil');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const BRUSH = 26; // px radius, CSS pixels
    let revealed = false;
    let drawing = false;
    let last = null;
    let strokes = 0;

    function paint() {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';

      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#f9dd8a');
      g.addColorStop(0.35, '#e2a92c');
      g.addColorStop(0.55, '#fbe3a0');
      g.addColorStop(0.8, '#cf8e1c');
      g.addColorStop(1, '#f2c45e');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // fine diagonal foil grain
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      for (let x = -h; x < w; x += 7) {
        ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + h, 0); ctx.stroke();
      }
      // a few sparkles
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (let i = 0; i < 26; i++) {
        const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * w;
        const y = (Math.sin(i * 47.3 + 1) * 0.5 + 0.5) * h;
        ctx.beginPath(); ctx.arc(x, y, 1 + (i % 3) * 0.6, 0, Math.PI * 2); ctx.fill();
      }
      // inset frame
      ctx.strokeStyle = 'rgba(122,13,29,0.45)';
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.setLineDash([]);

      ctx.fillStyle = '#7a0d1d';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${Math.min(30, w / 11)}px Parisienne, cursive`;
      ctx.fillText('Scratch to reveal', w / 2, h / 2 - 12);
      ctx.font = `600 ${Math.min(12, w / 30)}px Marcellus, serif`;
      ctx.fillText('✦  THE COUNTDOWN TO OUR FOREVER  ✦', w / 2, h / 2 + 22);
    }

    function point(e) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function scratch(from, to) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = BRUSH * 2;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      if (++strokes % 6 === 0 && clearedRatio() > 0.5) reveal();
    }

    // Sample the alpha channel on a coarse grid — cheap enough to run while
    // scratching.
    function clearedRatio() {
      const { width, height } = canvas;
      const data = ctx.getImageData(0, 0, width, height).data;
      const step = Math.max(4, Math.round(width / 60)) * 4;
      let clear = 0;
      let total = 0;
      for (let i = 3; i < data.length; i += step * 4) {
        total++;
        if (data[i] < 40) clear++;
      }
      return total ? clear / total : 0;
    }

    function reveal() {
      if (revealed) return;
      revealed = true;
      canvas.classList.add('is-revealed');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.tabIndex = -1;
      setTimeout(() => canvas.remove(), 800);
    }

    canvas.addEventListener('pointerdown', (e) => {
      if (revealed) return;
      drawing = true;
      canvas.setPointerCapture(e.pointerId);
      last = point(e);
      scratch(last, { x: last.x + 0.1, y: last.y });
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drawing || revealed) return;
      const p = point(e);
      scratch(last, p);
      last = p;
    });
    const stop = () => { drawing = false; last = null; if (!revealed && clearedRatio() > 0.5) reveal(); };
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);
    canvas.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(); }
    });

    paint();
    // Repaint once the script fonts are in, and if the box changes size
    // before it's been scratched (rotation, resize).
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!strokes) paint(); });
    if (window.ResizeObserver) {
      let lastW = canvas.clientWidth;
      new ResizeObserver(() => {
        if (revealed || canvas.clientWidth === lastW) return;
        lastW = canvas.clientWidth;
        strokes = 0;
        paint();
      }).observe(canvas);
    }
  }

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
      populateTravel(cfg);
      populateAccommodations(cfg);
      populateRegistry(cfg);
      populateRsvpSection(cfg);
      setupCountdown(cfg);
      setupAddToCalendar(cfg);
      setupGanesh(cfg);
      music = setupIntroAudio(cfg);
    } catch (err) {
      console.error(err);
      // Config failed to load — still show the overlay so the page opens.
    }
    setupOpening(state.config, music);
    setupScratch();
    setupScrollReveal();
    setupPetals();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
