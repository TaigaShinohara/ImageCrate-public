// Mobile & Cross-Platform First-Time Onboarding for ImageCrate
// Follows the 1-page-1-claim principle, window-dot progress, 3-tier praise & haptics,
// pain-point selection -> match declaration -> value reordering -> mini trial -> workspace handoff.

export const ONBOARDING_VERSION = 1;
export const ONBOARDING_STORAGE_KEY = 'imagecrate.onboarding.v1';
export const ONBOARDING_EVENTS_KEY = 'imagecrate.onboarding.events.v1';
export const AUTO_ADVANCE_DELAY_MS = 320;

export const PAIN_OPTIONS = Object.freeze([
  {
    id: 'noise',
    label: '広告や小さなアイコンばかり混ざって探しにくい',
    shortMirror: '広告が混ざって探しにくい',
    matchHeading: '「広告が混ざって探しにくい」あなたにぴったりです',
    matchSubtext: '広告除外フィルターが最初から働き、本文の画像だけを残します。',
    valueOrder: ['ad_clean', 'batch_save'],
    workspaceHint: '広告を除外して表示中 · 欲しい画像をタップして選択',
    enforceAdFilter: true,
  },
  {
    id: 'effort',
    label: '1枚ずつ長押しや右クリックで保存するのが手間',
    shortMirror: '1枚ずつ保存するのが手間',
    matchHeading: '「1枚ずつ保存するのが手間」なあなたにぴったりです',
    matchSubtext: 'タップでまとめて選び、1回で一括保存できます。',
    valueOrder: ['batch_save', 'ad_clean'],
    workspaceHint: '複数枚をタップして「選択N件を保存」で一括保存できます',
    enforceAdFilter: true,
  },
  {
    id: 'format',
    label: '保存した画像の形式やフォルダ整理で困る',
    shortMirror: '形式やフォルダ整理で困る',
    matchHeading: '「形式やフォルダ整理で困る」あなたにぴったりです',
    matchSubtext: 'JPEG・PNG・WebPへの変換も、ページ名での整理も自動で整います。',
    valueOrder: ['format_folder', 'ad_clean'],
    workspaceHint: '下の「変更」から保存形式（JPEG/PNG/WebP）やフォルダ名を選べます',
    enforceAdFilter: true,
    highlightDestination: true,
  },
  {
    id: 'unsure',
    label: 'まだわからない・まずは見てみたい',
    shortMirror: 'まだわからない',
    matchHeading: 'まだ決まっていなくて大丈夫です',
    matchSubtext: 'まずは1枚だけ、一覧から選んで試してみましょう。',
    valueOrder: ['ad_clean', 'batch_save'],
    workspaceHint: '気になる画像をタップして選択できます',
    enforceAdFilter: true,
    isEscape: true,
  },
]);

export const TRIAL_CARDS = Object.freeze([
  {
    id: 'photo',
    label: '風景のメイン写真',
    dims: '1200 × 800',
    format: 'WEBP',
    accentColor: '#566ac4',
  },
  {
    id: 'illust',
    label: '記事のイラスト',
    dims: '800 × 800',
    format: 'PNG',
    accentColor: '#6351d9',
  },
  {
    id: 'diagram',
    label: '解説の図表スライド',
    dims: '1600 × 900',
    format: 'JPG',
    accentColor: '#3b8c75',
  },
]);

export const VALUE_PAGES = Object.freeze({
  ad_clean: {
    id: 'value-ad-clean',
    role: 'value',
    heading: '広告を除いて、本文の画像だけ並ぶ',
    subtext: 'バナーや計測タグを自動で隠し、見たい画像だけを残します。',
    visualId: 'value-filter',
    visualLabel: '広告バナーが消えて本文の写真カードだけが整列する比較図',
    heroAnimation: 'ノイズのバナー枠が薄れて消え、残った写真カードが中央へ寄る（探す手間が消える変化を伝える）',
    ambientAnimation: '背景の淡い円2つがゆっくり浮く（2.6秒・3.4秒）',
    ambientCount: 2,
    reactionTier: 'small',
  },
  batch_save: {
    id: 'value-batch-save',
    role: 'value',
    heading: '1枚ずつの保存から、1タップの一括保存へ',
    subtext: '選んだ画像をZIPやフォルダにまとめて一度で受け取れます。',
    visualId: 'value-batch',
    visualLabel: '選ばれた複数枚の画像カードが1つのZIP・フォルダへまとまる図',
    heroAnimation: '選ばれた3枚のカードが重なって1つのパッケージにまとまる（何回も保存しなくてよい軽快さを伝える）',
    ambientAnimation: '背景の2つの角丸図形がゆっくり呼吸するように伸縮（3.0秒・4.0秒）',
    ambientCount: 2,
    reactionTier: 'small',
  },
  format_folder: {
    id: 'value-format-folder',
    role: 'value',
    heading: '好きな画像形式で、ページ名のフォルダに整う',
    subtext: 'JPEG・PNG・WebPへ端末内で変換し、名前も自動で揃えます。',
    visualId: 'value-format',
    visualLabel: '画像形式バッジが切り替わりページ名のフォルダに収まる図',
    heroAnimation: '形式バッジがJPG・PNGへ切り替わり、フォルダへ綺麗に収まる（欲しい形式と整理が同時に整う変化を伝える）',
    ambientAnimation: '背景の2つの角丸図形がゆっくり呼吸するように伸縮（2.8秒・3.8秒）',
    ambientCount: 2,
    reactionTier: 'small',
  },
});

