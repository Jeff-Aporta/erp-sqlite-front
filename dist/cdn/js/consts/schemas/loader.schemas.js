import{z as o}from"../../base/zod.js?v=i38toz";const t=()=>o.custom(e=>typeof e=="function"),p=o.object({registerApp:t(),load:t()}).passthrough();export{p as LoaderAppSchema};
