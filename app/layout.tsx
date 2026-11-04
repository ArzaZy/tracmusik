import "./globals.css";import type {Metadata,Viewport} from "next";
import Nav from "@/components/Nav";import Player from "@/components/Player";import {PlayerProvider} from "@/lib/store";import Toast from "@/components/Toast";
export const metadata:Metadata={title:"TracMusic — Discover Music. Feel Everything.",description:"TracMusic by TracLabs: streaming musik dengan pratinjau legal.",icons:{icon:"/icon.svg"}};
export const viewport:Viewport={themeColor:"#8b5cf6"};
export default function Root({children}:{children:React.ReactNode}){
 return(<html lang="id"><body><PlayerProvider><Nav/><main className="min-h-screen px-4 pb-44 pt-6 md:ml-56 md:px-8">{children}</main><Player/><Toast/></PlayerProvider></body></html>);
}
