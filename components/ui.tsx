"use client";
import {useEffect,useState} from "react";import Link from "next/link";
import {Heart,Play,Pause,Shuffle,Music2,MoreHorizontal,ListPlus,User,X,ChevronRight,ChevronLeft} from "lucide-react";
import {motion} from "framer-motion";
import {usePlayer} from "@/lib/store";
import type {Track} from "@/lib/types";

export const Logo=()=>(<div className="flex items-center gap-2.5"><img src="/icon.svg" className="h-8 w-8" alt=""/><span className="text-[19px] font-bold tracking-tight">Trac<span className="text-trac">Music</span></span></div>);
export const Title=({children,right}:{children:React.ReactNode;right?:React.ReactNode})=>(<div className="mb-5 flex items-end justify-between gap-3"><h1 className="text-[34px] font-bold leading-[1.1] tracking-tight">{children}</h1>{right}</div>);
export const Empty=({children}:{children:React.ReactNode})=><p className="py-20 text-center text-[15px] text-fg/45">{children}</p>;
export const Cover=({src,cls}:{src?:string;cls:string})=>src?<img loading="lazy" src={src} alt="" className={cls+" object-cover"}/>:<div className={cls+" flex items-center justify-center bg-gradient-to-br from-fg/20 to-fg/5"}><Music2 className="text-fg/40" size={22}/></div>;

export function Segmented({items,value,onChange}:{items:string[][];value:string;onChange:(k:string)=>void}){
 return(<div className="relative mb-6 flex rounded-full bg-fill/20 p-0.5">{items.map(([k,l])=>(<button key={k} onClick={()=>onChange(k)} className={`relative flex-1 rounded-full py-1.5 text-[13px] font-semibold ${value===k?"text-fg":"text-fg/60"}`}>
  {value===k&&<motion.span layoutId={"seg"+items.map(i=>i[0]).join()} transition={{type:"spring",damping:26,stiffness:380}} className="absolute inset-0 rounded-full bg-fg/15 shadow-sm"/>}<span className="relative">{l}</span></button>))}</div>);
}

export function Row({title,tracks}:{title:string;tracks:Track[]}){
 const p=usePlayer();if(!tracks.length)return null;
 return(<section className="mb-9"><h2 className="mb-3 flex items-center gap-1 text-[22px] font-bold tracking-tight">{title}<ChevronRight size={20} className="text-fg/35"/></h2>
  <div className="noscroll -mx-5 flex gap-4 overflow-x-auto px-5 pb-2 md:-mx-10 md:px-10">{tracks.map((t,n)=>(
   <motion.button whileTap={{scale:.96}} key={t.id} onClick={()=>p.play(tracks,n)} className="group w-[152px] shrink-0 text-left sm:w-44">
    <div className="relative overflow-hidden rounded-[14px] shadow-lg shadow-black/25"><Cover src={t.cover} cls="aspect-square w-full"/>
     <span className="glass absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full opacity-0 transition group-hover:opacity-100"><Play size={15} fill="currentColor"/></span></div>
    <p className="mt-2 truncate text-[14px] font-medium">{t.title}</p><p className="truncate text-[13px] text-fg/55">{t.artist}</p></motion.button>))}</div></section>);
}