export const PRAISE_CATALOG = Object.freeze({
  small: [
    '確認しました。次へ進みます。',
    'その調子です。続けて見てみましょう。',
    '受け取りました。次のステップへ進みます。',
  ],
  medium: [
    '教えてくれてありがとうございます。あなたに合う順番でご案内します。',
    'いい選択です。その使い方がいちばん快適に進められます。',
    'バッチリ選べました。本番の一覧でも同じ1タップで選べます。',
    'ありがとうございます。ぴったりの設定を準備しました。',
  ],
  large: [
    'これで準備は完了です。あとは一覧から最初の1枚を選ぶだけです。',
    'すべての基本が揃いました。さっそく欲しい画像を集めましょう。',
    '準備が整いました。あなたのコレクション作りを始めましょう。',
  ],
});

export function pickPraise(tier, lastPraiseByTier = {}) {
  const list = PRAISE_CATALOG[tier];
  if (!Array.isArray(list) || list.length === 0) return { text: '', nextLast: { ...lastPraiseByTier } };
  const last = lastPraiseByTier[tier] || '';
  const candidates = list.filter(item => item !== last);
  const chosen = (candidates.length > 0 ? candidates : list)[0];
  return {
    text: chosen,
    nextLast: { ...lastPraiseByTier, [tier]: chosen },
  };
}

export function computeWindowDots(currentPage, totalPages) {
  const safeTotal = Math.max(1, Number(totalPages) || 1);
  const safeCurrent = Math.max(0, Math.min(Number(currentPage) || 0, safeTotal - 1));
  const windowSize = Math.min(5, safeTotal);
  const maxStart = Math.max(0, safeTotal - windowSize);
  const windowStart = Math.max(0, Math.min(safeCurrent - 2, maxStart));
  const hasPrevOutside = windowStart > 0;
  const hasNextOutside = windowStart + windowSize < safeTotal;
  const isComplete = safeCurrent === safeTotal - 1;
  const dots = [];
  for (let i = 0; i < windowSize; i++) {
    const pageIndex = windowStart + i;
    let role = 'normal';
    if (pageIndex === safeCurrent) {
      role = 'active';
    } else if (i === 0 && hasPrevOutside) {
      role = 'edge';
    } else if (i === windowSize - 1 && hasNextOutside) {
      role = 'edge';
    } else if (Math.abs(pageIndex - safeCurrent) === 1) {
      role = 'near';
    }
    dots.push({ pageIndex, slotIndex: i, role });
  }
  return {
    windowSize,
    windowStart,
    currentPage: safeCurrent,
    hasPrevOutside,
    hasNextOutside,
    isComplete,
    dots,
  };
}

export function getPainOption(painId) {
  return PAIN_OPTIONS.find(option => option.id === painId) || PAIN_OPTIONS.find(option => option.id === 'unsure');
}

export function getTrialCard(cardId) {
  return TRIAL_CARDS.find(card => card.id === cardId) || TRIAL_CARDS[0];
}

