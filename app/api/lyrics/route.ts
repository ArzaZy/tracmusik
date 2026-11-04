import {NextRequest,NextResponse} from "next/server";
import {lyrics} from "@/lib/providers";
export async function GET(r:NextRequest){
 const a=r.nextUrl.searchParams.get("artist")||"",t=r.nextUrl.searchParams.get("title")||"";
 try{return NextResponse.json({lyrics:await lyrics(a,t)})}catch{return NextResponse.json({lyrics:null})}
}
