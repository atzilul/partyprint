export const MAX_BODY=16*1024*1024;
export async function readLimitedForm(request:Request){
 const declared=Number(request.headers.get('content-length')||0);if(declared>MAX_BODY)throw new Error('too_large');
 const reader=request.body?.getReader();if(!reader)throw new Error('empty');const parts:Uint8Array[]=[];let length=0;
 while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>MAX_BODY){await reader.cancel();throw new Error('too_large')}parts.push(value)}
 const bytes=new Uint8Array(length);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length}
 return new Request(request.url,{method:'POST',headers:{'content-type':request.headers.get('content-type')||''},body:bytes}).formData();
}
export function validImage(bytes:Uint8Array,type:string){
 if(type==='image/jpeg')return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(type==='image/png')return [137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
 if(type==='image/webp')return String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';return false;
}
