const clone=v=>JSON.parse(JSON.stringify(v));
const stable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
export async function digest(value,crypto){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(stable(value)));return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');}
export function createCheckpointStore({indexedDB,crypto,database='chargeweave-client-v1'}){
 const open=()=>new Promise((resolve,reject)=>{if(!indexedDB)return reject(Error('Browser storage unavailable'));const r=indexedDB.open(database,1);r.onupgradeneeded=()=>r.result.createObjectStore('workspaces');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 async function transaction(mode,callback){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('workspaces',mode);let result;tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=()=>{db.close();reject(tx.error??Error('Storage failed'));};tx.onabort=()=>{db.close();reject(Error('Workspace conflict or storage transaction aborted'));};callback(tx.objectStore('workspaces'),tx,v=>{result=v;});});}
 async function verify(envelope,pkg){if(!envelope||envelope.format!==1||envelope.packageDigest!==pkg.digest||envelope.package?.digest!==pkg.digest)throw Error('Incompatible package or checkpoint');if(await digest(envelope.payload,crypto)!==envelope.checksum)throw Error('Damaged checkpoint');if(!Number.isInteger(envelope.storageRevision)||envelope.storageRevision<1||!Number.isInteger(envelope.payload.revision))throw Error('Invalid checkpoint revision');return clone(envelope);}
 return {
  async save(id,payload,pkg,expectedStorageRevision){const envelope={format:1,packageDigest:pkg.digest,package:clone(pkg),payload:clone(payload),storageRevision:expectedStorageRevision+1,checksum:await digest(payload,crypto)};return transaction('readwrite',(store,tx,done)=>{const get=store.get(id);get.onsuccess=()=>{if((get.result?.storageRevision??0)!==expectedStorageRevision){tx.abort();return;}store.put(envelope,id);done(envelope);};});},
  async load(id,pkg){const envelope=await transaction('readonly',(store,tx,done)=>{const r=store.get(id);r.onsuccess=()=>done(r.result??null);});return envelope?verify(envelope,pkg):null;},
  async remove(id,expectedStorageRevision){return transaction('readwrite',(store,tx,done)=>{const r=store.get(id);r.onsuccess=()=>{if((r.result?.storageRevision??0)!==expectedStorageRevision){tx.abort();return;}store.delete(id);done(true);};});},
  raw(id){return transaction('readonly',(store,tx,done)=>{const r=store.get(id);r.onsuccess=()=>done(r.result??null);});},
  verify,
 };
}
