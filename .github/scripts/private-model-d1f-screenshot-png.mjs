import {inflateSync} from 'node:zlib';
const reject=()=>{throw new Error('D1F_SCREENSHOT_PNG_REJECTED');};
const table=Uint32Array.from({length:256},(_,i)=>{let n=i;for(let j=0;j<8;j++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc=b=>{let c=0xffffffff;for(const x of b)c=table[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
/** Bounded lossless decoder for Chromium's 8-bit RGB/RGBA screenshot PNGs.
 * Reads the actual captured bytes locally, avoiding a second browser canvas/RPC.
 * Unsupported formats, invalid CRCs and truncated/oversized streams fail closed.
 */
export function decodeD1FScreenshotPng(png){
 if(!Buffer.isBuffer(png)||png.length<45||png.length>64000000||!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))reject();
 let at=8,width=0,height=0,channels=0,ended=false,header=false,dataSeen=false,dataEnded=false;
 const compressed=[];
 while(at<png.length){
  if(at+12>png.length)reject();
  const len=png.readUInt32BE(at),end=at+12+len;
  if(end>png.length||len>64000000)reject();
  const type=png.subarray(at+4,at+8).toString('ascii'),body=png.subarray(at+8,at+8+len);
  if(crc(png.subarray(at+4,at+8+len))!==png.readUInt32BE(at+8+len))reject();
  if(!header&&type!=='IHDR')reject();
  if(type==='IHDR'){
   if(header||len!==13)reject();header=true;width=body.readUInt32BE(0);height=body.readUInt32BE(4);
   if(width<1||height<1||width*height>10000000||body[8]!==8||![2,6].includes(body[9])||body[10]||body[11]||body[12])reject();
   channels=body[9]===2?3:4;
  }else if(type==='IDAT'){
   if(dataEnded)reject();dataSeen=true;compressed.push(body);
  }else if(type==='IEND'){
   if(len!==0||!dataSeen||end!==png.length)reject();ended=true;
  }else{
   if((png[at+4]&32)===0)reject();
   if(dataSeen)dataEnded=true;
  }
  at=end;if(ended)break;
 }
 if(!ended||!header||!dataSeen)reject();
 const stride=width*channels,expected=(stride+1)*height;
 let scan;
 try{scan=inflateSync(Buffer.concat(compressed),{maxOutputLength:expected});}catch{reject();}
 if(scan.length!==expected)reject();
 const raw=Buffer.alloc(stride*height),rgba=new Uint8Array(width*height*4);
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){
  const filter=scan[y*(stride+1)];if(filter>4)reject();
  for(let x=0;x<stride;x++){
   const o=y*stride+x,left=x>=channels?raw[o-channels]:0,up=y?raw[o-stride]:0,ul=y&&x>=channels?raw[o-stride-channels]:0;
   const predictor=filter===0?0:filter===1?left:filter===2?up:filter===3?Math.floor((left+up)/2):paeth(left,up,ul);
   raw[o]=(scan[y*(stride+1)+1+x]+predictor)&255;
  }
 }
 for(let i=0;i<width*height;i++){for(let c=0;c<3;c++)rgba[i*4+c]=raw[i*channels+c];rgba[i*4+3]=channels===4?raw[i*channels+3]:255;}
 return {width,height,rgba};
}
