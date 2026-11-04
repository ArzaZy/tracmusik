"use client";
import {usePlayer} from "@/lib/store";
export default function Toast(){const {toast}=usePlayer();if(!toast)return null;
 return <div className="glass fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm">{toast}</div>}
