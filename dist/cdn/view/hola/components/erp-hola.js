import{crearComponente as l,define as n,emitir as d,html as t}from"../../../js/base/componente.js?v=6ij5d7";import{caracteristicas as p,guionInicio as m}from"../utils/bienvenida.js?v=b52ca3";import"./erp-hola-mundo.js?v=k56bxq";const w=l(import.meta.url,"erp-hola",{modal:!1},(i,c,a)=>{const s=o=>{a.props.modal!==o&&(a.props={modal:o},d(a,"erp-hola-modal",{abierto:o}))},r=()=>s(!0),e=()=>s(!1);i.append(t`
      <section class="hero" part="hero" aria-labelledby="titulo">
        <p class="kicker">ERP SQLite · iswc</p>
        <erp-hola-mundo id="titulo"></erp-hola-mundo>
        <p class="lede">App de web components sobre el kit iswc-root: vanilla, Deno y un estándar común para todas las apps.</p>
        <div class="acciones">
          <iswc-button id="abrir-modal" color="brand" variant="filled" oniswc-click=${r}>
            Ver cómo está hecha
            <iswc-icon slot="end" icon="mdi:arrow-right"></iswc-icon>
          </iswc-button>
        </div>
        <div class="chips">
          <iswc-tag color="brand">Vanilla</iswc-tag>
          <iswc-tag>Deno</iswc-tag>
          <iswc-tag color="success">Zod</iswc-tag>
          <iswc-tag color="warning">SCSS</iswc-tag>
        </div>
      </section>
      <div class="tarjetas" part="tarjetas">
        ${p().map(o=>t`
          <iswc-card variant="outlined">
            <strong slot="header"><iswc-icon icon=${o.icono}></iswc-icon> ${o.titulo}</strong>
            <p>${o.texto}</p>
          </iswc-card>
        `)}
      </div>
      <iswc-dialog id="modal" label="Cómo está hecha" backdrop-variant="basic" light-dismiss ?open=${c.modal} oniswc-hide=${e}>
        <iswc-callout tone="info">
          <strong slot="title">Un componente = 4 archivos</strong>
          <code>.ts</code> (lógica) · <code>.scss</code> (estilos) · <code>.md</code> (ficha) · <code>.json</code> (demo), registrados una vez en <code>kit-tags.ts</code>.
        </iswc-callout>
        <iswc-code lang="bash" readonly value=${m()}></iswc-code>
        <iswc-button slot="footer" color="brand" id="cerrar-modal" oniswc-click=${e}>Entendido</iswc-button>
      </iswc-dialog>
    `)},(i,c,a)=>{if(c.modal===a.modal)return!1;const s=i.querySelector("#modal");return s?(s.open=c.modal,!0):!1});n("erp-hola",w);
