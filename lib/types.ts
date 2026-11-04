export type Track={id:string;title:string;artist:string;artistId?:string;album:string;albumId?:string;cover:string;audio?:string;source:string};
export type Album={id:string;title:string;artist:string;artistId?:string;cover:string;year?:string};
export type Artist={id:string;name:string;genre?:string};
export type Playlist={id:string;name:string;tracks:Track[]};
// Adapter: metadata & audio dipisah. Provider baru cukup implement interface ini lalu didaftarkan di lib/providers.ts
export interface MusicProvider{search(q:string,limit?:number):Promise<Track[]>}