export function buildOnboardingPages(answers = {}) {
  const chosenPain = getPainOption(answers.painPoint);
  const chosenCard = getTrialCard(answers.trialCard);
  const [firstValueKey, secondValueKey] = chosenPain.valueOrder;
  const firstValue = VALUE_PAGES[firstValueKey] || VALUE_PAGES.ad_clean;
  const secondValue = VALUE_PAGES[secondValueKey] || VALUE_PAGES.batch_save;

  return [
    {
      index: 0,
      id: 'hook',
      role: 'hook',
      chapter: '導入',
      heading: '欲しい画像だけ、ひとまとめ',
      subtext: 'ページの中の必要な画像を一括で手元に集めます。',
      visualId: 'hook-crate',
      visualLabel: '散らばった3枚の画像カードが中央のボックスへ吸い込まれて整列する図',
      heroAnimation: '3枚の画像カードが中央の箱へすっと吸い込まれて整列する（散らばった画像が1つにまとまる快感を伝える）',
      ambientAnimation: '背景の淡い円2つが周期3.2秒と4.0秒で数pxゆっくり浮く',
      ambientCount: 2,
      reactionTier: 'small',
      autoAdvance: false,
    },
    {
      index: 1,
      id: 'choice-pain',
      role: 'choice',
      chapter: 'お悩みの選択',
      heading: '画像集めで、いちばん困ることは？',
      subtext: 'あなたの使い方に合わせて案内します。選ぶと自動で進みます。',
      visualId: 'choice-pain',
      visualLabel: '困りごとを表す4つの選択肢カード',
      heroAnimation: '選択肢カードが順番に浮かび上がり、押したカードが弾む（ここから1つ選んでほしいことと選択の手応えを伝える）',
      ambientAnimation: 'なし（選択肢を主役にするため）',
      ambientCount: 0,
      reactionTier: 'medium',
      autoAdvance: true,
      questionKey: 'painPoint',
      choices: PAIN_OPTIONS.map(opt => ({ id: opt.id, label: opt.label, isEscape: Boolean(opt.isEscape) })),
    },
    {
      index: 2,
      id: 'match-pain',
      role: 'match',
      chapter: 'あなたへの提案',
      heading: chosenPain.matchHeading,
      subtext: chosenPain.matchSubtext,
      visualId: 'match-bridge',
      visualLabel: '選んだお悩みバッジとImageCrateのアイコンが重なって一致を示す図',
      heroAnimation: '選んだバッジとアプリアイコンが左右から寄って重なりチェックが灯る（自分の悩みにアプリが合致したことを伝える）',
      ambientAnimation: '背景の2つのリングが非同期（2.8秒・3.8秒）でわずかに伸縮',
      ambientCount: 2,
      reactionTier: 'medium',
      autoAdvance: false,
    },
    {
      index: 3,
      id: 'identity',
      role: 'identity',
      chapter: 'アプリの目的',
      heading: 'Webページの画像を、選んで一括保存',
      subtext: '外部サーバーを使わず、あなたの端末の中だけで安全に完結します。',
      visualId: 'identity-workbench',
      visualLabel: 'ImageCrateのギャラリー画面モックと端末内保護を示すシールドアイコン',
      heroAnimation: '画面モックの枠が静かに広がり、シールドが一度だけ輝く（端末内で安全に画像を選別できる道具であることを伝える）',
      ambientAnimation: '背景の2つのドットがゆっくり上下に浮く（3.0秒・3.6秒）',
      ambientCount: 2,
      reactionTier: 'small',
      autoAdvance: false,
    },
    {
      index: 4,
      ...firstValue,
      chapter: '価値 1',
      autoAdvance: false,
    },
    {
      index: 5,
      ...secondValue,
      chapter: '価値 2',
      autoAdvance: false,
    },
    {
      index: 6,
      id: 'step-1',
      role: 'step',
      stepNumber: 1,
      chapter: '使い方の1つめ',
      heading: '1. 画像を選ぶ',
      subtext: '一覧のカードをタップすると、選択マークがつきます。',
      visualId: 'step-1-select',
      visualLabel: 'ステップ1：画像カードをタップして左上の選択チェックが点灯する画面モック',
      heroAnimation: '番号1が強調され、カードの選択チェックがバイオレットに灯る（最初の操作である「選ぶ」場所と変化を伝える）',
      ambientAnimation: '背景の小さな円1つがゆっくり浮く（3.2秒）',
      ambientCount: 1,
      reactionTier: 'small',
      autoAdvance: false,
    },
    {
      index: 7,
      id: 'step-2',
      role: 'step',
      stepNumber: 2,
      chapter: '使い方の2つめ',
      heading: '2. 条件で絞り込む',
      subtext: '横幅・高さのバーや広告除外で、目当ての画像に絞れます。',
      visualId: 'step-2-filter',
      visualLabel: 'ステップ2：横幅・高さの範囲スライダーと広告除外ボタンの画面モック',
      heroAnimation: '番号2が強調され、サイズ範囲バーのつまみが内側に寄る（2つ目の操作である「絞り込む」動きを伝える）',
      ambientAnimation: '背景の小さな円1つがゆっくり浮く（3.6秒）',
      ambientCount: 1,
      reactionTier: 'small',
      autoAdvance: false,
    },
    {
      index: 8,
      id: 'step-3',
      role: 'step',
      stepNumber: 3,
      chapter: '使い方の3つめ',
      heading: '3. まとめて保存する',
      subtext: '画面下の保存ボタンを押すと、選んだ画像が一括で保存されます。',
      visualId: 'step-3-save',
      visualLabel: 'ステップ3：画面下の「選択N件を保存」ボタンと保存完了チェックの画面モック',
      heroAnimation: '番号3が強調され、保存ボタンが一度光って完了チェックへ変わる（3つ目の操作と保存完了の結果を伝える）',
      ambientAnimation: '背景の小さな円1つがゆっくり浮く（3.0秒）',
      ambientCount: 1,
      reactionTier: 'small',
      autoAdvance: false,
    },
    {
      index: 9,
      id: 'interaction-trial',
      role: 'interaction',
      chapter: '試し操作',
      heading: '試しに、欲しい画像を1枚選んでみましょう',
      subtext: '本物のカードと同じ動きです。気になる画像をタップしてください。',
      visualId: 'trial-select',
      visualLabel: '試しにタップして選べる3枚のミニ画像カード',
      heroAnimation: 'カードのチェック枠が控えめに脈打ち、タップしたカードが大きく弾む（実際にタップして選ぶ操作感を伝える）',
      ambientAnimation: 'なし（試し操作に集中させるため）',
      ambientCount: 0,
      reactionTier: 'medium',
      autoAdvance: true,
      questionKey: 'trialCard',
      choices: TRIAL_CARDS.map(card => ({
        id: card.id,
        label: `${card.label}（${card.dims} · ${card.format}）`,
        dims: card.dims,
        format: card.format,
      })),
    },
    {
      index: 10,
      id: 'match-trial',
      role: 'match',
      chapter: '試し操作の結果',
      heading: 'その1タップで、保存の準備は完了です',
      subtext: `「${chosenCard.label}」を選びました。本番の一覧でも同じ操作で集められます。`,
      visualId: 'trial-result',
      visualLabel: '選んだミニ画像カードに選択チェックがつき、下部の「選択1件を保存」バーが点灯した図',
      heroAnimation: '選んだカードと保存バーが一度だけ広がって収まる（800ms以内、操作の達成と本番への自信を伝える）',
      ambientAnimation: '背景の2つの円がゆっくり浮く（2.8秒・3.6秒）',
      ambientCount: 2,
      reactionTier: 'large',
      autoAdvance: false,
    },
    {
      index: 11,
      id: 'expectation',
      role: 'expectation',
      chapter: 'これからの体験',
      heading: '欲しい画像だけが、きれいな箱に揃う',
      subtext: 'ページごとのフォルダやZIPで、あとから見返すのも快適です。',
      visualId: 'expectation-collection',
      visualLabel: '整理された画像コレクションのボックスが開き、選んだ画像が並んでいる図',
      heroAnimation: 'クレートが静かに開き、整頓された画像カードが顔を覗かせる（使い続けると手元が綺麗に整うワクワクを伝える）',
      ambientAnimation: '背景の2つの光輪がゆっくり伸縮（3.2秒・4.0秒）',
      ambientCount: 2,
      reactionTier: 'small',
      autoAdvance: false,
    },
    {
      index: 12,
      id: 'connection',
      role: 'connection',
      chapter: '最初の操作へ',
      heading: 'さっそく最初の画像を選んでみる',
      subtext: '今開いているページの画像一覧へ移動します。1枚選ぶだけで準備OKです。',
      visualId: 'connection-start',
      visualLabel: '画像一覧へ進む準備が整ったプレビューと開始ボタン',
      heroAnimation: '主ボタンが静かに脈打ち、押すと祝いの波紋が広がる（ここを押せばすぐ最初の画像選びが始まることを伝える）',
      ambientAnimation: '背景の小さな円1つがゆっくり浮く（3.4秒）',
      ambientCount: 1,
      reactionTier: 'large',
      autoAdvance: false,
      ctaLabel: '画像一覧を開いて選ぶ',
    },
  ];
}

