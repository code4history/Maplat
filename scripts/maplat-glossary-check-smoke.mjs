#!/usr/bin/env node
// MaplatEditor の scripts/editor-glossary-check-smoke.mjs（commit 19a563970230179f9c28bcbe41470c01d1f9c982）を手本に、Maplat の正本と locale に合わせて作り直した fixture。
// 照合・例外・関門・構造・生成物の場合を確かめる。手本の CI 実行器・判定器（scripts/ci/*）の場合は Maplat に無いので除いた。
// Maplat の用語集検査を、実データを壊さず一時ディレクトリの fixture で回帰検証する。
// 使い方: node scripts/maplat-glossary-check-smoke.mjs
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checker = path.join(root, 'scripts', 'maplat-glossary-check.mjs');
const LANGS = ['de', 'en', 'es', 'fr', 'id', 'ja', 'ko', 'th', 'vi', 'zh', 'zh-TW'];
let failures = 0;
let passes = 0;
function check(name, ok, detail = '') {
  if (ok) {
    passes += 1;
    console.log(`ok   ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL ${name}${detail ? `\n     ${detail}` : ''}`);
  }
}

const tmpRoots = [];
function tmp(prefix) {
  const dir = mkdtempSync(path.join(process.env.TMPDIR || tmpdir(), `maplat-glossary-${prefix}-`));
  tmpRoots.push(dir);
  return dir;
}
const env = { ...process.env };
delete env.MAPLAT_GLOSSARY_BASE;
delete env.GITHUB_STEP_SUMMARY;
function git(dir, ...args) {
  const r = spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8', env: { ...env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.invalid', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.invalid' } });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const writeJson = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const localePath = (dir, lang) => path.join(dir, 'assets', 'locales', lang, 'translation.json');

function makeRepo(prefix, { withGlossary = true } = {}) {
  const dir = tmp(prefix);
  mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  cpSync(path.join(root, 'assets', 'locales'), path.join(dir, 'assets', 'locales'), { recursive: true });
  cpSync(checker, path.join(dir, 'scripts', 'maplat-glossary-check.mjs'));
  if (withGlossary) cpSync(path.join(root, 'docs', 'i18n'), path.join(dir, 'docs', 'i18n'), { recursive: true });
  writeJson(path.join(dir, 'package.json'), { name: 'fixture', private: true, scripts: { 'smoke:maplat-glossary': 'node scripts/maplat-glossary-check.mjs', 'smoke:maplat-glossary-fixtures': 'node scripts/maplat-glossary-check-smoke.mjs' } });
  mkdirSync(path.join(dir, '.github', 'workflows'), { recursive: true });
  writeFileSync(path.join(dir, '.github', 'workflows', 'ci.yml'), 'name: CI\n');
  git(dir, 'init', '-q', '-b', 'master');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'base');
  return dir;
}
function commitAll(dir, msg) {
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '--allow-empty', '-m', msg);
  return git(dir, 'rev-parse', 'HEAD');
}
function setValue(dir, lang, dotted, value) {
  const file = localePath(dir, lang);
  const data = readJson(file);
  const parts = dotted.split('.');
  let node = data;
  for (const p of parts.slice(0, -1)) node = node[p] ??= {};
  if (value === undefined) delete node[parts.at(-1)];
  else node[parts.at(-1)] = value;
  writeJson(file, data);
}
function editGlossary(dir, fn) {
  const file = path.join(dir, 'docs', 'i18n', 'maplat-glossary.json');
  const value = readJson(file);
  fn(value);
  writeJson(file, value);
}
function editExceptions(dir, fn) {
  const file = path.join(dir, 'docs', 'i18n', 'maplat-glossary.exceptions.json');
  const value = readJson(file);
  fn(value);
  writeJson(file, value);
}
function run(dir, args = [], extraEnv = {}) {
  const report = path.join(tmp('report'), 'report.json');
  const r = spawnSync(process.execPath, [path.join(dir, 'scripts', 'maplat-glossary-check.mjs'), '--report', report, ...args], { encoding: 'utf8', env: { ...env, ...extraEnv } });
  let rep;
  try {
    rep = readJson(report);
  } catch {
    rep = null;
  }
  return { status: r.status, out: `${r.stdout}${r.stderr}`, report: rep };
}
const findings = (r, pred) => (r.report?.violations ?? []).filter(pred);
const summarize = (r) => `exit=${r.status} ${r.out.split('\n').slice(-12).join(' | ')}`;

