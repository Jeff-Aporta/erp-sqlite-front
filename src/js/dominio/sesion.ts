/**
 * sesion.ts — sesión del usuario contra el API (DER identity). Dominio sin componentes.
 *
 * - Un solo cliente del SDK (`../api/front.js`, vendorizado del repo `api`) para toda la app.
 * - DER autentica solo por `Authorization: Bearer`: el token se guarda en `sessionStorage`, o en
 *   `localStorage` si el usuario marcó «Recordar». Lo guardado se PARSEA con `SesionSchema`.
 * - La base del API sale de `<meta name="erp-api" content="…">`; por defecto `/api` (mismo origen
 *   detrás de nginx, sin CORS).
 * - Cambios de sesión se avisan con `alCambiar()`; un 401 del API cierra la sesión local.
 */
import { ApiError, createClient } from '../api/front.js';
import { SesionSchema, type Sesion } from '../consts/schemas/componentes.schemas.js';

const CLAVE = 'erp:sesion';
const avisos = new EventTarget();

type Cliente = ReturnType<typeof createClient>;
let cliente: Cliente;
let actual: Sesion | null = null;

function baseApi(): string {
  const meta = globalThis.document?.querySelector('meta[name="erp-api"]')?.getAttribute('content');
  return meta?.trim() || '/api';
}

function almacenes(): Storage[] {
  const out: Storage[] = [];
  try { out.push(sessionStorage); } catch { /* sin storage (modo privado estricto) */ }
  try { out.push(localStorage); } catch { /* idem */ }
  return out;
}

const vigente = (s: Sesion) => Date.parse(s.expira) > Date.now();

function leer(): Sesion | null {
  for (const st of almacenes()) {
    const texto = st.getItem(CLAVE);
    if (texto === null) continue;
    let crudo: unknown = null;
    try { crudo = JSON.parse(texto); } catch { /* corrupto: se descarta abajo */ }
    const r = SesionSchema.safeParse(crudo);
    if (r.success && vigente(r.data)) return r.data;
    st.removeItem(CLAVE); // vencida, corrupta o con otra forma
  }
  return null;
}

function guardar(s: Sesion | null): void {
  for (const st of almacenes()) st.removeItem(CLAVE);
  if (s) (s.recordar ? localStorage : sessionStorage).setItem(CLAVE, JSON.stringify(s));
}

function fijar(s: Sesion | null): void {
  actual = s;
  guardar(s);
  cliente.setToken(s?.token ?? null);
  avisos.dispatchEvent(new CustomEvent('cambio', { detail: s }));
}

/** (Re)crea el cliente. La app no lo llama: existe para pruebas (fetch y base inyectables). */
export function configurar(opciones: { baseUrl?: string; fetch?: typeof fetch } = {}): void {
  actual = leer();
  cliente = createClient({ baseUrl: opciones.baseUrl ?? baseApi(), fetch: opciones.fetch, token: actual?.token });
}
configurar();

/** Sesión vigente o `null`. */
export function sesion(): Sesion | null {
  if (actual && !vigente(actual)) fijar(null);
  return actual;
}

/** Suscribe a cambios de sesión; devuelve la función para desuscribirse. */
export function alCambiar(fn: (s: Sesion | null) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent<Sesion | null>).detail);
  avisos.addEventListener('cambio', h);
  return () => avisos.removeEventListener('cambio', h);
}

/** Login. Lanza `ApiError` (401 credenciales, 429 bloqueado) para que la vista lo muestre. */
export async function entrar(usuario: string, password: string, recordar: boolean): Promise<Sesion> {
  const r = await cliente.login(usuario, password);
  const s = SesionSchema.parse({ token: r.token, expira: r.expira, usuario: r.usuario, recordar });
  fijar(s);
  return s;
}

/** Cierra la sesión (o todas, en todos los dispositivos). El estado local se limpia aunque el API falle. */
export async function salir(todas = false): Promise<void> {
  try {
    if (actual) await (todas ? cliente.logoutAll() : cliente.logout());
  } catch { /* token ya inválido o API caído: igual se cierra local */ }
  fijar(null);
}

/** Llamada autenticada: un 401 significa token revocado/expirado y cierra la sesión local. */
export async function api<T>(fn: (c: Cliente) => Promise<T>): Promise<T> {
  try {
    return await fn(cliente);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401 && actual) fijar(null);
    throw e;
  }
}

/** Mensaje legible para un error del API (lo que muestra el login). */
export function mensajeError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return 'Usuario o contraseña incorrectos';
    if (e.status === 429) return 'Demasiados intentos: espera unos minutos';
    // DER responde `{ error: "<mensaje legible>" }`; el SDK lo deja en `code`.
    if (e.status === 400) return e.code;
    return `Error del servidor (${e.status})`;
  }
  return 'No se pudo contactar el servidor';
}
