import{crearComponente as p,define as c,emitir as g,html as u}from"../../../js/base/componente.js?v=6ij5d7";import{entrar as b,mensajeError as d}from"../../../js/dominio/sesion.js?v=wxs269";const E=p(import.meta.url,"erp-login",{aviso:""},(o,i,s)=>{const n=async t=>{const e=t.currentTarget,{username:a,password:m,remember:l}=t.detail;e.removeAttribute("error"),e.busy=!0;try{const r=await b(a.trim(),m,l);g(s,"erp-login-ok",{usuario:r.usuario})}catch(r){e.setAttribute("error",d(r))}finally{e.busy=!1}};o.append(u`
    <iswc-login
      id="login"
      part="login"
      heading="ERP SQLite"
      subtitle="Administrador de bases SQLite"
      provider="DER"
      oniswc-login-submit=${n}
    ></iswc-login>
  `),i.aviso&&o.querySelector("#login")?.setAttribute("notice",i.aviso)});c("erp-login",E);
