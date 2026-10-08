import fs from 'node:fs';
import path from 'node:path';
import {parseSync} from 'rolldown/experimental';
const dir='dist-minitool';const issues=[];let nodeCount=0;
const unsupported=new Set(['ChainExpression','ImportExpression','ImportDeclaration','ExportNamedDeclaration','ExportDefaultDeclaration','ExportAllDeclaration','PrivateIdentifier','StaticBlock','PropertyDefinition']);
const bannedCalls=new Set(['fetch','eval','Function','XMLHttpRequest','WebSocket','EventSource','RTCPeerConnection','Worker','SharedWorker','Accelerometer','Gyroscope','Magnetometer','PaymentRequest']);
function visit(node,parent,filename){if(!node||typeof node!=='object')return;nodeCount++;
 if(unsupported.has(node.type)||node.type==='LogicalExpression'&&node.operator==='??'||node.type==='AssignmentExpression'&&['??=','&&=','||='].includes(node.operator)||node.type==='CatchClause'&&!node.param||node.type==='ForOfStatement'&&node.await||node.type==='SpreadElement'&&parent?.type==='ObjectExpression'||node.type==='Literal'&&node.bigint)issues.push(`${filename}: post-ES2017/module syntax ${node.type}`);
 if(node.type==='Literal'&&node.regex&&(/\(\?<|\\p\{|\\P\{/.test(node.regex.pattern)||/[sdv]/.test(node.regex.flags)))issues.push(`${filename}: newer regex feature`);
 if(['CallExpression','NewExpression'].includes(node.type)&&node.callee?.type==='Identifier'&&bannedCalls.has(node.callee.name))issues.push(`${filename}: forbidden call ${node.callee.name}`);
 if(node.type==='MemberExpression'&&node.object?.type==='Identifier'&&node.object.name==='navigator'&&['connection','geolocation','clipboard','bluetooth','usb','hid','serial','getBattery','credentials','locks','storage','serviceWorker'].includes(node.property?.name))issues.push(`${filename}: forbidden navigator.${node.property.name}`);
 for(const [key,value] of Object.entries(node)){if(key==='parent')continue;if(Array.isArray(value))value.forEach(v=>visit(v,node,filename));else if(value&&typeof value==='object')visit(value,node,filename)}
}
for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.js'))){const result=parseSync(name,fs.readFileSync(path.join(dir,name),'utf8'),{sourceType:'script'});issues.push(...result.errors.map(e=>`${name}: ${e.message}`));visit(result.program,null,name)}
const html=fs.readFileSync(`${dir}/index.html`,'utf8');
if(/type=["']module|<base\b|<iframe\b|<object\b|\son\w+=|http-equiv=["']Content-Security-Policy/i.test(html))issues.push('HTML violates static container rules');
for(const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(!/\bsrc=/.test(script[1])||script[2].trim())issues.push('inline script')}
for(const resource of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){if(!resource[1].startsWith('./')||!fs.existsSync(path.join(dir,resource[1])))issues.push(`bad/missing resource ${resource[1]}`)}
for(const f of fs.readdirSync(`${dir}/assets`))if(!/\.(svg|png|webp|jpe?g|gif)$/.test(f))issues.push(`unsupported asset ${f}`);
if(issues.length){console.error(issues.join('\n'));process.exit(1)}
console.log(`PASS: classic JS syntax/selected ES2017 AST checks (${nodeCount} nodes), forbidden calls, HTML CSP/path references.`);
console.log('AST checks supplement build target; no real Chrome 61 or platform acceptance implied.');
