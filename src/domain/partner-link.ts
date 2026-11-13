export function partnerFromQuery(value:string|readonly string[]|undefined):number|undefined {
 if(typeof value!=='string'||!/^[1-9]\d*$/.test(value))return undefined;
 const id=Number(value);
 return Number.isSafeInteger(id)?id:undefined;
}
export function moveFromQuery(value:string|readonly string[]|undefined):string|undefined {
 return typeof value==='string'&&/^[a-z0-9-]{1,80}$/.test(value)?value:undefined;
}
