import {NextRequest,NextResponse} from "next/server";
import {searchTracks,trackFromUrl,playlistFromUrl,spotifyKind} from "@/lib/providers";
export const maxDuration=30;
export async function GET(r:NextRequest){
 const q=r.nextUrl.searchParams.get("q")?.trim();
 if(!q)return NextResponse.json([]);
 try{
  const k=spotifyKind(q);
  if(/open\.spotify\.com/i.test(q)&&!k)return NextResponse.json({error:"Hanya tautan lagu dan playlist Spotify yang didukung"},{status:400});
  return NextResponse.json(k==="track"?await trackFromUrl(q):k==="playlist"?await playlistFromUrl(q):await searchTracks(q,24));
 }catch(e:any){return NextResponse.json({error:"Gagal memuat ("+(e?.message||"error")+")"},{status:502})}
}
