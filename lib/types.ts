export type Track={id:string;title:string;artist:string;album:string;cover:string;audio?:string;sid?:string;source:string};
export type Playlist={id:string;name:string;tracks:Track[]};
