"use client";
import {useEffect,useState} from "react";import {Search as SIcon,XCircle,ListPlus} from "lucide-react";
import {List,Title,Empty} from "@/components/ui";import {usePlayer} from "@/lib/store";import type {Track} from "@/lib/types";
export default function Search(){
 const p=usePlayer();const [q,setQ]=useState("");const [r,setR]=useState<Track[]>([]);const [load,setLoad]=useState(false);const [err,setErr]=useState("");
 useEffect(()=>{const s=new URLSearchParams(location.search).get("q");if(s)setQ(s)},[]);
 const isPl=/open\.spotify\.com\/playlist\//i.test(q);
 useEffect(()=>{if(!q.trim()){setR([]);setErr("");setLoad(false);return}setLoad(true);setErr("");let dead=false;
  const x=setTimeout(()=>fetch(`/api/search?q=${encodeURIComponent(q.trim())}`).then(r=>r.json()).then(j=>{if(dead)return;if(Array.isArray(j))setR(j);else{setR([]);setErr(j?.error||"Terjadi error. Coba lagi.")}}).catch(()=>!dead&&setErr("Terjadi error. Coba lagi.")).finally(()=>!dead&&setLoad(false)),500);
  return()=>{dead=true;clearTimeout(x)}},[q]);
 return(<><Title>Search</Title>
  <div className="relative mb-5"><SIcon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg/45"/>
   <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Lagu, artis, atau tautan Spotify" enterKeyHint="search" autoCapitalize="none" autoCorrect="off"
    className="h-11 w-full rounded-[14px] bg-fill/20 pl-10 pr-10 text-[17px] outline-none placeholder:text-fg/40 focus:ring-2 focus:ring-trac/60"/>
   {q&&<button onClick={()=>setQ("")} aria-label="Hapus" className="absolute right-3 top-1/2 -translate-y-1/2 text-fg/40"><XCircle size={18} fill="currentColor" className="text-fg/35"/></button>}</div>
  {isPl&&r.length>0&&!load&&<button onClick={()=>p.createPl("Playlist Spotify",r)} className="mb-4 flex w-full items-center justify-center gap-2 rounded-[14px] bg-trac/15 py-3 text-[16px] font-semibold text-trac"><ListPlus size={18}/>Simpan {r.length} lagu ke Library</button>}
  {load?<div className="space-y-3">{[...Array(6)].map((_,i)=><div key={i} className="shimmer flex items-center gap-3"><div className="h-[52px] w-[52px] rounded-[9px] bg-fg/10"/><div className="flex-1 space-y-2"><div className="h-3 w-2/3 rounded bg-fg/10"/><div className="h-3 w-1/3 rounded bg-fg/10"/></div></div>)}</div>
  :err?<Empty>{err}</Empty>
  :!r.length?<Empty>{q?"Tidak ada hasil.":"Ketik untuk mencari musik, atau tempel tautan lagu/playlist Spotify."}</Empty>
  :<List tracks={r} empty=""/>}</>);
}
