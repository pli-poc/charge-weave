// Exact fixed-point correction calculation: kWh to 0.001; EUR/kWh to 0.00001.
export function fixed(value, places) {
 const s=String(value);if(!/^-?\d+(?:\.\d+)?$/.test(s))throw Error('Expected a decimal string');
 const [whole,fraction='']=s.replace(/^-/,'').split('.');if(fraction.length>places)throw Error(`Maximum ${places} decimal places`);
 return (s.startsWith('-')?-1n:1n)*BigInt(whole+fraction.padEnd(places,'0'));
}
export function formatFixed(value,places){const sign=value<0n?'-':'';const digits=(value<0n?-value:value).toString().padStart(places+1,'0');return sign+digits.slice(0,-places)+'.'+digits.slice(-places);}
export function rateReading(reading,caseData){
 const energy=fixed(reading,3)-fixed(caseData.meterStart,3);
 const product=energy*fixed(caseData.tariffEurPerKwh,5);
 const cents=(product+(product<0n?-500000n:500000n))/1000000n;
 return {energyKwh:formatFixed(energy,3),amountEur:formatFixed(cents,2),calculationVersion:'meter-fixed-v1'};
}
