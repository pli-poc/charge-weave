export function evaluateRules(required,registry,context){
 return required.flatMap(ruleId=>{
  if(!Object.hasOwn(registry,ruleId)||typeof registry[ruleId]!=='function')return [{ruleId,message:'Required rule is unsupported'}];
  return registry[ruleId](context).map(v=>({ruleId,...v}));
 });
}
export function validateFields(fields,input){
 const violations=[];
 for(const key of Object.keys(input))if(!fields.some(f=>f.id===key))violations.push({field:key,message:'Unknown input'});
 for(const f of fields){const v=input[f.id];const s=String(v??'');let message;
  if(f.required&&!s.trim())message='Required value';
  else if(f.minLength&&s.trim().length<f.minLength)message=`Minimum ${f.minLength} characters`;
  else if(f.maxLength&&s.length>f.maxLength)message=`Maximum ${f.maxLength} characters`;
  else if(f.pattern&&!new RegExp(`^(?:${f.pattern})$`).test(s))message='Invalid format';
  else if(f.options&&!f.options.some(o=>o.value===v))message='Unsupported option';
  if(message)violations.push({field:f.id,message});
 }return violations;
}
