import "./globals.css";import type {Metadata,Viewport} from "next";
import Nav from "@/components/Nav";import Player from "@/components/Player";import {PlayerProvider} from "@/lib/store";import Toast from "@/components/Toast";
export const metadata:Metadata={title:"TracMusic — Discover Music. Feel Everything.",description:"TracMusic by TracLabs: streaming musik dengan tampilan iOS.",icons:{icon:"/icon.svg",apple:"/icon.svg"},appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"TracMusic"}};
export const viewport:Viewport={themeColor:[{media:"(prefers-color-scheme: dark)",color:"#000000"},{media:"(prefers-color-scheme: light)",color:"#f2f2f7"}],viewportFit:"cover",width:"device-width",initialScale:1};
export default function Root({children}:{children:React.ReactNode}){
 return(<html lang="id"><body><PlayerProvider><Nav/><main className="safe-top min-h-screen px-5 md:ml-64 md:px-10" style={{paddingBottom:"calc(max(env(safe-area-inset-bottom),.75rem) + 11rem)"}}>{children}</main><Player/><Toast/></PlayerProvider></body></html>);
}
