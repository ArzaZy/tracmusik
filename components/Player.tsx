"use client";
import {useEffect,useState} from "react";
import {motion,AnimatePresence,useDragControls} from "framer-motion";
import {Play,Pause,SkipBack,SkipForward,Shuffle,Repeat,Repeat1,Volume1,Volume2,Quote,ListMusic,Heart} from "lucide-react";
import {usePlayer} from "@/lib/store";import Slider from "./Slider";import {Cover} from "./ui";
const fmt=(s:number)=>isFinite(s)&&s>0?`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`:"0:00";
export default function Player(){
 const p=usePlayer();const [open,setOpen]=useState(false);const [view,setView]=useState<"art"|"lyrics"|"queue">("art");const [ly,setLy]=useState<string|null|undefined>();
 const drag=useDragControls();const c=p.cur;
 useEffect(()=>{if(!open||view!=="lyrics"||!c)return;setLy(undefined);fetch(`/api/lyrics?artist=${encodeURIComponent(c.artist)}&title=${encodeURIComponent(c.title)}`).then(r=>r.json()).then(j=>setLy(j.lyrics)).catch(()=>setLy(null))},[open,view,c?.id]);
 useEffect(()=>{document.body.style.overflow=open?"hidden":""},[open]);
 if(!c)return null;
 const RIcon=p.repeat==="one"?Repeat1:Repeat;const liked=p.likes.some((x:any)=>x.id===c.id);
 const PP=({size=22}:{size?:number})=>p.playing?<Pause size={size} fill="currentColor"/>:<Play size={size} fill="currentColor"/>;
 const dur=isFinite(p.d)?p.d:0;
 return(<>
  {/* Mini player: kapsul kaca di atas tab bar */}
  <motion.div initial={{y:30,opacity:0}} animate={{y:0,opacity:1}} className="glass fixed inset-x-4 z-30 flex items-center gap-3 rounded-full py-2 pl-2 pr-3 md:inset-x-auto md:bottom-3 md:left-[15.5rem] md:right-3 md:pr-5" style={{bottom:"calc(max(env(safe-area-inset-bottom),.75rem) + 4.75rem)"}}>
   <button onClick={()=>{setView("art");setOpen(true)}} className="flex min-w-0 flex-1 items-center gap-3 text-left md:flex-none md:basis-64"><Cover src={c.cover} cls={`h-11 w-11 rounded-full ${p.playing?"":"opacity-80"}`}/>
    <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{c.title}</p><p className="truncate text-[13px] text-fg/55">{c.artist}</p></div></button>
   <div className="hidden flex-1 flex-col items-center md:flex">
    <div className="flex items-center gap-5"><button onClick={()=>p.setShuffle(!p.shuffle)} className={p.shuffle?"text-trac":"text-fg/55"} aria-label="Shuffle"><Shuffle size={17}/></button>
     <button onClick={p.prev} aria-label="Sebelumnya"><SkipBack size={20} fill="currentColor"/></button>
     <button onClick={p.toggle} aria-label="Putar/Jeda" className="flex h-10 w-10 items-center justify-center rounded-full bg-fg text-bg"><PP size={18}/></button>
     <button onClick={p.next} aria-label="Berikutnya"><SkipForward size={20} fill="currentColor"/></button>
     <button onClick={()=>p.setRepeat(p.repeat==="off"?"all":p.repeat==="all"?"one":"off")} className={p.repeat!=="off"?"text-trac":"text-fg/55"} aria-label="Repeat"><RIcon size={17}/></button></div>
    <div className="flex w-full max-w-md items-center gap-2 text-[11px] tabular-nums text-fg/55"><span className="w-8 text-right">{fmt(p.t)}</span><Slider value={p.t} max={dur} onChange={p.seek}/><span className="w-8">{fmt(dur)}</span></div></div>
   <div className="hidden w-36 items-center gap-2 md:flex"><Volume1 size={16} className="text-fg/55"/><Slider value={p.vol} max={1} onChange={p.setVol}/><Volume2 size={16} className="text-fg/55"/></div>
   <button onClick={p.toggle} className="flex h-10 w-10 items-center justify-center md:hidden" aria-label="Putar/Jeda"><PP/></button>
   <button onClick={p.next} className="flex h-10 w-9 items-center justify-center md:hidden" aria-label="Berikutnya"><SkipForward size={22} fill="currentColor"/></button>
  </motion.div>

  {/* Now Playing: sheet penuh, tarik ke bawah untuk menutup */}
  <AnimatePresence>{open&&(<motion.div key="np" role="dialog" aria-label="Sedang diputar" initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:32,stiffness:300}}
   drag="y" dragControls={drag} dragListener={false} dragConstraints={{top:0,bottom:0}} dragElastic={{top:0,bottom:.7}}
   onDragEnd={(_,i)=>{if(i.offset.y>140||i.velocity.y>700)setOpen(false)}}
   className="fixed inset-0 z-40 overflow-hidden bg-black text-white [--fg:255_255_255] md:inset-x-auto md:right-3 md:top-3 md:bottom-3 md:w-[26rem] md:rounded-[32px]">
   <div className="absolute inset-0 -z-0 scale-150 bg-cover bg-center opacity-80 blur-[70px] saturate-[1.6]" style={{backgroundImage:c.cover?`url(${c.cover})`:undefined}}/>
   <div className="absolute inset-0 bg-black/35"/>
   <div className="relative mx-auto flex h-full max-w-md flex-col px-7" style={{paddingTop:"max(env(safe-area-inset-top),.5rem)",paddingBottom:"max(env(safe-area-inset-bottom),1.25rem)"}}>
    <div onPointerDown={e=>drag.start(e)} className="flex shrink-0 cursor-grab touch-none justify-center py-3" aria-label="Tarik untuk menutup"><span className="h-[5px] w-10 rounded-full bg-white/40"/></div>

    {view==="art"?<div className="flex min-h-0 flex-1 flex-col justify-center">
      <motion.div animate={{scale:p.playing?1:.86}} transition={{type:"spring",damping:18,stiffness:180}} className="mx-auto w-full">
       <Cover src={c.cover} cls="aspect-square w-full rounded-[22px] shadow-2xl shadow-black/50"/></motion.div></div>
     :<div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex shrink-0 items-center gap-3"><Cover src={c.cover} cls="h-14 w-14 rounded-[10px]"/><div className="min-w-0"><p className="truncate text-[17px] font-semibold">{c.title}</p><p className="truncate text-[15px] text-white/60">{c.artist}</p></div></div>
      <div className="noscroll min-h-0 flex-1 overflow-y-auto">
       {view==="lyrics"?<p className="whitespace-pre-line pb-6 text-[22px] font-bold leading-[1.35] tracking-tight text-white/85">{ly===undefined?"Memuat lirik…":ly||"Lirik tidak tersedia."}</p>
        :<ul>{p.queue.map((t:any,n:number)=>(<li key={t.id+n}><button onClick={()=>p.setI(n)} className="flex w-full items-center gap-3 py-2 text-left"><Cover src={t.cover} cls="h-11 w-11 rounded-lg"/>
         <div className="min-w-0"><p className={`truncate text-[15px] ${n===p.i?"font-semibold text-trac":"font-medium"}`}>{t.title}</p><p className="truncate text-[13px] text-white/55">{t.artist}</p></div></button></li>))}</ul>}</div></div>}

    <div className="shrink-0 pt-5">
     {view==="art"&&<div className="mb-4 flex items-center gap-3"><div className="min-w-0 flex-1"><p className="truncate text-[22px] font-bold leading-tight tracking-tight">{c.title}</p><p className="truncate text-[19px] text-white/60">{c.artist}</p></div>
      <button onClick={()=>p.like(c)} aria-label="Like" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15"><Heart size={18} className={liked?"fill-white":""}/></button></div>}
     <Slider value={p.t} max={dur} onChange={p.seek}/>
     <div className="-mt-1 mb-3 flex justify-between text-[12px] tabular-nums text-white/55"><span>{fmt(p.t)}</span><span>-{fmt(Math.max(0,dur-p.t))}</span></div>
     <div className="flex items-center justify-center gap-10">
      <button onClick={p.prev} aria-label="Sebelumnya" className="active:scale-90 transition"><SkipBack size={38} fill="currentColor"/></button>
      <button onClick={p.toggle} aria-label="Putar/Jeda" className="active:scale-90 transition"><PP size={54}/></button>
      <button onClick={p.next} aria-label="Berikutnya" className="active:scale-90 transition"><SkipForward size={38} fill="currentColor"/></button></div>
     <div className="mt-6 flex items-center gap-3 text-white/60"><Volume1 size={16}/><Slider value={p.vol} max={1} onChange={p.setVol}/><Volume2 size={16}/></div>
     <div className="mt-2 flex items-center justify-around">
      {([["lyrics",Quote],["queue",ListMusic]] as const).map(([k,I])=>(<button key={k} onClick={()=>setView(view===k?"art":k)} aria-label={k} className={`flex h-11 w-11 items-center justify-center rounded-full transition ${view===k?"bg-white text-black":"text-white/65"}`}><I size={20}/></button>))}
      <button onClick={()=>p.setShuffle(!p.shuffle)} aria-label="Shuffle" className={`flex h-11 w-11 items-center justify-center rounded-full transition ${p.shuffle?"bg-white text-black":"text-white/65"}`}><Shuffle size={19}/></button>
      <button onClick={()=>p.setRepeat(p.repeat==="off"?"all":p.repeat==="all"?"one":"off")} aria-label="Repeat" className={`flex h-11 w-11 items-center justify-center rounded-full transition ${p.repeat!=="off"?"bg-white text-black":"text-white/65"}`}><RIcon size={19}/></button></div>
    </div>
   </div></motion.div>)}</AnimatePresence></>);
}
