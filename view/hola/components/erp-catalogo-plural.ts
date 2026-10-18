/**
 * <erp-catalogo-plural> — Catálogo de objetos (tablas/vistas) de una base SQLite.
 * Lista tablas y vistas; cada tarjeta muestra nombre, tipo y conteo de filas.
 * Click -> emite erp-open-catalogo-singular con { db, table } para el singular.
 * Reusa el kit: iswc-card, iswc-button, iswc-icon, iswc-callout, iswc-tag, iswc-spinner.
 * API: GET /api/db-admin/databases + /api/db-admin/{db}/objects + POST .../rows (conteo).
 */
import { crearComponente, define } from '../../../src/js/base/componente.js';
import { sesion } from '../../../src/js/dominio/sesion.js';

interface Item { nombre: string; tipo: string; filas: number | null; }
interface Props { cargandoBds: boolean; bds: string[]; db: string; cargando: boolean; error: string; items: Item[]; }

let activo: (HTMLElement & { props: Partial<Props> }) | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('erp-open-catalogo', () => { if (activo) activo.props = { db: '' }; });
}
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"\']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "\'": '&#39;' }[c] as string));
const fmt = (n: number) => n.toLocaleString('es');

const ErpCatalogoPlural = crearComponente<Props>(
  import.meta.url,
  'erp-catalogo-plural',
  { cargandoBds: false, bds: [], db: '', cargando: false, error: '', items: [] },
  (root, props, host) => {
    activo = host as HTMLElement & { props: Partial<Props> };
    const h = host as unknown as { _cargado?: boolean; _bdsCargadas?: boolean };
    if (!h._bdsCargadas) { h._bdsCargadas = true; void cargarBds(host as HTMLElement & { props: Partial<Props> }); }
    if (props.db && !h._cargado) { h._cargado = true; void cargarObjetos(props.db, host as HTMLElement & { props: Partial<Props> }); }
    if (!props.db) h._cargado = false;

    const cards = (props.items || []).map((it) => {
      const iconName = it.tipo === 'view' ? 'mdi:eye-outline' : 'mdi:table-large';
      const tagColor = it.tipo === 'view' ? 'accent' : 'brand';
      const filasTxt = it.filas != null ? fmt(it.filas) + ' filas' : '\u2014';
      return '<button class="card-item" data-tabla="' + esc(it.nombre) + '" type="button" part="card-item">' +
        '<iswc-card>' +
          '<span slot="header">' +
            '<iswc-icon icon="' + iconName + '" slot="start"></iswc-icon>' +
            ' ' + esc(it.nombre) +
          '</span>' +
          '<div class="meta">' +
            '<iswc-tag color="' + tagColor + '">' + esc(it.tipo) + '</iswc-tag>' +
            '<span class="filas">' + filasTxt + '</span>' +
          '</div>' +
        '</iswc-card>' +
      '</button>';
    }).join('');

    const sel = '<select id="db" class="sel"' + (props.cargandoBds ? ' disabled' : '') + '>' +
      (props.cargandoBds ? '<option>cargando\u2026</option>' :
        ('<option value="">(elegir base)</option>' + (props.bds || []).map((b) =>
          '<option value="' + esc(b) + '"' + (b === props.db ? ' selected' : '') + '>' + esc(b) + '</option>').join(''))) +
      '</select>';

    const err = props.error ? '<iswc-callout color="danger">' + esc(props.error) + '</iswc-callout>' : '';
    const body = props.cargando
      ? '<div class="cargando"><iswc-spinner></iswc-spinner> Cargando objetos\u2026</div>'
      : (props.db
          ? (cards ? '<div class="grid">' + cards + '</div>' : '<p class="vacio">La base no tiene tablas ni vistas.</p>')
          : '<p class="vacio">Elige una base para ver su cat\u00e1logo.</p>');

    root.innerHTML =
      '<section class="panel" part="panel">' +
        '<header class="panel-head">' +
          '<h2 class="titulo">Cat\u00e1logo</h2>' +
          '<p class="lede">Tablas y vistas de la base elegida. Click para ver filas.</p>' +
        '</header>' +
        '<div class="fila">' +
          '<label class="lbl">Base</label>' + sel +
          '<iswc-button id="ref" variant="outlined" color="brand"' + (props.db && !props.cargando ? '' : ' disabled') + '>' +
            '<iswc-icon slot="start" icon="mdi:refresh"></iswc-icon> Refrescar' +
          '</iswc-button>' +
        '</div>' + err + body +
      '</section>';

    const s = root.querySelector('#db');
    if (s) s.addEventListener('change', (ev) => { (host as any).props = { db: (ev.target as HTMLSelectElement).value, items: [], error: '' }; });
    const ref = root.querySelector('#ref');
    if (ref) ref.addEventListener('click', () => { if (props.db) void cargarObjetos(props.db, host as HTMLElement & { props: Partial<Props> }, true); });
    root.querySelectorAll('.card-item').forEach((b) => {
      b.addEventListener('click', () => {
        const tabla = b.getAttribute('data-tabla') || '';
        if (tabla && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('erp-open-catalogo-singular', { detail: { db: props.db, table: tabla } }));
        }
      });
    });
  },
);

async function cargarBds(host: HTMLElement & { props: Partial<Props> }) {
  host.props = { cargandoBds: true, error: '' };
  try {
    const s = sesion();
    if (!s?.token) { host.props = { cargandoBds: false, error: 'Sin sesi\u00f3n' }; return; }
    const r = await fetch('/api/db-admin/databases', { headers: { authorization: 'Bearer ' + s.token } });
    if (r.status === 401) { host.props = { cargandoBds: false, error: 'Sesi\u00f3n caducada' }; return; }
    const data = await r.json();
    host.props = { cargandoBds: false, bds: (data?.databases ?? []) as string[] };
  } catch (e) {
    host.props = { cargandoBds: false, error: 'No se pudo listar bases: ' + String((e as Error).message ?? e) };
  }
}

async function cargarObjetos(db: string, host: HTMLElement & { props: Partial<Props> }, refresh = false) {
  host.props = { cargando: true, error: '', items: refresh ? (host.props as Props).items : [] };
  try {
    const s = sesion();
    if (!s?.token) { host.props = { cargando: false, error: 'Sin sesi\u00f3n' }; return; }
    const r = await fetch('/api/db-admin/' + encodeURIComponent(db) + '/objects', { headers: { authorization: 'Bearer ' + s.token } });
    if (r.status === 401) { host.props = { cargando: false, error: 'Sesi\u00f3n caducada' }; return; }
    const data = await r.json();
    const objs = [...(data?.tables ?? []), ...(data?.views ?? [])];
    const items: Item[] = objs.map((o) => ({ nombre: o.name, tipo: o.type, filas: null }));
    host.props = { cargando: false, items };
    for (const it of items) {
      if (it.tipo !== 'table') continue;
      try {
        const rr = await fetch('/api/db-admin/' + encodeURIComponent(db) + '/rows', {
          method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + s.token },
          body: JSON.stringify({ table: it.nombre, limit: 1, offset: 0 }),
        });
        if (rr.ok) {
          const d = await rr.json();
          it.filas = Number(d?.total ?? 0);
          host.props = { items: (host.props as Props).items.map((x) => x.nombre === it.nombre ? it : x) };
        }
      } catch { /* best-effort */ }
    }
  } catch (e) {
    host.props = { cargando: false, error: 'No se pudo listar objetos: ' + String((e as Error).message ?? e) };
  }
}

define('erp-catalogo-plural', ErpCatalogoPlural);
