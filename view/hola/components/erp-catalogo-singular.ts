/**
 * <erp-catalogo-singular> — Vista de una tabla: esquema (columnas) + filas paginadas.
 * Se abre al recibir el evento window `erp-open-catalogo-singular` con { db, table }.
 * Permite filtrar (LIKE por columna), paginar y ejecutar SQL libre (con allowWrite opt).
 * Reusa el kit: iswc-button, iswc-icon, iswc-callout, iswc-tag, iswc-spinner, iswc-input.
 * API: GET /api/db-admin/{db}/columns/{table} + POST /api/db-admin/{db}/rows + POST .../query.
 */
import { crearComponente, define } from '../../../src/js/base/componente.js';
import { sesion } from '../../../src/js/dominio/sesion.js';

interface Col { name: string; type: string; notNull: boolean; pk: boolean; }
interface Props { abierto: boolean; db: string; tabla: string; cargando: boolean; error: string; cols: Col[]; total: number; offset: number; limit: number; filtroCol: string; filtroTxt: string; filas: Record<string, unknown>[]; sql: string; allowWrite: boolean; resultado: any | null; }

const ErpCatalogoSingular = crearComponente<Props>(
  import.meta.url,
  'erp-catalogo-singular',
  { abierto: false, db: '', tabla: '', cargando: false, error: '', cols: [], total: 0, offset: 0, limit: 25, filtroCol: '', filtroTxt: '', filas: [], sql: '', allowWrite: false, resultado: null },
  (root, props, host) => {
    const h = host as unknown as { _cargado?: boolean };
    if (typeof window !== 'undefined' && !h._cargado) {
      h._cargado = true;
      window.addEventListener('erp-open-catalogo-singular', ((ev: CustomEvent) => {
        const d = (ev as CustomEvent).detail || {};
        (host as any).props = { abierto: true, db: d.db ?? '', tabla: d.table ?? '', offset: 0, filtroCol: '', filtroTxt: '', error: '', filas: [], cols: [], total: 0, sql: 'SELECT * FROM ' + (d.table ?? ''), resultado: null, cargando: true };
        void cargar(host as HTMLElement & { props: Partial<Props> });
      }) as EventListener);
    }
    if (!props.abierto) { h._cargado = false; return; }

    const head = props.cols.map((c) => '<th>' + esc(c.name) + '<span class="tipo">' + esc(c.type) + (c.pk ? ' \u00b7 pk' : '') + '</span></th>').join('');
    const rowsHtml = (props.filas || []).map((r) =>
      '<tr>' + props.cols.map((c) => '<td>' + esc(JSON.stringify(r[c.name])) + '</td>').join('') + '</tr>'
    ).join('');
    const tagTipo = props.cols.length ? 'tabla' : '';
    const colsOpts = '<option value="">(sin filtro)</option>' + props.cols.map((c) =>
      '<option value="' + esc(c.name) + '"' + (c.name === props.filtroCol ? ' selected' : '') + '>' + esc(c.name) + '</option>'
    ).join('');

    const pagInfo = 'filas ' + ((props.offset ?? 0) + 1) + '\u2013' + Math.min((props.offset ?? 0) + (props.limit ?? 25), props.total ?? 0) + ' de ' + (props.total ?? 0);
    const prevDis = (props.offset ?? 0) <= 0 ? ' disabled' : '';
    const nextDis = ((props.offset ?? 0) + (props.limit ?? 25)) >= (props.total ?? 0) ? ' disabled' : '';

    root.innerHTML =
      '<section class="panel" part="panel">' +
        '<header class="panel-head">' +
          '<div class="fila">' +
            '<h2 class="titulo">' + esc(props.tabla) + '</h2>' +
            '<iswc-tag color="brand">' + esc(tagTipo) + '</iswc-tag>' +
            '<span class="muted">' + esc(props.db) + '</span>' +
            '<iswc-button id="cerrar" variant="outlined" color="neutral">' +
              '<iswc-icon slot="start" icon="mdi:close"></iswc-icon> Cerrar' +
            '</iswc-button>' +
          '</div>' +
        '</header>' +
        (props.error ? '<iswc-callout color="danger">' + esc(props.error) + '</iswc-callout>' : '') +
        (props.cargando ? '<div class="cargando"><iswc-spinner></iswc-spinner> Cargando\u2026</div>' :
          ('<div class="fila">' +
            '<label class="lbl">Filtrar</label>' +
            '<select id="fcol" class="sel">' + colsOpts + '</select>' +
            '<input id="ftxt" class="inp" placeholder="contiene\u2026" value="' + esc(props.filtroTxt) + '"/>' +
            '<iswc-button id="aplicar" variant="outlined" color="brand">' +
              '<iswc-icon slot="start" icon="mdi:filter"></iswc-icon> Aplicar' +
            '</iswc-button>' +
            '<span class="muted">' + pagInfo + '</span>' +
            '<iswc-button id="prev" variant="outlined" color="neutral"' + prevDis + '>' +
              '<iswc-icon slot="start" icon="mdi:chevron-left"></iswc-icon> Ant' +
            '</iswc-button>' +
            '<iswc-button id="next" variant="outlined" color="neutral"' + nextDis + '>' +
              'Sig <iswc-icon slot="end" icon="mdi:chevron-right"></iswc-icon>' +
            '</iswc-button>' +
          '</div>' +
          ('<div class="tabla-wrap"><table class="tabla"><thead><tr>' + head + '</tr></thead><tbody>' + (rowsHtml || '<tr><td class="vacio" colspan="' + props.cols.length + '">Sin filas.</td></tr>') + '</tbody></table></div>'))) +
        '<details class="sql">' +
          '<summary>SQL libre</summary>' +
          '<textarea id="sql" class="ta" rows="4" placeholder="SELECT * FROM ' + esc(props.tabla) + '">' + esc(props.sql) + '</textarea>' +
          '<div class="fila"><label class="chk"><input id="aw" type="checkbox"' + (props.allowWrite ? ' checked' : '') + '/> permitir escritura (allowWrite)</label>' +
            '<iswc-button id="ejecutar" variant="filled" color="brand"' + (props.cargando ? ' disabled' : '') + '>' +
              '<iswc-icon slot="start" icon="mdi:play"></iswc-icon> Ejecutar' +
            '</iswc-button></div>' +
          (props.resultado ? '<pre class="resultado">' + esc(JSON.stringify(props.resultado, null, 2)) + '</pre>' : '') +
        '</details>' +
      '</section>';

    const wire = (sel: string, fn: (el: Element) => void) => { const el = root.querySelector(sel); if (el) fn(el); };
    wire('#cerrar', () => { (host as any).props = { abierto: false }; });
    wire('#fcol', (el) => { (host as any).props = { filtroCol: (el as HTMLSelectElement).value }; });
    wire('#ftxt', (el) => { (el as HTMLInputElement).addEventListener('change', () => { (host as any).props = { filtroTxt: (el as HTMLInputElement).value, offset: 0 }; void cargar(host as HTMLElement & { props: Partial<Props> }); }); });
    wire('#aplicar', () => { (host as any).props = { offset: 0 }; void cargar(host as HTMLElement & { props: Partial<Props> }); });
    wire('#prev', () => { (host as any).props = { offset: Math.max(0, (props.offset ?? 0) - (props.limit ?? 25)) }; void cargar(host as HTMLElement & { props: Partial<Props> }); });
    wire('#next', () => { (host as any).props = { offset: (props.offset ?? 0) + (props.limit ?? 25) }; void cargar(host as HTMLElement & { props: Partial<Props> }); });
    wire('#aw', (el) => { (el as HTMLInputElement).addEventListener('change', () => { (host as any).props = { allowWrite: (el as HTMLInputElement).checked }; }); });
    wire('#ejecutar', () => {
      const ta = root.querySelector('#sql') as HTMLTextAreaElement | null;
      const aw = root.querySelector('#aw') as HTMLInputElement | null;
      if (ta) (host as any).props = { sql: ta.value, allowWrite: !!(aw && aw.checked) };
      void ejecutarSql(host as HTMLElement & { props: Partial<Props> });
    });
  },
);

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"\']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "\'": '&#39;' }[c] as string));

