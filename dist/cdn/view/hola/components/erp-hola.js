import{crearComponente as d,define as l}from"../../../js/base/componente.js?v=6ij5d7";import{sesion as p}from"../../../js/dominio/sesion.js?v=6m927q";const c=a=>String(a??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s]),b=a=>a<1024?a+" B":a<1048576?(a/1024).toFixed(1)+" KB":(a/1048576).toFixed(1)+" MB",g=d(import.meta.url,"erp-hola",{bds:[],cargando:!0},(a,s,r)=>{const e=r;if(e._cargado||(e._cargado=!0,setTimeout(()=>{m(r)},0)),s.cargando){a.innerHTML='<section class="panel" part="panel"><div class="cargando"><iswc-spinner></iswc-spinner> Cargando bases\u2026</div></section>';return}const n=(s.bds??[]).map(t=>`
      <iswc-card>
        <span slot="header">${c(t.nombre)}</span>
        <div class="stats">
          <div class="stat"><strong>${t.tablas??"\u2014"}</strong><span>tablas</span></div>
          <div class="stat"><strong>${t.vistas??"\u2014"}</strong><span>vistas</span></div>
          <div class="stat"><strong>${t.bytes!=null?c(b(t.bytes)):"\u2014"}</strong><span>tama\xF1o</span></div>
        </div>
      </iswc-card>`).join("");a.innerHTML=`
      <section class="panel" part="panel">
        <header class="panel-head">
          <h1 class="titulo">Bases de datos</h1>
          <p class="lede">Bases SQLite administradas por el API. Reusa el kit <code>iswc</code>.</p>
        </header>
        ${s.error?`<iswc-callout color="danger">${c(s.error)}</iswc-callout>`:""}
        <div class="grid">${n||'<p class="vacio">No hay bases todav\xEDa.</p>'}</div>
      </section>`});async function m(a){const s=p();if(!s){a.props={bds:[],cargando:!1};return}const r={authorization:"Bearer "+s.token};try{const e=await fetch("/api/db-admin/databases",{headers:r});if(!e.ok)throw new Error("HTTP "+e.status);const n=await e.json(),t=await Promise.all((n.databases??[]).map(async o=>{try{const i=await(await fetch("/api/db-admin/"+encodeURIComponent(o)+"/stats",{headers:r})).json();return{nombre:o,tablas:i.tables,vistas:i.views,bytes:i.sizeBytes}}catch{return{nombre:o}}}));a.props={bds:t,cargando:!1}}catch(e){a.props={bds:[],cargando:!1,error:e.message}}}l("erp-hola",g);
