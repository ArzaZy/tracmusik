"use client";
import {createContext,useContext,useEffect,useRef,useState} from "react";
import type {Track,Playlist} from "./types";
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
 const [theme,setTheme]=usePersist<{accent:string;mode?:string}>("tm_theme",{accent:"#FF2D55",mode:"auto"});
 const [toast,setToast]=useState("");
 const cur:Track|undefined=queue[i];
 const [user,setUser]=useState<any>(null);const synced=useRef(false);
 const mg=<T extends {id:string}>(a:T[],b:T[])=>[...a,...b.filter(y=>!a.some(x=>x.id===y.id))];
 useEffect(()=>{if(!sb)return;sb.auth.getSession().then(({data})=>setUser(data.session?.user??null));
  const {data:l}=sb.auth.onAuthStateChange((_,s)=>{setUser(s?.user??null);synced.current=false});return()=>l.subscription.unsubscribe()},[]);
 useEffect(()=>{if(!sb||!user)return;sb.from("user_data").select("data").eq("user_id",user.id).maybeSingle().then(({data,error}:any)=>{
  if(error){setToast("Sinkronisasi gagal");return}const d=data?.data||{};
  setLikes(l=>mg(l,d.likes||[]));setRecent(l=>mg(l,d.recent||[]).slice(0,30));setPlaylists(l=>mg(l,d.playlists||[]));
  if(d.theme)setTheme(d.theme);synced.current=true;setToast("Tersinkron")})},[user?.id]);
 useEffect(()=>{if(!sb||!user||!synced.current)return;
  const x=setTimeout(()=>{sb!.from("user_data").upsert({user_id:user.id,data:{likes,recent,playlists,theme},updated_at:new Date().toISOString()}).then(({error}:any)=>{if(error)setToast("Sinkronisasi gagal")})},1500);
  return()=>clearTimeout(x)},[likes,recent,playlists,theme]);
 const signOut=async()=>{synced.current=false;await sb?.auth.signOut();setLikes([]);setRecent([]);setPlaylists([]);setToast("Keluar")};
 useEffect(()=>{const h=(theme.accent||"#FF2D55").replace("#","");const n=parseInt(h.length===3?h.replace(/./g,"$&$&"):h,16);const r=document.documentElement;
  r.style.setProperty("--accent",`${(n>>16)&255} ${(n>>8)&255} ${n&255}`);r.dataset.mode=theme.mode||"auto"},[theme]);
 useEffect(()=>{if(!toast)return;const x=setTimeout(()=>setToast(""),2200);return()=>clearTimeout(x)},[toast]);
 const retried=useRef(false);
 const resolve=async(t:Track):Promise<string|undefined>=>{try{const q=new URLSearchParams({title:t.title,artist:t.artist});if(t.sid)q.set("sid",t.sid);const j=await (await fetch("/api/resolve?"+q)).json();return j.audio||undefined}catch{return undefined}};
 const patch=(id:string,audio:string)=>setQueue(q=>q.map(x=>x.id===id?{...x,audio}:x));
 useEffect(()=>{const el=a.current;if(!el||!cur)return;let dead=false;retried.current=false;
  (async()=>{let src=cur.audio;if(!src){setPlaying(false);src=await resolve(cur);if(src&&!dead)patch(cur.id,src)}
   if(dead)return;if(!src){setToast("Audio tidak tersedia");return}
   el.src=src;el.play().then(()=>setPlaying(true)).catch(()=>setPlaying(false))})();
  setRecent(r=>[cur,...r.filter(x=>x.id!==cur.id)].slice(0,30));return()=>{dead=true}},[cur?.id]);
 // link unduhan bisa kedaluwarsa: coba ambil link baru sekali sebelum menyerah
 const failed=async()=>{const el=a.current;if(!el||!cur)return;if(retried.current){setToast("Gagal memutar audio");setPlaying(false);return}
  retried.current=true;const src=await resolve(cur);if(!src){setToast("Gagal memutar audio");setPlaying(false);return}
  patch(cur.id,src);el.src=src;el.play().then(()=>setPlaying(true)).catch(()=>setPlaying(false))};
 useEffect(()=>{if(a.current)a.current.volume=vol},[vol]);
 useEffect(()=>{if(!cur||!("mediaSession" in navigator))return;navigator.mediaSession.metadata=new MediaMetadata({title:cur.title,artist:cur.artist,album:cur.album,artwork:cur.cover?[{src:cur.cover,sizes:"512x512"}]:[]})},[cur?.id]);
 const play=(list:Track[],idx:number)=>{if(!list[idx])return;setQueue(list);setI(idx)};
 const toggle=()=>{const el=a.current;if(!el||!cur)return;if(el.paused){el.play();setPlaying(true)}else{el.pause();setPlaying(false)}};
 const next=()=>{if(!queue.length)return;if(shuffle)return setI(Math.floor(Math.random()*queue.length));
  if(i+1<queue.length)setI(i+1);else if(repeat==="all")setI(0);else setPlaying(false)};
 const prev=()=>{if(t>3&&a.current){a.current.currentTime=0;return}setI(Math.max(0,i-1))};
 const seek=(v:number)=>{if(a.current)a.current.currentTime=v};
 const tog=<T extends {id:string}>(set:React.Dispatch<React.SetStateAction<T[]>>,x:T,on:string,off:string)=>set(l=>{const h=l.some(y=>y.id===x.id);setToast(h?off:on);return h?l.filter(y=>y.id!==x.id):[x,...l]});
 const like=(x:Track)=>tog(setLikes,x,"Ditambah ke Liked","Dihapus dari Liked");
 const createPl=(name:string,tracks:Track[]=[])=>{const n=name.trim();if(!n)return;const id=uid();setPlaylists(l=>[{id,name:n,tracks},...l]);setToast("Playlist dibuat");return id};
 const renamePl=(id:string,name:string)=>{if(name.trim())setPlaylists(l=>l.map(p=>p.id===id?{...p,name:name.trim()}:p))};
 const delPl=(id:string)=>{setPlaylists(l=>l.filter(p=>p.id!==id));setToast("Playlist dihapus")};
 const addToPl=(id:string,x:Track)=>setPlaylists(l=>l.map(p=>{if(p.id!==id)return p;if(p.tracks.some(y=>y.id===x.id)){setToast("Sudah ada di playlist");return p}setToast("Ditambah ke "+p.name);return{...p,tracks:[...p.tracks,x]}}));
 const rmFromPl=(id:string,tid:string)=>setPlaylists(l=>l.map(p=>p.id===id?{...p,tracks:p.tracks.filter(y=>y.id!==tid)}:p));
 const ended=()=>{if(repeat==="one"&&a.current){a.current.currentTime=0;a.current.play()}else next()};
 useEffect(()=>{if(!("mediaSession" in navigator))return;const m=navigator.mediaSession;
  m.setActionHandler("play",()=>a.current?.play());m.setActionHandler("pause",()=>a.current?.pause());m.setActionHandler("nexttrack",next);m.setActionHandler("previoustrack",prev)});
 useEffect(()=>{const k=(e:KeyboardEvent)=>{const tg=e.target as HTMLElement;if(["INPUT","TEXTAREA"].includes(tg.tagName))return;
  if(e.code==="Space"){e.preventDefault();toggle()}if(e.key==="n")next();if(e.key==="p")prev()};
  window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k)});
 return <Ctx.Provider value={{queue,i,cur,playing,t,d,vol,setVol,shuffle,setShuffle,repeat,setRepeat,likes,recent,playlists,theme,setTheme,play,toggle,next,prev,seek,like,createPl,renamePl,delPl,addToPl,rmFromPl,setI,toast,user,signOut}}>
  {children}
  <audio ref={a} onTimeUpdate={e=>setT(e.currentTarget.currentTime)} onLoadedMetadata={e=>setD(e.currentTarget.duration)} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={ended} onError={failed} playsInline/>
 </Ctx.Provider>;
}
