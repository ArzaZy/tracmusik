"use client";
export default function Slider({value,max,onChange,className=""}:{value:number;max:number;onChange:(v:number)=>void;className?:string}){
 const m=isFinite(max)&&max>0?max:1;const v=Math.min(isFinite(value)?value:0,m);
 return <input type="range" min={0} max={m} step="any" value={v} onChange={e=>onChange(+e.target.value)} className={"ios-range "+className} style={{["--p" as any]:(v/m*100)+"%"}} aria-label="Slider"/>;
}
