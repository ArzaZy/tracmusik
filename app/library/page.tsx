"use client";
import {useState} from "react";import Link from "next/link";import {Plus,Pencil,Trash2} from "lucide-react";
import {List,Albums,Artists} from "@/components/ui";import {usePlayer} from "@/lib/store";
const tabs=["Liked","Playlist","Album","Artis","Riwayat"];
export default function Library(){
 const p=usePlayer();const [t,setT]=useState("Liked");const [n,setN]=useState("");
 return(<><div className="mb-6 flex gap-2 overflow-x-auto noscroll">{tabs.map(x=><button key={x} onClick={()=>setT(x)} className={`shrink-0 rounded-full px-4 py-1.5 text-sm ${t===x?"bg-trac":"glass"}`}>{x}</button>)}</div>
  {t==="Liked"&&<List tracks={p.likes} empty="Belum ada lagu yang di-like."/>}
  {t==="Riwayat"&&<List tracks={p.recent} empty="Belum ada riwayat."/>}
  {t==="Album"&&(p.albums.length?<Albums albums={p.albums}/>:<p className="py-16 text-center text-white/40">Belum ada album tersimpan.</p>)}
  {t==="Artis"&&(p.artists.length?<Artists artists={p.artists}/>:<p className="py-16 text-center text-white/40">Belum ada artis favorit.</p>)}
  {t==="Playlist"&&<><div className="mb-4 flex gap-2"><input value={n} onChange={e=>setN(e.target.value)} placeholder="Nama playlist baru" className="glass flex-1 rounded-full px-4 py-2 text-sm outline-none"/>
   <button onClick={()=>{p.createPl(n);setN("")}} className="rounded-full bg-trac p-2.5" aria-label="Buat"><Plus size={18}/></button></div>
   {p.playlists.length?<ul className="space-y-1">{p.playlists.map((l:any)=>(<li key={l.id} className="glass flex items-center gap-3 rounded-lg p-3">
    <Link href={`/playlist/${l.id}`} className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{l.name}</p><p className="text-xs text-white/50">{l.tracks.length} lagu</p></Link>
    <button onClick={()=>{const x=prompt("Nama baru",l.name);if(x)p.renamePl(l.id,x)}} aria-label="Edit"><Pencil size={16}/></button>
    <button onClick={()=>{if(confirm("Hapus playlist?"))p.delPl(l.id)}} aria-label="Hapus"><Trash2 size={16}/></button></li>))}</ul>
   :<p className="py-12 text-center text-white/40">Belum ada playlist.</p>}</>}</>);
}