export function defaultOnboardingState() {
  return {
    version: ONBOARDING_VERSION,
    currentPage: 0,
    answers: {
      painPoint: null,
      trialCard: null,
    },
    completed: false,
    lastPraiseByTier: {
      small: '',
      medium: '',
      large: '',
    },
  };
}

export function loadOnboardingState(storage = globalThis.localStorage) {
  const fallback = defaultOnboardingState();
  if (!storage || typeof storage.getItem !== 'function') return fallback;
  try {
    const raw = storage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;
    const versionMatch = parsed.version === ONBOARDING_VERSION;
    const painPoint = PAIN_OPTIONS.some(o => o.id === parsed.answers?.painPoint) ? parsed.answers.painPoint : null;
    const trialCard = TRIAL_CARDS.some(c => c.id === parsed.answers?.trialCard) ? parsed.answers.trialCard : null;
    return {
      version: ONBOARDING_VERSION,
      currentPage: versionMatch && Number.isSafeInteger(parsed.currentPage) && parsed.currentPage >= 0 && parsed.currentPage < 13
        ? parsed.currentPage
        : 0,
      answers: { painPoint, trialCard },
      completed: Boolean(versionMatch && parsed.completed === true),
      lastPraiseByTier: {
        small: typeof parsed.lastPraiseByTier?.small === 'string' ? parsed.lastPraiseByTier.small : '',
        medium: typeof parsed.lastPraiseByTier?.medium === 'string' ? parsed.lastPraiseByTier.medium : '',
        large: typeof parsed.lastPraiseByTier?.large === 'string' ? parsed.lastPraiseByTier.large : '',
      },
    };
  } catch {
    return fallback;
  }
}

