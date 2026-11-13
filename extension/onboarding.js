// First-run onboarding for the workspace page.
// Design: docs/ONBOARDING.md (mobile-onboarding skill). One claim per page,
// question and its match declaration on separate pages, exactly three steps,
// window dots (max 5), praise + vibration feedback, skip always available.
// State stays on-device (chrome.storage.local, localStorage fallback) and is
// never sent anywhere.

export const ONBOARDING_VERSION = 1;
export const ONBOARDING_STORAGE_KEY = 'imagecrate.onboarding';

export const WORRIES = [
  { id: 'ads', label: '広告や関係ない画像が多くて探しにくい', strength: '広告らしい画像を先に除けるので、探す分だけが残ります' },
  { id: 'compare', label: '似た画像が多くて見比べにくい', strength: '大きなプレビューで見比べてから選べるので、迷いが減ります' },
  { id: 'save', label: '1枚ずつ保存するのが面倒', strength: '選んだ分をまとめて保存できるので、1枚ずつの作業が要りません' },
  { id: 'unknown', label: 'まだわからない', strength: '' },
];

export const VALUES = {
  compare: { id: 'value-compare', headline: '見比べてから、選べる', sub: '大きなプレビューで比べ、必要なものだけを選べます。', visual: 'zoom' },
  ads: { id: 'value-ads', headline: '広告らしい画像は、先に除ける', sub: '横長バナーなど広告らしい形は、自動で候補から外せます。', visual: 'banner' },
  bulk: { id: 'value-bulk', headline: '選んだ分は、まとめて保存できる', sub: '保存の結果は最後まで表示されるので、終えたかどうかが分かります。', visual: 'bundle' },
};

export function valueOrder(answerId) {
  if (answerId === 'ads') return ['ads', 'compare', 'bulk'];
  if (answerId === 'save') return ['bulk', 'compare', 'ads'];
  return ['compare', 'ads', 'bulk'];
}

export function worryById(answerId) {
  return WORRIES.find((worry) => worry.id === answerId) || WORRIES[WORRIES.length - 1];
}

export function matchFor(answerId) {
  const worry = worryById(answerId);
  if (worry.id === 'unknown') {
    return {
      headline: 'まだわからなくて、大丈夫',
      sub: 'まずは1枚、選んで保存してみてください。使いながら分かってきます。',
    };
  }
  return {
    headline: `「${worry.label}」— そんなあなたには、ImageCrateがぴったり`,
    sub: worry.strength + '。',
  };
}

export function closingLineFor(answerId) {
  if (answerId === 'ads') return '広告を除いた候補から、最初の1枚を選んでみてください。';
  if (answerId === 'save') return '選んだ分はまとめて保存できます。まず1枚選んでみてください。';
  if (answerId === 'compare') return 'プレビューで見比べて、最初の1枚を選んでみてください。';
  return 'このページの画像から、最初の1枚を選んでみてください。';
}

// Pages are rebuilt once the worry answer is known: the match page echoes the
// chosen words and the value pages are reordered so the matching value leads.
export function buildPages(answerId = null) {
  const match = matchFor(answerId);
  const pages = [
    { id: 'hook', role: 'フック', chapter: 'はじめに', headline: 'そのページの画像、全部は要らない', sub: '欲しいのは、そのうちの何枚かだけのはず。', visual: 'pile', stage: 'small' },
    { id: 'question', role: '選択', chapter: '質問', headline: '画像を集めるとき、いちばん困るのは？', sub: '', visual: 'choices', stage: 'medium' },
    { id: 'match', role: 'マッチ', chapter: '結果', headline: match.headline, sub: match.sub, visual: 'match', stage: 'medium' },
    { id: 'identity', role: 'アイデンティティ', chapter: 'このアプリについて', headline: 'ImageCrateは、選んだ画像だけをまとめて保存する道具', sub: '', visual: 'crate', stage: 'small' },
    ...valueOrder(answerId).map((key) => ({ role: '価値', chapter: 'できること', stage: 'small', ...VALUES[key] })),
    { id: 'step-1', role: 'ステップ', chapter: 'ステップ 1', headline: '1. 開く', sub: 'ページで拡張機能のアイコンを押します。', visual: 'step1', stage: 'small' },
    { id: 'step-2', role: 'ステップ', chapter: 'ステップ 2', headline: '2. 選ぶ', sub: 'プレビューで見比べて、欲しい画像をタップします。', visual: 'step2', stage: 'small' },
    { id: 'step-3', role: 'ステップ', chapter: 'ステップ 3', headline: '3. 保存する', sub: '選んだ分を、まとめて保存します。', visual: 'step3', stage: 'small' },
    { id: 'practice', role: 'インタラクション', chapter: '試し操作', headline: '試しに、1枚選んでみて', sub: '本番と同じ、押して選ぶ操作です。', visual: 'practice', stage: 'medium' },
    { id: 'practice-result', role: 'マッチ', chapter: '結果', headline: 'できた！ その調子で本番も選べる', sub: '選んだ画像は、あとから見返しても残っています。', visual: 'result', stage: 'large' },
    { id: 'expect', role: '期待', chapter: 'これから', headline: '500枚のページでも、続きまで届く', sub: '候補が多いページでは「続きの候補」で最後まで見られます。', visual: 'stack', stage: 'small' },
    { id: 'start', role: '接続', chapter: 'はじめる', headline: 'さあ、最初の1枚を', sub: closingLineFor(answerId), visual: 'start', stage: 'large' },
  ];
  return pages;
}

