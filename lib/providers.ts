import type {Track,Album,Artist,MusicProvider} from "./types";
const enc=encodeURIComponent;
const J=async(u:string)=>{const r=await fetch(u,{next:{revalidate:3600}});if(!r.ok)throw new Error("api "+r.status);return r.json()};

// Jamendo only — full tracks, Creative Commons licensed
export const jamendo:MusicProvider={
  async search(q,l=24){
    const id=process.env.JAMENDO_CLIENT_ID;
    if(!id)throw new Error("JAMENDO_CLIENT_ID not set");
    const j=await J(`https://api.jamendo.com/v3.0/tracks/?client_id=${id}&format=json&limit=${l}&search=${enc(q)}&audioformat=mp31`);
    return j.results.filter((x:any)=>x.audio).map((x:any):Track=>({id:"jm"+x.id,title:x.name,artist:x.artist_name,artistId:x.artist_id?String(x.artist_id):undefined,album:x.album_name||"",albumId:x.album_id?String(x.album_id):undefined,cover:x.image||x.album_image||"",audio:x.audio,source:"jamendo"}));
  }
};

export const provider:MusicProvider={
  async search(q,l){return jamendo.search(q,l)}
};

export async function searchAlbums(q:string):Promise<Album[]>{
  const id=process.env.JAMENDO_CLIENT_ID;
  if(!id)throw new Error("JAMENDO_CLIENT_ID not set");
  const j=await J(`https://api.jamendo.com/v3.0/albums/?client_id=${id}&format=json&limit=24&search=${enc(q)}&imagesize=400`);
  return j.results.filter((x:any)=>x.id).map((x:any):Album=>({id:"jm"+x.id,title:x.name,artist:x.artist_name,artistId:x.artist_id?String(x.artist_id):undefined,cover:x.image||"",year:x.releasedate?.slice(0,4)}));
}

export async function searchArtists(q:string):Promise<Artist[]>{
  const id=process.env.JAMENDO_CLIENT_ID;
  if(!id)throw new Error("JAMENDO_CLIENT_ID not set");
  const j=await J(`https://api.jamendo.com/v3.0/artists/?client_id=${id}&format=json&limit=24&search=${enc(q)}`);
  return j.results.filter((x:any)=>x.id).map((x:any):Artist=>({id:"jm"+x.id,name:x.name,genre:x.joindate?undefined:undefined}));
}

export async function lookupAlbum(id:string){
  const clientId=process.env.JAMENDO_CLIENT_ID;
  if(!clientId)return null;
  const realId=id.replace("jm","");
  const [aj,tj]=await Promise.all([
    J(`https://api.jamendo.com/v3.0/albums/?client_id=${clientId}&format=json&id=${realId}&imagesize=400`),
    J(`https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=50&album_id=${realId}&audioformat=mp31`)
  ]);
  const a=aj.results[0];if(!a)return null;
  return{
    album:{id,title:a.name,artist:a.artist_name,artistId:a.artist_id?String(a.artist_id):undefined,cover:a.image||"",year:a.releasedate?.slice(0,4)} as Album,
    tracks:tj.results.filter((x:any)=>x.audio).map((x:any):Track=>({id:"jm"+x.id,title:x.name,artist:x.artist_name,artistId:a.artist_id?String(a.artist_id):undefined,album:a.name,albumId:id,cover:x.image||a.image||"",audio:x.audio,source:"jamendo"}))
  };
}

export async function lookupArtist(id:string){
  const clientId=process.env.JAMENDO_CLIENT_ID;
  if(!clientId)return null;
  const realId=id.replace("jm","");
  const [ar,tr,al]=await Promise.all([
    J(`https://api.jamendo.com/v3.0/artists/?client_id=${clientId}&format=json&id=${realId}`),
    J(`https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=25&artist_id=${realId}&audioformat=mp31`),
    J(`https://api.jamendo.com/v3.0/albums/?client_id=${clientId}&format=json&limit=20&artist_id=${realId}&imagesize=400`)
  ]);
  const a=ar.results[0];if(!a)return null;
  return{
    artist:{id,name:a.name,genre:undefined} as Artist,
    tracks:tr.results.filter((x:any)=>x.audio).map((x:any):Track=>({id:"jm"+x.id,title:x.name,artist:a.name,artistId:id,album:x.album_name||"",cover:x.image||"",audio:x.audio,source:"jamendo"})),
    albums:al.results.filter((x:any)=>x.id).map((x:any):Album=>({id:"jm"+x.id,title:x.name,artist:a.name,artistId:id,cover:x.image||"",year:x.releasedate?.slice(0,4)}))
  };
}

export async function lyrics(artist:string,title:string):Promise<string|null>{
  const r=await fetch(`https://lrclib.net/api/get?artist_name=${enc(artist)}&track_name=${enc(title)}`,{next:{revalidate:86400}});
  if(!r.ok)return null;const j=await r.json();return j.plainLyrics||null;
}
