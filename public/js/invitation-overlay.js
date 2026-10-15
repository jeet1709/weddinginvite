/* Invitation opening overlay — the full-screen "tap to open" envelope.
   Adapted from website-integration/invitation-overlay.js (v2) so its text
   comes from config and it hands off to the site instead of running on
   its own:

     InvitationOverlay.show({
       ganesha, monogram, names, tagline, headline, tapHint,
       buttonLabel,
       onTap,     // called synchronously inside the tap — start music here,
                  // browsers only allow unmuted audio within the gesture
       onReveal,  // overlay starts fading: reveal the site underneath now,
                  // so the two cross-fade instead of leaving a gap
       onDone,    // overlay removed from the DOM
     });

   Sequence after a tap: seal presses and melts (0–0.6s) → flap opens
   (0.45–1.1s) → the invitation card glides up out of the envelope
   (0.95–2.45s) → a short beat to read it → the overlay fades and gently
   scales up while the homepage fades in beneath it (3.05–3.7s). Fonts live in index.html's
   Google Fonts link. */
(function () {
  'use strict';

  var C = { site: '#B21E30', deep: '#6B0C18', maroon: '#7E0D1D', orange: '#F5A300', gold: '#F6C66B', ivory: '#F8EEDC', white: '#FFF8EE' };
  var EASE = 'cubic-bezier(.65,0,.35,1)', OUT = 'cubic-bezier(.22,1,.36,1)';

  // How far the card rises out of the envelope, as a fraction of its own height.
  var RISE = 0.8;

  var T = { melt: 220, open: 450, flapBack: 800, rise: 950, reveal: 3050, remove: 3700 };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var css =
    '#inv-ov{position:fixed;inset:0;z-index:2147483000;overflow:hidden;background:radial-gradient(ellipse at 50% 42%,#C42335 0%,' + C.site + ' 45%,#7A0C1B 100%);transform-origin:50% 40%;transition:opacity .6s ' + EASE + ',transform .6s ' + EASE + ';-webkit-tap-highlight-color:transparent;font-family:Marcellus,serif}' +
    '#inv-ov *{box-sizing:border-box}' +
    '#inv-ov .lat{position:absolute;inset:0;opacity:.09;background-image:repeating-linear-gradient(45deg,' + C.gold + ' 0 1px,transparent 1px 48px),repeating-linear-gradient(-45deg,' + C.gold + ' 0 1px,transparent 1px 48px)}' +
    '#inv-ov .rays{position:absolute;left:50%;top:-30vh;width:160vmax;height:160vmax;margin-left:-80vmax;opacity:.08;background:repeating-conic-gradient(from 0deg at 50% 50%,' + C.gold + ' 0 2deg,transparent 2deg 9deg);-webkit-mask:radial-gradient(circle at 50% 50%,#000 0,transparent 45%);mask:radial-gradient(circle at 50% 50%,#000 0,transparent 45%)}' +
    '#inv-ov .pt{position:absolute;top:-40px;border-radius:60% 0 60% 0;opacity:.55;animation:inv-fall linear infinite}' +
    '@keyframes inv-fall{to{transform:translate3d(30px,110vh,0) rotate(540deg)}}' +
    '#inv-ov .skyline{position:absolute;left:0;right:0;bottom:0;height:18vh;display:flex;align-items:flex-end;justify-content:center;gap:1.5vw;opacity:.22;pointer-events:none}' +
    '#inv-ov .skyline i{display:block;background:#4A0610}' +
    '#inv-ov .col{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(8px,1.8vh,22px);padding:3vh 0;z-index:2}' +
    '#inv-ov .gan{width:clamp(44px,7vh,64px);aspect-ratio:118/146;border-radius:50% 50% 8px 8px/40% 40% 8px 8px;border:3px solid ' + C.orange + ';overflow:hidden;background:#fff;box-shadow:0 4px 12px rgba(40,0,6,.4)}' +
    '#inv-ov .gan img{width:100%;height:100%;object-fit:cover;display:block}' +
    '#inv-ov .env{position:relative;width:min(92vw,620px,calc((100vh - 230px) * 1.42));aspect-ratio:1.42;container-type:inline-size;cursor:pointer;perspective:1400px;animation:inv-float 3.9s ease-in-out infinite;outline:none;transition:transform .7s ' + OUT + '}' +
    '@media (max-aspect-ratio:3/4){#inv-ov .env{aspect-ratio:1.25;width:min(92vw,calc((100vh - 230px) * 1.25))}}' +
    '#inv-ov .env:focus-visible .frame{box-shadow:0 22px 50px rgba(40,0,6,.5),0 0 0 3px ' + C.gold + '}' +
    '@keyframes inv-float{0%,100%{translate:0 -5px}50%{translate:0 5px}}' +
    '#inv-ov.tapped .env{animation-play-state:paused}' +
    '#inv-ov .frame{position:absolute;inset:0;border-radius:10px;padding:clamp(6px,1.6%,9px);background:repeating-linear-gradient(45deg,' + C.orange + ' 0 5px,#C9781A 5px 7px,' + C.gold + ' 7px 12px);box-shadow:0 22px 50px rgba(40,0,6,.5),inset 0 0 0 2px rgba(255,240,200,.4)}' +
    '#inv-ov .inner{position:relative;width:100%;height:100%;border-radius:4px;perspective:1400px}' +
    '#inv-ov .liner{position:absolute;inset:0;border-radius:4px;background:' + C.maroon + ';overflow:hidden}' +
    '#inv-ov .liner:after{content:"";position:absolute;inset:0;opacity:.25;background-image:repeating-linear-gradient(45deg,' + C.gold + ' 0 1px,transparent 1px 16px),repeating-linear-gradient(-45deg,' + C.gold + ' 0 1px,transparent 1px 16px)}' +
    '#inv-ov .card{position:absolute;left:8%;right:8%;top:6%;height:88%;background:' + C.ivory + ';border-radius:3px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:4%;gap:1.2cqw;container-type:inline-size;box-shadow:0 -4px 14px rgba(40,0,6,.3);transition:transform 1.5s cubic-bezier(.42,0,.2,1)}' +
    '#inv-ov .card .gan{width:15cqw;border-width:2px}' +
    '#inv-ov .card .sh{font-family:"Tiro Devanagari Hindi",serif;color:#B05A00;font-size:4.6cqw}' +
    '#inv-ov .card .nm{font-family:"Great Vibes",cursive;color:' + C.maroon + ';font-size:10cqw;line-height:1.1}' +
    '#inv-ov .card .r{display:flex;align-items:center;gap:8px}#inv-ov .card .r i{width:44px;height:1px;background:' + C.orange + '}#inv-ov .card .r b{width:7px;height:7px;background:' + C.orange + ';transform:rotate(45deg)}' +
    '#inv-ov.risen .card{transform:translateY(-' + RISE * 100 + '%)}' +
    '#inv-ov .pocket{position:absolute;inset:0;border-radius:4px;background:' + C.ivory + ';clip-path:polygon(0 30%,50% 57%,100% 30%,100% 100%,0 100%);filter:drop-shadow(0 -2px 3px rgba(60,20,0,.25))}' +
    '#inv-ov .pocket:before{content:"";position:absolute;inset:0;background:repeating-conic-gradient(from 0deg at 50% 57%,rgba(200,140,60,.10) 0 3deg,transparent 3deg 9deg)}' +
    '#inv-ov .flap{position:absolute;left:0;top:0;right:0;height:100%;transform-origin:50% 0;transform-style:preserve-3d;transition:transform .65s ' + EASE + ';z-index:4}' +
    '#inv-ov .flap .face{position:absolute;inset:0;border-radius:4px 4px 0 0;-webkit-backface-visibility:hidden;backface-visibility:hidden;filter:drop-shadow(0 3px 3px rgba(30,0,5,.4))}' +
    '#inv-ov .flap .face:before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(180deg,#9A1628,' + C.maroon + ');clip-path:polygon(0 0,100% 0,100% 30%,50% 60%,0 30%)}' +
    '#inv-ov .flap .back{transform:rotateX(180deg)}' +
    '#inv-ov .flap .back:before{background:linear-gradient(0deg,#6E0A18,#560915);clip-path:polygon(0 100%,100% 100%,100% 70%,50% 40%,0 70%)}' +
    '#inv-ov .ftext{position:relative;display:flex;flex-direction:column;align-items:center;gap:.9cqw;padding-top:4cqw;text-align:center}' +
    '#inv-ov .ttag{font-family:"Cormorant Garamond",serif;font-style:italic;color:' + C.gold + ';font-size:3.7cqw;line-height:1.2}' +
    '#inv-ov .tmono{font-family:"Great Vibes",cursive;color:' + C.white + ';font-size:9.5cqw;line-height:1.05;text-shadow:0 3px 12px rgba(40,0,6,.4)}' +
    '#inv-ov .tname{font-family:Marcellus,serif;color:' + C.gold + ';font-size:2.9cqw;letter-spacing:.3em;text-transform:uppercase;line-height:1.3}' +
    '#inv-ov.open .flap{transform:rotateX(180deg)}' +
    '#inv-ov.flapback .flap{z-index:-1}' +
    '#inv-ov .seal{position:absolute;left:50%;top:60%;width:15%;aspect-ratio:1;margin:-7.5% 0 0 -7.5%;z-index:5;transition:transform .4s ' + OUT + ',opacity .4s,filter .4s}' +
    '#inv-ov .wax{width:100%;height:100%;border-radius:50%;background:radial-gradient(circle at 38% 32%,#FFE09A,' + C.orange + ' 55%,#C47A00 100%);box-shadow:0 8px 18px rgba(50,0,8,.5),inset 0 -4px 8px rgba(120,60,0,.35);display:flex;align-items:center;justify-content:center;position:relative;font-family:"Great Vibes",cursive;font-size:5cqw;color:' + C.maroon + '}' +
    '#inv-ov .wax:before{content:"";position:absolute;inset:10%;border-radius:50%;border:1px dashed rgba(122,13,29,.45)}' +
    '#inv-ov .seal.press{animation:inv-press .25s ' + EASE + '}' +
    '@keyframes inv-press{50%{transform:scale(.86)}}' +
    '#inv-ov.melt .seal{transform:scale(1.25);opacity:0;filter:blur(6px)}' +
    '#inv-ov .ring,#inv-ov .rip{position:absolute;left:50%;top:60%;width:15%;aspect-ratio:1;margin:-7.5% 0 0 -7.5%;border-radius:50%;pointer-events:none;z-index:5}' +
    '#inv-ov .ring{border:2px solid ' + C.gold + ';animation:inv-ring 1.6s ease-out infinite}' +
    '@keyframes inv-ring{0%{transform:scale(1);opacity:.8}100%{transform:scale(2);opacity:0}}' +
    '#inv-ov .rip{background:rgba(255,230,170,.55);opacity:0}#inv-ov .rip.go{animation:inv-rip .7s ease-out forwards}' +
    '@keyframes inv-rip{0%{transform:scale(.6);opacity:.9}100%{transform:scale(3);opacity:0}}' +
    '#inv-ov .below{display:flex;flex-direction:column;align-items:center;gap:clamp(6px,1.4vh,14px);text-align:center;transition:opacity .4s,transform .5s ' + OUT + '}' +
    '#inv-ov .div{display:flex;align-items:center;gap:10px;color:' + C.gold + ';font-size:11px;letter-spacing:.5em}#inv-ov .div i{width:56px;height:1px;background:' + C.gold + ';opacity:.6}' +
    '#inv-ov .yi{font-family:"Great Vibes",cursive;color:' + C.white + ';font-size:clamp(42px,7.4vh,72px);line-height:1;text-shadow:0 3px 14px rgba(40,0,6,.4)}' +
    '#inv-ov .btn{margin-top:6px;border:0;cursor:pointer;border-radius:999px;padding:clamp(12px,1.8vh,16px) clamp(34px,7vw,56px);background:linear-gradient(180deg,#FFD98A,' + C.orange + ' 60%,#D88900);color:' + C.maroon + ';font-family:Marcellus,serif;font-size:clamp(12px,1.6vh,15px);letter-spacing:.32em;text-transform:uppercase;box-shadow:0 8px 20px rgba(40,0,6,.4),inset 0 1px 0 rgba(255,255,255,.6);animation:inv-glow 2.2s ease-in-out infinite}' +
    '@keyframes inv-glow{0%,100%{box-shadow:0 8px 20px rgba(40,0,6,.4),0 0 0 0 rgba(246,198,107,.5),inset 0 1px 0 rgba(255,255,255,.6)}50%{box-shadow:0 8px 20px rgba(40,0,6,.4),0 0 0 10px rgba(246,198,107,0),inset 0 1px 0 rgba(255,255,255,.6)}}' +
    '#inv-ov.tapped .below{opacity:0;transform:translateY(12px)}#inv-ov.tapped .ring{opacity:0;animation:none}' +
    '#inv-ov.gone{opacity:0;transform:scale(1.25);pointer-events:none}' +
    '@media (prefers-reduced-motion:reduce){#inv-ov .pt,#inv-ov .env,#inv-ov .ring,#inv-ov .btn{animation:none}}';

  function build(o) {
    var petals = '', pcols = [C.orange, C.gold, '#E0566A'];
    var rnd = function (i, k) { var x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
    for (var i = 0; i < 20; i++) {
      var sz = 10 + rnd(i, 1) * 12;
      petals += '<div class="pt" style="left:' + (rnd(i, 2) * 100) + '%;width:' + sz + 'px;height:' + (sz * 1.4) + 'px;background:' + pcols[i % 3] + ';animation-duration:' + (9 + rnd(i, 3) * 8) + 's;animation-delay:-' + (rnd(i, 4) * 15) + 's"></div>';
    }
    var sky = [[7, 9, '50% 50% 0 0'], [4, 13, '2px 2px 0 0'], [12, 6, '0'], [9, 14, '50% 50% 0 0'], [14, 8, '0'], [9, 14, '50% 50% 0 0'], [12, 6, '0'], [4, 13, '2px 2px 0 0'], [7, 9, '50% 50% 0 0']]
      .map(function (s) { return '<i style="width:' + s[0] + 'vw;height:' + s[1] + 'vh;border-radius:' + s[2] + '"></i>'; }).join('');
    var gan = o.ganesha ? '<div class="gan"><img src="' + esc(o.ganesha) + '" alt=""></div>' : '';

    return '<div class="rays"></div><div class="lat"></div>' + petals +
      '<div class="skyline">' + sky + '</div>' +
      '<div class="col">' +
        '<div class="env" role="button" tabindex="0" aria-label="' + esc(o.tapHint) + '"><div class="frame"><div class="inner">' +
          '<div class="liner"></div>' +
          '<div class="card">' + gan + '<div class="sh">॥ श्री गणेशाय नमः ॥</div><div class="r"><i></i><b></b><i></i></div><div class="nm">' + esc(o.names) + '</div></div>' +
          '<div class="pocket"></div>' +
          '<div class="flap"><div class="face front"><div class="ftext"><div class="ttag">' + esc(o.tagline) + '</div><div class="tmono">' + esc(o.monogram) + '</div><div class="tname">' + esc(o.names) + '</div></div></div><div class="face back"></div></div>' +
          '<div class="seal"><div class="wax">' + esc(String(o.monogram || '').replace(/\s+/g, '')) + '</div></div><div class="ring"></div><div class="rip"></div>' +
        '</div></div></div>' +
        '<div class="below">' +
          '<div class="div"><i></i>✦ ✦ ✦<i></i></div>' +
          '<div class="yi">' + esc(o.headline) + '</div>' +
          '<button class="btn" type="button">' + esc(o.buttonLabel) + '</button>' +
        '</div>' +
      '</div>';
  }

  var DEFAULTS = {
    ganesha: '', monogram: 'A & S', names: 'Anushka & Saurabh',
    tagline: 'A little love. A little filmy.',
    headline: 'You’re Invited', tapHint: 'Tap the envelope to break the seal', buttonLabel: 'Open Invitation',
  };

  function show(opts) {
    var o = {};
    for (var key in DEFAULTS) o[key] = (opts && opts[key]) || DEFAULTS[key];
    var noop = function () {};
    var onTap = (opts && opts.onTap) || noop;
    var onReveal = (opts && opts.onReveal) || noop;
    var onDone = (opts && opts.onDone) || noop;

    if (!document.getElementById('inv-ov-css')) {
      var style = document.createElement('style');
      style.id = 'inv-ov-css';
      style.textContent = css;
      document.head.appendChild(style);
    }

    var el = document.createElement('div');
    el.id = 'inv-ov';
    el.innerHTML = build(o);
    var started = false;

    // The risen card sticks out above the envelope by most of its own
    // height, which on short phones (and wide desktops, where the envelope
    // is large) would push it past the top of the screen. At tap time,
    // measure where envelope + risen card will sit, then slide the
    // envelope down — and shrink it if the pair is taller than the screen —
    // so both are fully visible, centred in the viewport. The text below
    // the envelope fades out at the same moment, freeing that space.
    function fitRisenCard() {
      var env = el.querySelector('.env');
      var card = el.querySelector('.card');
      var e = env.getBoundingClientRect();
      var c = card.getBoundingClientRect();
      var margin = Math.max(12, window.innerHeight * 0.03);
      var top = Math.min(e.top, c.top - c.height * RISE);
      var bottom = e.bottom;
      var scale = Math.min(1, (window.innerHeight - 2 * margin) / (bottom - top));
      var originY = ((top + bottom) / 2 - e.top);
      var dy = window.innerHeight / 2 - (top + bottom) / 2;
      env.style.transformOrigin = '50% ' + originY + 'px';
      env.style.transform = 'translateY(' + dy.toFixed(1) + 'px) scale(' + scale.toFixed(3) + ')';
    }

    function open() {
      if (started) return;
      started = true;
      // Must run inside the click itself, before any await — this is the
      // user gesture that unlocks audio playback.
      onTap();

      var at = function (ms, fn) { setTimeout(fn, ms); };
      var go = function () {
        el.classList.add('tapped');
        fitRisenCard();
        el.querySelector('.seal').classList.add('press');
        el.querySelector('.rip').classList.add('go');
        at(T.melt, function () { el.classList.add('melt'); });
        at(T.open, function () { el.classList.add('open'); });
        at(T.flapBack, function () { el.classList.add('flapback'); });
        at(T.rise, function () { el.classList.add('risen'); });
        at(T.reveal, function () { el.classList.add('gone'); onReveal(); });
        at(T.remove, function () { el.remove(); onDone(); });
      };
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go);
    }

    var env = el.querySelector('.env');
    env.addEventListener('click', open);
    el.querySelector('.btn').addEventListener('click', open);
    env.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    document.body.appendChild(el);
    return el;
  }

  window.InvitationOverlay = { show: show };
})();