export const PRAISE = {
  small: ['いいね、その調子', 'うん、進もう', 'よし、次へ'],
  medium: ['教えてくれてありがとう', 'それがいちばん助かる使い方です', 'いい選択。その困りごとに効きます'],
  large: ['最初の成功です。その調子', 'よくできました。もう使い方は大丈夫', '完璧な滑り出しです'],
};

export function praiseFor(stage, avoidIndex = -1, random = Math.random) {
  const list = PRAISE[stage] || PRAISE.small;
  let index = Math.floor(random() * list.length) % list.length;
  if (list.length > 1 && index === avoidIndex) index = (index + 1) % list.length;
  return { text: list[index], index };
}

// Window dots: at most 5 visible, the window slides so the current page is
// always represented, and every page turn moves the active dot by one.
export function windowDots(total, current, maxVisible = 5) {
  const count = Math.min(total, maxVisible);
  if (count <= 0) return [];
  let start = Math.min(Math.max(current - Math.floor(count / 2), 0), total - count);
  if (start < 0) start = 0;
  return Array.from({ length: count }, (_, offset) => {
    const page = start + offset;
    const atEdge = (offset === 0 && start > 0) || (offset === count - 1 && start + count < total);
    return { page, active: page === current, small: atEdge && page !== current };
  });
}

export function parseStored(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.version !== ONBOARDING_VERSION) return null;
  return {
    version: ONBOARDING_VERSION,
    done: raw.done === true,
    skipped: raw.skipped === true,
    answer: typeof raw.answer === 'string' ? raw.answer : null,
  };
}

export function shouldShowOnboarding(stored) {
  return !stored || stored.done !== true;
}

export function serializeState({ done, skipped = false, answer = null }) {
  return { version: ONBOARDING_VERSION, done: done === true, skipped: skipped === true, answer };
}

/* ---------------- DOM layer (browser only) ---------------- */

const VIBRATION = { small: 8, medium: 15, large: [15, 50, 15] };

function vibrate(stage) {
  try { globalThis.navigator?.vibrate?.(VIBRATION[stage] || VIBRATION.small); } catch {}
}

function storageAdapter() {
  const chromeStorage = globalThis.chrome?.storage?.local;
  if (chromeStorage) {
    return {
      async get() {
        return new Promise((resolve) => {
          try {
            const result = chromeStorage.get(ONBOARDING_STORAGE_KEY, (items) => resolve(items?.[ONBOARDING_STORAGE_KEY] ?? null));
            if (result && typeof result.then === 'function') result.then((items) => resolve(items?.[ONBOARDING_STORAGE_KEY] ?? null), () => resolve(null));
          } catch { resolve(null); }
        });
      },
      async set(value) {
        try { await chromeStorage.set({ [ONBOARDING_STORAGE_KEY]: value }); } catch {}
      },
    };
  }
  return {
    async get() { try { const raw = globalThis.localStorage?.getItem(ONBOARDING_STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } },
    async set(value) { try { globalThis.localStorage?.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(value)); } catch {} },
  };
}

