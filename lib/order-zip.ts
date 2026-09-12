// Uncompressed ZIP: preserve original image bytes and UTF-8 filenames.
const table=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});
function crc32(bytes:Uint8Array){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0}
export async function orderZip(summary:File,images:File[],id:string){
 const locals:BlobPart[]=[],central:BlobPart[]=[];let offset=0,centralSize=0;
 const entries=[{file:summary,name:summary.name},...images.map((file,i)=>({file,name:`images/${String(i+1).padStart(2,'0')}-${file.name.replace(/[\\/\x00-\x1f]/g,'_').slice(0,150)}`}))];
 for(const entry of entries){const bytes=new Uint8Array(await entry.file.arrayBuffer());const name=new TextEncoder().encode(entry.name);const crc=crc32(bytes);const local=new ArrayBuffer(30);const l=new DataView(local);l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint16(12,33,true);l.setUint32(14,crc,true);l.setUint32(18,bytes.length,true);l.setUint32(22,bytes.length,true);l.setUint16(26,name.length,true);locals.push(local,name.buffer as ArrayBuffer,entry.file);
 const dir=new ArrayBuffer(46);const d=new DataView(dir);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint16(14,33,true);d.setUint32(16,crc,true);d.setUint32(20,bytes.length,true);d.setUint32(24,bytes.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);central.push(dir,name.buffer as ArrayBuffer);centralSize+=46+name.length;offset+=30+name.length+bytes.length;
 }
 const end=new ArrayBuffer(22);const e=new DataView(end);e.setUint32(0,0x06054b50,true);e.setUint16(8,entries.length,true);e.setUint16(10,entries.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);
 return new File([...locals,...central,end],`PARTYPRINT-${id.slice(0,8)}-with-photos.zip`,{type:'application/zip'});
}
