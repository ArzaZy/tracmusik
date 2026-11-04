"use client";
import {motion,AnimatePresence} from "framer-motion";
import {usePlayer} from "@/lib/store";
export default function Toast(){const {toast}=usePlayer();
 return <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center" style={{paddingTop:"max(env(safe-area-inset-top),.75rem)"}}>
  <AnimatePresence>{toast&&<motion.div key={toast} initial={{y:-40,opacity:0,scale:.9}} animate={{y:0,opacity:1,scale:1}} exit={{y:-30,opacity:0,scale:.95}} transition={{type:"spring",damping:22,stiffness:320}}
   className="glass rounded-full px-5 py-2.5 text-[15px] font-medium">{toast}</motion.div>}</AnimatePresence></div>}
