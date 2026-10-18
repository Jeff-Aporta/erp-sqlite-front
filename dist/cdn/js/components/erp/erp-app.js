import{crearComponente as p,define as l,html as r}from"../../base/componente.js?v=38pejm";import{alCambiar as m,salir as d,sesion as u}from"../../dominio/sesion.js?v=6m927q";const e={hola:"erp-hola",login:"erp-login"},t=new Set;m(()=>{for(const s of t)s.isConnected?s.props={}:t.delete(s)});const g=p(import.meta.url,"erp-app",{vista:"hola"},(s,o,n)=>{t.add(n);const a=u(),i=a?o.vista!=="login"&&e[o.vista]?o.vista:"hola":"login",c=document.createElement(e[i]);s.append(r`
    <header class="barra" part="barra">
      <strong class="marca">ERP SQLite</strong>
      <div class="acciones">
        ${a?r`
          <span class="usuario" part="usuario"><iswc-icon icon="mdi:account-circle"></iswc-icon> ${a.usuario.nombre||a.usuario.iusuario}</span>
          <iswc-button id="salir" variant="text" oniswc-click=${()=>d()}>
            <iswc-icon slot="start" icon="mdi:logout"></iswc-icon> Salir
          </iswc-button>
        `:null}
        <iswc-theme-toggle scope="root"></iswc-theme-toggle>
      </div>
    </header>
    <main class="vista" part="vista" data-vista=${i}>${c}</main>
  `)});l("erp-app",g);
