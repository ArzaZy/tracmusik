"use client";
import {createContext,useContext,useEffect,useRef,useState} from "react";
import type {Track,Album,Artist,Playlist} from "./types";
import {sb} from "./supabase";
const Ctx=createContext<any>(null);
export const usePlayer=()=>useContext(Ctx);
function usePersist<T>(k:string,init:T):[T,React.Dispatch<React.SetStateAction<T>>]{
 const [v,s]=useState<T>(init);const r=useRef(0);
 useEffect(()=>{try{const x=localStorage.getItem(k);if(x)s(JSON.parse(x))}catch{}r.current=1},[]);
 useEffect(()=>{if(r.current===0)return;if(r.current===1){r.current=2;return}try{localStorage.setItem(k,JSON.stringify(v))}catch{}},[v]);
 return[v,s];
}
const uid=()=>Math.random().toString(36).slice(2,10);
export function PlayerProvider({children}:{children:React.ReactNode}){
 const a=useRef<HTMLAudioElement>(null);
 const [queue,setQueue]=useState<Track[]>([]);const [i,setI]=useState(-1);
 const [playing,setPlaying]=useState(false);const [t,setT]=useState(0);const [d,setD]=useState(0);
 const [vol,setVol]=usePersist("tm_vol",0.8);const [shuffle,setShuffle]=useState(false);const [repeat,setRepeat]=useState<"off"|"all"|"one">("off");
 const [likes,setLikes]=usePersist<Track[]>("tm_likes",[]);const [recent,setRecent]=usePersist<Track[]>("tm_recent",[]);
 const [playlists,setPlaylists]=usePersist<Playlist[]>("tm_playlists",[]);
 const [albums,setAlbums]=usePersist<Album[]>("tm_albums",[]);const [artists,setArtists]=usePersist<Artist[]>("tm_artists",[]);
 const [theme,setTheme]=usePersist("tm_theme",{accent:"#8b5cf6",bg:"#0a0a0f"});
 const [toast,setToast]=useState("");
 const cur:Track|undefined=queue[i];
 const [user,setUser]=useState<any>(null);const synced=useRef(false);
 const mg=<T extends {id:string}>(a:T[],b:T[])=>[...a,...b.filter(y=>!a.some(x=>x.id===y.id))];
 useEffect(()=>{if(!sb)return;sb.auth.getSession().then(({data})=>setUser(data.session?.user??null));
  const {data:l}=sb.auth.onAuthStateChange((_,s)=>{setUser(s?.user??null);synced.current=false});return()=>l.subscription.unsubscribe()},[]);
 useEffect(()=>{if(!sb||!user)return;sb.from("user_data").select("data").eq("user_id",user.id).maybeSingle().then(({data,error}:any)=>{
  if(error){setToast("Sinkronisasi gagal");return}const d=data?.data||{};
  setLikes(l=>mg(l,d.likes||[]));setRecent(l=>mg(l,d.recent||[]).slice(0,30));setPlaylists(l=>mg(l,d.playlists||[]));setAlbums(l=>mg(l,d.albums||[]));setArtists(l=>mg(l,d.artists||[]));
  if(d.theme)setTheme(d.theme);synced.current=true;setToast("Tersinkron")})},[user?.id]);
 useEffect(()=>{if(!sb||!user||!synced.current)return;
  const x=setTimeout(()=>{sb!.from("user_data").upsert({user_id:user.id,data:{likes,recent,playlists,albums,artists,theme},updated_at:new Date().toISOString()}).then(({error}:any)=>{if(error)setToast("Sinkronisasi gagal")})},1500);
  return()=>clearTimeout(x)},[likes,recent,playlists,albums,artists,theme]);
 const signOut=async()=>{synced.current=false;await sb?.auth.signOut();setLikes([]);setRecent([]);setPlaylists([]);setAlbums([]);setArtists([]);setToast("Keluar")};
 useEffect(()=>{document.documentElement.style.setProperty("--accent",theme.accent);document.documentElement.style.setProperty("--bg",theme.bg)},[theme]);
 useEffect(()=>{if(!toast)return;const x=setTimeout(()=>setToast(""),2200);return()=>clearTimeout(x)},[toast]);
 useEffect(()=>{const el=a.current;if(!el||!cur?.audio)return;el.src=cur.audio;el.play().then(()=>setPlaying(true)).catch(()=>setPlaying(false));
  setRecent(r=>[cur,...r.filter(x=>x.id!==cur.id)].slice(0,30))},[cur?.id]);
 useEffect(()=>{if(a.current)a.current.volume=vol},[vol]);
 useEffect(()=>{if(!cur||!("mediaSession" in navigator))return;navigator.mediaSession.metadata=new MediaMetadata({title:cur.title,artist:cur.artist,album:cur.album,artwork:[{src:cur.cover,sizes:"400x400"}]})},[cur?.id]);
 const play=(list:Track[],idx:number)=>{const p=list.filter(x=>x.audio);const n=p.findIndex(x=>x.id===list[idx]?.id);if(n<0){setToast("Lagu ini tidak punya sumber audio legal");return}setQueue(p);setI(n)};
 const toggle=()=>{const el=a.current;if(!el||!cur)return;if(el.paused){el.play();setPlaying(true)}else{el.pause();setPlaying(false)}};
 const next=()=>{if(!queue.length)return;if(shuffle)return setI(Math.floor(Math.random()*queue.length));
  if(i+1<queue.length)setI(i+1);else if(repeat==="all")setI(0);else setPlaying(false)};
 const prev=()=>{if(t>3&&a.current){a.current.currentTime=0;return}setI(Math.max(0,i-1))};
 const seek=(v:number)=>{if(a.current)a.current.currentTime=v};
 const tog=<T extends {id:string}>(set:React.Dispatch<React.SetStateAction<T[]>>,x:T,on:string,off:string)=>set(l=>{const h=l.some(y=>y.id===x.id);setToast(h?off:on);return h?l.filter(y=>y.id!==x.id):[x,...l]});
 const like=(x:Track)=>tog(setLikes,x,"Ditambah ke Liked","Dihapus dari Liked");
 const saveAlbum=(x:Album)=>tog(setAlbums,x,"Album disimpan","Album dihapus");
 const favArtist=(x:Artist)=>tog(setArtists,x,"Artis difavoritkan","Artis dihapus");
 const createPl=(name:string)=>{const n=name.trim();if(!n)return;const id=uid();setPlaylists(l=>[{id,name:n,tracks:[]},...l]);setToast("Playlist dibuat");return id};
 const renamePl=(id:string,name:string)=>{if(name.trim())setPlaylists(l=>l.map(p=>p.id===id?{...p,name:name.trim()}:p))};
 const delPl=(id:string)=>{setPlaylists(l=>l.filter(p=>p.id!==id));setToast("Playlist dihapus")};
 const addToPl=(id:string,x:Track)=>setPlaylists(l=>l.map(p=>{if(p.id!==id)return p;if(p.tracks.some(y=>y.id===x.id)){setToast("Sudah ada di playlist");return p}setToast("Ditambah ke "+p.name);return{...p,tracks:[...p.tracks,x]}}));
 const rmFromPl=(id:string,tid:string)=>setPlaylists(l=>l.map(p=>p.id===id?{...p,tracks:p.tracks.filter(y=>y.id!==tid)}:p));
 const ended=()=>{if(repeat==="one"&&a.current){a.current.currentTime=0;a.current.play()}else next()};
 useEffect(()=>{const k=(e:KeyboardEvent)=>{const tg=e.target as HTMLElement;if(["INPUT","TEXTAREA"].includes(tg.tagName))return;
  if(e.code==="Space"){e.preventDefault();toggle()}if(e.key==="n")next();if(e.key==="p")prev()};
  window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k)});
 return <Ctx.Provider value={{queue,i,cur,playing,t,d,vol,setVol,shuffle,setShuffle,repeat,setRepeat,likes,recent,playlists,albums,artists,theme,setTheme,play,toggle,next,prev,seek,like,saveAlbum,favArtist,createPl,renamePl,delPl,addToPl,rmFromPl,setI,toast,user,signOut}}>
  {children}
  <audio ref={a} onTimeUpdate={e=>setT(e.currentTarget.currentTime)} onLoadedMetadata={e=>setD(e.currentTarget.duration)} onEnded={ended} onError={()=>setToast("Gagal memutar audio")}/>
 </Ctx.Provider>;
}
