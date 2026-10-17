/**
 * <erp-app> — shell de la app: barra (marca, usuario, tema, salir) y la vista activa.
 *
 * La app solo conoce el shell de cada vista (SHELLS). Las vistas se cargan por el registrador
 * (`erpLoader.min.js`); aquí solo se monta su tag. Sin sesión vigente la vista es siempre `login`:
 * el front no protege datos (eso lo hace el API con 401), solo evita mostrar pantallas inútiles.
 */
import { crearComponente, define, html } from '../../base/componente.js';
import type { ErpAppProps } from '../../consts/schemas/componentes.schemas.js';
import { alCambiar, salir, sesion } from '../../dominio/sesion.js';

/** Vista → tag del shell de esa vista (cada vista tiene UN shell). */
const SHELLS: Record<string, string> = { hola: 'erp-hola', login: 'erp-login' };

/** Apps montadas: un cambio de sesión (login, logout, 401) las repinta. */
const montadas = new Set<HTMLElement & { props: Partial<ErpAppProps> }>();
alCambiar(() => { for (const app of montadas) if (app.isConnected) app.props = {}; else montadas.delete(app); });

const ErpApp = crearComponente<ErpAppProps>(import.meta.url, 'erp-app', { vista: 'hola' }, (root, props, host) => {
  montadas.add(host as HTMLElement & { props: Partial<ErpAppProps> });
  const s = sesion();
  const vista = !s ? 'login' : props.vista !== 'login' && SHELLS[props.vista] ? props.vista : 'hola';
  const shell = document.createElement(SHELLS[vista]!);
  root.append(html`
    <header class="barra" part="barra">
      <strong class="marca">ERP SQLite</strong>
      <div class="acciones">
        ${s ? html`
          <span class="usuario" part="usuario"><iswc-icon icon="mdi:account-circle"></iswc-icon> ${s.usuario.nombre || s.usuario.iusuario}</span>
          <iswc-button id="salir" variant="text" oniswc-click=${() => salir()}>
            <iswc-icon slot="start" icon="mdi:logout"></iswc-icon> Salir
          </iswc-button>
        ` : null}
        <iswc-theme-toggle scope="root"></iswc-theme-toggle>
      </div>
    </header>
    <main class="vista" part="vista" data-vista=${vista}>${shell}</main>
  `);
});

define('erp-app', ErpApp);
