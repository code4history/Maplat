#!/usr/bin/env node
// MaplatEditor の scripts/editor-glossary-check.mjs（commit 19a563970230179f9c28bcbe41470c01d1f9c982）からの写し。直すときは手本と見比べる。
// 論理は手本のまま。Maplat に合わせて変えたのは、ファイルの置き場所・名前・環境変数・正本側の一覧（下の定数のまとまり）と、
// 文言の「エディタ UI」→「Maplat UI」・parity の担当だけ。規則の説明は AGENTS.md の「UI Wording & Glossary」と
// 手本 MaplatEditor の検査（同じ規則）にある。
// Maplat UI の全言語用語集（docs/i18n/maplat-glossary.json）による locale の検査。Node の標準ライブラリだけで動く。
//
// 使い方:
//   node scripts/maplat-glossary-check.mjs                 検査だけ（何も書かない）
//   node scripts/maplat-glossary-check.mjs --write         生成物（bindings.json・md）だけを書き直してから検査する
//   node scripts/maplat-glossary-check.mjs --report <path> 結果を JSON で書き出す
//   node scripts/maplat-glossary-check.mjs --base <sha>    関門 1・2（正本側と locale の分離・正本の差分の要約）。環境変数 MAPLAT_GLOSSARY_BASE でも渡せる
//   --root <dir> で対象のリポジトリ直下を替えられる（既定はこの script の 1 つ上）
//
// 順序（手本 MaplatEditor の検査と同じ）: (0) 関門 (1) 構造・11 言語 (2) parity は spec/locales.spec.ts に任せる (3) 結び付けと錨
//             (4) 禁止形 (5) 必須形 (6) 例外の使用状況 (7) 生成物の一致 (8) 代表語 (9) 正本の差分の要約
// locale と正本は書き換えない（自動修正はしない）。違反があれば exit 1。
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const GLOSSARY = 'docs/i18n/maplat-glossary.json';
export const EXCEPTIONS = 'docs/i18n/maplat-glossary.exceptions.json';
export const SCHEMA = 'docs/i18n/maplat-glossary.schema.json';
export const BINDINGS = 'docs/i18n/maplat-glossary.bindings.json';
export const MARKDOWN = 'docs/i18n/maplat-glossary.md';
export const SELF = 'scripts/maplat-glossary-check.mjs';
/**
 * 関門 1 の「正本側」（AGENTS.md の guarded side）。生成物は入れない。検査を外せるファイル（検査を動かす workflow）も同じ扱いにする。
 * package.json は検査の script（GATED_SCRIPTS）を変えたときだけ正本側に数える。
 * Maplat には手本の実行器・判定器・除外表（scripts/ci/*・ci/test-exclusions.json）が無く、CI が直接この script を呼ぶ
 */
export const CANONICAL_SIDE = [
  GLOSSARY,
  EXCEPTIONS,
  SCHEMA,
  SELF,
  'scripts/maplat-glossary-check-smoke.mjs',
  '.github/workflows/ci.yml',
];
export const GATED_SCRIPTS = ['smoke:maplat-glossary', 'smoke:maplat-glossary-fixtures'];
const LOCALE_SIDE = /^assets\/locales\/[^/]+\/translation\.json$/;

// ───────────────────────────── 重複キーを拒否する JSON の読み取り ─────────────────────────────
/** JSON.parse と同じ値を返す。ただし同じオブジェクトの中のキーの重複を失敗にする */
export function parseJsonStrict(text, file = '<json>') {
  let pos = 0;
  const fail = (msg) => {
    const line = text.slice(0, pos).split('\n').length;
    throw new Error(`${file}:${line}: ${msg}`);
  };
  const ws = () => {
    while (pos < text.length && ' \t\n\r'.includes(text[pos])) pos += 1;
  };
  const str = () => {
    const start = pos;
    pos += 1;
    while (pos < text.length && text[pos] !== '"') pos += text[pos] === '\\' ? 2 : 1;
    if (pos >= text.length) fail('unterminated string');
    pos += 1;
    return JSON.parse(text.slice(start, pos));
  };
  const value = (pathStr) => {
    ws();
    const ch = text[pos];
    if (ch === '{') {
      pos += 1;
      const obj = {};
      const seen = new Set();
      ws();
      if (text[pos] === '}') {
        pos += 1;
        return obj;
      }
      for (;;) {
        ws();
        if (text[pos] !== '"') fail('expected string key');
        const key = str();
        if (seen.has(key)) fail(`duplicate key: ${pathStr}${key}`);
        seen.add(key);
        ws();
        if (text[pos] !== ':') fail('expected :');
        pos += 1;
        obj[key] = value(`${pathStr}${key}.`);
        ws();
        if (text[pos] === ',') {
          pos += 1;
          continue;
        }
        if (text[pos] === '}') {
          pos += 1;
          return obj;
        }
        fail('expected , or }');
      }
    }
    if (ch === '[') {
      pos += 1;
      const arr = [];
      ws();
      if (text[pos] === ']') {
        pos += 1;
        return arr;
      }
      for (;;) {
        arr.push(value(`${pathStr}${arr.length}.`));
        ws();
        if (text[pos] === ',') {
          pos += 1;
          continue;
        }
        if (text[pos] === ']') {
          pos += 1;
          return arr;
        }
        fail('expected , or ]');
      }
    }
    if (ch === '"') return str();
    const m = /^(?:-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)/.exec(text.slice(pos));
    if (!m) fail('unexpected token');
    pos += m[0].length;
    return JSON.parse(m[0]);
  };
  const v = value('');
  ws();
  if (pos !== text.length) fail('trailing characters');
  return v;
}

