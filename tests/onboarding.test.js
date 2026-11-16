import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ONBOARDING_VERSION,
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_EVENTS_KEY,
  PAIN_OPTIONS,
  TRIAL_CARDS,
  PRAISE_CATALOG,
  pickPraise,
  computeWindowDots,
  buildOnboardingPages,
  loadOnboardingState,
  saveOnboardingState,
  recordOnboardingEvent,
  shouldAutoShowOnboarding,
  triggerHaptic,
} from '../extension/onboarding.js';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: key => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    clear: () => map.clear(),
  };
}

test('onboarding page map enforces 1-page-1-claim, 3 steps, and visual/animation metadata', () => {
  const pages = buildOnboardingPages();
  assert.equal(pages.length, 13, 'standard onboarding flow has 13 single-claim pages');

  const steps = pages.filter(p => p.role === 'step');
  assert.equal(steps.length, 3, 'basic usage is exactly 3 steps');
  assert.deepEqual(
    steps.map(s => s.heading),
    ['1. 画像を選ぶ', '2. 条件で絞り込む', '3. まとめて保存する']
  );

  for (const page of pages) {
    assert.ok(page.heading && page.heading.length <= 28, `page ${page.id} has a concise 1-line heading`);
    assert.ok(!page.heading.includes('\n'), `page ${page.id} heading is a single line`);
    assert.ok(page.subtext && page.subtext.length <= 60, `page ${page.id} subtext fits within 2 lines`);
    assert.ok(page.visualId && page.visualLabel, `page ${page.id} has a visual hero and accessibility label`);
    assert.ok(page.heroAnimation && page.heroAnimation.includes('伝える'), `page ${page.id} documents hero animation meaning`);
    assert.ok(page.ambientCount >= 0 && page.ambientCount <= 2, `page ${page.id} ambient animation is at most 2 elements`);
    for (const forbidden of ['必ず', '絶対に', '誰でも']) {
      assert.ok(!page.heading.includes(forbidden) && !page.subtext.includes(forbidden), `page ${page.id} avoids guarantee word: ${forbidden}`);
    }
  }
});

test('questions and results are strictly separated and answers reorder subsequent value pages', () => {
  const painQuestionPage = buildOnboardingPages()[1];
  assert.equal(painQuestionPage.id, 'choice-pain');
  assert.equal(painQuestionPage.autoAdvance, true, 'question page has no Next button and auto-advances on selection');
  assert.equal(painQuestionPage.choices.length, 4, '3 concrete pain points + 1 escape hatch');
  assert.equal(painQuestionPage.choices.some(c => c.isEscape), true, 'includes an escape hatch option');

  const noisePages = buildOnboardingPages({ painPoint: 'noise' });
  assert.match(noisePages[2].heading, /広告が混ざって探しにくい/);
  assert.equal(noisePages[4].id, 'value-ad-clean');
  assert.equal(noisePages[5].id, 'value-batch-save');

  const effortPages = buildOnboardingPages({ painPoint: 'effort' });
  assert.match(effortPages[2].heading, /1枚ずつ保存するのが手間/);
  assert.equal(effortPages[4].id, 'value-batch-save', 'effort choice brings batch-save value page first');
  assert.equal(effortPages[5].id, 'value-ad-clean');

  const formatPages = buildOnboardingPages({ painPoint: 'format' });
  assert.match(formatPages[2].heading, /形式やフォルダ整理で困る/);
  assert.equal(formatPages[4].id, 'value-format-folder', 'format choice brings format/folder value page first');

  const unsurePages = buildOnboardingPages({ painPoint: 'unsure' });
  assert.equal(unsurePages[2].heading, 'まだ決まっていなくて大丈夫です', 'escape hatch uses a gentle non-assertive declaration');

  for (const card of TRIAL_CARDS) {
    const withTrial = buildOnboardingPages({ trialCard: card.id });
    assert.equal(withTrial[9].autoAdvance, true, 'trial operation page auto-advances');
    assert.match(withTrial[10].subtext, new RegExp(card.label), 'trial result page reflects chosen mini card');
  }
});

