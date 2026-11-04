"use client";
import {useState} from "react";import {sb} from "@/lib/supabase";import {usePlayer} from "@/lib/store";import {Title,Empty} from "@/components/ui";
const input="mb-3 h-12 w-full rounded-[14px] bg-fill/20 px-4 text-[17px] outline-none placeholder:text-fg/40 focus:ring-2 focus:ring-trac/60";
export default function Login(){
 const p=usePlayer();const [e,setE]=useState("");const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);
 if(!sb)return <Empty>Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di env.</Empty>;
 if(p.user)return(<div className="mx-auto max-w-sm"><Title>Akun</Title><div className="mb-4 rounded-[22px] bg-cell p-4"><p className="truncate text-[16px]">{p.user.email}</p><p className="mt-1 text-[13px] text-fg/50">Library, playlist, dan tema tersinkron otomatis.</p></div>
  <button onClick={p.signOut} className="h-12 w-full rounded-[14px] bg-cell text-[17px] font-medium text-red-500 active:opacity-60">Keluar</button></div>);
 const send=async()=>{if(!e.includes("@"))return setMsg("Email tidak valid");setBusy(true);
  const {error}=await sb!.auth.signInWithOtp({email:e,options:{emailRedirectTo:location.origin}});setBusy(false);setMsg(error?"Gagal: "+error.message:"Cek email kamu, klik link masuknya.")};
 const google=()=>sb!.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin}});
 return(<div className="mx-auto max-w-sm"><Title>Masuk</Title>
  <input value={e} onChange={x=>setE(x.target.value)} type="email" placeholder="email@kamu.com" className={input}/>
  <button disabled={busy} onClick={send} className="mb-3 h-12 w-full rounded-[14px] bg-trac text-[17px] font-semibold text-white active:opacity-80 disabled:opacity-50">{busy?"Mengirim…":"Kirim link masuk"}</button>
  <button onClick={google} className="h-12 w-full rounded-[14px] bg-cell text-[17px] font-medium active:opacity-60">Lanjut dengan Google</button>
  {msg&&<p className="mt-4 text-center text-[14px] text-fg/65">{msg}</p>}</div>);
}