// ───────────────────────────── JSON Schema（使う部分だけ） ─────────────────────────────
/** draft 2020-12 の部分集合（type・required・properties・additionalProperties・propertyNames・items・enum・const・minItems・minLength・uniqueItems・$ref）で検査する */
export function validateSchema(schema, value, rootSchema = schema, at = '$') {
  const errors = [];
  const resolve = (s) => {
    let cur = s;
    while (cur && cur.$ref) {
      const parts = cur.$ref.replace(/^#\//, '').split('/');
      cur = parts.reduce((o, p) => o?.[p], rootSchema);
      if (!cur) throw new Error(`schema: $ref を解決できない: ${s.$ref}`);
    }
    return cur;
  };
  const walk = (s0, v, where) => {
    const s = resolve(s0);
    const typeOf = (x) => (Array.isArray(x) ? 'array' : x === null ? 'null' : Number.isInteger(x) ? 'integer' : typeof x);
    if (s.type) {
      const t = typeOf(v);
      const types = Array.isArray(s.type) ? s.type : [s.type];
      if (!types.includes(t) && !(t === 'integer' && types.includes('number'))) {
        errors.push(`${where}: 型が ${types.join('|')} ではない（${t}）`);
        return;
      }
    }
    if (s.enum && !s.enum.includes(v)) errors.push(`${where}: ${JSON.stringify(v)} は ${s.enum.join(', ')} のどれでもない`);
    if ('const' in s && s.const !== v) errors.push(`${where}: ${JSON.stringify(s.const)} でなければならない`);
    if (typeof v === 'string' && s.minLength !== undefined && [...v].length < s.minLength) errors.push(`${where}: 空の文字列`);
    if (Array.isArray(v)) {
      if (s.minItems !== undefined && v.length < s.minItems) errors.push(`${where}: 空の配列`);
      if (s.uniqueItems) {
        const seen = new Set();
        for (const x of v) {
          const k = typeof x === 'string' ? x.toLowerCase() : JSON.stringify(x);
          if (seen.has(k)) errors.push(`${where}: 重複: ${JSON.stringify(x)}`);
          seen.add(k);
        }
      }
      if (s.items) v.forEach((x, i) => walk(s.items, x, `${where}[${i}]`));
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const r of s.required ?? []) if (!(r in v)) errors.push(`${where}: ${r} が無い`);
      for (const [k, x] of Object.entries(v)) {
        if (s.propertyNames) {
          const pn = resolve(s.propertyNames);
          if (pn.enum && !pn.enum.includes(k)) errors.push(`${where}: 未知のキー ${k}`);
        }
        if (s.properties?.[k]) walk(s.properties[k], x, `${where}.${k}`);
        else if (s.additionalProperties === false) errors.push(`${where}: 未知のキー ${k}`);
        else if (s.additionalProperties && typeof s.additionalProperties === 'object') walk(s.additionalProperties, x, `${where}.${k}`);
      }
    }
  };
  walk(schema, value, at);
  return errors;
}

// ───────────────────────────── 照合 ─────────────────────────────
const WORD = '[\\p{L}\\p{M}\\p{N}_]';
const ID_PREFIX = ['', 'di', 'me', 'mem', 'men', 'meng', 'meny', 'pe', 'pem', 'pen', 'peng', 'peny', 'ber', 'ter', 'ke', 'se'];
const ID_SUFFIX = ['', 'kan', 'an', 'i', 'nya', 'lah', 'annya', 'kannya'];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const fold = (s) => s.toLowerCase();
const tokens = (s) => s.match(/[\p{L}\p{M}\p{N}_]+/gu) ?? [];
const reCache = new Map();
function re(src, flags = 'u') {
  const k = `${flags}\u0000${src}`;
  if (!reCache.has(k)) reCache.set(k, new RegExp(src, flags));
  return reCache.get(k);
}

/** 1 つの形が値に当たるか。mode: substring / word / compound / affix */
export function matchForm(mode, value, form) {
  if (mode === 'substring') return value.includes(form);
  const v = fold(value);
  const f = fold(form);
  const multi = f.includes(' ') || f.includes('-');
  if (mode === 'affix' && multi) {
    const suf = `(?:${ID_SUFFIX.filter(Boolean).join('|')})?`;
    return re(`(?<!${WORD})${esc(f)}${suf}(?!${WORD})`).test(v);
  }
  if (mode === 'word' || multi) return re(`(?<!${WORD})${esc(f)}(?!${WORD})`).test(v);
  if (mode === 'compound') return tokens(v).some((t) => t.includes(f));
  if (mode === 'affix') return tokens(v).some((t) => ID_PREFIX.some((p) => t.startsWith(p) && ID_SUFFIX.some((s) => t === p + f + s)));
  throw new Error(`未知の照合モード: ${mode}`);
}

/** 禁止形・統一前の形の照合モード。de・id でも compound・affix にせず word で照合する */
const strictMode = (mode) => (mode === 'compound' || mode === 'affix' ? 'word' : mode);

const stripNoise = (v) => v.replace(/\{\{[^}]*\}\}/g, ' ').replace(/https?:\/\/\S+/g, ' ');

function applyExclusions(v, list) {
  let out = v;
  for (const e of [...list].sort((a, b) => b.text.length - a.text.length)) {
    out = e.caseSensitive ? out.split(e.text).join(' ') : out.replace(re(esc(e.text), 'giu'), ' ');
  }
  return out;
}

/** 長い許容形・当たった語を伏せる（許容形が禁止形を含む場合。例 th「แอปพลิเคชัน」⊃「แอป」） */
function mask(mode, v, forms) {
  let out = v;
  for (const f of [...forms].sort((a, b) => b.length - a.length)) {
    out = mode === 'substring' ? out.split(f).join(' ') : out.replace(re(esc(f), 'giu'), ' ');
  }
  return out;
}

// ───────────────────────────── 正本の読み取り ─────────────────────────────
function readJsonFile(file, label, errors) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (e) {
    errors.push(`${label} を読めない: ${e.code ?? e.message}`);
    return null;
  }
  try {
    return parseJsonStrict(text, label);
  } catch (e) {
    errors.push(e.message);
    return null;
  }
}

