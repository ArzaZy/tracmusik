"use client";
import {usePlayer} from "@/lib/store";
const accents=[["Violet","#8b5cf6"],["Fuchsia","#d946ef"],["Sky","#38bdf8"],["Emerald","#34d399"],["Rose","#fb7185"],["Amber","#fbbf24"]];
const bgs=[["Midnight","#0a0a0f"],["AMOLED","#000000"],["Charcoal","#16161d"],["Plum","#120a1c"]];
export default function Settings(){
 const p=usePlayer();const Sw=({l,c,on,fn}:any)=>(<button onClick={fn} className={`flex flex-col items-center gap-1 text-xs ${on?"text-white":"text-white/50"}`}><span className={`h-12 w-12 rounded-full border-2 ${on?"border-white":"border-white/10"}`} style={{background:c}}/>{l}</button>);
 return(<><h1 className="mb-6 text-2xl font-bold">Appearance Studio</h1>
  <h2 className="mb-3 text-sm text-white/60">Warna aksen</h2><div className="mb-8 flex flex-wrap gap-4">{accents.map(([l,c])=><Sw key={c} l={l} c={c} on={p.theme.accent===c} fn={()=>p.setTheme({...p.theme,accent:c})}/>)}</div>
  <h2 className="mb-3 text-sm text-white/60">Latar</h2><div className="flex flex-wrap gap-4">{bgs.map(([l,c])=><Sw key={c} l={l} c={c} on={p.theme.bg===c} fn={()=>p.setTheme({...p.theme,bg:c})}/>)}</div></>);
}
