import {changeLearning,type LearningState} from '../domain/learning';
export type LearningReply=LearningState & {syncScope?:string};
type Action=Record<string,unknown>;
export type LearningView={data:LearningState|null;pending:number;syncing:boolean;error:string};
type Journal={read:(scope:string)=>Action[];put:(scope:string,event:Action)=>void;remove:(scope:string,event:Action)=>void};
// Shared across route mounts. Only server-created lessons can be practiced locally.
export class LearningSession {
 private scope='';
 private base:LearningState|null=null;
 private events:Action[]=[];
 private flight:Promise<void>|null=null;
 private timer:ReturnType<typeof setTimeout>|undefined;
 private disposed=false;
 private listeners=new Set<()=>void>();
 private view:LearningView={data:null,pending:0,syncing:false,error:''};
 constructor(private request:(body?:Action)=>Promise<LearningReply>,private journal:Journal){}
 getSnapshot=()=>this.view;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
 dispose(){this.disposed=true;if(this.timer)clearTimeout(this.timer);this.view={data:null,pending:0,syncing:false,error:''};this.listeners.forEach(fn=>fn());}
 private publish(error='',syncing=!!this.flight){
  if(this.disposed)return;
  let data=this.base;
  try{if(data)for(const event of this.events)data=changeLearning(data,event,[]);}catch{error='另一处的学习进度已变化，本机记录仍保留，请重试同步。';}
  this.view={data,pending:this.events.length,syncing,error};this.listeners.forEach(fn=>fn());
 }
 async load(){
  if(this.flight)await this.flight;
  if(this.events.length){await this.flush();return;}
  const task=(async()=>{
   try{const result=await this.request();if(this.disposed)return;if(!result.syncScope)throw Error('请刷新页面后重试。');
    this.scope=result.syncScope;this.base=result;this.events=this.journal.read(this.scope);this.publish();
   }catch(e){this.publish(e instanceof Error?e.message:'暂时无法读取学习手帐。');}
  })();
  this.flight=task;await task;this.flight=null;this.publish(this.view.error,false);
  if(this.events.length)this.schedule();
 }
 apply(event:Action){
  if(this.disposed||!this.view.data||!this.scope)throw Error('请先打开学习手帐。');
  if(this.events.length>=100)throw Error('本机记录待同步，请连接网络后重试。');
  const next=changeLearning(this.view.data,event,[]);
  // Persist before showing success, so a refresh cannot lose an acknowledged answer.
  this.journal.put(this.scope,event);this.events.push(event);this.publish();
  if(next.active?.finishedAt)void this.flush();else this.schedule();
  return next;
 }
 private schedule(){if(!this.timer)this.timer=setTimeout(()=>{this.timer=undefined;void this.flush();},8000);}
 async flush():Promise<void>{
  if(this.disposed)return;
  if(this.timer){clearTimeout(this.timer);this.timer=undefined;}
  if(this.flight){await this.flight;if(this.events.length&&!this.view.error)return this.flush();return;}
  if(!this.events.length)return;
  const task=(async()=>{
   try{
    while(this.events.length){
     const batch=this.events.slice(0,20);
     const result=await this.request({action:'batch',requestId:crypto.randomUUID(),syncScope:this.scope,events:batch});
     if(this.disposed)return;
     // The server replays inputs atomically; retries reuse individual request IDs.
     this.base=result;
     for(const event of batch)this.journal.remove(this.scope,event);
     this.events=this.events.slice(batch.length);this.publish();
    }
   }catch(e){this.publish(e instanceof Error?e.message:'记录已保存在本机，联网后继续同步。');}
  })();
  this.flight=task;this.publish();await task;this.flight=null;this.publish(this.view.error,false);
 }
 async start(event:Action){
  if(this.disposed)throw Error('设备已变化，请重新打开学习手帐。');
  if(this.view.data?.active&&!this.view.data.active.finishedAt){this.schedule();return this.view.data;}
  await this.flush();
  if(this.events.length)throw Error('上一轮记录已保存在本机，请先同步后再开始新一轮。');
  const result=await this.request(event);this.base=result;this.publish();return result;
 }
}