/** 正本・例外・schema を読む。errors は構造の不備（1 件でもあれば赤） */
export function loadCanonical(root) {
  const errors = [];
  const glossary = readJsonFile(path.join(root, GLOSSARY), GLOSSARY, errors);
  const exceptionsFile = readJsonFile(path.join(root, EXCEPTIONS), EXCEPTIONS, errors);
  const schema = readJsonFile(path.join(root, SCHEMA), SCHEMA, errors);
  if (schema && glossary) errors.push(...validateSchema(schema.$defs.glossary, glossary, schema, GLOSSARY));
  if (schema && exceptionsFile) errors.push(...validateSchema(schema.$defs.exceptions, exceptionsFile, schema, EXCEPTIONS));
  return { glossary, exceptions: exceptionsFile?.exceptions ?? [], errors };
}

/**
 * 正本の意味の整合。schema で書けないものだけ。
 * 例外・additionalBindings のキーがまだ locale に無いのは不備にせず、pending（警告）に積む（AGENTS.md の 2 段の手順: 正本だけの PR で
 * 新しいキーの例外を先に足し、後の locale の PR でキーを足す）
 */
export function validateSemantics(glossary, exceptions, keys, pending = []) {
  const errors = [];
  const langs = new Set(glossary.locales);
  const ids = new Set();
  const ruleIds = new Set();
  for (const c of glossary.concepts) {
    if (ids.has(c.id)) errors.push(`概念 ID の重複: ${c.id}`);
    ids.add(c.id);
    if (!keys.has(c.rootKey)) errors.push(`${c.id}: rootKey ${c.rootKey} が locale に無い`);
    for (const l of c.requiredLocales) {
      if (!langs.has(l)) errors.push(`${c.id}: requiredLocales に未知の言語 ${l}`);
      if (!c.locales[l]) errors.push(`${c.id}: requiredLocales の ${l} に locales の項目が無い`);
    }
    for (const [l, e] of Object.entries(c.locales)) {
      if (!langs.has(l)) errors.push(`${c.id}: 未知の言語 ${l}`);
      if (e.rootKey && !keys.has(e.rootKey)) errors.push(`${c.id}/${l}: rootKey ${e.rootKey} が locale に無い`);
      const acc = new Set(e.acceptedForms.map(fold));
      if (!acc.has(fold(e.preferred))) errors.push(`${c.id}/${l}: 代表語 ${e.preferred} が acceptedForms に無い`);
      for (const f of [...(e.formerForms ?? []), ...(e.forbidden ?? []).map((x) => x.literal)]) {
        if (acc.has(fold(f))) errors.push(`${c.id}/${l}: 許容形と禁止形・統一前の形が重なる: ${f}`);
      }
      for (const fb of e.forbidden ?? []) {
        if (ruleIds.has(fb.ruleId)) errors.push(`ruleId の重複: ${fb.ruleId}`);
        ruleIds.add(fb.ruleId);
      }
    }
    for (const l of Object.keys(c.excludePhrases ?? {})) if (l !== '*' && !langs.has(l)) errors.push(`${c.id}: excludePhrases に未知の言語 ${l}`);
    for (const k of c.additionalBindings ?? []) if (!keys.has(k)) pending.push({ kind: 'pending-key', type: 'additionalBindings', concept: c.id, lang: '-', key: k, message: 'キーがまだ locale に無い（locale の PR で足す）' });
  }
  for (const s of glossary.sharedForms ?? []) {
    for (const cid of s.concepts) if (!ids.has(cid)) errors.push(`sharedForms: 未知の概念 ${cid}`);
    if (!langs.has(s.locale) || !langs.has(s.decideBy)) errors.push(`sharedForms: 未知の言語 ${s.locale}/${s.decideBy}`);
  }
  const seen = new Set();
  for (const x of exceptions) {
    const id = `${x.type}|${x.concept}|${x.locale ?? ''}|${x.key}`;
    const dup = JSON.stringify([id, x.type === 'anchorExclusion' ? [x.ja, x.en] : x.value ?? '']);
    if (seen.has(dup)) errors.push(`例外の重複: ${id}（記録した文まで同じ）`);
    seen.add(dup);
    if (!ids.has(x.concept)) errors.push(`例外: 未知の概念 ${x.concept}（${x.key}）`);
    if (/[*?]/.test(x.key)) errors.push(`例外: glob は使えない: ${x.key}`);
    else if (!keys.has(x.key)) pending.push({ kind: 'pending-key', type: x.type, concept: x.concept, lang: x.locale ?? '-', key: x.key, message: 'キーがまだ locale に無い例外（locale の PR で足す）' });
    if (x.type === 'anchorExclusion') {
      if (typeof x.ja !== 'string' || typeof x.en !== 'string' || 'locale' in x || 'value' in x) errors.push(`例外: anchorExclusion は ja と en の全文だけを持つ（${x.concept} ${x.key}）`);
    } else {
      if (!langs.has(x.locale)) errors.push(`例外: 未知の言語 ${x.locale}（${x.key}）`);
      if (typeof x.value !== 'string' || 'ja' in x || 'en' in x) errors.push(`例外: ${x.type} は言語の全文 value だけを持つ（${x.concept} ${x.locale} ${x.key}）`);
    }
  }
  return errors;
}

// ───────────────────────────── locale の読み取り ─────────────────────────────
function flatten(obj, prefix, out, errors, lang) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out, errors, lang);
    else if (typeof v === 'string') out.set(key, v.normalize('NFC'));
    else errors.push(`${lang}: 文字列でない leaf: ${key}`);
  }
}

