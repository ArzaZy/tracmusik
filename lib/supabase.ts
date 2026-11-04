import {createClient} from "@supabase/supabase-js";
const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// anon key memang publik (dijaga RLS). JANGAN pernah pakai service_role di frontend.
export const sb=u&&k?createClient(u,k):null;