test('window dots show at most 5 dots, move every page without compression, and mark outside edges', () => {
  const total = 13;
  let prevActivePage = -1;
  for (let current = 0; current < total; current++) {
    const info = computeWindowDots(current, total);
    assert.equal(info.windowSize, 5, 'at most 5 dots are visible at once');
    assert.equal(info.dots.length, 5);
    const activeDots = info.dots.filter(d => d.role === 'active');
    assert.equal(activeDots.length, 1, 'exactly 1 dot is active');
    assert.equal(activeDots[0].pageIndex, current, 'active dot advances on every single page');
    assert.notEqual(activeDots[0].pageIndex, prevActivePage);
    prevActivePage = activeDots[0].pageIndex;

    if (current >= 3) {
      assert.equal(info.hasPrevOutside, true);
      assert.equal(info.dots[0].role, 'edge', 'leftmost dot shrinks when earlier pages exist outside window');
    }
    if (current <= total - 4) {
      assert.equal(info.hasNextOutside, true);
      assert.equal(info.dots[4].role, 'edge', 'rightmost dot shrinks when more pages exist ahead');
    }
  }
  const finalInfo = computeWindowDots(total - 1, total);
  assert.equal(finalInfo.isComplete, true, 'final page marks window dots complete');
  assert.equal(finalInfo.dots[4].role, 'active', 'final page active dot sits at the right end of the window');
});

test('praise catalog has >=3 phrases per tier and never repeats consecutively', () => {
  for (const tier of ['small', 'medium', 'large']) {
    assert.ok(PRAISE_CATALOG[tier].length >= 3, `${tier} tier has at least 3 praise variations`);
    let lastState = {};
    let previousText = '';
    for (let i = 0; i < 6; i++) {
      const { text, nextLast } = pickPraise(tier, lastState);
      assert.ok(text.length > 0);
      assert.notEqual(text, previousText, `praise in ${tier} does not repeat consecutively`);
      previousText = text;
      lastState = nextLast;
    }
  }
});

test('onboarding state persists currentPage, answers, and completion version separately', () => {
  const storage = createMemoryStorage();
  assert.equal(shouldAutoShowOnboarding({ storage, webdriver: false }), true, 'auto-shows on first launch');

  saveOnboardingState({
    currentPage: 4,
    answers: { painPoint: 'effort', trialCard: 'illust' },
    completed: true,
    lastPraiseByTier: { small: 'a', medium: 'b', large: 'c' },
  }, storage);

  const loaded = loadOnboardingState(storage);
  assert.equal(loaded.version, ONBOARDING_VERSION);
  assert.equal(loaded.currentPage, 4);
  assert.equal(loaded.answers.painPoint, 'effort');
  assert.equal(loaded.answers.trialCard, 'illust');
  assert.equal(loaded.completed, true);
  assert.equal(shouldAutoShowOnboarding({ storage, webdriver: false }), false, 'does not auto-show once completed for current version');

  // Simulate version bump
  storage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({
    version: ONBOARDING_VERSION - 1,
    currentPage: 12,
    answers: { painPoint: 'noise' },
    completed: true,
  }));
  assert.equal(shouldAutoShowOnboarding({ storage, webdriver: false }), true, 're-shows when onboarding version changes');

  recordOnboardingEvent({ type: 'page_view', pageId: 'hook', pageIndex: 0 }, storage);
  const events = JSON.parse(storage.getItem(ONBOARDING_EVENTS_KEY));
  assert.equal(events.length, 1);
  assert.equal(events[0].pageId, 'hook');
});

test('haptics respect reduced-motion setting and navigator support', () => {
  const calls = [];
  const fakeNav = { vibrate: pattern => { calls.push(pattern); return true; } };
  assert.equal(triggerHaptic('small', { reducedMotion: true, navigatorObj: fakeNav }), false);
  assert.equal(calls.length, 0, 'does not vibrate when reduced motion is active');
  assert.equal(triggerHaptic('medium', { reducedMotion: false, navigatorObj: fakeNav }), true);
  assert.equal(calls.length, 1);
});
