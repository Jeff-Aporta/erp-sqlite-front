/**
 * <erp-login> — puerta de acceso (shell de la vista `login`).
 *
 * Envuelve `<iswc-login>` del kit (que no habla con el API: solo emite eventos) y lo conecta a la
 * sesión de la app (`src/js/dominio/sesion.ts`, DER identity). No valida credenciales: eso es del
 * server; aquí solo se muestra lo que responde (401 credenciales, 429 bloqueo por intentos).
 *
 * Eventos: `erp-login-ok { usuario }` al iniciar sesión.
 */
import { crearComponente, define, emitir, html } from '../../../src/js/base/componente.js';
import type { ErpLoginProps } from '../../../src/js/consts/schemas/componentes.schemas.js';
import { entrar, mensajeError } from '../../../src/js/dominio/sesion.js';

type Login = HTMLElement & { busy: boolean };
type Envio = { username: string; password: string; remember: boolean };

const ErpLogin = crearComponente<ErpLoginProps>(import.meta.url, 'erp-login', { aviso: '' }, (root, props, host) => {
  const enviar = async (e: Event) => {
    const login = e.currentTarget as Login;
    const { username, password, remember } = (e as CustomEvent<Envio>).detail;
    login.removeAttribute('error');
    login.busy = true;
    try {
      const s = await entrar(username.trim(), password, remember);
      emitir(host, 'erp-login-ok', { usuario: s.usuario });
    } catch (err) {
      login.setAttribute('error', mensajeError(err));
    } finally {
      login.busy = false;
    }
  };
  root.append(html`
    <iswc-login id="login" part="login" heading="ERP SQLite" subtitle="Administrador de bases SQLite" provider="DER"
      oniswc-login-submit=${enviar}></iswc-login>
  `);
  // Sin aviso no debe quedar `notice=""`: solo se pone cuando hay texto.
  if (props.aviso) root.querySelector('#login')?.setAttribute('notice', props.aviso);
});

define('erp-login', ErpLogin);
