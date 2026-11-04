"use client";
import Link from "next/link";import {usePathname} from "next/navigation";import {motion} from "framer-motion";
import {Home,Search,Library,Settings} from "lucide-react";import {Logo} from "./ui";
const items=[{h:"/",l:"Home",I:Home},{h:"/search",l:"Search",I:Search},{h:"/library",l:"Library",I:Library},{h:"/settings",l:"Settings",I:Settings}];
const on=(p:string,h:string)=>h==="/"?p==="/":p.startsWith(h)||(h==="/settings"&&p==="/login");
export default function Nav(){
 const p=usePathname();
 return(<>
  {/* iPad / desktop: sidebar kaca melayang */}
  <aside className="glass fixed bottom-3 left-3 top-3 z-20 hidden w-56 flex-col gap-1 rounded-[28px] p-4 md:flex"><div className="mb-5 px-2 pt-1"><Logo/></div>
   {items.map(({h,l,I})=>(<Link key={h} href={h} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors ${on(p,h)?"bg-fg/10 text-trac":"text-fg/70 hover:bg-fg/5"}`}><I size={20} strokeWidth={2.2}/>{l}</Link>))}</aside>
  {/* iPhone: tab bar kapsul melayang */}
  <nav className="glass fixed inset-x-4 z-30 flex rounded-full p-1.5 md:hidden" style={{bottom:"max(env(safe-area-inset-bottom),.75rem)"}}>
   {items.map(({h,l,I})=>{const a=on(p,h);return(<Link key={h} href={h} aria-label={l} className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5 text-[10px] font-medium ${a?"text-trac":"text-fg/65"}`}>
    {a&&<motion.span layoutId="tab" transition={{type:"spring",damping:26,stiffness:360}} className="absolute inset-0 rounded-full bg-fg/10"/>}
    <I size={22} strokeWidth={a?2.4:2} className="relative"/><span className="relative">{l}</span></Link>)})}</nav></>);
}
