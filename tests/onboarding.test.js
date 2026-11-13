import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ONBOARDING_VERSION, WORRIES, PRAISE,
  buildPages, valueOrder, matchFor, closingLineFor,
  praiseFor, windowDots, parseStored, shouldShowOnboarding, serializeState,
} from '../extension/onboarding.js';

const ANSWERS = [null, 'ads', 'compare', 'save', 'unknown'];

test('every page carries exactly one non-empty headline claim for every answer', () => {
  for (const answer of ANSWERS) {
    const pages = buildPages(answer);
    assert.equal(pages.length, 14, `answer=${answer}`);
    const ids = new Set();
    for (const page of pages) {
      assert.equal(typeof page.headline, 'string');
      assert.ok(page.headline.trim().length > 0, `${page.id} headline`);
      assert.ok(!ids.has(page.id), `duplicate page id ${page.id}`);
      ids.add(page.id);
    }
  }
});

test('the basic flow is exactly three steps, in order', () => {
  const steps = buildPages(null).filter((page) => page.role === 'ステップ');
  assert.deepEqual(steps.map((page) => page.headline), ['1. 開く', '2. 選ぶ', '3. 保存する']);
});

test('the question page comes before its match page, and the match echoes the chosen words', () => {
  const pages = buildPages('ads');
  const questionIndex = pages.findIndex((page) => page.id === 'question');
  const matchIndex = pages.findIndex((page) => page.id === 'match');
  assert.ok(questionIndex >= 0 && matchIndex === questionIndex + 1);
  const match = matchFor('ads');
  assert.ok(match.headline.includes(WORRIES[0].label), 'chosen words are echoed back');
  assert.ok(match.sub.includes('広告'), 'one root strength is named');
  assert.ok(!/必ず|絶対に|誰でも/.test(match.headline + match.sub), 'no guaranteed outcomes');
});

test('the unknown answer gets a non-assertive match and the escape worry exists', () => {
  assert.ok(WORRIES.some((worry) => worry.id === 'unknown'));
  assert.equal(WORRIES.length, 4);
  const match = matchFor('unknown');
  assert.ok(match.headline.includes('大丈夫'));
  assert.ok(!match.headline.includes('ぴったり'));
});

test('value pages reorder so the value matching the worry leads', () => {
  assert.deepEqual(valueOrder('ads'), ['ads', 'compare', 'bulk']);
  assert.deepEqual(valueOrder('save'), ['bulk', 'compare', 'ads']);
  assert.deepEqual(valueOrder('compare'), ['compare', 'ads', 'bulk']);
  assert.deepEqual(valueOrder(null), ['compare', 'ads', 'bulk']);
  const values = buildPages('save').filter((page) => page.role === '価値');
  assert.equal(values[0].id, 'value-bulk');
  assert.equal(values.length, 3);
});

test('the closing page speaks to the chosen worry', () => {
  assert.ok(closingLineFor('ads').includes('広告'));
  assert.ok(closingLineFor(null).includes('最初の1枚'));
});

test('praise has at least three variants per stage and never repeats back-to-back', () => {
  for (const stage of ['small', 'medium', 'large']) {
    assert.ok(PRAISE[stage].length >= 3, stage);
    const first = praiseFor(stage, -1, () => 0);
    const second = praiseFor(stage, first.index, () => 0);
    assert.notEqual(second.index, first.index);
    assert.equal(second.text, PRAISE[stage][second.index]);
  }
});

test('window dots show at most five, always include the current page, and move every turn', () => {
  const total = 14;
  let previousFirst = null;
  for (let current = 0; current < total; current += 1) {
    const dots = windowDots(total, current);
    assert.ok(dots.length <= 5, `current=${current}`);
    assert.ok(dots.some((dot) => dot.active && dot.page === current), `current=${current} is active`);
    assert.equal(dots.filter((dot) => dot.active).length, 1);
    if (previousFirst !== null && current > 2) assert.ok(dots[0].page >= previousFirst, 'window never slides backwards');
    previousFirst = dots[0].page;
  }
  assert.deepEqual(windowDots(3, 1).length, 3, 'short flows show all dots');
  assert.deepEqual(windowDots(0, 0), []);
});

test('stored state round-trips and stale versions are ignored', () => {
  const saved = serializeState({ done: true, skipped: false, answer: 'ads' });
  assert.equal(saved.version, ONBOARDING_VERSION);
  assert.deepEqual(parseStored(saved), saved);
  assert.equal(parseStored({ ...saved, version: ONBOARDING_VERSION + 99 }), null);
  assert.equal(parseStored(null), null);
  assert.equal(parseStored('nope'), null);
  assert.equal(shouldShowOnboarding(null), true);
  assert.equal(shouldShowOnboarding(parseStored(saved)), false);
  assert.equal(shouldShowOnboarding(parseStored(serializeState({ done: false }))), true);
});
