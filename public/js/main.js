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

    const monogramFull = couple.monogram || `${couple.bride.name} & ${couple.groom.name}`;

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
              ${item.dressCode ? `<p class="festivity-back-row"><strong>Dress Code</strong>${escapeHtml(item.dressCode)}</p>` : ''}
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

  /* ============ Now Showing (#Pyar Dosti Hai screening card) ============ */
  function populateNowShowing(cfg) {
    const sc = cfg.screening;
    if (!sc || sc.enabled === false) return;
    const { couple, wedding, rsvp } = cfg;
    const set = (sel, text) => { $(sel).textContent = text || ''; };

    if (sc.ganeshaArt) $('#nsGaneshaArt').src = sc.ganeshaArt;
    else $('#nsGanesha').hidden = true;
    set('#nsShloka', sc.invocation);
    set('#nsPresenters', sc.presentedBy);
    set('#nsEyebrow', sc.eyebrow);
    set('#nsTitle', sc.title);
    set('#nsBride', couple.bride.name);
    set('#nsGroom', couple.groom.name);
    set('#nsBrideParents', couple.bride.parents);
    set('#nsGroomParents', couple.groom.parents);

    const shows = (cfg.schedule || []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    $('#nsShows').innerHTML = shows.map((item) => `
      <div class="ns-show">
        <div class="ns-show-head">
          <span class="ns-show-title">${escapeHtml(item.title)}</span>
          <span class="ns-show-date">${escapeHtml(formatDisplayDate(item.date, { weekday: 'short', day: 'numeric', month: 'short' }))}</span>
        </div>
        ${item.subtitle ? `<span class="ns-show-sub">${escapeHtml(item.subtitle)}</span>` : ''}
        <span class="ns-show-when">${escapeHtml((item.time || '').replace(/\s*onwards$/i, ''))}</span>
        ${item.location ? `<span class="ns-show-where">${escapeHtml(item.location)}</span>` : ''}
      </div>`).join('');

    const t = new Date(`${wedding.date}T${to24h(wedding.time)}`);
    const time = Number.isNaN(t.getTime()) ? '' : t.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
    set('#nsPremiereLabel', sc.premiereLabel);
    set('#nsPremiereWhen', [formatDisplayDate(wedding.date), time].filter(Boolean).join(' · '));
    set('#nsPremiereWhere', [wedding.venueName, wedding.venueCity].filter(Boolean).join(', '));
    set('#nsAdmit', sc.admit);
    set('#nsRsvpBy', rsvp && rsvp.deadline ? `RSVP by ${formatDisplayDate(rsvp.deadline, { day: 'numeric', month: 'short' })}` : '');

    $('#nowShowing').hidden = false;
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
      names: couple && `${couple.bride.name} & ${couple.groom.name}`,
      tagline: intro.tagline,
      subtitle: intro.subtitle,
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
      populateNowShowing(cfg);
      populateFestivities(cfg);
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
    setupScrollReveal();
    setupPetals();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
