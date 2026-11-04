import {provider} from "@/lib/providers";import {Row,Artists,Recent,ForYou} from "@/components/ui";
export const revalidate=3600;
const safe=(q:string)=>provider.search(q,18).catch(()=>null);
export default async function Home(){
 const [a,b,c]=await Promise.all([safe("top hits 2026"),safe("new music friday"),safe("indonesia pop")]);
 if(!a&&!b&&!c)return <p className="py-20 text-center text-white/50">Gagal memuat musik. Coba refresh nanti.</p>;
 const seen=new Set<string>();const arts=[...(a||[]),...(c||[])].filter(t=>t.artistId&&t.source==="itunes"&&!seen.has(t.artistId)&&seen.add(t.artistId)).slice(0,12).map(t=>({id:t.artistId!,name:t.artist}));
 return(<><h1 className="mb-6 text-2xl font-bold">Discover Music. <span className="text-trac">Feel Everything.</span></h1>
  <Recent/><ForYou/><Row title="Trending Music" tracks={a||[]}/><Artists title="Popular Artists" artists={arts}/><Row title="New Releases" tracks={b||[]}/><Row title="Playlist Pilihan: Indonesia Pop" tracks={c||[]}/></>);
}
