import {lookupAlbum} from "@/lib/providers";import {List,SaveAlbum,PlayAll,Cover} from "@/components/ui";import Link from "next/link";
export const revalidate=3600;
export default async function Page({params}:{params:{id:string}}){
 const d=await lookupAlbum(params.id).catch(()=>null);
 if(!d)return <p className="py-20 text-center text-white/50">Album tidak ditemukan.</p>;
 const {album:a,tracks}=d;
 return(<><div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-end"><Cover src={a.cover} cls="h-44 w-44 rounded-2xl shadow-2xl"/>
  <div className="text-center sm:text-left"><p className="text-xs uppercase text-white/50">Album{a.year&&` · ${a.year}`}</p><h1 className="text-2xl font-bold">{a.title}</h1>
   <Link href={`/artist/${a.artistId}`} className="text-sm text-white/70 hover:text-white">{a.artist}</Link>
   <div className="mt-3 flex items-center justify-center gap-3 sm:justify-start"><PlayAll tracks={tracks}/><SaveAlbum album={a}/></div></div></div>
  <List tracks={tracks} empty="Tidak ada lagu."/></>);
}
