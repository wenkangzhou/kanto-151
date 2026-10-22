import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
const values=new Set(),templates=new Set();const han=/[\u3400-\u9fff]/;
function walk(dir){for(const f of fs.readdirSync(dir)){const p=path.join(dir,f);if(p.includes('/i18n'))continue;if(fs.statSync(p).isDirectory())walk(p);else if(/\.(tsx?|json)$/.test(f)&&!p.includes('voice-index')&&!p.includes('provenance')){
 if(f.endsWith('.json')){function strings(o){if(typeof o==='string'&&han.test(o))values.add(o);else if(o&&typeof o==='object')Object.values(o).forEach(strings)}strings(JSON.parse(fs.readFileSync(p,'utf8')));continue;}
 const sf=ts.createSourceFile(p,fs.readFileSync(p,'utf8'),ts.ScriptTarget.Latest,true);function visit(n){
 if((ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n)||ts.isJsxText(n))&&han.test(n.text))values.add(n.text.trim());
 if(ts.isTemplateExpression(n)){const value=n.head.text+n.templateSpans.map((s,i)=>`{${i}}`+s.literal.text).join('');if(/[\u3400-\u9fff，。]/.test(value)){values.add(value);templates.add(value);}}
 ts.forEachChild(n,visit);}visit(sf);
}}}walk('src');
fs.writeFileSync('src/lib/i18n/zh-catalog.json',JSON.stringify([...values].sort(),null,2)+'\n');fs.writeFileSync('src/lib/i18n/templates.json',JSON.stringify([...templates].sort(),null,2)+'\n');console.log(values.size,'strings',templates.size,'templates');