export function saveOnboardingState(state, storage = globalThis.localStorage) {
  if (!storage || typeof storage.setItem !== 'function') return;
  try {
    const payload = {
      version: ONBOARDING_VERSION,
      currentPage: Math.max(0, Math.min(Number(state.currentPage) || 0, 12)),
      answers: {
        painPoint: state.answers?.painPoint || null,
        trialCard: state.answers?.trialCard || null,
      },
      completed: Boolean(state.completed),
      lastPraiseByTier: {
        small: state.lastPraiseByTier?.small || '',
        medium: state.lastPraiseByTier?.medium || '',
        large: state.lastPraiseByTier?.large || '',
      },
    };
    storage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}

export function recordOnboardingEvent(event, storage = globalThis.localStorage) {
  // Strictly local, non-PII event log (no URLs, no user identifiers, capped at 50 entries).
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') return;
  try {
    const existingRaw = storage.getItem(ONBOARDING_EVENTS_KEY);
    const list = existingRaw ? JSON.parse(existingRaw) : [];
    const safeList = Array.isArray(list) ? list.slice(-49) : [];
    safeList.push({
      type: String(event.type || 'unknown'),
      pageId: String(event.pageId || ''),
      pageIndex: Number.isSafeInteger(event.pageIndex) ? event.pageIndex : 0,
      timestamp: Date.now(),
    });
    storage.setItem(ONBOARDING_EVENTS_KEY, JSON.stringify(safeList));
  } catch {}
}

export function shouldAutoShowOnboarding({
  storage = globalThis.localStorage,
  search = globalThis.location?.search || '',
  webdriver = globalThis.navigator?.webdriver === true,
} = {}) {
  const params = new URLSearchParams(search);
  if (params.get('onboarding') === '0') return false;
  if (params.get('onboarding') === '1') return true;
  if (webdriver && !globalThis.__enableOnboardingInWebdriver) return false;
  const state = loadOnboardingState(storage);
  return !(state.completed && state.version === ONBOARDING_VERSION);
}

export function triggerHaptic(tier, {
  reducedMotion = false,
  navigatorObj = globalThis.navigator,
} = {}) {
  if (reducedMotion || !tier || tier === 'none') return false;
  if (!navigatorObj || typeof navigatorObj.vibrate !== 'function') return false;
  try {
    if (tier === 'small') return Boolean(navigatorObj.vibrate(8));
    if (tier === 'medium') return Boolean(navigatorObj.vibrate([12, 30, 18]));
    if (tier === 'large') return Boolean(navigatorObj.vibrate([16, 40, 26]));
  } catch {}
  return false;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function svgIcon(name, className = 'icon ob-svg-icon') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#icon-${name}`);
  svg.append(use);
  return svg;
}

function buildVisualDOM(page, answers) {
  const root = el('div', `ob-scene ob-scene-${page.visualId}`);
  // Ambient layer (strictly <= 2 elements, stopped automatically on reduced-motion or serious pages)
  if (page.ambientCount > 0) {
    const ambientWrap = el('div', 'ob-ambient-layer');
    ambientWrap.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < Math.min(2, page.ambientCount); i++) {
      ambientWrap.append(el('span', `ob-ambient-orb ob-ambient-orb-${i + 1}`));
    }
    root.append(ambientWrap);
  }

  const hero = el('div', 'ob-hero-layer');
  hero.setAttribute('aria-hidden', 'true');

  if (page.visualId === 'hook-crate') {
    const cards = el('div', 'ob-floating-cards');
    for (let i = 1; i <= 3; i++) {
      const card = el('div', `ob-mini-photo ob-mini-photo-${i}`);
      card.append(svgIcon('image', 'icon ob-card-thumb-icon'), el('span', 'ob-mini-check', '✓'));
      cards.append(card);
    }
    const crate = el('div', 'ob-crate-box');
    crate.append(svgIcon('folder', 'icon ob-inline-icon'), el('span', 'ob-crate-badge', 'ImageCrate で一括整理'));
    hero.append(cards, crate);
  } else if (page.visualId === 'choice-pain') {
    const badge = el('div', 'ob-question-emblem');
    const iconWrap = el('span', 'ob-emblem-icon');
    iconWrap.append(svgIcon('help', 'icon ob-svg-icon'));
    badge.append(iconWrap, el('span', 'ob-emblem-caption', '当てはまるものを1つタップしてください'));
    hero.append(badge);
  } else if (page.visualId === 'match-bridge') {
    const pain = getPainOption(answers.painPoint);
    const bridge = el('div', 'ob-match-pair');
    const left = el('div', 'ob-match-node ob-match-user', pain.shortMirror);
    const join = el('div', 'ob-match-spark', '✓');
    const right = el('div', 'ob-match-node ob-match-app');
    right.append(svgIcon('select', 'icon ob-inline-icon'), el('span', '', 'ImageCrate'));
    bridge.append(left, join, right);
    hero.append(bridge);
  } else if (page.visualId === 'identity-workbench') {
    const mock = el('div', 'ob-workbench-mock');
    const top = el('div', 'ob-workbench-bar');
    const shield = el('span', 'ob-shield-pill');
    shield.append(svgIcon('shield', 'icon ob-inline-icon'), el('span', '', '端末内で安全に完結'));
    top.append(shield);
    const grid = el('div', 'ob-workbench-grid');
    for (let i = 0; i < 3; i++) {
      const item = el('div', 'ob-workbench-item selected');
      item.append(svgIcon('image', 'icon ob-card-thumb-icon'), el('span', 'ob-mini-check', '✓'));
      grid.append(item);
    }
    mock.append(top, grid);
    hero.append(mock);
  } else if (page.visualId === 'value-filter') {
    const row = el('div', 'ob-filter-demo');
    const ad = el('div', 'ob-demo-ad', 'AD バナー除外');
    const keep1 = el('div', 'ob-demo-keep');
    keep1.append(svgIcon('image', 'icon ob-inline-icon'), el('span', '', '本文画像 1'));
    const keep2 = el('div', 'ob-demo-keep');
    keep2.append(svgIcon('image', 'icon ob-inline-icon'), el('span', '', '本文画像 2'));
    row.append(ad, keep1, keep2);
    hero.append(row);
  } else if (page.visualId === 'value-batch') {
    const pack = el('div', 'ob-batch-demo');
    const stack = el('div', 'ob-batch-stack');
    stack.append(el('span', 'ob-stack-card c1'), el('span', 'ob-stack-card c2'), el('span', 'ob-stack-card c3'));
    const arrow = el('span', 'ob-batch-arrow', '→');
    const zip = el('div', 'ob-batch-zip');
    zip.append(svgIcon('download', 'icon ob-inline-icon'), el('span', '', '一括保存 (ZIP / フォルダ)'));
    pack.append(stack, arrow, zip);
    hero.append(pack);
  } else if (page.visualId === 'value-format') {
    const fmt = el('div', 'ob-format-demo');
    const pills = el('div', 'ob-format-pills');
    pills.append(el('span', 'ob-fmt-pill', 'WEBP'), el('span', 'ob-fmt-arrow', '→'), el('span', 'ob-fmt-pill active', 'JPG / PNG'));
    const folder = el('div', 'ob-fmt-folder');
    folder.append(svgIcon('folder', 'icon ob-inline-icon'), el('span', '', 'ページ名のフォルダへ整理'));
    fmt.append(pills, folder);
    hero.append(fmt);
  } else if (page.visualId.startsWith('step-')) {
    const stepBox = el('div', 'ob-step-mock');
    const num = el('div', 'ob-step-badge', `STEP ${page.stepNumber}`);
    const stage = el('div', 'ob-step-stage');
    if (page.stepNumber === 1) {
      const card = el('div', 'ob-step-card-mock');
      card.append(svgIcon('select', 'icon ob-inline-icon'), el('span', 'ob-step-caption', 'カードをタップして選択'));
      stage.append(card);
    } else if (page.stepNumber === 2) {
      const bar = el('div', 'ob-step-slider-mock');
      const label = el('span', 'ob-slider-label');
      label.append(svgIcon('filter', 'icon ob-inline-icon'), el('span', '', '横幅・高さ / 広告除外'));
      bar.append(label, el('div', 'ob-slider-track-mock'));
      stage.append(bar);
    } else {
      const btn = el('div', 'ob-step-save-mock');
      btn.append(svgIcon('download', 'icon ob-inline-icon'), el('span', '', '選択3件を保存'));
      stage.append(btn);
    }
    stepBox.append(num, stage);
    hero.append(stepBox);
  } else if (page.visualId === 'trial-select') {
    const hint = el('div', 'ob-trial-banner');
    hint.append(svgIcon('select', 'icon ob-inline-icon'), el('span', '', '下の3枚から1枚をタップして選択'));
    hero.append(hint);
  } else if (page.visualId === 'trial-result') {
    const chosen = getTrialCard(answers.trialCard);
    const res = el('div', 'ob-trial-success-card');
    const bar = el('div', 'ob-trial-save-bar');
    bar.append(svgIcon('check', 'icon ob-inline-icon'), el('span', '', '選択1件を保存 準備OK'));
    res.append(
      el('span', 'ob-mini-check active', '✓'),
      el('strong', 'ob-trial-title', chosen.label),
      el('span', 'ob-trial-meta', `${chosen.dims} · ${chosen.format}`),
      bar
    );
    hero.append(res);
  } else if (page.visualId === 'expectation-collection') {
    const showcase = el('div', 'ob-expectation-box');
    const header = el('div', 'ob-collection-header');
    header.append(svgIcon('folder', 'icon ob-inline-icon'), el('span', '', 'お気に入り記事の画像 (12枚)'));
    showcase.append(header, el('div', 'ob-collection-thumbs'));
    const thumbs = showcase.querySelector('.ob-collection-thumbs');
    for (let i = 0; i < 4; i++) {
      const item = el('span', 'ob-collection-item');
      item.append(svgIcon('image', 'icon ob-card-thumb-icon'));
      thumbs.append(item);
    }
    hero.append(showcase);
  } else if (page.visualId === 'connection-start') {
    const startMock = el('div', 'ob-connection-preview');
    const badge = el('span', 'ob-connection-badge');
    badge.append(svgIcon('check', 'icon ob-inline-icon'), el('span', '', '準備完了'));
    startMock.append(badge, el('p', 'ob-connection-note', '開いているページの画像がすぐに並びます'));
    hero.append(startMock);
  }

  root.append(hero);
  return root;
}

