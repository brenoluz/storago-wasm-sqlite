import { Field } from "@storago/orm"

export function fieldTransformFromDb<F extends Field>(field: F, value: any) : any{

  if(field.kind){
    return '';
  }

  return 'oi';
}
