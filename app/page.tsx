import {searchTracks,trackFromUrl,playlistFromUrl,spotifyKind} from "@/lib/providers";import {Row,Recent,ForYou,Title,Empty} from "@/components/ui";import type {Track} from "@/lib/types";
// Cache data ada di fetch (lib/providers); halaman dirender per request supaya error API tidak "menempel".
export const dynamic="force-dynamic";export const maxDuration=30;
// Isi tiap baris Home. Tiap item boleh berupa tautan Spotify (playlist atau lagu) atau kata kunci.
// Tautan lebih stabil karena memakai endpoint spotifypl / spotify. Tambah baris atau ganti tautan sesukamu.
const SECTIONS:[string,string[]][]=[
 ["Playlist Pilihan",["https://open.spotify.com/playlist/6Tp1XghEcLfAsZfwHZA6dK"]],
 // ["Trending Music",["https://open.spotify.com/playlist/ID_PLAYLIST_KAMU"]],
 // ["Pilihan Editor",["https://open.spotify.com/track/5vQSU3pxA9atqN6zMrcTU7"]],
];
const one=async(s:string):Promise<Track[]>=>{const k=spotifyKind(s);return k==="playlist"?(await playlistFromUrl(s)).slice(0,20):k==="track"?trackFromUrl(s):searchTracks(s,8)};
const load=async(items:string[])=>{const r=await Promise.allSettled(items.map(one));
 const seen=new Set<string>();const ok=r.filter((x):x is PromiseFulfilledResult<Track[]>=>x.status==="fulfilled");
 return{ok:ok.length>0,tracks:ok.flatMap(x=>x.value).filter(t=>!seen.has(t.id)&&!!seen.add(t.id))}};
export default async function Home(){
 const rows=await Promise.all(SECTIONS.map(async([t,q])=>({t,...await load(q)})));
 if(!rows.some(r=>r.ok))return <><Title>Home</Title><Recent/><Empty>Gagal memuat musik. Coba refresh nanti, atau cari lewat tab Search dengan menempel tautan Spotify.</Empty></>;
 return(<><Title>Home</Title><Recent/><ForYou/>{rows.map(r=><Row key={r.t} title={r.t} tracks={r.tracks}/>)}</>);
}
