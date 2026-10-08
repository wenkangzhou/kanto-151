import 'server-only';
import {changeLearning,learningState, type LearningState} from '@/domain/learning';
import {ApiError,db,rpc} from './http';
type Stored={revision:number;state:Partial<LearningState>;serverNow:string};
export async function readLearning(childId:string) {
  const row=await rpc<Stored>('kanto_learning_read',{p_child_id:childId});
  return learningState(row.state);
}
export async function updateLearning(childId:string,deviceId:string,input:Record<string,unknown>,parent:boolean) {
  const {data,error}=await db().from('kanto_pokemon_collection').select('pokemon_id').eq('child_id',childId);
  if(error)throw new ApiError(503,'DATABASE','暂时无法读取伙伴。');
  for(let attempt=0;attempt<4;attempt++){
    const row=await rpc<Stored>('kanto_learning_read',{p_child_id:childId});
    let state:LearningState;
    try{state=changeLearning(learningState(row.state),input,data.map(p=>p.pokemon_id),parent,Date.parse(row.serverNow));}
    catch(error){throw new ApiError(409,'LEARNING',error instanceof Error?error.message:'请重试。');}
    if(await rpc<boolean>('kanto_device_learning_save',{p_child_id:childId,p_device_id:deviceId,p_expected:row.revision,p_state:state,p_parent:parent}))return state;
  }
  throw new ApiError(409,'LEARNING_CHANGED','另一台设备正在学习，请重试。');
}
