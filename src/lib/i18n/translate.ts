import english from './en.json';
import narrations from './narrations.json';
import officialNames from './official-names.json';
import templateKeys from './templates.json';
export type Locale = 'zh' | 'en';
const dictionary: Record<string,string> = {...english,...officialNames,...narrations};
const escape=(text:string)=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const patterns=[...templateKeys].sort((a,b)=>b.replace(/\{\d+\}/g,'').length-a.replace(/\{\d+\}/g,'').length).map(key=>{
 const slots:number[]=[];let previous=0;let source='^';
 for(const match of key.matchAll(/\{(\d+)\}/g)){source+=escape(key.slice(previous,match.index))+'([\\s\\S]*?)';slots.push(Number(match[1]));previous=match.index!+match[0].length;}
 return {key,slots,regex:new RegExp(source+escape(key.slice(previous))+'$')};
});
export function translate<T>(value:T,locale:Locale):T {
 if(locale==='zh'||typeof value!=='string')return value;
 const text=value.trim();
 if(dictionary[text])return (value.replace(text,()=>dictionary[text])) as T;
 if(text.includes('、')){const parts=text.split('、');const translated=parts.map(part=>translate(part,'en'));if(translated.every(part=>!/[\u3400-\u9fff]/.test(part)))return translated.join(', ') as T;}
 for(const {key,slots,regex} of patterns){const match=regex.exec(text);if(!match||!dictionary[key])continue;
  const args:Record<number,string>={};slots.forEach((slot,index)=>{args[slot]=translate(match[index+1],'en');});
  return dictionary[key].replace(/\{(\d+)\}/g,(_,id)=>args[Number(id)]??'') as T;
 }
 return value;
}

/** Explicit arguments preserve user-authored names and keep word order correct. */
export function formatTranslation<T>(value:T,locale:Locale,args?:readonly (string|number)[]):T {
 const text=translate(value,locale);
 return args&&typeof text==='string'?text.replace(/\{(\d+)\}/g,(_,index)=>String(args[Number(index)]??'')) as T:text;
}
