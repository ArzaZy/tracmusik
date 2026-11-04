"use client";
import {useState} from "react";import {sb} from "@/lib/supabase";import {usePlayer} from "@/lib/store";
export default function Login(){
 const p=usePlayer();const [e,setE]=useState("");const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);
 if(!sb)return <p className="py-20 text-center text-white/50">Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di env.</p>;
 if(p.user)return(<div className="mx-auto max-w-sm py-10 text-center"><h1 className="mb-2 text-2xl font-bold">Akun</h1><p className="mb-6 text-sm text-white/60">{p.user.email}</p>
  <p className="mb-6 text-xs text-white/40">Library, playlist, dan tema tersinkron otomatis.</p>
  <button onClick={p.signOut} className="glass rounded-full px-6 py-2 text-sm">Keluar</button></div>);
 const send=async()=>{if(!e.includes("@"))return setMsg("Email tidak valid");setBusy(true);
  const {error}=await sb!.auth.signInWithOtp({email:e,options:{emailRedirectTo:location.origin}});setBusy(false);setMsg(error?"Gagal: "+error.message:"Cek email kamu, klik link masuknya.")};
 const google=()=>sb!.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin}});
 return(<div className="mx-auto max-w-sm py-10"><h1 className="mb-6 text-2xl font-bold">Masuk ke TracMusic</h1>
  <input value={e} onChange={x=>setE(x.target.value)} type="email" placeholder="email@kamu.com" className="glass mb-3 w-full rounded-full px-5 py-3 text-sm outline-none"/>
  <button disabled={busy} onClick={send} className="mb-3 w-full rounded-full bg-trac py-3 text-sm font-medium disabled:opacity-50">{busy?"Mengirim…":"Kirim link masuk"}</button>
  <button onClick={google} className="glass w-full rounded-full py-3 text-sm">Lanjut dengan Google</button>
  {msg&&<p className="mt-4 text-center text-sm text-white/70">{msg}</p>}</div>);
}
