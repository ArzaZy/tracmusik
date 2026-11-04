"use client";
import Link from "next/link";import {usePathname} from "next/navigation";
import {Home,Search,Library,Palette,User} from "lucide-react";import {Logo} from "./ui";
const items=[{h:"/",l:"Home",I:Home},{h:"/search",l:"Search",I:Search},{h:"/library",l:"Library",I:Library},{h:"/settings",l:"Tema",I:Palette},{h:"/login",l:"Akun",I:User}];
export default function Nav(){
 const p=usePathname();
 return(<>
  <aside className="glass fixed inset-y-0 left-0 z-20 hidden w-56 flex-col gap-6 p-5 md:flex"><Logo/>
   {items.map(({h,l,I})=>(<Link key={h} href={h} className={`flex items-center gap-3 text-sm ${p===h?"text-trac":"text-white/60 hover:text-white"}`}><I size={18}/>{l}</Link>))}</aside>
  <nav className="glass fixed inset-x-0 bottom-0 z-30 flex h-14 justify-around md:hidden">
   {items.map(({h,l,I})=>(<Link key={h} href={h} className={`flex flex-col items-center justify-center text-[10px] ${p===h?"text-trac":"text-white/60"}`}><I size={20}/>{l}</Link>))}</nav></>);
}