try {
  {
    const r = run(root);
    check('実物: 検査が緑', r.status === 0 && r.report?.violations?.length === 0, summarize(r));
    check('実物: 警告が無い', r.report?.warnings?.length === 0, JSON.stringify(r.report?.warnings));
    check('実物: 生成物が再生成と一致', !findings(r, (v) => v.kind === 'generated').length, summarize(r));
  }

  const mod = await import(pathToFileURL(checker).href);
  const { glossary } = mod.loadCanonical(root);
  const evaluate = (values) => {
    const full = {};
    for (const l of LANGS) full[l] = values[l] ?? values.en;
    return mod.evaluateKey(glossary, full, 'fixture.key');
  };
  const has = (res, cid) => Object.prototype.hasOwnProperty.call(res.bindings, cid);
  const langFindings = (res, cid, lang) => res.findings.filter((f) => f.concept === cid && f.lang === lang);
  {
    const res = evaluate({ en: 'Show map information', ja: '地図情報表示', de: 'Karteninformationen anzeigen' });
    check('照合: de の複合語 Karteninformationen は map を満たす', has(res, 'map') && langFindings(res, 'map', 'de').length === 0, JSON.stringify(res.findings));
    const res2 = evaluate({ en: 'Show the base map', ja: 'ベースマップを表示' });
    check('照合: base map は map の錨から外す', !has(res2, 'map'), JSON.stringify(res2.bindings));
    const res3 = evaluate({ en: 'Show marker', ja: 'マーカー表示', id: 'Tampilkan penanda' });
    check('照合: id の penanda は marker を満たす', has(res3, 'marker') && langFindings(res3, 'marker', 'id').length === 0, JSON.stringify(res3.findings));
  }
  {
    const dir = makeRepo('former');
    editGlossary(dir, (g) => { g.concepts.find((c) => c.id === 'attribution').locales.de.formerForms = ['attribution']; });
    setValue(dir, 'de', 'html.dataAttr', 'Attribution');
    run(dir, ['--write']);
    const r = run(dir);
    check('統一前の形: de Attribution を例外なしで赤にする', r.status === 1 && findings(r, (v) => v.lang === 'de' && v.key === 'html.dataAttr' && v.kind === 'former').length === 1, summarize(r));
  }
  {
    const dir = makeRepo('anchor');
    editExceptions(dir, (e) => {
      if (!e.exceptions.length) e.exceptions.push({ type: 'anchorExclusion', concept: 'attribution', key: 'html.dataAttr', ja: 'データ帰属', en: 'Data attribution', reason: 'fixture' });
    });
    run(dir, ['--write']);
    const green = run(dir);
    check('例外: ja・en の全文一致で錨を外せる', green.status === 0, summarize(green));
    setValue(dir, 'ja', 'html.dataAttr', 'データの帰属');
    const red = run(dir);
    check('例外: 記録した文が変わると失効する', red.status === 1 && (red.report?.warnings ?? []).some((w) => w.kind === 'unused-exception'), summarize(red));
  }
  {
    const dir = makeRepo('required');
    setValue(dir, 'de', 'control.marker_list', 'Liste');
    const r = run(dir);
    check('必須形: 結び付いたキーで marker を欠くと赤', findings(r, (v) => v.lang === 'de' && v.key === 'control.marker_list' && v.kind === 'required').length === 1, summarize(r));
  }
  {
    const dir = makeRepo('representative');
    setValue(dir, 'ja', 'control.info', '情報表示');
    const r = run(dir);
    check('代表語: 根拠キーから map を消すと赤', findings(r, (v) => v.lang === 'ja' && v.key === 'control.info' && v.kind === 'representative').length === 1, summarize(r));
  }
  {
    const dir = makeRepo('omission');
    editExceptions(dir, (e) => e.exceptions.push({ type: 'omission', concept: 'marker', locale: 'de', key: 'control.marker_list', value: 'Liste', reason: 'fixture' }));
    setValue(dir, 'de', 'control.marker_list', 'Liste');
    run(dir, ['--write']);
    const r = run(dir);
    check('例外: omission は全文一致の必須形だけを抑える', r.status === 1 && !findings(r, (v) => v.key === 'control.marker_list' && v.kind === 'required').length && findings(r, (v) => v.key === 'control.marker_list' && v.kind === 'representative').length === 1, summarize(r));
  }
  {
    const dir = makeRepo('gate-glossary-only');
    const base = git(dir, 'rev-parse', 'HEAD');
    editGlossary(dir, (g) => g.concepts.find((c) => c.id === 'map').locales.de.acceptedForms.push('landkarte'));
    run(dir, ['--write']);
    commitAll(dir, 'glossary');
    const r = run(dir, ['--base', base]);
    check('関門: 正本だけの変更は緑で要約が出る', r.status === 0 && /landkarte/.test(r.report?.glossaryChangeSummary ?? ''), summarize(r));
  }
  {
    const dir = makeRepo('gate-locale-only');
    const base = git(dir, 'rev-parse', 'HEAD');
    setValue(dir, 'de', 'control.info', 'Karteninformationen!');
    run(dir, ['--write']);
    commitAll(dir, 'locale');
    const r = run(dir, ['--base', base]);
    check('関門: locale と生成物だけの変更は緑', r.status === 0 && !r.report?.glossaryChangeSummary, summarize(r));
  }
  {
    const dir = makeRepo('gate-both');
    const base = git(dir, 'rev-parse', 'HEAD');
    setValue(dir, 'de', 'control.info', 'Karteninformationen!');
    editGlossary(dir, (g) => g.concepts.find((c) => c.id === 'map').locales.de.acceptedForms.push('landkarte'));
    run(dir, ['--write']);
    commitAll(dir, 'both');
    const r = run(dir, ['--base', base]);
    check('関門: 正本と locale の同時変更は赤', r.status === 1 && findings(r, (v) => v.kind === 'gate').length === 1, summarize(r));
    const r2 = run(dir, ['--base', 'f'.repeat(40)]);
    check('関門: base を解決できなければ fail-closed', r2.status === 1, summarize(r2));
  }
  {
    const dir = makeRepo('gate-first', { withGlossary: false });
    const base = git(dir, 'rev-parse', 'HEAD');
    cpSync(path.join(root, 'docs', 'i18n'), path.join(dir, 'docs', 'i18n'), { recursive: true });
    setValue(dir, 'de', 'control.info', 'Karteninformationen!');
    run(dir, ['--write']);
    commitAll(dir, 'first');
    const r = run(dir, ['--base', base]);
    check('関門: base に正本が無い初版は関門 1 をかけない', r.status === 0 && findings(r, (v) => v.kind === 'gate').length === 0, summarize(r));
  }
  for (const [label, mutate] of [
    ['package.json の検査 script', (dir) => { const f = path.join(dir, 'package.json'); const p = readJson(f); delete p.scripts['smoke:maplat-glossary']; writeJson(f, p); }],
    ['検査を動かす workflow', (dir) => writeFileSync(path.join(dir, '.github', 'workflows', 'ci.yml'), 'name: CI\non: workflow_dispatch\n')],
    ['検査 script', (dir) => writeFileSync(path.join(dir, 'scripts', 'maplat-glossary-check.mjs'), `${readFileSync(path.join(dir, 'scripts', 'maplat-glossary-check.mjs'), 'utf8')}\n// fixture\n`)],
  ]) {
    const dir = makeRepo('gate-runner');
    const base = git(dir, 'rev-parse', 'HEAD');
    mutate(dir);
    setValue(dir, 'de', 'control.info', 'Karteninformationen!');
    run(dir, ['--write']);
    commitAll(dir, 'runner and locale');
    const r = run(dir, ['--base', base]);
    check(`関門: ${label} と locale の同時変更は赤`, r.status === 1 && findings(r, (v) => v.kind === 'gate').length === 1, summarize(r));
  }
  {
    const dir = makeRepo('two-step');
    const base = git(dir, 'rev-parse', 'HEAD');
    const key = 'html.fixture_marker';
    editExceptions(dir, (e) => e.exceptions.push({ type: 'untranslated', concept: 'marker', locale: 'ko', key, value: 'Show marker', reason: 'fixture' }));
    run(dir, ['--write']);
    const first = commitAll(dir, 'glossary first');
    const r1 = run(dir, ['--base', base]);
    check('2 段: まだ無いキーの例外は pending-key の警告で緑', r1.status === 0 && (r1.report?.warnings ?? []).some((w) => w.kind === 'pending-key' && w.key === key), summarize(r1));
    const values = { de: 'Marker anzeigen', en: 'Show marker', es: 'Mostrar marcador', fr: 'Afficher le marqueur', id: 'Tampilkan penanda', ja: 'マーカー表示', ko: 'Show marker', th: 'แสดงหมุด', vi: 'Hiển thị điểm đánh dấu', zh: '显示标记', 'zh-TW': '顯示標記' };
    for (const l of LANGS) setValue(dir, l, key, values[l]);
    run(dir, ['--write']);
    commitAll(dir, 'locale second');
    const r2 = run(dir, ['--base', first]);
    check('2 段: 後の locale で例外が使われて緑', r2.status === 0 && !(r2.report?.warnings ?? []).some((w) => w.key === key), summarize(r2));
  }
  {
    const dir = makeRepo('missing-lang');
    rmSync(path.join(dir, 'assets', 'locales', 'th'), { recursive: true });
    const r = run(dir);
    check('構造: 11 言語の脱落は赤', r.status === 1 && findings(r, (v) => v.kind === 'structure' && /th/.test(v.message ?? '')).length > 0, summarize(r));
  }
  {
    const dir = makeRepo('dup-key');
    const file = localePath(dir, 'de');
    writeFileSync(file, readFileSync(file, 'utf8').replace(/^\{\n/, '{\n  "control": {},\n'));
    const r = run(dir);
    check('構造: locale の重複キーは赤', r.status === 1 && findings(r, (v) => v.kind === 'structure' && /duplicate/i.test(v.message ?? '')).length > 0, summarize(r));
  }
  {
    const dir = makeRepo('non-string');
    setValue(dir, 'fr', 'control.info', 42);
    const r = run(dir);
    check('構造: 文字列でない leaf は赤', r.status === 1 && findings(r, (v) => v.kind === 'structure' && /control\.info/.test(v.message ?? '')).length > 0, summarize(r));
  }
  {
    const dir = makeRepo('schema');
    editGlossary(dir, (g) => g.concepts.find((c) => c.id === 'map').locales.de.acceptedForms.push(''));
    const r = run(dir);
    check('構造: 正本の空語は赤', r.status === 1 && findings(r, (v) => v.kind === 'structure' && /空の文字列/.test(v.message ?? '')).length > 0, summarize(r));
    const dir2 = makeRepo('concept-dup');
    editGlossary(dir2, (g) => g.concepts.push({ ...g.concepts[0] }));
    const r2 = run(dir2);
    check('構造: 概念 ID の重複は赤', r2.status === 1 && findings(r2, (v) => v.kind === 'structure' && /概念 ID の重複/.test(v.message ?? '')).length > 0, summarize(r2));
    const dir3 = makeRepo('exception-glob');
    editExceptions(dir3, (e) => e.exceptions.push({ type: 'omission', concept: 'map', locale: 'de', key: 'control.*', value: 'x', reason: 'fixture' }));
    const r3 = run(dir3);
    check('構造: glob の例外は赤', r3.status === 1 && findings(r3, (v) => v.kind === 'structure' && /glob/.test(v.message ?? '')).length > 0, summarize(r3));
  }
  {
    const dir = makeRepo('stale');
    const file = path.join(dir, 'docs', 'i18n', 'maplat-glossary.md');
    writeFileSync(file, `${readFileSync(file, 'utf8')}\n手で足した行\n`);
    const r = run(dir);
    check('生成物: 手編集の古さは赤', r.status === 1 && findings(r, (v) => v.kind === 'generated').length === 1, summarize(r));
    run(dir, ['--write']);
    const r2 = run(dir);
    check('生成物: --write は生成物だけを更新', r2.status === 0 && git(dir, 'status', '--porcelain').split('\n').filter(Boolean).every((l) => !/locales|maplat-glossary\.json|exceptions/.test(l)), summarize(r2));
  }
} finally {
  for (const d of tmpRoots) rmSync(d, { recursive: true, force: true });
}

console.log(`\nmaplat-glossary fixtures: ${passes} passed, ${failures} failed`);
if (failures) process.exit(1);
