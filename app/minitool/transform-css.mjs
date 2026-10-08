/** Build-only CSS compatibility pass for this Chinese, light-theme mini-tool.
 * Uses the project's existing PostCSS + Lightning CSS. Source coss components
 * remain untouched. Run after every Vite mini-tool build (before zipping).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import { transform } from 'lightningcss';

const here = path.dirname(fileURLToPath(import.meta.url));
const targets = { chrome: 61 << 16, ios_saf: (18 << 16) | (4 << 8) };
const isPseudo = (x, kind) => x.type === 'pseudo-class' && x.kind === kind;
const isDark = x => x.type === 'class' && x.name === 'dark';
const hasLang = s => s.some(x => isPseudo(x, 'lang') || x.selectors?.some(hasLang));
const hasDark = s => s.some(x => isDark(x) || x.selectors?.some(hasDark));
const pseudoLists = new Set(['is', 'where', 'any']);

/** Expand Tailwind's functional selector groups to Chrome-61 selectors.
 * This build only supports the application's actual zh-CN / LTR / light UI.
 * Dark and RTL variants are intentionally excluded, not mis-applied as defaults.
 */
function expandSelector(input) {
  let work = [[]];
  for (const original of input) {
    let part = original;
    if (part.type === 'pseudo-element' && ['backdrop', 'file-selector-button'].includes(part.kind)) return [];
    if (part.type === 'pseudo-class' && ['host', 'host-context'].includes(part.kind)) return [];
    if (isPseudo(part, 'custom') && ['host', '-moz-focusring'].includes(part.name)) return [];
    if (isPseudo(part, 'lang') || isDark(part)) return [];
    if (isPseudo(part, 'dir')) {
      if (part.direction === 'rtl') return [];
      continue;
    }
    if (isPseudo(part, 'focus-visible')) part = { ...part, kind: 'focus' };
    if (isPseudo(part, 'has')) {
      if (part.selectors?.length === 1 && part.selectors[0].length === 1 && isPseudo(part.selectors[0][0], 'focus')) {
        part = { type: 'pseudo-class', kind: 'focus-within' };
      } else return []; // Calendar parent styles have exact slot fallbacks below.
    }
    if (isPseudo(part, 'not')) {
      if (part.selectors?.some(hasLang) || part.selectors?.some(hasDark)) continue;
      const alternatives = part.selectors.flatMap(expandSelector);
      // These Tailwind "not-in" variants are not used by this app's active UI.
      // Preserve an exact calendar hover fallback in compat.css instead.
      if (alternatives.some(s => s.some(x => x.type === 'combinator'))) return [];
      const negations = alternatives.map(s => ({ ...part, selectors: [s] }));
      work = work.map(s => [...s, ...negations]);
      continue;
    }
    if (part.type === 'pseudo-class' && pseudoLists.has(part.kind)) {
      const options = part.selectors.flatMap(expandSelector);
      if (!options.length) return [];
      const expanded = [];
      for (const outer of work) {
        const split = outer.findLastIndex(x => x.type === 'combinator');
        const prefix = outer.slice(0, split + 1);
        const compound = outer.slice(split + 1);
        for (const inner of options) {
          const merged = [...prefix, ...inner];
          if (compound.length && merged.at(-1)?.type === 'universal') merged.pop();
          expanded.push([...merged, ...compound]);
        }
      }
      work = expanded;
      continue;
    }
    work = work.map(s => [...s, part]);
  }
  return work.map(selector => {
    const result = [];
    let compound = [];
    const flush = () => {
      const types = compound.filter(x => ['type', 'namespace'].includes(x.type));
      const normal = compound.filter(x => !['type', 'namespace', 'pseudo-element', 'universal'].includes(x.type));
      const pseudos = compound.filter(x => x.type === 'pseudo-element');
      if (!types.length && !normal.length && !pseudos.length && compound.length) types.push({ type: 'universal' });
      result.push(...types, ...normal, ...pseudos);
      compound = [];
    };
    for (const part of selector) {
      if (part.type === 'combinator') { flush(); result.push(part); }
      else compound.push(part);
    }
    flush();
    return result;
  });
}

