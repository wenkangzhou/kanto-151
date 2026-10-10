'use client';
import {api} from './api-client';
import {isVisitorDemo} from './demo-mode';
import {LearningSession,type LearningReply} from './learning-session';
const sessions=new Map<string,LearningSession>();
let listening=false,sequence=0;
export function learningClient(){
 if(!listening){listening=true;const reset=()=>{sessions.forEach(session=>session.dispose());sessions.clear();};window.addEventListener('kanto-device-lost',reset);window.addEventListener('kanto-learning-reset',reset);}
 const mode=isVisitorDemo()?'demo':'live';
 let session=sessions.get(mode);
 if(!session){
  const storage=mode==='demo'?sessionStorage:localStorage;
  const prefix=(scope:string)=>`kanto-learning-events-v1:${mode}:${scope}:`;
  session=new LearningSession(body=>api<LearningReply>('learning',body,AbortSignal.timeout(20000)),{
   read(scope){const start=prefix(scope);const events=[];for(let i=0;i<storage.length;i++){const key=storage.key(i)!;if(key.startsWith(start)){const value=JSON.parse(storage.getItem(key)!);events.push(value);}}return events.sort((a,b)=>a.at-b.at).map(value=>value.event);},
   put(scope,event){try{storage.setItem(prefix(scope)+event.requestId,JSON.stringify({at:Date.now()*1000+(sequence++%1000),event}));}catch{throw Error('本机存储空间不足，暂时不能保存答题记录。');}},
   remove(scope,event){storage.removeItem(prefix(scope)+event.requestId);},
  });
  sessions.set(mode,session);
  const current=session;
  window.addEventListener('online',()=>void current.flush());
  window.addEventListener('pagehide',()=>void current.flush());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)void current.flush();});
 }
 return session;
}
