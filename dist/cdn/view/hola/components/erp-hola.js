import{crearComponente as l,define as d}from"../../../js/base/componente.js?v=fjq7v5";import{sesion as p}from"../../../js/dominio/sesion.js?v=6m927q";const i=a=>String(a??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s]),g=a=>a<1024?a+" B":a<1048576?(a/1024).toFixed(1)+" KB":(a/1048576).toFixed(1)+" MB",u=l(import.meta.url,"erp-hola",{bds:[],cargando:!0},(a,s,o)=>{const e=o;if(e._cargado||(e._cargado=!0,setTimeout(()=>{b(o)},0)),s.cargando){a.innerHTML='<section class="panel" part="panel"><div class="cargando"><iswc-spinner></iswc-spinner> Cargando bases\u2026</div></section>';return}const c=(s.bds??[]).map(t=>`
      <iswc-card>
        <span slot="header">${i(t.nombre)}</span>
        <div class="stats">
          <div class="stat"><strong>${t.tablas??"\u2014"}</strong><span>tablas</span></div>
          <div class="stat"><strong>${t.vistas??"\u2014"}</strong><span>vistas</span></div>
          <div class="stat"><strong>${t.bytes!=null?i(g(t.bytes)):"\u2014"}</strong><span>tama\xF1o</span></div>
        </div>
      </iswc-card>`).join("");a.innerHTML=`
      <section class="panel" part="panel">
        <header class="panel-head">
          <h1 class="titulo">Bases de datos</h1>
          <p class="lede">Bases SQLite administradas por el API. Reusa el kit <code>iswc</code>.</p>
        <div class="acc"><iswc-button id="consola" color="brand" variant="filled"><iswc-icon slot="start" icon="mdi:console"></iswc-icon> Consola SQL</iswc-button>
            <iswc-button id="catalogo" color="brand" variant="filled"><iswc-icon slot="start" icon="mdi:database-search"></iswc-icon> Cat\xE1logo</iswc-button></div>
        </header>
        ${s.error?`<iswc-callout color="danger">${i(s.error)}</iswc-callout>`:""}
        <div class="grid">${c||'<p class="vacio">No hay bases todav\xEDa.</p>'}</div>
      </section>
      <erp-consola></erp-consola>
      <erp-catalogo-plural></erp-catalogo-plural>
      <erp-catalogo-singular></erp-catalogo-singular>`;const r=o.querySelector("#consola");r&&r.addEventListener("iswc-click",()=>{window.dispatchEvent(new Event("erp-open-consola"))});const n=o.querySelector("#catalogo");n&&n.addEventListener("iswc-click",()=>{window.dispatchEvent(new Event("erp-open-catalogo"))})});async function b(a){const s=p();if(!s){a.props={bds:[],cargando:!1};return}const o={authorization:"Bearer "+s.token};try{const e=await fetch("/api/db-admin/databases",{headers:o});if(!e.ok)throw new Error("HTTP "+e.status);const c=await e.json(),r=await Promise.all((c.databases??[]).map(async n=>{try{const t=await(await fetch("/api/db-admin/"+encodeURIComponent(n)+"/stats",{headers:o})).json();return{nombre:n,tablas:t.tables,vistas:t.views,bytes:t.sizeBytes}}catch{return{nombre:n}}}));a.props={bds:r,cargando:!1}}catch(e){a.props={bds:[],cargando:!1,error:e.message}}}d("erp-hola",u);