const VISUALS = {
  pile: '<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="14" y="26" width="52" height="40" rx="6" transform="rotate(-8 40 46)"/><rect x="52" y="18" width="52" height="40" rx="6" transform="rotate(6 78 38)" class="soft"/><circle cx="74" cy="32" r="5" class="sun"/><path d="M56 56l14-14 10 10 8-7 12 11z" class="mount"/></svg>',
  match: '<svg viewBox="0 0 120 90" aria-hidden="true"><circle cx="44" cy="45" r="22" class="soft"/><circle cx="76" cy="45" r="22"/></svg>',
  crate: '<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M22 38h76l-8 38H30z"/><path d="M14 26h92l6 12H8z" class="soft"/><circle cx="60" cy="56" r="6" class="sun"/><path d="M38 68l14-12 9 8 7-6 14 10z" class="mount"/></svg>',
  zoom: '<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="18" y="14" width="64" height="48" rx="6"/><circle cx="40" cy="30" r="5" class="sun"/><path d="M24 56l16-16 11 11 8-7 17 12z" class="mount"/><circle cx="82" cy="58" r="13" class="soft"/><path d="M92 68l10 10" class="handle"/></svg>',
  banner: '<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="10" y="34" width="76" height="22" rx="6" class="soft"/><path d="M94 38l14 14M108 38l-14 14" class="cross"/><rect x="18" y="64" width="40" height="14" rx="5"/></svg>',
  bundle: '<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="26" y="24" width="44" height="34" rx="6" transform="rotate(-6 48 41)"/><rect x="48" y="30" width="44" height="34" rx="6" class="soft" transform="rotate(5 70 47)"/><path d="M34 16v58M86 16v58" class="tie"/></svg>',
  step1: '<svg viewBox="0 0 120 90" aria-hidden="true"><circle cx="60" cy="42" r="24" class="soft"/><path d="M46 52l10-14 8 9 5-5 9 10z" class="mount"/><circle cx="52" cy="34" r="4" class="sun"/><path d="M60 10v8M60 66v8M26 42h8M86 42h8" class="rays"/></svg>',
  step2: '<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="28" y="18" width="64" height="48" rx="6"/><circle cx="50" cy="34" r="5" class="sun"/><path d="M34 60l16-16 11 11 8-7 17 12z" class="mount"/><circle cx="92" cy="18" r="13" class="badge"/><path d="M86 18l4 4 8-8" class="check"/></svg>',
  step3: '<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M60 14v34M46 36l14 14 14-14" class="arrow"/><path d="M26 62h68v14H26z" class="soft"/></svg>',
  result: '<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="30" y="14" width="60" height="46" rx="6" class="soft"/><circle cx="52" cy="30" r="5" class="sun"/><path d="M36 54l16-15 11 10 8-6 13 11z" class="mount"/><path d="M46 76l9 9 20-20" class="check big"/></svg>',
  stack: '<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="34" y="56" width="52" height="16" rx="5"/><rect x="30" y="38" width="52" height="16" rx="5" class="soft"/><rect x="38" y="20" width="52" height="16" rx="5"/><path d="M96 66V24M88 32l8-8 8 8" class="arrow"/></svg>',
  start: '<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M24 40h60l-7 34H31z"/><path d="M18 28h72l5 12H13z" class="soft"/><path d="M92 30l14 15-14 15M106 45H84" class="arrow"/></svg>',
};

