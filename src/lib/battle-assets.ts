// A small session cache for short public battle clips. Never prefetch long music tracks.
const ready = new Map<string,string>();
export function preparedAudio(source:string) { return ready.get(source) ?? source; }
export function prepareBattleAudio(sources:string[]) {
  const controller=new AbortController();
  const queue=[...new Set(sources)].filter(source=>!ready.has(source));
  const work=async()=>{
    while(queue.length&&!controller.signal.aborted){
      const source=queue.shift()!;
      try{
        const response=await fetch(source,{signal:controller.signal,cache:'force-cache'});
        if(!response.ok)continue;
        const blob=await response.blob();
        if(controller.signal.aborted||ready.has(source))continue;
        if(ready.size>=64){const oldest=ready.keys().next().value!;URL.revokeObjectURL(ready.get(oldest)!);ready.delete(oldest);}
        ready.set(source,URL.createObjectURL(blob));
      }catch{ /* Preparation is optional; playback can retry the original URL. */ }
    }
  };
  void work();void work();
  return ()=>controller.abort();
}
