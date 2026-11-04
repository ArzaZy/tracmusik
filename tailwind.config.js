const c=(v)=>`rgb(var(--${v}) / <alpha-value>)`;
module.exports={content:["./app/**/*.tsx","./components/**/*.tsx"],theme:{extend:{colors:{trac:c("accent"),fg:c("fg"),bg:c("bg"),cell:c("cell"),fill:c("fill")}}},plugins:[]};