function TrackMenu({t,onRemove}:{t:Track;onRemove?:(id:string)=>void}){
 const p=usePlayer();const [o,setO]=useState(false);const [pl,setPl]=useState(false);
 const liked=p.likes.some((x:Track)=>x.id===t.id);const close=()=>{setO(false);setPl(false)};
 const item="flex w-full items-center justify-between gap-6 px-4 py-3 text-left text-[16px] active:bg-fg/10";
 return(<div className="relative">
  <button onClick={()=>setO(true)} aria-label="Menu" className="flex h-9 w-9 items-center justify-center rounded-full text-fg/60 active:bg-fg/10"><MoreHorizontal size={20}/></button>
  {o&&<><button aria-label="Tutup" onClick={close} className="fixed inset-0 z-30 cursor-default"/>
   <motion.div initial={{opacity:0,scale:.92,y:-6}} animate={{opacity:1,scale:1,y:0}} style={{transformOrigin:"top right"}} className="glass glass-thick absolute right-0 top-10 z-40 w-64 overflow-hidden rounded-[18px] divide-y divide-fg/10">
   {!pl?<>
    <button className={item} onClick={()=>{p.like(t);close()}}>{liked?"Hapus dari Liked":"Tambah ke Liked"}<Heart size={18} className={liked?"fill-trac text-trac":""}/></button>
    <button className={item} onClick={()=>setPl(true)}>Tambah ke Playlist<ListPlus size={18}/></button>
    <Link className={item} href={`/search?q=${encodeURIComponent(t.artist.split(",")[0])}`} onClick={close}>Cari artis<User size={18}/></Link>
    {onRemove&&<button className={item+" text-red-500"} onClick={()=>{onRemove(t.id);close()}}>Hapus dari playlist<X size={18}/></button>}
   </>:<>
    <button className={item+" text-fg/60"} onClick={()=>setPl(false)}><span className="flex items-center gap-1"><ChevronLeft size={18}/>Kembali</span></button>
    {p.playlists.length?p.playlists.map((l:any)=><button key={l.id} className={item} onClick={()=>{p.addToPl(l.id,t);close()}}><span className="truncate">{l.name}</span></button>)
     :<p className="px-4 py-3 text-[14px] text-fg/50">Buat playlist dulu di Library</p>}</>}
  </motion.div></>}</div>);
}

export function List({tracks,empty,onRemove}:{tracks:Track[];empty:string;onRemove?:(id:string)=>void}){
 const p=usePlayer();
 if(!tracks.length)return empty?<Empty>{empty}</Empty>:null;
 return(<ul>{tracks.map((t,n)=>{const now=p.cur?.id===t.id;return(
  <li key={t.id} className="flex items-center gap-3 py-1.5">
   <button onClick={()=>p.play(tracks,n)} className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-60">
    <div className="relative shrink-0"><Cover src={t.cover} cls="h-[52px] w-[52px] rounded-[9px]"/>
     {now&&<span className="absolute inset-0 flex items-end justify-center gap-[3px] rounded-[9px] bg-black/45 pb-3.5">{[0,1,2].map(i=><i key={i} className="h-3.5 w-[3px] origin-bottom rounded-full bg-white" style={{animation:p.playing?`eq .9s ${i*.15}s ease-in-out infinite`:"none",transform:p.playing?undefined:"scaleY(.4)"}}/>)}</span>}</div>
    <div className="min-w-0 border-b border-fg/10 py-2.5 flex-1"><p className={`truncate text-[16px] ${now?"text-trac font-semibold":"font-medium"}`}>{t.title}</p><p className="truncate text-[14px] text-fg/55">{t.artist}</p></div></button>
   <TrackMenu t={t} onRemove={onRemove}/></li>)})}</ul>);
}

export function PlayButtons({tracks}:{tracks:Track[]}){
 const p=usePlayer();if(!tracks.length)return null;
 const btn="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-trac/15 py-3 text-[16px] font-semibold text-trac active:scale-[.98] active:bg-trac/25 transition";
 return(<div className="flex gap-3"><button className={btn} onClick={()=>{p.setShuffle(false);p.play(tracks,0)}}><Play size={18} fill="currentColor"/>Putar</button>
  <button className={btn} onClick={()=>{p.setShuffle(true);p.play(tracks,Math.floor(Math.random()*tracks.length))}}><Shuffle size={18}/>Acak</button></div>);
}
export function Recent(){const p=usePlayer();return <Row title="Recently Played" tracks={p.recent.slice(0,15)}/>}
export function ForYou(){
 const p=usePlayer();const [r,setR]=useState<Track[]>([]);
 const key=Array.from(new Set(p.likes.slice(0,6).map((t:Track)=>t.artist.split(",")[0].trim()))).slice(0,2).join("|");
 useEffect(()=>{if(!key){setR([]);return}Promise.all(key.split("|").map(n=>fetch("/api/search?q="+encodeURIComponent(n)).then(x=>x.json()).catch(()=>[]))).then(a=>setR(a.flat().filter((x:any)=>x&&x.id)))},[key]);
 return <Row title="Made For You" tracks={r}/>;
}