export function loadLocales(root, langs) {
  const errors = [];
  const dir = path.join(root, 'assets', 'locales');
  let present = [];
  try {
    present = readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  } catch (e) {
    errors.push(`assets/locales を読めない: ${e.code ?? e.message}`);
  }
  const want = [...langs].sort();
  for (const l of want) if (!present.includes(l)) errors.push(`言語ディレクトリが無い: ${l}`);
  for (const l of present) if (!want.includes(l)) errors.push(`正本に無い言語ディレクトリ: ${l}`);
  const values = {};
  for (const l of langs) {
    values[l] = new Map();
    const file = path.join(dir, l, 'translation.json');
    if (!existsSync(file)) continue;
    const data = readJsonFile(file, `assets/locales/${l}/translation.json`, errors);
    if (data) flatten(data, '', values[l], errors, l);
  }
  return { values, errors };
}

// ───────────────────────────── 結び付けと判定 ─────────────────────────────
function conceptIndex(glossary) {
  const byId = new Map(glossary.concepts.map((c) => [c.id, c]));
  const excl = (c, l) => [...(c.excludePhrases?.['*'] ?? []), ...(c.excludePhrases?.[l] ?? [])];
  const modeOf = (l) => glossary.matchModes[l];
  const allForms = (c, l) => {
    const e = c.locales[l];
    if (!e) return [];
    return [...e.acceptedForms, ...(e.formerForms ?? []), ...(e.forbidden ?? []).map((x) => x.literal)];
  };
  const anchorForms = (c, l) => {
    if ((c.anchors?.disabled ?? []).includes(l)) return [];
    const not = new Set(c.anchors?.notAnchor?.[l] ?? []);
    return allForms(c, l).filter((f) => !not.has(f));
  };
  return { byId, excl, modeOf, allForms, anchorForms };
}

function screenRole(role, ja) {
  if ((role.jaPhrases ?? []).some((p) => ja.includes(p))) return true;
  const lab = role.jaLabel;
  if (!lab) return false;
  return [...ja].length <= lab.maxLength && ja.endsWith(lab.suffix) && !(lab.unless ?? []).some((u) => ja.includes(u));
}

/** 役割（正本の roles）。strict な役割に当たればその名前、当たらなければ strict でない役割 */
function roleOf(c, ja) {
  if (!c.roles) return null;
  const entries = Object.entries(c.roles);
  for (const [name, r] of entries) if (r.strict && screenRole(r, ja)) return name;
  const weak = entries.find(([, r]) => !r.strict);
  return weak ? weak[0] : null;
}

/**
 * 1 キーを判定する。values は {lang: 値}（NFC 済み）。
 * 返り値: bindings {概念: {by, role?, sharedForm?}}、findings（違反）、suppressed（例外で抑えた行）、usedExceptions（使った例外の添字）
 */
export function evaluateKey(glossary, values, key, exceptions = [], exIndex = indexExceptions(exceptions)) {
  const ix = conceptIndex(glossary);
  const findings = [];
  const used = new Set();
  const suppressed = [];
  const prepared = (c, l) => applyExclusions(stripNoise(values[l] ?? ''), ix.excl(c, l));

  // 結び付け: ja（substring）・en（word）の錨
  const bind = new Map();
  const add = (cid, by, extra = {}) => {
    const b = bind.get(cid) ?? { by: new Set() };
    b.by.add(by);
    Object.assign(b, extra);
    bind.set(cid, b);
  };
  for (const c of glossary.concepts) {
    for (const l of ['ja', 'en']) {
      const v = prepared(c, l);
      if (ix.anchorForms(c, l).some((f) => matchForm(ix.modeOf(l), v, f))) add(c.id, l);
    }
    if ((c.additionalBindings ?? []).includes(key)) add(c.id, 'manual');
  }
  // 共有形（正本の sharedForms）: 指定した言語の値で振り分ける
  for (const s of glossary.sharedForms ?? []) {
    const cs = s.concepts.map((id) => ix.byId.get(id));
    const v = applyExclusions(stripNoise(values[s.locale] ?? ''), cs.flatMap((c) => ix.excl(c, s.locale)));
    const form = s.forms.find((f) => matchForm(ix.modeOf(s.locale), v, f));
    if (!form) continue;
    const decided = cs.filter((c) => {
      const e = c.locales[s.decideBy];
      if (!e) return false;
      const forms = [...e.acceptedForms, ...(e.formerForms ?? [])].filter((f) => !s.forms.includes(f));
      return forms.some((f) => matchForm(ix.modeOf(s.decideBy), prepared(c, s.decideBy), f));
    });
    const targets = decided;
    if (!targets.length) {
      // 錨の除外（キー×ja・en の全文）は、共有形の錨にも効く（別の概念の語として外す）
      const excluded = s.concepts.flatMap((cid) => exIndex.anchor.get(`${cid}|${key}`) ?? []).filter((i) => exceptions[i].ja === values.ja && exceptions[i].en === values.en);
      if (excluded.length) {
        excluded.forEach((i) => used.add(i));
        continue;
      }
      findings.push({ kind: 'shared', lang: s.decideBy, key, concept: s.concepts.join('/'), ruleId: `shared.${s.locale}.${s.forms[0]}`, hit: form, preferred: s.concepts.join(' / '), message: `${s.locale}「${form}」があるのに ${s.decideBy} にどちらの概念の語も無い` });
      continue;
    }
    for (const c of targets) add(c.id, `shared:${s.locale}:${s.forms[0]}`, { sharedForm: `${s.locale}:${s.forms[0]}` });
  }
  // 錨の除外（キー×ja・en の全文）
  for (const [cid] of [...bind]) {
    const hitIdx = exIndex.anchor.get(`${cid}|${key}`) ?? [];
    for (const i of hitIdx) {
      const x = exceptions[i];
      if (x.ja === values.ja && x.en === values.en) {
        used.add(i);
        bind.delete(cid);
      }
    }
  }
  const bindings = {};
  for (const c of glossary.concepts) {
    const b = bind.get(c.id);
    if (!b) continue;
    const role = roleOf(c, values.ja ?? '');
    bindings[c.id] = { by: [...b.by].sort(), ...(role ? { role } : {}), ...(b.sharedForm ? { sharedForm: b.sharedForm } : {}) };
  }

  // 判定: 禁止形 → 統一前の形 → 許容形 → 未翻訳 → 省略
  for (const c of glossary.concepts) {
    const b = bindings[c.id];
    for (const l of glossary.locales) {
      const e = c.locales[l];
      const v0 = values[l] ?? '';
      const v = prepared(c, l);
      const mode = ix.modeOf(l);
      const { forbHits, formerHits, accepted } = judgeValue(e, mode, v, Boolean(b));
      for (const x of forbHits) findings.push({ kind: 'forbidden', lang: l, key, concept: c.id, ruleId: x.ruleId, hit: x.literal, preferred: x.alternative ?? e.preferred });
      if (!b) continue;
      for (const f of formerHits) findings.push({ kind: 'former', lang: l, key, concept: c.id, ruleId: `${c.id}.${l}.former`, hit: f, preferred: e.preferred });
      if (forbHits.length || formerHits.length || accepted) continue;
      const strict = b.role ? glossary.concepts.find((x) => x.id === c.id).roles[b.role].strict : true;
      if (!strict || !c.requiredLocales.includes(l)) continue;
      const cand = exIndex.lang.get(`${c.id}|${l}|${key}`) ?? [];
      const ok = cand.find((i) => {
        const x = exceptions[i];
        if (x.value !== v0) return false;
        if (x.type === 'untranslated') return l !== 'en' && v0 === values.en;
        return x.type === 'omission';
      });
      if (ok !== undefined) {
        used.add(ok);
        suppressed.push({ type: exceptions[ok].type, lang: l, key, concept: c.id });
        continue;
      }
      findings.push({ kind: 'required', lang: l, key, concept: c.id, ruleId: `${c.id}.${l}.required`, hit: '-', preferred: e?.preferred ?? '-' });
    }
  }
  return { bindings, findings, suppressed, usedExceptions: used };
}

