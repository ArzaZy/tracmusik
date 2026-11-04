import {NextRequest,NextResponse} from "next/server";
import {provider,searchAlbums,searchArtists} from "@/lib/providers";
export async function GET(r:NextRequest){
 const q=r.nextUrl.searchParams.get("q")?.trim();const type=r.nextUrl.searchParams.get("type")||"song";
 if(!q)return NextResponse.json([]);
 try{return NextResponse.json(type==="album"?await searchAlbums(q):type==="artist"?await searchArtists(q):await provider.search(q,24))}
 catch{return NextResponse.json({error:"Gagal memuat"},{status:502})}
}
