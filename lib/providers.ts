import type {Track} from "./types";
// Semua data musik berasal dari NexaDev API: spotifyplay (cari), spotify (lagu via link), spotifypl (playlist via link).
// Lirik tetap memakai LRCLIB karena NexaDev tidak punya endpoint lirik.
const BASE=process.env.NEXA_API_BASE||"https://api.nexadev.my.id/api";
const enc=encodeURIComponent;
const HEAD={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36","Accept":"application/json, text/plain, */*","Accept-Language":"id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"};

async function call(path:string,key:string,val:string,rev=900){
  const r=await fetch(`${BASE}/${path}?${key}=${enc(val)}`,{headers:HEAD,signal:AbortSignal.timeout(25000),...(rev?{next:{revalidate:rev}}:{cache:"no-store" as const})});
  if(!r.ok)throw new Error("api "+r.status);
  return r.json();
}

// ---------- normalisasi respons (nama field di API bisa bervariasi) ----------
const first=(o:any,keys:string[])=>{if(o&&typeof o==="object")for(const k of keys){const v=o[k];if(v!==undefined&&v!==null&&v!=="")return v}};
const isUrl=(v:any):v is string=>typeof v==="string"&&/^https?:\/\//i.test(v);
const isSpotify=(v:string)=>/open\.spotify\.com/i.test(v);
const text=(v:any):string=>{
  if(v==null)return"";
  if(typeof v==="string"||typeof v==="number")return String(v);
  if(Array.isArray(v))return v.map(text).filter(Boolean).join(", ");
  if(typeof v==="object")return text(first(v,["name","title"]));
  return"";
};
function imgOf(o:any):string{
  const v=first(o,["thumbnail","thumb","cover","coverUrl","cover_url","image","imageUrl","image_url","albumArt","album_art","artwork","poster","images"]);
  if(isUrl(v))return v;
  if(Array.isArray(v)){const x=v[0];if(isUrl(x))return x;if(isUrl(x?.url))return x.url}
  if(v&&typeof v==="object"){if(isUrl(v.url))return v.url}
  const a=o?.album;if(a&&typeof a==="object")return imgOf(a);
  return"";
}
function audioOf(o:any):string|undefined{
  const keys=["download","downloadUrl","download_url","downloadLink","download_link","dl","mp3","audio","audioUrl","audio_url","link","directLink","direct_link","url","stream"];
  for(const k of keys){
    const v=o?.[k];
    if(isUrl(v)&&!isSpotify(v))return v;
    if(v&&typeof v==="object"&&!Array.isArray(v)){const n=audioOf(v);if(n)return n}
  }
  for(const v of Object.values(o||{}))if(isUrl(v)&&/\.(mp3|m4a|aac|ogg)(\?|$)/i.test(v))return v;
  const pv=first(o,["preview","previewUrl","preview_url"]);
  return isUrl(pv)?pv:undefined;
}
function sidOf(o:any):string|undefined{
  for(const k of ["url","spotifyUrl","spotify_url","link","external_url","uri","id","trackId","track_id"]){
    const v=o?.[k];if(typeof v!=="string")continue;
    const m=v.match(/track[/:]([A-Za-z0-9]{10,30})/);if(m)return m[1];
    if(k==="id"||k==="trackId"||k==="track_id"){if(/^[A-Za-z0-9]{22}$/.test(v))return v}
  }
}
const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60);
function toTrack(o:any):Track|null{
  if(!o||typeof o!=="object")return null;
  const title=text(first(o,["title","name","judul","trackName","track_name","song"]));
  if(!title)return null;
  const artist=text(first(o,["artist","artists","artistName","artist_name","author","singer","channel"]));
  const sid=sidOf(o);
  return{id:"sp"+(sid||slug(title+"-"+artist)),title,artist,album:text(first(o,["album","albumName","album_name"])),cover:imgOf(o),audio:audioOf(o),sid,source:"spotify"};
}
function unwrap(j:any):any{
  let x=j;
  for(let n=0;n<4;n++){
    if(Array.isArray(x))return x;
    if(!x||typeof x!=="object")return x;
    if(first(x,["title","name"])&&!Array.isArray(x.tracks)&&!Array.isArray(x.items))return x; // satu lagu
    const k=["result","results","data","tracks","items","songs","playlist"].find(k=>x[k]!=null);
    if(!k)return x;
    x=x[k];
  }
  return x;
}
function toTracks(j:any):Track[]{
  const x=unwrap(j);
  const arr=Array.isArray(x)?x:x&&typeof x==="object"?[x]:[];
  const seen=new Set<string>();
  return arr.map(toTrack).filter((t):t is Track=>!!t&&!seen.has(t.id)&&!!seen.add(t.id));
}

// ---------- API publik ----------
export type SpotifyKind="track"|"playlist"|null;
export function spotifyKind(q:string):SpotifyKind{
  if(!/^https?:\/\/open\.spotify\.com\//i.test(q.trim()))return null;
  if(/\/playlist\//i.test(q))return"playlist";
  if(/\/track\//i.test(q))return"track";
  return null;
}
export async function searchTracks(q:string,limit=24):Promise<Track[]>{
  return toTracks(await call("spotifyplay","q",q)).slice(0,limit);
}
export async function trackFromUrl(url:string):Promise<Track[]>{
  return toTracks(await call("spotify","url",url));
}
export async function playlistFromUrl(url:string):Promise<Track[]>{
  return toTracks(await call("spotifypl","url",url,300));
}
// Ambil link audio baru (link unduhan bisa kedaluwarsa), tanpa cache.
export async function resolveAudio(o:{sid?:string;title?:string;artist?:string}):Promise<string|undefined>{
  if(o.sid){
    const t=toTracks(await call("spotify","url",`https://open.spotify.com/track/${o.sid}`,0))[0];
    if(t?.audio)return t.audio;
  }
  if(o.title){
    const list=toTracks(await call("spotifyplay","q",`${o.title} ${o.artist||""}`.trim(),0));
    const hit=list.find(t=>t.audio&&t.title.toLowerCase()===o.title!.toLowerCase())||list.find(t=>t.audio);
    return hit?.audio;
  }
}

export async function lyrics(artist:string,title:string):Promise<string|null>{
  const a=artist.split(",")[0].trim();
  const opt={next:{revalidate:86400},signal:AbortSignal.timeout(8000)};
  const r=await fetch(`https://lrclib.net/api/get?artist_name=${enc(a)}&track_name=${enc(title)}`,opt);
  if(r.ok){const j=await r.json();if(j.plainLyrics)return j.plainLyrics}
  const s=await fetch(`https://lrclib.net/api/search?q=${enc(a+" "+title)}`,opt);
  if(s.ok){const l=await s.json();const h=Array.isArray(l)&&l.find((x:any)=>x.plainLyrics);if(h)return h.plainLyrics}
  return null;
}
