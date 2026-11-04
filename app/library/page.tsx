"use client";
import {useState} from "react";import Link from "next/link";import {Plus,ListMusic} from "lucide-react";
import {List,Title,Empty,Segmented,Cover} from "@/components/ui";import {usePlayer} from "@/lib/store";
const tabs=[["Liked","Liked"],["Playlist","Playlist"],["Riwayat","Riwayat"]];
export default function Library(){
 const p=usePlayer();const [t,setT]=useState("Liked");const [n,setN]=useState("");
 return(<><Title>Library</Title><Segmented items={tabs} value={t} onChange={setT}/>
  {t==="Liked"&&<List tracks={p.likes} empty="Belum ada lagu yang di-like."/>}
  {t==="Riwayat"&&<List tracks={p.recent} empty="Belum ada riwayat."/>}
  {t==="Playlist"&&<><form onSubmit={e=>{e.preventDefault();p.createPl(n);setN("")}} className="mb-6 flex gap-3"><input value={n} onChange={e=>setN(e.target.value)} placeholder="Nama playlist baru" className="h-11 flex-1 rounded-[14px] bg-fill/20 px-4 text-[17px] outline-none placeholder:text-fg/40 focus:ring-2 focus:ring-trac/60"/>
   <button type="submit" className="flex h-11 w-11 items-center justify-center rounded-full bg-trac text-white" aria-label="Buat"><Plus size={22}/></button></form>
   {p.playlists.length?<div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">{p.playlists.map((l:any)=>(<Link key={l.id} href={`/playlist/${l.id}`} className="active:opacity-60">
    {l.tracks[0]?<Cover src={l.tracks[0].cover} cls="aspect-square w-full rounded-[14px] shadow-lg shadow-black/25"/>:<div className="flex aspect-square w-full items-center justify-center rounded-[14px] bg-gradient-to-br from-trac/40 to-trac/10"><ListMusic className="text-trac" size={32}/></div>}
    <p className="mt-2 truncate text-[15px] font-medium">{l.name}</p><p className="text-[13px] text-fg/55">{l.tracks.length} lagu</p></Link>))}</div>
   :<Empty>Belum ada playlist.</Empty>}</>}</>);
}