/**
 * 1 つの値を 1 概念・1 言語で照合する。bound=false なら全キー範囲（allKeys）の禁止形だけを見る。
 * 許容形が禁止形・統一前の形を含む場合は、長い許容形を先に伏せてから探す
 */
function judgeValue(e, mode, v, bound) {
  const forb = e?.forbidden ?? [];
  const former = bound ? (e?.formerForms ?? []) : [];
  const acc = e?.acceptedForms ?? [];
  const bad = [...forb.map((x) => x.literal), ...former];
  const vm = mask(mode, v, acc.filter((a) => bad.some((x) => fold(a).includes(fold(x)) && fold(a) !== fold(x))));
  const forbHits = forb.filter((x) => (x.scope === 'allKeys' || bound) && matchForm(strictMode(mode), vm, x.literal));
  const formerHits = former.filter((f) => matchForm(strictMode(mode), vm, f));
  const rest = mask(mode, v, [...forbHits.map((x) => x.literal), ...formerHits]);
  return { forbHits, formerHits, accepted: acc.some((a) => matchForm(mode, rest, a)) };
}

export function indexExceptions(exceptions) {
  const anchor = new Map();
  const lang = new Map();
  exceptions.forEach((x, i) => {
    const m = x.type === 'anchorExclusion' ? anchor : lang;
    const k = x.type === 'anchorExclusion' ? `${x.concept}|${x.key}` : `${x.concept}|${x.locale}|${x.key}`;
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(i);
  });
  return { anchor, lang };
}

/** 代表語の検査: 根拠キーの値がその概念の許容形を満たす */
function checkRepresentatives(glossary, values) {
  const ix = conceptIndex(glossary);
  const out = [];
  for (const c of glossary.concepts) {
    for (const l of c.requiredLocales) {
      const e = c.locales[l];
      if (!e) continue;
      const rk = e.rootKey ?? c.rootKey;
      const raw = values[l].get(rk);
      const j = judgeValue(e, ix.modeOf(l), applyExclusions(stripNoise(raw ?? ''), ix.excl(c, l)), true);
      const ok = raw !== undefined && j.accepted && !j.forbHits.length && !j.formerHits.length;
      if (!ok) out.push({ kind: 'representative', lang: l, key: rk, concept: c.id, ruleId: `${c.id}.${l}.representative`, hit: raw ?? '(none)', preferred: e.preferred });
    }
  }
  return out;
}

// ───────────────────────────── 生成物 ─────────────────────────────
function sortObject(o) {
  return Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
}

export function renderBindings(glossary, all) {
  const out = {};
  for (const c of glossary.concepts) out[c.id] = sortObject(all[c.id] ?? {});
  return `${JSON.stringify(out, null, 2)}\n`;
}

