"use client";
import {useParams,useRouter} from "next/navigation";import {List,PlayAll} from "@/components/ui";import {usePlayer} from "@/lib/store";
export default function Page(){
 const {id}=useParams<{id:string}>();const p=usePlayer();const r=useRouter();const pl=p.playlists.find((x:any)=>x.id===id);
 if(!pl)return <p className="py-20 text-center text-white/50">Playlist tidak ditemukan.</p>;
 return(<><div className="mb-6 flex items-center gap-3"><PlayAll tracks={pl.tracks}/><h1 className="flex-1 truncate text-2xl font-bold">{pl.name}</h1>
  <button onClick={()=>{const x=prompt("Nama baru",pl.name);if(x)p.renamePl(id,x)}} className="glass rounded-full px-3 py-1.5 text-sm">Edit</button>
  <button onClick={()=>{if(confirm("Hapus playlist?")){p.delPl(id);r.push("/library")}}} className="glass rounded-full px-3 py-1.5 text-sm">Hapus</button></div>
  <List tracks={pl.tracks} empty="Playlist kosong. Tambah lagu lewat ikon + di daftar lagu." onRemove={tid=>p.rmFromPl(id,tid)}/></>);
}