function physicalDeclarations(root) {
  const maps = {
    'inset-inline-start': ['left'], 'inset-inline-end': ['right'],
    'inset-block-start': ['top'], 'inset-block-end': ['bottom'],
    'inset-inline': ['left', 'right'], 'inset-block': ['top', 'bottom'],
    'margin-inline': ['margin-left', 'margin-right'], 'margin-block': ['margin-top', 'margin-bottom'],
    'padding-inline': ['padding-left', 'padding-right'], 'padding-block': ['padding-top', 'padding-bottom'],
    'margin-inline-start': ['margin-left'], 'margin-inline-end': ['margin-right'],
    'padding-inline-start': ['padding-left'], 'padding-inline-end': ['padding-right'],
    'margin-block-start': ['margin-top'], 'margin-block-end': ['margin-bottom'],
    'padding-block-start': ['padding-top'], 'padding-block-end': ['padding-bottom'],
    'inline-size': ['width'], 'block-size': ['height'],
    'min-inline-size': ['min-width'], 'max-inline-size': ['max-width'],
    'min-block-size': ['min-height'], 'max-block-size': ['max-height'],
    'border-start-start-radius': ['border-top-left-radius'], 'border-start-end-radius': ['border-top-right-radius'],
    'border-end-start-radius': ['border-bottom-left-radius'], 'border-end-end-radius': ['border-bottom-right-radius']
  };
  root.walkDecls(d => {
    if (d.prop === 'inset') {
      const values = postcss.list.space(d.value);
      ['top', 'right', 'bottom', 'left'].forEach((prop, i) => d.cloneBefore({ prop, value: values[i] || values[i % 2] || values[0] }));
      d.remove();
    } else if (maps[d.prop]) {
      const values = postcss.list.space(d.value);
      maps[d.prop].forEach((prop, i) => d.cloneBefore({ prop, value: values[i] || values[0] }));
      d.remove();
    } else if (d.prop === 'gap') {
      d.cloneBefore({ prop: 'grid-gap' });
    } else if (d.prop === 'row-gap') {
      d.cloneBefore({ prop: 'grid-row-gap' });
    } else if (d.prop === 'column-gap') {
      d.cloneBefore({ prop: 'grid-column-gap' });
    } else if (d.prop === 'overflow' && d.value === 'clip') {
      d.value = 'hidden';
    } else if (d.prop === 'transition-property') {
      d.value = [...new Set(d.value.split(',').map(x => /^(scale|translate|rotate)$/.test(x.trim()) ? 'transform' : x.trim()))].join(', ');
    } else if (d.prop === 'overflow-wrap' && d.value === 'anywhere') {
      d.value = 'break-word';
    } else if (d.prop === 'scale' || d.prop === 'translate' || d.prop === 'rotate') {
      const p = d.prop;
      if (d.value === 'none') { d.remove(); return; }
      const values = postcss.list.space(d.value);
      d.prop = 'transform';
      d.value = p === 'rotate' ? `rotate(${d.value})`
        : p === 'translate' ? `translate(${values.slice(0, 2).join(', ')})`
        : `scale(${values.slice(0, 2).join(', ')})`;
    }
  });
}

