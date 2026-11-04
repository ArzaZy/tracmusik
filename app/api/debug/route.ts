import {NextRequest,NextResponse} from "next/server";
export const dynamic="force-dynamic";export const maxDuration=30;
// Buka: /api/debug?q=the%20hijau  — menampilkan respons mentah dari NexaDev sebagaimana dilihat server Vercel. Hapus file ini setelah selesai.
export async function GET(r:NextRequest){
 const q=r.nextUrl.searchParams.get("q")||"the hijau";
 const base=process.env.NEXA_API_BASE||"https://api.nexadev.my.id/api";
 const url=`${base}/spotifyplay?q=${encodeURIComponent(q)}`;const t=Date.now();
 try{
  const res=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(25000),headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36","Accept":"application/json, text/plain, */*"}});
  const body=await res.text();
  return NextResponse.json({url,status:res.status,ms:Date.now()-t,contentType:res.headers.get("content-type"),body:body.slice(0,1500)});
 }catch(e:any){return NextResponse.json({url,ms:Date.now()-t,error:String(e?.name+": "+e?.message),cause:String(e?.cause?.code||e?.cause?.message||"")})}
}
