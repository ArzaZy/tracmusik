import type {Track,Album,Artist,MusicProvider} from "./types";
const enc=encodeURIComponent;
const J=async(u:string)=>{const r=await fetch(u,{next:{revalidate:3600}});if(!r.ok)throw new Error("api "+r.status);return r.json()};
const art=(u?:string)=>(u||"").replace("100x100","400x400");
const mapT=(x:any):Track=>({id:"it"+x.trackId,title:x.trackName,artist:x.artistName,artistId:String(x.artistId),album:x.collectionName||"",albumId:x.collectionId&&String(x.collectionId),cover:art(x.artworkUrl100),audio:x.previewUrl,source:"itunes"});
const IT="https://itunes.apple.com";
export const itunes:MusicProvider={async search(q,l=24){const j=await J(`${IT}/search?term=${enc(q)}&media=music&entity=song&limit=${l}`);return j.results.filter((x:any)=>x.trackId).map(mapT)}};
// Jamendo: audio streaming penuh berlisensi Creative Commons. Butuh JAMENDO_CLIENT_ID (server-only).
export const jamendo:MusicProvider={async search(q,l=12){const id=process.env.JAMENDO_CLIENT_ID;if(!id)return[];
 const j=await J(`https://api.jamendo.com/v3.0/tracks/?client_id=${id}&format=json&limit=${l}&search=${enc(q)}&audioformat=mp31`);
 return j.results.filter((x:any)=>x.audio).map((x:any):Track=>({id:"jm"+x.id,title:x.name,artist:x.artist_name,album:x.album_name||"",cover:x.image||x.album_image||"",audio:x.audio,source:"jamendo"}))}};
export const provider:MusicProvider={async search(q,l){const r=await Promise.allSettled([jamendo.search(q,12),itunes.search(q,l)]);
 const out=r.flatMap(x=>x.status==="fulfilled"?x.value:[]);if(!out.length&&r.every(x=>x.status==="rejected"))throw new Error("all failed");return out}};
export async function searchAlbums(q:string):Promise<Album[]>{const j=await J(`${IT}/search?term=${enc(q)}&media=music&entity=album&limit=24`);
 return j.results.filter((x:any)=>x.collectionId).map((x:any)=>({id:String(x.collectionId),title:x.collectionName,artist:x.artistName,artistId:String(x.artistId),cover:art(x.artworkUrl100),year:x.releaseDate?.slice(0,4)}))}
export async function searchArtists(q:string):Promise<Artist[]>{const j=await J(`${IT}/search?term=${enc(q)}&media=music&entity=musicArtist&limit=24`);
 return j.results.filter((x:any)=>x.artistId).map((x:any)=>({id:String(x.artistId),name:x.artistName,genre:x.primaryGenreName}))}
export async function lookupAlbum(id:string){const j=await J(`${IT}/lookup?id=${enc(id)}&entity=song`);const [a,...t]=j.results;if(!a)return null;
 return{album:{id,title:a.collectionName,artist:a.artistName,artistId:String(a.artistId),cover:art(a.artworkUrl100),year:a.releaseDate?.slice(0,4)} as Album,tracks:t.filter((x:any)=>x.trackId).map(mapT)}}
export async function lookupArtist(id:string){const [s,al]=await Promise.all([J(`${IT}/lookup?id=${enc(id)}&entity=song&limit=25`),J(`${IT}/lookup?id=${enc(id)}&entity=album&limit=20`)]);
 const a=s.results[0];if(!a)return null;
 return{artist:{id,name:a.artistName,genre:a.primaryGenreName} as Artist,tracks:s.results.slice(1).filter((x:any)=>x.trackId).map(mapT),
  albums:al.results.slice(1).filter((x:any)=>x.collectionId).map((x:any):Album=>({id:String(x.collectionId),title:x.collectionName,artist:x.artistName,cover:art(x.artworkUrl100),year:x.releaseDate?.slice(0,4)}))}}
export async function lyrics(artist:string,title:string):Promise<string|null>{
 const r=await fetch(`https://lrclib.net/api/get?artist_name=${enc(artist)}&track_name=${enc(title)}`,{next:{revalidate:86400}});
 if(!r.ok)return null;const j=await r.json();return j.plainLyrics||null}
