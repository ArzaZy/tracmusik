import {searchTracks} from "@/lib/providers";import {Row,Recent,ForYou,Title,Empty} from "@/components/ui";import type {Track} from "@/lib/types";
// Cache data ada di fetch (lib/providers); halaman dirender per request supaya error API tidak "menempel".
export const dynamic="force-dynamic";export const maxDuration=30;
// Ubah daftar kueri ini untuk mengganti isi tiap baris di Home.
const SECTIONS:[string,string[]][]=[
 ["Trending Music",["bernadya","tulus","hindia","nadin amizah"]],
 ["New Releases",["new music friday","lagu baru 2026"]],
 ["Playlist Pilihan: Indonesia Pop",["raisa","juicy luicy","sheila on 7","pamungkas"]],
];
const load=async(qs:string[])=>{const r=await Promise.allSettled(qs.map(q=>searchTracks(q,8)));
 const seen=new Set<string>();const ok=r.filter((x):x is PromiseFulfilledResult<Track[]>=>x.status==="fulfilled");
 return{ok:ok.length>0,tracks:ok.flatMap(x=>x.value).filter(t=>!seen.has(t.id)&&!!seen.add(t.id))}};
export default async function Home(){
 const rows=await Promise.all(SECTIONS.map(async([t,q])=>({t,...await load(q)})));
 if(!rows.some(r=>r.ok))return <><Title>Home</Title><Empty>Gagal memuat musik. Coba refresh nanti.</Empty></>;
 return(<><Title>Home</Title><Recent/><ForYou/>{rows.map(r=><Row key={r.t} title={r.t} tracks={r.tracks}/>)}</>);
}