function initOnboarding() {
  const root = document.getElementById('onboarding-root');
  if (!root) return;
  const storage = storageAdapter();
  const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  let pages = buildPages(null);
  let current = 0;
  let answer = null;
  let lastPraiseIndex = { small: -1, medium: -1, large: -1 };
  let advancing = false;

  root.innerHTML = `
    <div class="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-heading" hidden>
      <div class="onboarding-ambient" aria-hidden="true"><span></span><span></span></div>
      <p id="onboarding-status" class="sr-only" role="status"></p>
      <div class="onboarding-track"></div>
      <p class="onboarding-praise" aria-hidden="true"></p>
      <div class="onboarding-dots" aria-hidden="true"></div>
      <div class="onboarding-nav">
        <button type="button" class="onboarding-back quiet">戻る</button>
        <button type="button" class="onboarding-skip quiet">スキップ</button>
        <button type="button" class="onboarding-next primary">次へ</button>
      </div>
    </div>`;
  const overlay = root.querySelector('.onboarding-overlay');
  const track = root.querySelector('.onboarding-track');
  const dotsBox = root.querySelector('.onboarding-dots');
  const praiseBox = root.querySelector('.onboarding-praise');
  const statusBox = root.querySelector('#onboarding-status');
  const backButton = root.querySelector('.onboarding-back');
  const skipButton = root.querySelector('.onboarding-skip');
  const nextButton = root.querySelector('.onboarding-next');
  if (reducedMotion) overlay.classList.add('reduced-motion');

  function renderPages() {
    track.innerHTML = pages.map((page) => {
      const visual = page.visual === 'choices'
        ? `<div class="onboarding-choices">${WORRIES.map((worry) => `<button type="button" class="onboarding-choice" data-worry="${worry.id}">${worry.label}</button>`).join('')}</div>`
        : page.visual === 'practice'
          ? `<div class="onboarding-practice">${['sun', 'mount', 'sea'].map((kind, index) => `<button type="button" class="onboarding-sample" data-sample="${index}" aria-label="サンプル画像 ${index + 1}"><svg viewBox="0 0 120 90" aria-hidden="true"><rect x="8" y="8" width="104" height="74" rx="8" class="soft"/><circle cx="${kind === 'sun' ? 84 : 36}" cy="30" r="9" class="sun"/><path d="M14 74l${kind === 'sea' ? '24-18 18 12 16-20 34 26' : '28-26 20 16 18-22 26 30'}z" class="mount"/></svg><span class="onboarding-sample-check" aria-hidden="true">✓</span></button>`).join('')}</div>`
          : `<div class="onboarding-visual visual-${page.visual}">${VISUALS[page.visual] || ''}</div>`;
      return `<section class="onboarding-page" data-page="${page.id}" aria-hidden="true">
        <h2 id="${page.id === pages[current]?.id ? 'onboarding-heading' : ''}" class="onboarding-headline">${page.headline}</h2>
        ${page.sub ? `<p class="onboarding-sub">${page.sub}</p>` : ''}
        ${visual}
      </section>`;
    }).join('');
    track.querySelectorAll('[data-worry]').forEach((button) => button.addEventListener('click', () => chooseWorry(button)));
    track.querySelectorAll('[data-sample]').forEach((button) => button.addEventListener('click', () => chooseSample(button)));
    const startPage = track.querySelector('[data-page="start"]');
    if (startPage && !startPage.querySelector('.onboarding-start-button')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'onboarding-start-button primary';
      button.textContent = 'このページで始める';
      button.addEventListener('click', () => finish(false));
      startPage.appendChild(button);
    }
  }

  function renderDots() {
    dotsBox.innerHTML = windowDots(pages.length, current).map((dot) =>
      `<span class="onboarding-dot${dot.active ? ' active' : ''}${dot.small ? ' small' : ''}"></span>`).join('');
  }

  function show(index, { focus = true } = {}) {
    current = Math.min(Math.max(index, 0), pages.length - 1);
    const page = pages[current];
    track.style.transform = `translateX(-${current * 100}%)`;
    track.querySelectorAll('.onboarding-page').forEach((section, i) => {
      section.setAttribute('aria-hidden', i === current ? 'false' : 'true');
      section.classList.toggle('current', i === current);
    });
    statusBox.textContent = page.chapter;
    backButton.disabled = current === 0;
    const isChoiceDriven = page.visual === 'choices' || page.visual === 'practice' || page.id === 'start';
    nextButton.hidden = isChoiceDriven;
    renderDots();
    if (focus) {
      const heading = track.querySelectorAll('.onboarding-page')[current]?.querySelector('.onboarding-headline');
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    }
  }

  function praise(stage) {
    const picked = praiseFor(stage, lastPraiseIndex[stage]);
    lastPraiseIndex[stage] = picked.index;
    praiseBox.textContent = picked.text;
    praiseBox.classList.remove('show'); void praiseBox.offsetWidth; praiseBox.classList.add('show');
    vibrate(stage);
  }

  function go(delta) {
    const page = pages[current];
    if (delta > 0 && page.stage) praise(page.stage === 'large' ? 'small' : page.stage);
    show(current + delta);
  }

  function chooseWorry(button) {
    if (advancing) return;
    advancing = true;
    answer = button.dataset.worry;
    button.classList.add('chosen');
    praise('medium');
    const questionIndex = current;
    pages = buildPages(answer);
    renderPages();
    setTimeout(() => { advancing = false; show(questionIndex + 1); }, reducedMotion ? 60 : 340);
  }

  function chooseSample(button) {
    if (advancing) return;
    advancing = true;
    button.classList.add('chosen');
    praise('medium');
    setTimeout(() => { advancing = false; show(current + 1); praise('large'); }, reducedMotion ? 60 : 340);
  }

  async function finish(skipped) {
    if (!skipped) praise('large');
    await storage.set(serializeState({ done: true, skipped, answer }));
    overlay.hidden = true;
    document.getElementById('scan')?.focus({ preventScroll: false });
  }

  nextButton.addEventListener('click', () => go(1));
  backButton.addEventListener('click', () => show(current - 1));
  skipButton.addEventListener('click', () => finish(true));
  track.addEventListener('click', (event) => {
    const page = pages[current];
    if (page.visual === 'choices' || page.visual === 'practice' || page.id === 'start') return;
    if (event.target.closest('button')) return;
    go(1);
  });
  let touchX = null;
  overlay.addEventListener('touchstart', (event) => { touchX = event.changedTouches[0].clientX; }, { passive: true });
  overlay.addEventListener('touchend', (event) => {
    if (touchX === null) return;
    const dx = event.changedTouches[0].clientX - touchX; touchX = null;
    const page = pages[current];
    if (Math.abs(dx) < 48 || page.visual === 'choices' || page.visual === 'practice') return;
    if (dx < 0) go(1); else show(current - 1);
  }, { passive: true });
  overlay.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') go(1);
    if (event.key === 'ArrowLeft') show(current - 1);
  });

  function open() {
    pages = buildPages(answer);
    renderPages();
    overlay.hidden = false;
    show(0);
  }

  document.getElementById('onboarding-replay')?.addEventListener('click', open);
  storage.get().then((raw) => { if (shouldShowOnboarding(parseStored(raw))) open(); });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initOnboarding);
  else initOnboarding();
}