const md = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function renderMarkdown(glossary, exceptions, all) {
  const lines = [];
  lines.push('# Maplat UI 用語集（生成物）');
  lines.push('');
  lines.push('<!-- 生成物: 手で編集しない。`node scripts/maplat-glossary-check.mjs --write` で作り直す。正本は docs/i18n/maplat-glossary.json -->');
  lines.push('');
  lines.push('正本は `maplat-glossary.json`（概念・言語別の代表語・許容形・統一前の形・禁止形）と `maplat-glossary.exceptions.json`（例外）。');
  lines.push('検査は `node scripts/maplat-glossary-check.mjs`（`pnpm smoke:maplat-glossary`）。文言を設計する前に、ここで概念を探す。');
  lines.push('正本と locale は同じ PR で変えられない（初版を除く）。新しい語・例外は、先に正本だけの PR を合流させてから locale の PR を出す。');
  lines.push('まだ無いキーへの例外は、正本だけの PR の時点では警告（pending-key）になり、後の locale の PR でキーを足すと働く。手順は AGENTS.md の「UI Wording & Glossary」。');
  lines.push('');
  const counts = {};
  for (const x of exceptions) counts[x.type] = (counts[x.type] ?? 0) + 1;
  lines.push(`概念 ${glossary.concepts.length}・結び付いたキー ${new Set(Object.values(all).flatMap((b) => Object.keys(b))).size}・例外 ${exceptions.length}（${Object.entries(counts).sort().map(([k, v]) => `${k} ${v}`).join('・')}）`);
  lines.push('');
  lines.push('| 概念 | 説明 | 根拠キー | 結び付け |');
  lines.push('|---|---|---|---:|');
  for (const c of glossary.concepts) lines.push(`| [${c.id}](#${c.id}) | ${md(c.description)} | \`${c.rootKey}\` | ${Object.keys(all[c.id] ?? {}).length} |`);
  for (const c of glossary.concepts) {
    lines.push('');
    lines.push(`## ${c.id}`);
    lines.push('');
    lines.push(md(c.description));
    lines.push('');
    const roles = c.roles ? Object.entries(c.roles).map(([n, r]) => `${n}（${r.strict ? 'strict' : 'weak'}）`).join('・') : '';
    lines.push(`根拠キー \`${c.rootKey}\`。必須形を求める言語: ${c.requiredLocales.join(', ')}${roles ? `。役割: ${roles}` : ''}`);
    lines.push('');
    lines.push('| 言語 | 代表語 | 許容形 | 統一前の形 | 禁止形 | 除外語 |');
    lines.push('|---|---|---|---|---|---|');
    for (const l of glossary.locales) {
      const e = c.locales[l];
      const ex = [...(c.excludePhrases?.['*'] ?? []), ...(c.excludePhrases?.[l] ?? [])].map((x) => x.text);
      if (!e && !ex.length) continue;
      const forb = (e?.forbidden ?? []).map((x) => `${x.literal}${x.scope === 'allKeys' ? '（全キー）' : ''}`);
      lines.push(`| ${l} | ${md(e?.preferred ?? '—')} | ${md((e?.acceptedForms ?? []).join('、') || '—')} | ${md((e?.formerForms ?? []).join('、') || '—')} | ${md(forb.join('、') || '—')} | ${md(ex.join('、') || '—')} |`);
    }
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

// ───────────────────────────── 関門と差分の要約 ─────────────────────────────
function gitOut(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
function gitOk(root, args) {
  try {
    gitOut(root, args);
    return true;
  } catch {
    return false;
  }
}

const setDiff = (a, b) => [...a].filter((x) => !b.has(x));
function formsOf(c, field) {
  const out = new Map();
  for (const [l, e] of Object.entries(c?.locales ?? {})) {
    const v = field === 'forbidden' ? (e.forbidden ?? []).map((x) => x.literal) : (e[field] ?? []);
    for (const f of v) out.set(`${l}\u0000${f}`, [l, f]);
  }
  return out;
}

/** 正本の差分を「緩める変更」「締める変更」「その他の変更」に分ける */
export function diffCanonical(oldG, oldEx, newG, newEx) {
  const loosen = [];
  const tighten = [];
  const other = [];
  const oldC = new Map((oldG?.concepts ?? []).map((c) => [c.id, c]));
  const newC = new Map((newG?.concepts ?? []).map((c) => [c.id, c]));
  for (const id of setDiff(new Set(oldC.keys()), new Set(newC.keys()))) loosen.push(`概念を消した: ${id}`);
  for (const id of setDiff(new Set(newC.keys()), new Set(oldC.keys()))) tighten.push(`概念を足した: ${id}`);
  const pairDiff = (a, b, field, addTo, addLabel, delTo, delLabel, id) => {
    const A = formsOf(a, field);
    const B = formsOf(b, field);
    for (const k of setDiff(new Set(B.keys()), new Set(A.keys()))) addTo.push(`${addLabel} ${B.get(k)[0]} ${id}: ${B.get(k)[1]}`);
    for (const k of setDiff(new Set(A.keys()), new Set(B.keys()))) delTo.push(`${delLabel} ${A.get(k)[0]} ${id}: ${A.get(k)[1]}`);
  };
  const listDiff = (a, b, addTo, addLabel, delTo, delLabel) => {
    const A = new Set(a);
    const B = new Set(b);
    for (const x of setDiff(B, A)) addTo.push(`${addLabel}: ${x}`);
    for (const x of setDiff(A, B)) delTo.push(`${delLabel}: ${x}`);
  };
  for (const [id, b] of newC) {
    const a = oldC.get(id);
    if (!a) continue;
    pairDiff(a, b, 'acceptedForms', loosen, '許容形を足した', tighten, '許容形を外した', id);
    pairDiff(a, b, 'formerForms', tighten, '統一前の形を足した', loosen, '統一前の形を外した', id);
    pairDiff(a, b, 'forbidden', tighten, '禁止形を足した', loosen, '禁止形を外した', id);
    const ex = (c) => Object.entries(c.excludePhrases ?? {}).flatMap(([l, xs]) => xs.map((x) => `${l} ${id}: ${x.text}${x.caseSensitive ? '（大小を区別）' : ''}`));
    listDiff(ex(a), ex(b), loosen, '除外語を足した', tighten, '除外語を外した');
    const na = (c) => Object.entries(c.anchors?.notAnchor ?? {}).flatMap(([l, xs]) => xs.map((x) => `${l} ${id}: ${x}`)).concat((c.anchors?.disabled ?? []).map((l) => `${l} ${id}: （錨を使わない）`));
    listDiff(na(a), na(b), loosen, '錨から外した', tighten, '錨に戻した');
    listDiff((a.additionalBindings ?? []).map((k) => `${id}: ${k}`), (b.additionalBindings ?? []).map((k) => `${id}: ${k}`), loosen, 'additionalBindings を足した', tighten, 'additionalBindings を外した');
    listDiff(a.requiredLocales.map((l) => `${id}: ${l}`), b.requiredLocales.map((l) => `${id}: ${l}`), tighten, 'requiredLocales に足した', loosen, 'requiredLocales から外した');
    if (JSON.stringify(a.roles ?? null) !== JSON.stringify(b.roles ?? null)) other.push(`役割のパラメータを変えた: ${id}`);
    if (a.rootKey !== b.rootKey) other.push(`根拠キーを変えた: ${id}: ${a.rootKey} → ${b.rootKey}`);
    for (const l of new Set([...Object.keys(a.locales), ...Object.keys(b.locales)])) {
      if (a.locales[l]?.preferred !== b.locales[l]?.preferred) other.push(`代表語を変えた: ${l} ${id}: ${a.locales[l]?.preferred ?? '—'} → ${b.locales[l]?.preferred ?? '—'}`);
    }
  }
  if (JSON.stringify(oldG?.sharedForms ?? null) !== JSON.stringify(newG?.sharedForms ?? null)) other.push('sharedForms を変えた');
  if (JSON.stringify(oldG?.matchModes ?? null) !== JSON.stringify(newG?.matchModes ?? null)) other.push('matchModes を変えた');
  const exKey = (x) => `${x.type} ${x.concept} ${x.locale ?? '(ja+en)'} ${x.key} :: ${x.type === 'anchorExclusion' ? `ja=${x.ja} en=${x.en}` : x.value ?? ''}`;
  listDiff((oldEx ?? []).map(exKey), (newEx ?? []).map(exKey), loosen, '例外を足した', tighten, '例外を消した');
  return { loosen, tighten, other };
}

export function renderSummary(diff, changedCanonical) {
  const lines = ['<!-- maplat-glossary-summary -->', '## 用語集の正本の変更の要約', ''];
  lines.push(`変えた正本側のファイル: ${changedCanonical.map((f) => `\`${f}\``).join('、')}`);
  if (changedCanonical.includes(SELF)) lines.push('', '検査 script を変えた。検査が緩んでいないかを差分で確かめること。');
  const runners = changedCanonical.filter((f) => f !== SELF && ![GLOSSARY, EXCEPTIONS, SCHEMA].includes(f));
  if (runners.length) lines.push('', `検査を動かす側（${runners.map((f) => `\`${f}\`${f === 'package.json' ? ' の ' + GATED_SCRIPTS.join('・') : ''}`).join('、')}）を変えた。検査が外れていないかを差分で確かめること。`);
  const sec = (title, items) => {
    lines.push('', `### ${title}（${items.length} 件）`, '');
    if (!items.length) lines.push('なし');
    for (const x of items) lines.push(`- ${x}`);
  };
  sec('緩める変更', diff.loosen);
  sec('締める変更', diff.tighten);
  sec('その他の変更', diff.other);
  return `${lines.join('\n')}\n`;
}

/** 関門 1・2。返り値: { findings, summary, info } */
function runGate(root, base, current) {
  const out = { findings: [], summary: null, info: '' };
  if (!base) {
    out.info = 'base が無いので関門 1・2 を省いた（ローカルの実行）';
    return out;
  }
  if (/^0+$/.test(base)) {
    out.info = `base が ${base}（新しいブランチの push）なので関門 1・2 を省いた`;
    return out;
  }
  if (!gitOk(root, ['cat-file', '-e', `${base}^{commit}`])) {
    out.findings.push({ kind: 'gate', lang: '-', key: '-', concept: '-', ruleId: 'gate.base', hit: base, preferred: '-', message: `base ${base} を解決できない（checkout の fetch-depth を確かめる）` });
    return out;
  }
  const changed = gitOut(root, ['diff', '--name-only', base, 'HEAD']).split('\n').filter(Boolean);
  const canonical = changed.filter((f) => CANONICAL_SIDE.includes(f));
  if (changed.includes('package.json')) {
    const scriptsOf = (text) => {
      try {
        const s = JSON.parse(text).scripts ?? {};
        return JSON.stringify(GATED_SCRIPTS.map((n) => s[n] ?? null));
      } catch {
        return null;
      }
    };
    let baseText;
    try {
      baseText = gitOut(root, ['show', `${base}:package.json`]);
    } catch {
      baseText = '';
    }
    const headText = gitOut(root, ['show', 'HEAD:package.json']);
    if (scriptsOf(baseText) !== scriptsOf(headText)) canonical.push('package.json');
  }
  const locales = changed.filter((f) => LOCALE_SIDE.test(f));
  if (!gitOk(root, ['cat-file', '-e', `${base}:${GLOSSARY}`])) {
    out.info = `base ${base.slice(0, 12)} に正本が無い（初版 PR）ので関門 1 をかけない`;
    return out;
  }
  if (canonical.length && locales.length) {
    out.findings.push({ kind: 'gate', lang: '-', key: '-', concept: '-', ruleId: 'gate.canonical-and-locale', hit: `${canonical.join(',')} + ${locales.length} locale`, preferred: '正本だけの PR を先に合流させる', message: '正本側と locale を同じ PR で変えている（関門 1）' });
  }
  if (canonical.length) {
    const read = (file) => {
      try {
        return parseJsonStrict(gitOut(root, ['show', `${base}:${file}`]), `${base}:${file}`);
      } catch {
        return null;
      }
    };
    const diff = diffCanonical(read(GLOSSARY), read(EXCEPTIONS)?.exceptions ?? [], current.glossary, current.exceptions);
    out.summary = renderSummary(diff, canonical);
  }
  out.info = `base ${base.slice(0, 12)}: 変更 ${changed.length} ファイル（正本側 ${canonical.length}・locale ${locales.length}）`;
  return out;
}

// ───────────────────────────── 本体 ─────────────────────────────
export function runCheck({ root, write = false, base = null }) {
  const violations = [];
  const warnings = [];
  const structure = (message) => violations.push({ kind: 'structure', lang: '-', key: '-', concept: '-', ruleId: 'structure', hit: '-', preferred: '-', message });
  const canon = loadCanonical(root);
  canon.errors.forEach(structure);
  const langs = canon.glossary?.locales ?? [];
  const loc = loadLocales(root, langs.length ? langs : ['de', 'en', 'es', 'fr', 'id', 'ja', 'ko', 'th', 'vi', 'zh', 'zh-TW']);
  loc.errors.forEach(structure);
  const result = { violations, warnings, counts: {}, gate: null, glossaryChangeSummary: null };
  if (!canon.glossary || canon.errors.length) return result;
  const g = canon.glossary;
  const keys = new Set(loc.values.ja?.keys() ?? []);
  const pending = [];
  validateSemantics(g, canon.exceptions, keys, pending).forEach(structure);
  if (violations.length) return result;
  warnings.push(...pending);

  // (0) 関門・(9) 差分の要約
  const gate = runGate(root, base, canon);
  violations.push(...gate.findings);
  result.gate = { base, info: gate.info };
  result.glossaryChangeSummary = gate.summary;

  // (3)〜(6)
  const exIndex = indexExceptions(canon.exceptions);
  const used = new Set();
  const all = {};
  const suppressed = [];
  for (const key of [...keys].sort()) {
    const values = Object.fromEntries(langs.map((l) => [l, loc.values[l].get(key) ?? '']));
    const r = evaluateKey(g, values, key, canon.exceptions, exIndex);
    for (const [cid, b] of Object.entries(r.bindings)) (all[cid] ??= {})[key] = b;
    violations.push(...r.findings);
    suppressed.push(...r.suppressed);
    r.usedExceptions.forEach((i) => used.add(i));
  }
  canon.exceptions.forEach((x, i) => {
    if (!used.has(i) && keys.has(x.key)) warnings.push({ kind: 'unused-exception', type: x.type, concept: x.concept, lang: x.locale ?? '-', key: x.key, index: i, message: '違反を抑えなかった例外（消し待ちか locale の変更待ち。消すのは正本だけの PR で）' });
  });
  // (7) 生成物
  const genBindings = renderBindings(g, all);
  const genMd = renderMarkdown(g, canon.exceptions, all);
  for (const [rel, text] of [[BINDINGS, genBindings], [MARKDOWN, genMd]]) {
    const file = path.join(root, rel);
    if (write) writeFileSync(file, text);
    let cur;
    try {
      cur = readFileSync(file, 'utf8');
    } catch {
      cur = null;
    }
    if (cur !== text) violations.push({ kind: 'generated', lang: '-', key: rel, concept: '-', ruleId: 'generated.stale', hit: cur === null ? '(none)' : 'differs', preferred: '--write で作り直す', message: `${rel} が再生成と一致しない` });
  }
  // (8) 代表語
  violations.push(...checkRepresentatives(g, loc.values));

  const order = (v) => [v.kind === 'gate' || v.kind === 'structure' || v.kind === 'generated' ? 0 : 1, v.lang, v.key, v.concept, v.ruleId, v.hit].join('\u0000');
  violations.sort((a, b) => (order(a) < order(b) ? -1 : order(a) > order(b) ? 1 : 0));
  const byType = {};
  for (const s of suppressed) byType[s.type] = (byType[s.type] ?? 0) + 1;
  result.counts = {
    concepts: g.concepts.length,
    boundKeys: new Set(Object.values(all).flatMap((b) => Object.keys(b))).size,
    bindings: Object.fromEntries(g.concepts.map((c) => [c.id, Object.keys(all[c.id] ?? {}).length])),
    exceptions: canon.exceptions.length,
    exceptionsByType: canon.exceptions.reduce((o, x) => ({ ...o, [x.type]: (o[x.type] ?? 0) + 1 }), {}),
    suppressedByType: byType,
    representatives: g.concepts.reduce((n, c) => n + c.requiredLocales.length, 0),
  };
  return result;
}

function parseArgs(argv) {
  const opts = { write: false, report: null, base: process.env.MAPLAT_GLOSSARY_BASE || null, root: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--write') opts.write = true;
    else if (a === '--report' || a === '--base' || a === '--root') {
      const v = argv[i + 1];
      if (v === undefined) throw new Error(`${a} に値がありません`);
      opts[a.slice(2)] = v;
      i++;
    } else throw new Error(`不明な引数: ${a}`);
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const root = path.resolve(opts.root ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
  const r = runCheck({ root, write: opts.write, base: opts.base });
  for (const v of r.violations) {
    console.log(`${v.lang} ${v.key} ${v.concept} ${v.ruleId} ${v.hit} → ${v.preferred}${v.message ? `  # ${v.message}` : ''}`);
  }
  for (const w of r.warnings) console.log(`warning: ${w.kind} ${w.type} ${w.concept} ${w.lang} ${w.key}  # ${w.message}`);
  if (r.gate?.info) console.log(`gate: ${r.gate.info}`);
  if (r.glossaryChangeSummary) {
    console.log(r.glossaryChangeSummary);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${r.glossaryChangeSummary}\n`);
  }
  if (r.counts.concepts) {
    const c = r.counts;
    console.log(`concepts ${c.concepts}, bound keys ${c.boundKeys}, representatives ${c.representatives}, exceptions ${c.exceptions} (${Object.entries(c.exceptionsByType).map(([k, v]) => `${k} ${v}`).join(', ')})`);
  }
  console.log(`maplat-glossary: ${r.violations.length} violation(s), ${r.warnings.length} warning(s)`);
  if (opts.report) writeFileSync(opts.report, `${JSON.stringify({ ok: r.violations.length === 0, ...r }, null, 2)}\n`);
  process.exit(r.violations.length ? 1 : 0);
}

// symlink を経た起動（例 macOS の /var → /private/var）でも本体として動くよう、実体のパスで比べる
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(path.resolve(process.argv[1]))).href) main();