async function cargar(host: HTMLElement & { props: Partial<Props> }) {
  const p = host.props as Props;
  if (!p.db || !p.tabla) return;
  host.props = { cargando: true, error: '' };
  try {
    const s = sesion();
    if (!s?.token) { host.props = { cargando: false, error: 'Sin sesi\u00f3n' }; return; }
    const url = '/api/db-admin/' + encodeURIComponent(p.db) + '/columns/' + encodeURIComponent(p.tabla);
    const rc = await fetch(url, { headers: { authorization: 'Bearer ' + s.token } });
    const cols = rc.ok ? await rc.json() : [];
    const filtros = p.filtroCol && p.filtroTxt ? [{ column: p.filtroCol, op: 'like', value: '%' + p.filtroTxt + '%' }] : [];
    const rr = await fetch('/api/db-admin/' + encodeURIComponent(p.db) + '/rows', {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + s.token },
      body: JSON.stringify({ table: p.tabla, filters: filtros, limit: p.limit, offset: p.offset }),
    });
    if (!rr.ok) { host.props = { cargando: false, error: 'Error al cargar filas (' + rr.status + ')' }; return; }
    const data = await rr.json();
    host.props = { cargando: false, cols: cols as Col[], filas: (data?.rows ?? []) as Record<string, unknown>[], total: Number(data?.total ?? 0) };
  } catch (e) {
    host.props = { cargando: false, error: 'No se pudo cargar: ' + String((e as Error).message ?? e) };
  }
}

async function ejecutarSql(host: HTMLElement & { props: Partial<Props> }) {
  const p = host.props as Props;
  const s = sesion();
  if (!s?.token) { host.props = { error: 'Sin sesi\u00f3n' }; return; }
  try {
    const r = await fetch('/api/db-admin/' + encodeURIComponent(p.db) + '/query', {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + s.token },
      body: JSON.stringify({ sql: p.sql, allowWrite: !!p.allowWrite }),
    });
    const data = await r.json();
    host.props = { resultado: data };
    if (r.ok) { void cargar(host); }
  } catch (e) {
    host.props = { error: 'No se pudo ejecutar SQL: ' + String((e as Error).message ?? e) };
  }
}

define('erp-catalogo-singular', ErpCatalogoSingular);
