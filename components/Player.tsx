"use client";
import {useEffect,useState} from "react";
import {motion,AnimatePresence} from "framer-motion";
import {Play,Pause,SkipBack,SkipForward,Shuffle,Repeat,Repeat1,ChevronUp,ChevronDown,Volume2} from "lucide-react";
import {usePlayer} from "@/lib/store";
const fmt=(s:number)=>isFinite(s)?`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`:"0:00";
export default function Player(){
 const p=usePlayer();const [open,setOpen]=useState(false);const [tab,setTab]=useState<"lyrics"|"queue">("lyrics");const [ly,setLy]=useState<string|null|undefined>();
 const c=p.cur;
 useEffect(()=>{if(!open||tab!=="lyrics"||!c)return;setLy(undefined);fetch(`/api/lyrics?artist=${encodeURIComponent(c.artist)}&title=${encodeURIComponent(c.title)}`).then(r=>r.json()).then(j=>setLy(j.lyrics)).catch(()=>setLy(null))},[open,tab,c?.id]);
 const RIcon=p.repeat==="one"?Repeat1:Repeat;
 const ctrl=(<div className="flex items-center gap-4">
  <button onClick={()=>p.setShuffle(!p.shuffle)} className={p.shuffle?"text-trac":"text-white/60"} aria-label="Shuffle"><Shuffle size={18}/></button>
  <button onClick={p.prev} aria-label="Prev"><SkipBack size={20}/></button>
  <button onClick={p.toggle} className="rounded-full bg-white p-2.5 text-black" aria-label="Play">{p.playing?<Pause size={20} fill="#000"/>:<Play size={20} fill="#000"/>}</button>
  <button onClick={p.next} aria-label="Next"><SkipForward size={20}/></button>
  <button onClick={()=>p.setRepeat(p.repeat==="off"?"all":p.repeat==="all"?"one":"off")} className={p.repeat!=="off"?"text-trac":"text-white/60"} aria-label="Repeat"><RIcon size={18}/></button></div>);
 const seek=(<div className="flex w-full items-center gap-2 text-[10px] text-white/50"><span>{fmt(p.t)}</span>
  <input type="range" min={0} max={p.d||30} step={0.5} value={p.t} onChange={e=>p.seek(+e.target.value)} className="h-1 flex-1"/><span>{fmt(p.d)}</span></div>);
 if(!c)return null;
 return(<>
  <div className="glass fixed inset-x-0 bottom-14 z-30 flex items-center gap-3 px-3 py-2 md:bottom-0 md:left-56">
   <button onClick={()=>setOpen(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left"><img src={c.cover} alt="" className="h-11 w-11 rounded-md"/>
    <div className="min-w-0"><p className="truncate text-sm font-medium">{c.title}</p><p className="truncate text-xs text-white/50">{c.artist}</p></div></button>
   <div className="hidden w-[420px] flex-col items-center gap-1 md:flex">{ctrl}{seek}</div>
   <button onClick={p.toggle} className="md:hidden" aria-label="Play">{p.playing?<Pause/>:<Play/>}</button>
   <div className="hidden items-center gap-2 md:flex"><Volume2 size={16}/><input type="range" min={0} max={1} step={0.05} value={p.vol} onChange={e=>p.setVol(+e.target.value)} className="w-24"/>
    <button onClick={()=>setOpen(true)}><ChevronUp size={18}/></button></div></div>
  <AnimatePresence>{open&&(<motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:28,stiffness:260}} className="fixed inset-0 z-40 overflow-y-auto bg-[#0a0a0f]/95 p-6 backdrop-blur-2xl">
   <div className="absolute inset-0 -z-10 opacity-30 blur-3xl" style={{backgroundImage:`url(${c.cover})`,backgroundSize:"cover"}}/>
   <button onClick={()=>setOpen(false)} className="mb-4" aria-label="Tutup"><ChevronDown/></button>
   <div className="mx-auto flex max-w-sm flex-col items-center gap-4">
    <motion.img key={c.id} initial={{scale:.9,opacity:0}} animate={{scale:p.playing?1:.92,opacity:1}} src={c.cover} alt="" className="aspect-square w-full rounded-2xl shadow-2xl"/>
    <div className="w-full"><p className="text-lg font-semibold">{c.title}</p><p className="text-sm text-white/60">{c.artist}</p></div>
    {seek}{ctrl}
    <div className="flex gap-4 text-sm"><button onClick={()=>setTab("lyrics")} className={tab==="lyrics"?"text-trac":"text-white/50"}>Lirik</button><button onClick={()=>setTab("queue")} className={tab==="queue"?"text-trac":"text-white/50"}>Antrean</button></div>
    {tab==="lyrics"?<p className="whitespace-pre-line text-center text-sm leading-7 text-white/80">{ly===undefined?"Memuat lirik…":ly||"Lirik tidak tersedia."}</p>
     :<ul className="w-full space-y-1">{p.queue.map((t:any,n:number)=>(<li key={t.id}><button onClick={()=>p.setI(n)} className={`w-full truncate rounded p-2 text-left text-sm ${n===p.i?"text-trac":"text-white/70"}`}>{t.title} · {t.artist}</button></li>))}</ul>}
   </div></motion.div>)}</AnimatePresence></>);
}
