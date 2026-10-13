import applicationPackage from '../../client-runtime/generated/application.json' with { type: 'json' };
import { rateReading } from '../../client-runtime/src/services/decimal.js';
export const meterCorrectionModel = applicationPackage.task;
export function makeMeterCorrectionRun(){return {status:'open',currentStage:meterCorrectionModel.case.currentStage,revision:0,values:Object.fromEntries(meterCorrectionModel.task.form.fields.map(f=>[f.id,f.defaultValue??''])),outcome:null};}
export function rateCorrectedReading(reading,caseData=meterCorrectionModel.case){const r=rateReading(String(reading),caseData);return {energyKwh:Number(r.energyKwh),amountEur:Number(r.amountEur)};}
