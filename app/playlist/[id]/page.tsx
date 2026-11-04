"use client";
import {useParams,useRouter} from "next/navigation";import {Pencil,Trash2,ListMusic} from "lucide-react";import {List,PlayButtons,Cover,Empty} from "@/components/ui";import {usePlayer} from "@/lib/store";
export default function Page(){
 const {id}=useParams<{id:string}>();const p=usePlayer();const r=useRouter();const pl=p.playlists.find((x:any)=>x.id===id);
 if(!pl)return <Empty>Playlist tidak ditemukan.</Empty>;
 const b="glass flex h-10 w-10 items-center justify-center rounded-full";
 return(<><div className="mb-6 flex flex-col items-center text-center">
  {pl.tracks[0]?<Cover src={pl.tracks[0].cover} cls="h-56 w-56 rounded-[22px] shadow-2xl shadow-black/40"/>:<div className="flex h-56 w-56 items-center justify-center rounded-[22px] bg-gradient-to-br from-trac/40 to-trac/10"><ListMusic size={56} className="text-trac"/></div>}
  <h1 className="mt-5 text-[26px] font-bold tracking-tight">{pl.name}</h1><p className="text-[15px] text-fg/55">{pl.tracks.length} lagu</p>
  <div className="mt-4 flex w-full max-w-sm items-center gap-3"><div className="flex-1"><PlayButtons tracks={pl.tracks}/></div>
   <button className={b} aria-label="Ubah nama" onClick={()=>{const x=prompt("Nama baru",pl.name);if(x)p.renamePl(id,x)}}><Pencil size={17}/></button>
   <button className={b+" text-red-500"} aria-label="Hapus playlist" onClick={()=>{if(confirm("Hapus playlist?")){p.delPl(id);r.push("/library")}}}><Trash2 size={17}/></button></div></div>
  <List tracks={pl.tracks} empty="Playlist kosong. Tambah lagu lewat menu ••• di daftar lagu." onRemove={tid=>p.rmFromPl(id,tid)}/></>);
}
