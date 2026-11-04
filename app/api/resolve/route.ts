import {NextRequest,NextResponse} from "next/server";
import {resolveAudio} from "@/lib/providers";
export const maxDuration=30;
export async function GET(r:NextRequest){
 const s=r.nextUrl.searchParams;
 try{return NextResponse.json({audio:(await resolveAudio({sid:s.get("sid")||undefined,title:s.get("title")||undefined,artist:s.get("artist")||undefined}))||null},{headers:{"Cache-Control":"no-store"}})}
 catch{return NextResponse.json({audio:null},{status:502})}
}
