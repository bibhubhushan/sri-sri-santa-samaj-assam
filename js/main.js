/* =====================================================================
   Sri Sri Santa Samaj Assam — interactions
   ===================================================================== */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // `?static=1` renders the finished state immediately — used for screenshots
  // and press shots, where animation-in-progress would capture half-drawn UI.
  const staticMode = new URLSearchParams(location.search).has('static');
  const reduced =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches || staticMode;
  const fine =
    window.matchMedia('(hover: hover) and (pointer: fine)').matches && !staticMode;
  const compact = window.matchMedia('(max-width: 900px)').matches;

  if (compact) {
    $('#paymentDetails')?.removeAttribute('open');
  }

  if (staticMode) {
    document.documentElement.classList.add('static-shot');
    // Force every lazy image to load, otherwise a screenshot taken after a hash
    // jump lands in a gap that later fills in and shifts the layout.
    $$('img[loading="lazy"]').forEach(img => { img.loading = 'eager'; });

    // `?full=<viewportHeightPx>` renders the whole page in one tall window for
    // video capture. The hero is 100svh, which would stretch to the full window
    // height, so pin it to the real device viewport instead.
    const full = new URLSearchParams(location.search).get('full');
    if (full) {
      document.documentElement.style.setProperty('--shot-vh', `${parseInt(full, 10)}px`);
      document.documentElement.classList.add('static-full');
    }

    // `?shot=<section-id>` brings that section to the top of the viewport.
    // We pull the page up with a negative margin rather than scrolling, because
    // headless `--screenshot` always captures the top of the document.
    const shot = new URLSearchParams(location.search).get('shot');
    if (shot && shot !== 'top' && !full) {
      const park = () => {
        const t = document.getElementById(shot);
        if (!t) return;
        document.body.style.marginTop = '0px';
        const y = t.getBoundingClientRect().top + window.scrollY -
                  ($('#header')?.offsetHeight || 0) - 12;
        document.body.style.marginTop = `${-Math.max(0, y)}px`;
        window.scrollTo(0, 0);
        // scrollY stays 0, so give the header the solid state it would have here
        $('#header')?.classList.add('scrolled');
      };
      window.addEventListener('load', () => { park(); setTimeout(park, 300); });
    }
  }

  /* ---------- Preloader + hero entrance ---------- */
  const preloader = $('#preloader');

  function revealHero() {
    $$('#heroTitle .split-line').forEach((line, i) => {
      setTimeout(() => line.classList.add('in'), compact ? 0 : i * 110);
    });
    $$('.hero [data-reveal]').forEach(el => el.classList.add('in'));
  }

  window.addEventListener('load', () => {
    const wait = 0;
    setTimeout(() => {
      preloader.classList.add('done');
      revealHero();
    }, wait);
  });
  // Safety net: never leave the preloader up if `load` is slow.
  setTimeout(() => {
    if (preloader && !preloader.classList.contains('done')) {
      preloader.classList.add('done');
      revealHero();
    }
  }, 3500);

  /* ---------- Scroll progress ---------- */
  const progress = $('#progress');
  const toTop = $('#toTop');
  const mobileDock = $('.mobile-action-dock');

  /* ---------- Header behaviour ---------- */
  const header = $('#header');
  let lastY = 0;

  /* ---------- Mobile drawer ---------- */
  const burger = $('#burger');
  const drawer = $('#drawer');

  function closeMenu() {
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      $$('#drawer nav a').forEach((a, i) => {
        a.style.transitionDelay = compact ? '0ms' : `${140 + i * 55}ms`;
      });
    }
  });

  $$('#drawer nav a').forEach(a => a.addEventListener('click', closeMenu));

  $$('.mobile-programme').forEach(item => {
    item.addEventListener('toggle', () => {
      if (!compact || !item.open) return;
      $$('.mobile-programme').forEach(other => {
        if (other !== item) other.removeAttribute('open');
      });
    });
  });

  const recordToggle = $('#recordToggle');
  const ledger = $('#ledger');
  recordToggle?.addEventListener('click', () => {
    const expanded = ledger.classList.toggle('mobile-expanded');
    recordToggle.setAttribute('aria-expanded', String(expanded));
    recordToggle.firstChild.textContent = expanded ? 'Show first three programmes ' : 'View all six programmes ';
    recordToggle.querySelector('span').textContent = expanded ? '↑' : '↓';
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) closeMenu();
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('[data-reveal]').filter(el => !el.closest('.hero'));

  if (reduced) {
    revealEls.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- Mission: word-by-word highlight ---------- */
  const missionText = $('#missionText');
  let missionWords = [];

  if (missionText) {
    const frag = document.createDocumentFragment();

    const walk = (node, isKey) => {
      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          child.textContent.split(/(\s+)/).forEach(tok => {
            if (!tok.trim()) {
              frag.appendChild(document.createTextNode(tok));
              return;
            }
            const w = document.createElement('w');
            w.textContent = tok;
            if (isKey) w.classList.add('key');
            frag.appendChild(w);
          });
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child, isKey || child.tagName === 'EM');
        }
      });
    };

    walk(missionText, false);
    missionText.innerHTML = '';
    missionText.appendChild(frag);
    missionWords = $$('w', missionText);

    if (reduced) missionWords.forEach(w => w.classList.add('lit'));
  }

  function updateMission() {
    if (!missionText || reduced || !missionWords.length) return;
    const r = missionText.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.22));
    const upto = Math.round(p * missionWords.length);
    missionWords.forEach((w, i) => w.classList.toggle('lit', i < upto));
  }

  /* ---------- Counters ---------- */
  const easeOutExpo = t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  function runCounter(el) {
    if (el.hasAttribute('data-plain') || reduced || compact) return;   // markup already holds the final value
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const pad = el.hasAttribute('data-pad');
    const dur = 1500;
    const t0 = performance.now();

    const tick = (now) => {
      const p = clamp((now - t0) / dur);
      let v = Math.round(easeOutExpo(p) * target);
      let out = pad ? String(v).padStart(2, '0') : String(v);
      el.innerHTML = suffix ? `${out}<em>${suffix}</em>` : out;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const counters = $$('[data-count]');
  if (counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(c => cio.observe(c));
  }

  /* ---------- Work list: cursor-following image preview ---------- */
  const preview = $('#workPreview');
  const rows = $$('.work-row');
  let pvX = 0, pvY = 0, pvTX = 0, pvTY = 0, pvActive = false;

  if (preview && fine && !reduced && rows.length) {
    rows.forEach(row => {
      if (!row.dataset.img) return;
      const img = document.createElement('img');
      img.src = row.dataset.img;
      img.alt = '';
      img.loading = 'lazy';
      preview.appendChild(img);
      row._img = img;

      row.addEventListener('mouseenter', () => {
        if (!pvActive) {
          // seed position so the card fades in already parked on the right
          pvX = window.innerWidth - 190;
          pvY = Math.min(Math.max(my, 190), window.innerHeight - 190);
        }
        pvActive = true;
        preview.classList.add('show');
        // stock photography stays duotoned here too, same as its inline thumb
        preview.classList.toggle('duo', row.hasAttribute('data-img-duo'));
        $$('img', preview).forEach(i => i.classList.remove('active'));
        img.classList.add('active');
      });
      row.addEventListener('mouseleave', () => {
        pvActive = false;
        preview.classList.remove('show');
      });
    });
  }

  /* ---------- Custom cursor ---------- */
  const dot = $('#cursorDot');
  const ring = $('#cursorRing');
  let mx = -100, my = -100, rx = -100, ry = -100;

  if (fine && !reduced) {
    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      // preview is pinned to the right edge; it only tracks the cursor vertically
      pvTX = window.innerWidth - 190;
      pvTY = Math.min(Math.max(e.clientY, 190), window.innerHeight - 190);
    });
    $$('[data-cursor], a, button').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('grow'));
      el.addEventListener('mouseleave', () => ring.classList.remove('grow'));
    });
  } else {
    if (dot) dot.style.display = 'none';
    if (ring) ring.style.display = 'none';
  }

  /* ---------- Parallax ---------- */
  const parallaxEls = $$('[data-parallax]');

  function updateParallax() {
    if (reduced) return;
    const vh = window.innerHeight;
    parallaxEls.forEach(el => {
      const host = el.parentElement;
      const r = host.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const centre = r.top + r.height / 2 - vh / 2;
      // The layer is deliberately taller than its frame; never drift past that
      // slack or a bare edge slides into view on tall viewports.
      const slack = Math.max(0, (el.offsetHeight - host.clientHeight) / 2);
      const y = Math.max(-slack, Math.min(slack, -centre * 0.11));
      el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
    });
  }

  /* ---------- Unified scroll / rAF loop ---------- */
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    // in static shot mode the header state is pinned by park(); scrollY is 0
    if (!staticMode) header.classList.toggle('scrolled', y > 60);
    if (y > 400 && y > lastY && !document.body.classList.contains('menu-open')) {
      header.classList.add('hidden');
    } else {
      header.classList.remove('hidden');
    }
    lastY = y;

    toTop.classList.toggle('show', y > 700);
    mobileDock?.classList.toggle('is-visible', y > 440);

    updateMission();
    updateParallax();
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  window.addEventListener('resize', onScroll, { passive: true });

  function raf() {
    if (fine && !reduced) {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      if (dot)  dot.style.transform  = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      if (ring) ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;

      if (preview && pvActive) {
        pvX = lerp(pvX, pvTX, 0.12);
        pvY = lerp(pvY, pvTY, 0.12);
        preview.style.left = `${pvX}px`;
        preview.style.top  = `${pvY}px`;
      } else if (preview) {
        pvX = pvTX; pvY = pvTY;
      }
    }
    requestAnimationFrame(raf);
  }

  /* ---------- Back to top ---------- */
  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });

  /* ---------- Copy buttons ---------- */
  $$('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(val);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = val;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      const original = btn.textContent;
      btn.textContent = 'Copied ✓';
      setTimeout(() => { btn.textContent = original; }, 1800);
    });
  });

  /* ---------- Contact form ---------- */
  const form = $('#contactForm');
  const formMsg = $('#formMsg');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name  = $('#cf-name').value.trim();
    const email = $('#cf-email').value.trim();
    const phone = $('#cf-phone').value.trim();
    const msg   = $('#cf-msg').value.trim();

    if (!name || !email || !msg) {
      formMsg.textContent = 'Please fill in your name, email and message.';
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
    formMsg.textContent = 'Sending your message…';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      });

      if (!response.ok) throw new Error('Message delivery failed');

      form.reset();
      formMsg.textContent = 'Thank you — your message has been sent.';
    } catch {
      formMsg.innerHTML = 'We could not send this message. Please email <a href="mailto:srisrisantasamaj321@gmail.com">srisrisantasamaj321@gmail.com</a>.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
    }
  });

  /* ---------- Smooth anchor scroll with header offset ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Blur-up ---------- */
  // Every plate paints a 32px preview from css/lqip.css as its background; the
  // real photograph fades in over it once decoded, so a plate is never an
  // empty box and nothing shifts when the image lands.
  function watchPlate(img) {
    if (img.dataset.plateWatched) return;
    img.dataset.plateWatched = '1';
    if (img.complete && img.naturalWidth) { img.classList.add('ready'); return; }
    const done = () => img.classList.add('ready');
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });   // never strand a plate blurred
  }
  $$('.plate img').forEach(watchPlate);

  /* ---------- Hero sequence ---------- */
  const HERO = [
    {
      as: 'বাৰ্ষিক বৰসবাহ নামসেৱা',
      en: 'Annual Barsabah Namseva.',
      value: 'The second Annual Barsabah Namseva of SRI SRI SANTA SAMAJ, held on 26 April inside the Namghar.',
      credit: 'SRI SRI SANTA SAMAJ photo archive'
    }
  ];
  const HOLD = 7000;

  const frames = $$('#heroStage .hero-frame');
  const heroCap = $('#heroCap');
  const heroTicks = $('#heroTicks');
  let heroAt = 0, heroTimer = null;

  function paintCap(i) {
    if (!heroCap || !HERO[i]) return;
    heroCap.classList.add('fade');
    setTimeout(() => {
      heroCap.innerHTML = `
        <span class="cap-kicker">From the SRI SRI SANTA SAMAJ record · সমাজৰ নথিৰ পৰা</span>
        <span class="cap-title"><b lang="as">${HERO[i].as}</b><strong>${HERO[i].en}</strong></span>
        <span class="cap-value">${HERO[i].value}</span>
        <span class="cap-credit">${HERO[i].credit}</span>`;
      heroCap.classList.remove('fade');
    }, reduced ? 0 : 320);
  }

  function showFrame(i) {
    if (!frames.length) return;
    heroAt = (i + frames.length) % frames.length;
    frames.forEach((f, n) => f.classList.toggle('on', n === heroAt));
    (heroTicks ? $$('button', heroTicks) : []).forEach((t, n) => {
      // restart the fill animation by detaching and re-adding the class
      t.classList.remove('on');
      if (n === heroAt) { void t.offsetWidth; t.classList.add('on'); }
    });
    paintCap(heroAt);
  }

  function heroPlay() {
    if (reduced || compact || frames.length < 2) return;
    clearInterval(heroTimer);
    heroTimer = setInterval(() => showFrame(heroAt + 1), HOLD);
  }
  function heroPause() { clearInterval(heroTimer); heroTimer = null; }

  if (frames.length) {
    if (heroTicks) {
      heroTicks.style.setProperty('--hold', `${HOLD}ms`);
      frames.forEach((_, i) => {
        const b = document.createElement('button');
        b.innerHTML = '<i></i>';
        b.setAttribute('aria-label', `Show photograph ${i + 1} of ${frames.length}`);
        b.addEventListener('click', () => { showFrame(i); heroPlay(); });
        heroTicks.appendChild(b);
      });
    }
    paintCap(0);
    if (reduced || compact) {
      (heroTicks ? $$('button', heroTicks) : []).forEach(t => { t.querySelector('i').style.transform = 'scaleY(1)'; });
    } else {
      showFrame(0);
      heroPlay();
      // Don't burn frames — or the reader's battery — while the hero is off screen
      document.addEventListener('visibilitychange', () => {
        document.hidden ? heroPause() : heroPlay();
      });
      const heroIO = new IntersectionObserver(([e]) => {
        e.isIntersecting ? heroPlay() : heroPause();
      }, { threshold: 0.15 });
      heroIO.observe($('#top'));
    }
  }

  /* ---------- Mobile hero promise ---------- */
  const heroStatement = $('#heroStatement');
  const heroFocusWord = $('#heroFocusWord');
  const heroFocusAreas = ['Education', 'Welfare', 'Culture', 'Relief'];
  let heroFocusAt = 0;
  let heroFocusTimer = null;

  function advanceHeroFocus() {
    if (!heroFocusWord) return;
    heroFocusWord.classList.add('changing');
    setTimeout(() => {
      heroFocusAt = (heroFocusAt + 1) % heroFocusAreas.length;
      heroFocusWord.textContent = heroFocusAreas[heroFocusAt];
      heroFocusWord.classList.remove('changing');
    }, reduced ? 0 : 160);
  }

  function restartHeroFocus() {
    clearInterval(heroFocusTimer);
    if (!reduced && compact) heroFocusTimer = setInterval(advanceHeroFocus, 2800);
  }

  if (heroStatement && compact) {
    heroStatement.addEventListener('click', () => {
      advanceHeroFocus();
      restartHeroFocus();
    });
    restartHeroFocus();
  }

  /* ---------- Lightbox ---------- */
  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbCap = $('#lbCap');
  const lbCount = $('#lbCount');

  function imageFor(el) {
    return el?.matches?.('img') ? el : $('img', el);
  }

  function largestImageSource(el) {
    const img = imageFor(el);
    if (!img) return '';
    const candidates = [];
    const picture = img.closest('picture');
    const sets = [
      img.getAttribute('srcset'),
      ...$$('source', picture || el).map(source => source.getAttribute('srcset'))
    ];
    sets.filter(Boolean).forEach(set => {
      set.split(',').forEach(entry => {
        const parts = entry.trim().split(/\s+/);
        const score = Number.parseFloat(parts[1]) || 0;
        if (parts[0]) candidates.push({ src: parts[0], score });
      });
    });
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.src || img.getAttribute('src') || '';
  }

  function photoCaption(el) {
    const img = imageFor(el);
    const heroFrame = el.matches?.('.hero-frame') ? el : el.closest('.hero-frame');
    const heroIndex = frames.indexOf(heroFrame);
    if (heroIndex >= 0 && HERO[heroIndex]) {
      return { as: HERO[heroIndex].as, en: HERO[heroIndex].en, credit: HERO[heroIndex].credit };
    }

    const figure = el.matches?.('figure') ? el : el.closest('figure');
    const cap = figure ? $('figcaption', figure) : null;
    if (cap) {
      return {
        as: $('b', cap)?.textContent?.trim() || '',
        en: $('span', cap)?.textContent?.trim() || cap.textContent?.trim() || '',
        credit: figure.dataset.credit || 'SRI SRI SANTA SAMAJ photo archive'
      };
    }

    const led = el.closest('.led');
    if (led) {
      return {
        as: $('.led-body b', led)?.textContent?.trim() || '',
        en: $('.led-body span', led)?.textContent?.trim() || '',
        credit: 'SRI SRI SANTA SAMAJ photo archive'
      };
    }

    const row = el.closest('.work-row');
    if (row) {
      const heading = $('.h3', row);
      const as = $('i', heading)?.textContent?.trim() || '';
      const copy = heading?.cloneNode(true);
      $('i', copy)?.remove();
      return {
        as,
        en: copy?.textContent?.trim() || $('img', el)?.alt || '',
        credit: 'SRI SRI SANTA SAMAJ photo archive'
      };
    }

    const band = el.closest('.plate-band');
    if (band) {
      return {
        as: $('.plate-label strong', band)?.textContent?.trim() || '',
        en: $('.plate-label .value-copy', band)?.textContent?.trim() || '',
        credit: 'SRI SRI SANTA SAMAJ photo archive'
      };
    }

    return {
      as: '',
      en: img?.alt || 'SRI SRI SANTA SAMAJ photograph',
      credit: el.dataset.credit || el.closest('[data-credit]')?.dataset.credit || 'SRI SRI SANTA SAMAJ photo archive'
    };
  }

  // Every visible content image is a lightbox trigger. Using the image itself
  // avoids relying on section-specific wrapper classes, so newly added photos
  // automatically inherit the same full-screen behaviour.
  const photoCandidates = $$('main img');
  const shots = [];
  const shotIndexBySource = new Map();

  const photoKey = src => (src || '').replace(/-\d+\.(?:webp|jpe?g|png)(?:\?.*)?$/i, '');
  const sourceScore = src => Number(src?.match(/-(\d+)\.(?:webp|jpe?g|png)(?:\?.*)?$/i)?.[1]) || 0;
  const bestSourceByPhoto = new Map();
  photoCandidates.forEach(el => {
    const img = imageFor(el);
    const local = el.closest('[data-full]')?.dataset.full || largestImageSource(el);
    const key = photoKey(img?.getAttribute('src'));
    const best = bestSourceByPhoto.get(key);
    if (key && local && (!best || sourceScore(local) > sourceScore(best))) bestSourceByPhoto.set(key, local);
  });

  photoCandidates.forEach(el => {
    const img = imageFor(el);
    const local = el.dataset.full || el.closest('[data-full]')?.dataset.full || largestImageSource(el);
    const full = bestSourceByPhoto.get(photoKey(img?.getAttribute('src'))) || local;
    if (!full) return;
    el.dataset.full = full;
    let index = shotIndexBySource.get(full);
    if (index === undefined) {
      index = shots.length;
      shots.push(el);
      shotIndexBySource.set(full, index);
    }
    el.dataset.lightboxIndex = String(index);
    el.classList.add('photo-zoom');
  });
  let lbAt = 0, lastFocus = null;

  function lbRender(i) {
    lbAt = (i + shots.length) % shots.length;
    const el = shots[lbAt];
    const caption = photoCaption(el);

    lbImg.classList.remove('ready');
    lbImg.src = el.dataset.full;
    lbImg.alt = imageFor(el)?.alt || '';
    lbCap.innerHTML = `<b>${caption.as}</b><span>${caption.en}</span><em>${caption.credit}</em>`;
    lbCount.textContent = `${String(lbAt + 1).padStart(2, '0')} / ${String(shots.length).padStart(2, '0')}`;

    const show = () => lbImg.classList.add('ready');
    if (lbImg.complete && lbImg.naturalWidth) show();
    else lbImg.addEventListener('load', show, { once: true });

    // warm the neighbours so arrowing through feels instant
    [lbAt + 1, lbAt - 1].forEach(n => {
      const nb = shots[(n + shots.length) % shots.length];
      if (nb) new Image().src = nb.dataset.full;
    });
  }

  function lbOpen(i) {
    if (!lb || !shots.length) return;
    lastFocus = document.activeElement;
    lb.hidden = false;
    lbRender(i);
    requestAnimationFrame(() => {
      lb.classList.add('open');
      document.body.classList.add('lb-open');
      $('#lbClose').focus();
    });
  }

  function lbClose() {
    if (!lb) return;
    lb.classList.remove('open');
    document.body.classList.remove('lb-open');
    setTimeout(() => { lb.hidden = true; lbImg.removeAttribute('src'); },
               reduced ? 0 : 450);
    lastFocus?.focus();
  }

  if (lb && shots.length) {
    photoCandidates.filter(el => el.dataset.lightboxIndex !== undefined).forEach(el => {
      const i = Number(el.dataset.lightboxIndex);
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      const cap = el.closest('figure')?.querySelector('figcaption');
      const visibleLabel = cap?.textContent?.trim().replace(/\s+/g, ' ') || `Photograph ${i + 1}`;
      el.setAttribute('aria-label', `${visibleLabel}. Open photograph ${i + 1} of ${shots.length}`);
      el.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        lbOpen(i);
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lbOpen(i); }
      });
    });

    $('#lbClose').addEventListener('click', lbClose);
    $('#lbPrev').addEventListener('click', () => lbRender(lbAt - 1));
    $('#lbNext').addEventListener('click', () => lbRender(lbAt + 1));
    lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lb-stage') === e.target) lbClose(); });

    document.addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape')     { e.preventDefault(); lbClose(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); lbRender(lbAt + 1); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); lbRender(lbAt - 1); }
      if (e.key === 'Tab') {
        // keep focus inside the dialog while it owns the screen
        const f = $$('button', lb);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- Magazine front / back viewer ---------- */
  const magazineViewer = $('#magazineViewer');
  const magazineOpen = $('.magazine-open');
  const magazineRecord = $('.magazine-record');
  const magazineClose = $('#magazineClose');
  const magazineTabs = [$('#magazineFrontTab'), $('#magazineBackTab')];
  const magazinePanels = [$('#magazineFrontPanel'), $('#magazineBackPanel')];
  let magazineLastFocus = null;

  function showMagazinePage(index, focusTab = false) {
    magazineTabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      magazinePanels[i].hidden = i !== index;
    });
    if (focusTab) magazineTabs[index].focus();
  }

  function openMagazine() {
    if (!magazineViewer) return;
    magazineLastFocus = document.activeElement;
    showMagazinePage(0);
    magazineViewer.hidden = false;
    document.body.classList.add('magazine-open-body');
    requestAnimationFrame(() => {
      magazineViewer.classList.add('open');
      magazineClose.focus();
    });
  }

  function closeMagazine() {
    if (!magazineViewer) return;
    magazineViewer.classList.remove('open');
    document.body.classList.remove('magazine-open-body');
    setTimeout(() => { magazineViewer.hidden = true; }, reduced ? 0 : 250);
    magazineLastFocus?.focus();
  }

  magazineOpen?.addEventListener('click', openMagazine);
  magazineRecord?.addEventListener('click', e => {
    if (!e.target.closest('button, a')) openMagazine();
  });
  magazineClose?.addEventListener('click', closeMagazine);
  magazineTabs.forEach((tab, i) => {
    tab?.addEventListener('click', () => showMagazinePage(i));
    tab?.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      showMagazinePage(i === 0 ? 1 : 0, true);
    });
  });
  magazineViewer?.addEventListener('click', e => {
    if (e.target === magazineViewer) closeMagazine();
  });
  document.addEventListener('keydown', e => {
    if (magazineViewer?.hidden) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMagazine();
    }
    if (e.key === 'Tab') {
      const focusable = $$('button:not([tabindex="-1"])', magazineViewer);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Misc ---------- */
  $('#year').textContent = new Date().getFullYear();

  onScroll();
  raf();
})();
