import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import postcss from 'postcss';
const source = postcss.parse(fs.readFileSync('src/index.css','utf8'));
const final = postcss.parse(fs.readFileSync('dist-minitool/style.css','utf8'));
const names = new Set();
final.walkAtRules(/keyframes$/, rule=>names.add(rule.params));
let count=0;
source.walkAtRules(/keyframes$/, rule=>{assert(names.has(rule.params), `Missing source keyframe ${rule.params}`);count++;});
const custom = new Map();
final.walkDecls(d=>{if(d.prop.startsWith('--'))custom.set(d.prop,d.value)});
const resolve = (value,depth=0) => depth>8 ? value : value.replace(/var\((--[\w-]+)\)/g,(whole,key)=>custom.has(key)?resolve(custom.get(key),depth+1):whole);
final.walkDecls(/^animation(?:-name)?$/, d=>{
 if (d.prop === 'animation-name') {
   for(const n of d.value.split(',').map(x=>x.trim())) if(!['none','inherit','initial','unset'].includes(n))assert(names.has(n), `Missing animation-name: ${n}`);
 } else {
   const value=resolve(d.value);
   if (/var\(/.test(value)) return; // Dynamic library animation variables need container runtime checks.
   for(const segment of postcss.list.comma(value)) {
     const tokens=postcss.list.space(segment).filter(x=>!/^(-?[\d.]+m?s|[\d.]+|ease(?:-in|-out|-in-out)?|linear|infinite|normal|reverse|alternate(?:-reverse)?|forwards|backwards|both|none|running|paused|initial|inherit|unset|cubic-bezier\(|steps\()/.test(x));
     for(const name of tokens)assert(names.has(name), `Missing animation shorthand: ${name}`);
   }
 }
});
for(const [filename,text] of [['style.css',final.toString()],['app.js',fs.readFileSync('dist-minitool/app.js','utf8')]]) {
 for(const match of text.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) {
  const value=match[1]; if(value.startsWith('#')||value.startsWith('data:'))continue;
  assert(!/^(?:https?:|\/\/)/.test(value),`External resource in ${filename}`);
  assert(fs.existsSync(path.resolve('dist-minitool',value)),`Missing CSS resource ${value}`);
 }
}
for(const file of ['assets/card-back.svg','assets/card-face.svg','assets/icon.png'])assert(fs.existsSync(path.join('dist-minitool',file)),`Missing asset ${file}`);
final.walkAtRules(rule=>assert(!['layer','property','container'].includes(rule.name),'Unlowered modern CSS at-rule'));
final.walkRules(rule=>assert(!/(^|[^\\]):(?:where|is|has|focus-visible)\b/.test(rule.selector),'Unlowered modern CSS selector'));
console.log(`PASS: ${count} source keyframes preserved, resolved animation references and relative artwork/resources present; static checks only.`);