export function createOnboardingController({
  dialog = document.getElementById('onboarding'),
  storage = globalThis.localStorage,
  onComplete = () => {},
} = {}) {
  if (!dialog) return null;

  let state = loadOnboardingState(storage);
  let advanceTimer = null;
  let advancing = false;

  const els = {
    back: dialog.querySelector('#onboarding-back'),
    skip: dialog.querySelector('#onboarding-skip'),
    dots: dialog.querySelector('#onboarding-dots'),
    srLocation: dialog.querySelector('#onboarding-sr-location'),
    stage: dialog.querySelector('#onboarding-stage'),
    heading: dialog.querySelector('#onboarding-heading'),
    subtext: dialog.querySelector('#onboarding-subtext'),
    visual: dialog.querySelector('#onboarding-visual'),
    praise: dialog.querySelector('#onboarding-praise'),
    choices: dialog.querySelector('#onboarding-choices'),
    next: dialog.querySelector('#onboarding-next'),
  };

  const isReducedMotion = () =>
    Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);

  function clearAdvanceTimer() {
    if (advanceTimer !== null) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
    advancing = false;
  }

  function showReaction(tier, targetElement) {
    const reduced = isReducedMotion();
    triggerHaptic(tier, { reducedMotion: reduced });
    if (targetElement && !reduced) {
      targetElement.classList.remove('ob-bounce-small', 'ob-bounce-medium', 'ob-bounce-large');
      void targetElement.offsetWidth;
      targetElement.classList.add(`ob-bounce-${tier}`);
    }
    const { text, nextLast } = pickPraise(tier, state.lastPraiseByTier);
    state.lastPraiseByTier = nextLast;
    if (els.praise && text) {
      els.praise.textContent = text;
      els.praise.dataset.tier = tier;
      els.praise.dataset.visible = 'true';
    }
  }

  function renderDots(pages) {
    if (!els.dots) return;
    const info = computeWindowDots(state.currentPage, pages.length);
    els.dots.classList.toggle('window-dots-complete', info.isComplete);
    els.dots.replaceChildren();
    for (const dot of info.dots) {
      const span = el('span', `window-dot dot-${dot.role}`);
      span.dataset.pageIndex = String(dot.pageIndex);
      span.dataset.role = dot.role;
      els.dots.append(span);
    }
  }

  function render() {
    const pages = buildOnboardingPages(state.answers);
    const page = pages[state.currentPage] || pages[0];
    state.currentPage = page.index;
    saveOnboardingState(state, storage);
    recordOnboardingEvent({ type: 'page_view', pageId: page.id, pageIndex: page.index }, storage);

    dialog.dataset.pageId = page.id;
    dialog.dataset.pageRole = page.role;
    dialog.dataset.pageIndex = String(page.index);

    if (els.srLocation) {
      els.srLocation.textContent = `現在地: ${page.chapter}`;
    }

    if (els.back) {
      els.back.disabled = page.index === 0;
      els.back.classList.toggle('is-first-page', page.index === 0);
    }

    renderDots(pages);

    if (els.heading) els.heading.textContent = page.heading;
    if (els.subtext) els.subtext.textContent = page.subtext;

    if (els.visual) {
      els.visual.setAttribute('aria-label', page.visualLabel);
      els.visual.replaceChildren(buildVisualDOM(page, state.answers));
    }

    if (els.praise) {
      if (page.id === 'match-trial') {
        const { text, nextLast } = pickPraise('large', state.lastPraiseByTier);
        state.lastPraiseByTier = nextLast;
        els.praise.textContent = text;
        els.praise.dataset.tier = 'large';
        els.praise.dataset.visible = 'true';
      } else {
        els.praise.dataset.visible = 'false';
        els.praise.textContent = '';
      }
    }

    if (els.choices) {
      els.choices.replaceChildren();
      if (page.autoAdvance && Array.isArray(page.choices)) {
        els.choices.hidden = false;
        els.choices.className = `onboarding-choices choices-${page.questionKey}`;
        const currentAnswer = state.answers[page.questionKey];
        for (const choice of page.choices) {
          const btn = el('button', `onboarding-choice-btn${choice.isEscape ? ' is-escape' : ''}`);
          btn.type = 'button';
          btn.dataset.choiceId = choice.id;
          btn.setAttribute('aria-pressed', String(currentAnswer === choice.id));
          if (page.questionKey === 'trialCard') {
            const check = el('span', 'ob-trial-choice-check', '✓');
            check.setAttribute('aria-hidden', 'true');
            const label = el('span', 'ob-trial-choice-label', choice.label);
            btn.append(check, label);
          } else {
            btn.textContent = choice.label;
          }
          btn.addEventListener('click', event => {
            event.stopPropagation();
            if (advancing) return;
            advancing = true;
            state.answers[page.questionKey] = choice.id;
            for (const sibling of els.choices.querySelectorAll('.onboarding-choice-btn')) {
              sibling.setAttribute('aria-pressed', String(sibling === btn));
            }
            saveOnboardingState(state, storage);
            recordOnboardingEvent({ type: 'answer', pageId: page.id, pageIndex: page.index }, storage);
            showReaction(page.reactionTier || 'medium', btn);
            const delay = isReducedMotion() ? 60 : AUTO_ADVANCE_DELAY_MS;
            advanceTimer = setTimeout(() => {
              advanceTimer = null;
              advancing = false;
              goToPage(state.currentPage + 1);
            }, delay);
          });
          els.choices.append(btn);
        }
      } else {
        els.choices.hidden = true;
      }
    }

    if (els.next) {
      els.next.classList.remove('ob-bounce-small', 'ob-bounce-medium', 'ob-bounce-large');
      if (page.autoAdvance) {
        els.next.hidden = true;
      } else {
        els.next.hidden = false;
        const isLast = page.index === pages.length - 1;
        els.next.textContent = isLast ? (page.ctaLabel || '画像一覧を開いて選ぶ') : '次へ';
        els.next.classList.toggle('is-connection-cta', isLast);
      }
    }

    if (dialog.open) {
      const active = document.activeElement;
      if (!active || !dialog.contains(active) || active.hidden || active === document.body) {
        els.heading?.focus();
      }
    }
  }

  function goToPage(targetIndex) {
    clearAdvanceTimer();
    const pages = buildOnboardingPages(state.answers);
    const clamped = Math.max(0, Math.min(targetIndex, pages.length - 1));
    state.currentPage = clamped;
    render();
  }

  function complete() {
    clearAdvanceTimer();
    showReaction('large', els.next);
    state.completed = true;
    state.version = ONBOARDING_VERSION;
    saveOnboardingState(state, storage);
    recordOnboardingEvent({ type: 'complete', pageId: 'connection', pageIndex: state.currentPage }, storage);
    if (dialog.open) dialog.close();
    onComplete({ completed: true, skipped: false, answers: { ...state.answers } });
  }

  function skip() {
    clearAdvanceTimer();
    // Neutral transition only: no praise, no success haptic on skip.
    state.completed = true;
    state.version = ONBOARDING_VERSION;
    saveOnboardingState(state, storage);
    recordOnboardingEvent({ type: 'skip', pageId: dialog.dataset.pageId || '', pageIndex: state.currentPage }, storage);
    if (dialog.open) dialog.close();
    onComplete({ completed: true, skipped: true, answers: { ...state.answers } });
  }

  function goBack() {
    if (state.currentPage <= 0) return;
    // Neutral transition only: no praise, no success haptic on back.
    goToPage(state.currentPage - 1);
  }

  function advanceFromExplanation(sourceBtn = els.next) {
    const pages = buildOnboardingPages(state.answers);
    const page = pages[state.currentPage];
    if (!page || page.autoAdvance) return;
    if (page.index >= pages.length - 1) {
      complete();
      return;
    }
    showReaction('small', sourceBtn);
    goToPage(state.currentPage + 1);
  }

  els.back?.addEventListener('click', event => {
    event.stopPropagation();
    goBack();
  });

  els.skip?.addEventListener('click', event => {
    event.stopPropagation();
    skip();
  });

  els.next?.addEventListener('click', event => {
    event.stopPropagation();
    advanceFromExplanation(els.next);
  });

  // Tap-anywhere on stage for explanation pages (excluding interactive choice pages)
  els.stage?.addEventListener('click', event => {
    if (event.target.closest('button, a, input')) return;
    const pages = buildOnboardingPages(state.answers);
    const page = pages[state.currentPage];
    if (!page || page.autoAdvance || page.role === 'connection') return;
    advanceFromExplanation(els.stage);
  });

  // Standard horizontal swipe gesture on stage
  let touchStartX = null;
  let touchStartY = null;
  let touchStartTime = 0;
  els.stage?.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) return;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  els.stage?.addEventListener('touchend', event => {
    if (touchStartX === null || event.changedTouches.length !== 1) return;
    const dx = event.changedTouches[0].clientX - touchStartX;
    const dy = event.changedTouches[0].clientY - touchStartY;
    const elapsed = Date.now() - touchStartTime;
    touchStartX = null;
    touchStartY = null;
    if (elapsed > 500 || Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    const pages = buildOnboardingPages(state.answers);
    const page = pages[state.currentPage];
    if (dx < 0) {
      // Swipe left -> next (on explanation pages)
      if (page && !page.autoAdvance && page.index < pages.length - 1) {
        advanceFromExplanation(els.stage);
      }
    } else if (dx > 0) {
      // Swipe right -> back
      goBack();
    }
  }, { passive: true });

  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    skip();
  });

  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft') {
      if (state.currentPage > 0) {
        event.preventDefault();
        goBack();
      }
    } else if (event.key === 'ArrowRight') {
      const pages = buildOnboardingPages(state.answers);
      const page = pages[state.currentPage];
      if (page && !page.autoAdvance && page.index < pages.length - 1) {
        event.preventDefault();
        advanceFromExplanation(els.next);
      }
    }
  });

  return {
    open(resetToStart = false) {
      state = loadOnboardingState(storage);
      if (resetToStart) {
        state.currentPage = 0;
        state.completed = false;
      }
      render();
      if (!dialog.open) dialog.showModal();
      els.heading?.focus();
    },
    close() {
      clearAdvanceTimer();
      if (dialog.open) dialog.close();
    },
    getState: () => ({ ...state, answers: { ...state.answers } }),
    goToPage,
  };
}
