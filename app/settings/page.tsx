"use client";
import Link from "next/link";import {Check,ChevronRight,User} from "lucide-react";
import {usePlayer} from "@/lib/store";import {Title,Segmented} from "@/components/ui";
const accents=[["Pink","#FF2D55"],["Biru","#0A84FF"],["Ungu","#BF5AF2"],["Hijau","#30D158"],["Oranye","#FF9F0A"],["Merah","#FF453A"]];
const modes=[["auto","Otomatis"],["dark","Gelap"],["light","Terang"]];
const Group=({h,children}:{h:string;children:React.ReactNode})=>(<section className="mb-7"><h2 className="mb-2 px-4 text-[13px] text-fg/50">{h}</h2><div className="overflow-hidden rounded-[22px] bg-cell">{children}</div></section>);
export default function Settings(){
 const p=usePlayer();
 return(<><Title>Settings</Title>
  <Group h="Akun"><Link href="/login" className="flex items-center gap-3 p-4 active:bg-fg/5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-trac text-white"><User size={18}/></span>
   <span className="flex-1 truncate text-[16px]">{p.user?.email||"Masuk ke TracMusic"}</span><ChevronRight size={18} className="text-fg/30"/></Link></Group>
  <Group h="Tampilan"><div className="p-4 pb-0"><Segmented items={modes} value={p.theme.mode||"auto"} onChange={m=>p.setTheme({...p.theme,mode:m})}/></div></Group>
  <Group h="Warna aksen">{accents.map(([l,c],i)=>(<button key={c} onClick={()=>p.setTheme({...p.theme,accent:c})} className={`flex w-full items-center gap-3 px-4 py-3 text-left active:bg-fg/5 ${i?"border-t border-fg/10":""}`}>
   <span className="h-7 w-7 rounded-full" style={{background:c}}/><span className="flex-1 text-[16px]">{l}</span>{p.theme.accent?.toLowerCase()===c.toLowerCase()&&<Check size={20} className="text-trac"/>}</button>))}</Group>
  <p className="px-4 text-center text-[12px] text-fg/35">TracMusic v0.4.0 · TracLabs</p></>);
}
