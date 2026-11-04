"use client";
import {useEffect,useState} from "react";import Link from "next/link";
import {Heart,Play,ListPlus,X,Disc3} from "lucide-react";
import {usePlayer} from "@/lib/store";
import type {Track,Album,Artist} from "@/lib/types";
export const Logo=()=>(<div className="flex items-center gap-2"><img src="/icon.svg" className="h-8 w-8" alt=""/><span className="text-lg font-semibold tracking-tight">Trac<span className="text-trac">Music</span></span></div>);
export const Cover=({src,cls}:{src?:string;cls:string})=>src?<img loading="lazy" src={src} alt="" className={cls+" object-cover"}/>:<div className={cls+" flex items-center justify-center bg-white/10"}><Disc3 className="text-white/40"/></div>;
export function Row({title,tracks}:{title:string;tracks:Track[]}){
 const p=usePlayer();if(!tracks.length)return null;
 return(<section className="mb-8"><h2 className="mb-3 text-xl font-semibold">{title}</h2>
  <div className="noscroll flex gap-4 overflow-x-auto pb-2">{tracks.map((t,n)=>(
   <button key={t.id} onClick={()=>p.play(tracks,n)} className="group w-36 shrink-0 text-left sm:w-44">
    <div className="relative overflow-hidden rounded-xl"><Cover src={t.cover} cls="aspect-square w-full transition group-hover:scale-105"/>
     {t.audio&&<span className="absolute bottom-2 right-2 rounded-full bg-trac p-2 opacity-0 shadow-lg transition group-hover:opacity-100"><Play size={16} fill="#fff"/></span>}</div>
    <p className="mt-2 truncate text-sm font-medium">{t.title}</p><p className="truncate text-xs text-white/50">{t.artist}</p></button>))}</div></section>);
}
export function Albums({title,albums}:{title?:string;albums:Album[]}){
 if(!albums.length)return null;
 return(<section className="mb-8">{title&&<h2 className="mb-3 text-xl font-semibold">{title}</h2>}
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{albums.map(a=>(<Link key={a.id} href={`/album/${a.id}`} className="group">
   <Cover src={a.cover} cls="aspect-square w-full rounded-xl transition group-hover:scale-[1.03]"/>
   <p className="mt-2 truncate text-sm font-medium">{a.title}</p><p className="truncate text-xs text-white/50">{a.artist}{a.year&&` · ${a.year}`}</p></Link>))}</div></section>);
}
export function Artists({title,artists}:{title?:string;artists:Artist[]}){
 if(!artists.length)return null;
 return(<section className="mb-8">{title&&<h2 className="mb-3 text-xl font-semibold">{title}</h2>}
  <div className="noscroll flex gap-4 overflow-x-auto pb-2">{artists.map(a=>(<Link key={a.id} href={`/artist/${a.id}`} className="w-28 shrink-0 text-center">
   <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-trac to-black text-3xl font-bold">{a.name[0]}</div>
   <p className="mt-2 truncate text-sm">{a.name}</p>{a.genre&&<p className="truncate text-xs text-white/50">{a.genre}</p>}</Link>))}</div></section>);
}
function AddMenu({t}:{t:Track}){
 const p=usePlayer();const [o,setO]=useState(false);
 return(<div className="relative"><button onClick={()=>setO(!o)} aria-label="Tambah ke playlist"><ListPlus size={18} className="text-white/50"/></button>
  {o&&<div className="absolute right-0 z-20 w-44 rounded-lg border border-white/10 bg-[#15151f] p-1 text-sm shadow-xl">
   {p.playlists.length?p.playlists.map((pl:any)=><button key={pl.id} onClick={()=>{p.addToPl(pl.id,t);setO(false)}} className="block w-full truncate rounded p-2 text-left hover:bg-white/10">{pl.name}</button>):<p className="p-2 text-white/50">Buat playlist dulu di Library</p>}</div>}</div>);
}
export function List({tracks,empty,onRemove}:{tracks:Track[];empty:string;onRemove?:(id:string)=>void}){
 const p=usePlayer();
 if(!tracks.length)return <p className="py-16 text-center text-white/40">{empty}</p>;
 return(<ul className="space-y-1">{tracks.map((t,n)=>{const liked=p.likes.some((x:Track)=>x.id===t.id);return(
  <li key={t.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5">
   <button disabled={!t.audio} onClick={()=>p.play(tracks,n)} className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-40">
    <Cover src={t.cover} cls="h-12 w-12 rounded-md"/>
    <div className="min-w-0"><p className="truncate text-sm font-medium">{t.title}</p><p className="truncate text-xs text-white/50">{t.artist}{t.source==="jamendo"&&" · full"}{!t.audio&&" · tanpa audio"}</p></div></button>
   {t.artistId&&<Link href={`/artist/${t.artistId}`} className="hidden text-xs text-white/40 hover:text-white sm:block">Artis</Link>}
   <AddMenu t={t}/>
   <button onClick={()=>p.like(t)} aria-label="Like"><Heart size={18} className={liked?"fill-trac text-trac":"text-white/50"}/></button>
   {onRemove&&<button onClick={()=>onRemove(t.id)} aria-label="Hapus"><X size={18} className="text-white/50"/></button>}</li>)})}</ul>);
}
export function SaveAlbum({album}:{album:Album}){const p=usePlayer();const on=p.albums.some((x:Album)=>x.id===album.id);
 return <button onClick={()=>p.saveAlbum(album)} className={`rounded-full border px-4 py-1.5 text-sm ${on?"border-trac bg-trac":"border-white/20"}`}>{on?"Tersimpan":"Simpan album"}</button>}
export function FavArtist({artist}:{artist:Artist}){const p=usePlayer();const on=p.artists.some((x:Artist)=>x.id===artist.id);
 return <button onClick={()=>p.favArtist(artist)} className={`rounded-full border px-4 py-1.5 text-sm ${on?"border-trac bg-trac":"border-white/20"}`}>{on?"Favorit":"Favoritkan"}</button>}
export function PlayAll({tracks}:{tracks:Track[]}){const p=usePlayer();return <button onClick={()=>p.play(tracks,tracks.findIndex(t=>t.audio))} className="rounded-full bg-trac p-3" aria-label="Putar semua"><Play fill="#fff"/></button>}
export function Recent(){const p=usePlayer();return <Row title="Recently Played" tracks={p.recent.slice(0,15)}/>}
export function ForYou(){
 const p=usePlayer();const [r,setR]=useState<Track[]>([]);const key=p.artists.slice(0,2).map((a:Artist)=>a.name).join("|");
 useEffect(()=>{if(!key){setR([]);return}Promise.all(key.split("|").map(n=>fetch("/api/search?q="+encodeURIComponent(n)).then(x=>x.json()).catch(()=>[]))).then(a=>setR(a.flat().filter((x:any)=>x&&x.id)))},[key]);
 return <Row title="Made For You" tracks={r}/>;
}
