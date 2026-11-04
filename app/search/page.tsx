"use client";
import {useEffect,useState} from "react";import {List,Albums,Artists} from "@/components/ui";
const tabs=[["song","Lagu"],["album","Album"],["artist","Artis"]];
export default function Search(){
 const [q,setQ]=useState("");const [ty,setTy]=useState("song");const [r,setR]=useState<any[]>([]);const [load,setLoad]=useState(false);const [err,setErr]=useState(false);
 useEffect(()=>{if(!q.trim()){setR([]);return}setLoad(true);setErr(false);
  const x=setTimeout(()=>fetch(`/api/search?type=${ty}&q=${encodeURIComponent(q)}`).then(r=>r.json()).then(j=>{if(Array.isArray(j))setR(j);else setErr(true)}).catch(()=>setErr(true)).finally(()=>setLoad(false)),400);
  return()=>clearTimeout(x)},[q,ty]);
 return(<><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari lagu, album, atau artis…" className="glass mb-4 w-full rounded-full px-5 py-3 text-sm outline-none focus:border-trac"/>
  <div className="mb-6 flex gap-2">{tabs.map(([k,l])=><button key={k} onClick={()=>{setTy(k);setR([])}} className={`rounded-full px-4 py-1.5 text-sm ${ty===k?"bg-trac":"glass"}`}>{l}</button>)}</div>
  {load?<div className="space-y-2">{[...Array(6)].map((_,i)=><div key={i} className="h-16 animate-pulse rounded-lg bg-white/5"/>)}</div>
  :err?<p className="py-16 text-center text-white/50">Terjadi error. Coba lagi.</p>
  :!r.length?<p className="py-16 text-center text-white/40">{q?"Tidak ada hasil.":"Ketik untuk mencari musik."}</p>
  :ty==="song"?<List tracks={r} empty=""/>:ty==="album"?<Albums albums={r}/>:<Artists artists={r.map(a=>({id:a.id,name:a.name,genre:a.genre}))}/>}</>);
}