export function transformMinitoolCss(inputPath, outputPath = inputPath) {
  const raw = fs.readFileSync(inputPath, 'utf8');
  if (raw.includes('MINITOOL_COMPAT_COMPLETE')) throw new Error('CSS is already transformed; rebuild Vite before rerunning.');
  const root = postcss.parse(raw, { from: inputPath });
  const defaults = new Map();
  root.walkAtRules('property', a => {
    const initial = a.nodes?.find(n => n.type === 'decl' && n.prop === 'initial-value');
    defaults.set(a.params, initial?.value || 'initial');
    a.remove();
  });
  root.walkAtRules('layer', a => {
    if (a.params === 'properties') {
      a.walkDecls(d => { if (!defaults.has(d.prop)) defaults.set(d.prop, d.value); });
      a.remove();
    } else if (a.nodes) a.replaceWith(a.nodes);
    else a.remove();
  });
  const init = postcss.rule({ selector: '*, ::before, ::after' });
  for (const [prop, value] of defaults) init.append({ prop, value });
  root.prepend(init);

  // Static theme aliases can be resolved without changing the app's dynamic
  // measurements, animation state, floating-ui variables, or calendar cells.
  const palette = new Map();
  root.walkRules(r => {
    if (r.selectors.some(s => s.trim() === ':root')) {
      r.walkDecls(d => {
        if (d.prop.startsWith('--color-') || /^--(?:accent|background|border|card|destructive|foreground|info|input|muted|popover|primary|ring|secondary|success|warning)(?:-foreground)?$/.test(d.prop)) palette.set(d.prop, d.value);
      });
    }
  });
  const resolve = (value, seen = new Set()) => value.replace(/var\((--[\w-]+)\)/g, (m, key) => {
    if (!palette.has(key) || seen.has(key)) return m;
    return resolve(palette.get(key), new Set([...seen, key]));
  });
  root.walkDecls(d => {
    d.value = resolve(d.value);
    // The only colored shadow variants actually used are primary/24 + shadow-xs.
    // They use the registered 100% alpha; per-shadow alpha is baked into other utilities.
    d.value = d.value.replace(/var\(--tw-shadow-alpha\)/g, '100%');
  });
  // Vite already creates color-support wrappers. Once aliases are resolved the
  // corresponding static mixes can be compiled into ordinary RGBA fallbacks.
  root.walkAtRules('supports', a => {
    if (/^\(color:\s*(?:color-mix|lab|oklab|oklch|color)\(/.test(a.params)) a.replaceWith(a.nodes);
  });
  physicalDeclarations(root);

  const compiled = transform({
    filename: path.basename(outputPath), code: Buffer.from(root.toString()),
    targets, minify: false, errorRecovery: false,
    visitor: {
      Selector(selector) { return expandSelector(selector); }
    }
  });
  if (compiled.warnings.length) throw new Error(JSON.stringify(compiled.warnings));
  // Keep Lightning CSS's supported color enhancements, then append only local
  // fallback declarations. Avoid a second compressor modernizing the baselines.
  const compat = fs.readFileSync(path.join(here, 'compat.css'), 'utf8');
  const output = `/* MINITOOL_COMPAT_COMPLETE: Chrome 61 baseline, light zh-CN UI. */\n${compiled.code.toString()}\n${compat}\n`;
  const finalRoot = postcss.parse(output);
  finalRoot.walkDecls(d => {
    // These exact layout functions are replaced by the local viewport/media
    // fallbacks above; do not leave invalid custom-property values in old engines.
    if (/(?<![\w-])(?:min|max|clamp)\(/.test(d.value) || d.prop === 'aspect-ratio') d.remove();
    if (d.prop === '--tw-ring-offset-width' && d.value === '0') d.value = '0px';
  });
  finalRoot.walkRules(r => { if (!r.selector || !r.nodes.length) r.remove(); });
  const unsupportedSelectors = [];
  finalRoot.walkRules(r => {
    if (/(^|[^\\]):(?:where|is|has|focus-visible)\b/.test(r.selector)) unsupportedSelectors.push(r.selector);
  });
  if (unsupportedSelectors.length) throw new Error(`Unlowered selectors: ${unsupportedSelectors.join('\n')}`);
  if (/@(?:layer|property)\b/.test(output)) throw new Error('Unflattened CSS layers or property registrations');
  const finalOutput = finalRoot.toString();
  // Parse the final artifact again after AST selector expansion. This catches
  // malformed compound selectors instead of relying on browsers to drop them.
  transform({ code: Buffer.from(finalOutput), targets, minify: false, errorRecovery: false });
  fs.writeFileSync(outputPath, finalOutput);
  return { inputBytes: Buffer.byteLength(raw), outputBytes: Buffer.byteLength(finalOutput), initializedProperties: defaults.size, warnings: [] };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const input = process.argv[2];
  if (!input) throw new Error('Usage: node minitool/transform-css.mjs INPUT.css [OUTPUT.css]');
  console.log(JSON.stringify(transformMinitoolCss(input, process.argv[3] || input), null, 2));
}
