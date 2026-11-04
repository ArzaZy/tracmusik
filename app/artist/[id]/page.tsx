import {lookupArtist} from "@/lib/providers";import {List,Albums,FavArtist,PlayAll} from "@/components/ui";
export const revalidate=3600;
export default async function Page({params}:{params:{id:string}}){
 const d=await lookupArtist(params.id).catch(()=>null);
 if(!d)return <p className="py-20 text-center text-white/50">Artis tidak ditemukan.</p>;
 const {artist:a,tracks,albums}=d;
 return(<><div className="mb-6 flex items-center gap-4"><div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-trac to-black text-4xl font-bold">{a.name[0]}</div>
  <div><h1 className="text-2xl font-bold">{a.name}</h1><p className="text-sm text-white/50">{a.genre}</p><div className="mt-3 flex items-center gap-3"><PlayAll tracks={tracks}/><FavArtist artist={a}/></div></div></div>
  <h2 className="mb-3 text-xl font-semibold">Populer</h2><List tracks={tracks} empty="Tidak ada lagu."/><div className="mt-8"><Albums title="Album" albums={albums}/></div></>);
}
