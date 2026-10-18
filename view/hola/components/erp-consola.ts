/**
 * <erp-consola> — Consola SQL: ejecuta SELECTs sobre cualquier base administrada.
 *
 * Reusa piezas del kit: <iswc-dialog>, <iswc-button>, <iswc-input>, <iswc-tag>,
 * <iswc-callout>, <iswc-spinner>. Las escrituras requieren `allowWrite: true` explícito
 * (el API rechaza INSERT/UPDATE/DELETE/DROP/etc sin ese flag). El token sale de la sesión.
 *
 * API: POST /api/db-admin/{db}/query  body: { sql, allowWrite? }
 *   SELECT -> { keyword, rowCount, rows[] }
 *   write  -> { keyword, changes, lastInsertRowid }
 */
import { crearComponente, define } from '../../../src/js/base/componente.js';
import { sesion } from '../../../src/js/dominio/sesion.js';

interface Db { nombre: string; }
interface Props { abierto: boolean; cargandoBds: boolean; bds: Db[]; db: string; sql: string; allowWrite: boolean; corriendo: boolean; error: string; resultado: any | null; }


/** Instancia activa del consola (se reemplaza en cada render). */
let activo: (HTMLElement & { props: Partial<Props> }) | null = null;
/** Abre el consola: el dashboard dispara el evento `erp-open-consola` en window. */
if (typeof window !== 'undefined') {
  window.addEventListener('erp-open-consola', () => { if (activo) activo.props = { abierto: true }; });
}
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const KEYWORDS_READONLY = new Set(['select', 'with', 'pragma', 'explain', 'analyze']);
const esReadonly = (sql: string) => {
  const k = (sql.trim().split(/\\s+/)[0] || '').toLowerCase();
  return KEYWORDS_READONLY.has(k);
};

const ErpConsola = crearComponente<Props>(
  import.meta.url,
  'erp-consola',
  { abierto: false, cargandoBds: false, bds: [], db: '', sql: 'SELECT * FROM ', allowWrite: false, corriendo: false, error: '', resultado: null },
  (root, props, host) => {
    activo = host as HTMLElement & { props: Partial<Props> };
    const h = host as unknown as { _abrirCargado?: boolean };
    if (props.abierto && !h._abrirCargado) { h._abrirCargado = true; void cargarBds(host as HTMLElement & { props: Partial<Props> }); }
    if (!props.abierto) { h._abrirCargado = false; }

    const s = sesion();
    const token = s?.token ?? '';
    const sqlTrim = (props.sql || '').trim();
    const keyword = (sqlTrim.split(/\\s+/)[0] || '').toLowerCase();
    const readonly = esReadonly(props.sql || '');
    const writeMarcado = !!props.allowWrite;

    root.innerHTML = `
      <iswc-dialog id="dlg" ?open=${props.abierto ? '' : null} width="min(960px, calc(100vw - 2rem))" heading="Consola SQL"
        @iswc-hide=${() => { (host as any).props = { abierto: false, resultado: null, error: '' }; }}>
        <div class="fila">
          <label class="lbl">Base</label>
          <select id="db" class="sel" ?disabled=${props.cargandoBds ? '' : null}>
            ${props.cargandoBds ? '<option>cargando…</option>' : (props.bds || []).map((b) => `<option value="${esc(b.nombre)}" ${b.nombre === props.db ? 'selected' : ''}>${esc(b.nombre)}</option>`).join('') || '<option>(sin bases)</option>'}
          </select>
          <label class="chk"><input id="aw" type="checkbox" ${writeMarcado ? 'checked' : ''} ?disabled=${readonly ? '' : null}/> permitir escritura</label>
          <iswc-tag color="brand">${esc(keyword || '—')}</iswc-tag>
        </div>
        <label class="lbl">SQL</label>
        <textarea id="sql" class="ta" rows="8" placeholder="SELECT * FROM …">${esc(props.sql)}</textarea>
        <div class="err">${props.error ? `<iswc-callout color="danger">${esc(props.error)}</iswc-callout>` : ''}</div>
        <div class="res">${props.corriendo ? '<iswc-spinner></iswc-spinner> ejecutando…' : renderResultado(props.resultado)}</div>
        <div slot="actions" class="acc">
          <iswc-button id="cancelar" variant="text">Cerrar</iswc-button>
          <iswc-button id="ejecutar" color="brand" ?disabled=${(!props.db || !sqlTrim || props.corriendo) ? '' : null}>Ejecutar</iswc-button>
        </div>
      </iswc-dialog>`;

    const q = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector(s) as T | null;
    const dialog = q('iswc-dialog');
    dialog?.addEventListener('iswc-hide', () => { (host as any).props = { abierto: false, resultado: null, error: '' }; });
    q('#db')?.addEventListener('change', (ev) => { (host as any).props = { db: (ev.target as HTMLSelectElement).value }; });
    q('#aw')?.addEventListener('change', (ev) => { (host as any).props = { allowWrite: (ev.target as HTMLInputElement).checked }; });
    q('#sql')?.addEventListener('input', (ev) => { (host as any).props = { sql: (ev.target as HTMLTextAreaElement).value }; });
    q('#cancelar')?.addEventListener('iswc-click', () => { (host as any).props = { abierto: false, resultado: null, error: '' }; });
    q('#ejecutar')?.addEventListener('iswc-click', () => { void ejecutar(host as HTMLElement & { props: Partial<Props> }, token); });
  },
);

function renderResultado(r: any): string {
  if (!r) return '';
  if (r.keyword && r.changes != null) {
    return `<iswc-callout color="success">OK · keyword=<code>${esc(r.keyword)}</code> · changes=<strong>${esc(r.changes)}</strong> · lastInsertRowid=<code>${esc(r.lastInsertRowid || '')}</code></iswc-callout>`;
  }
  if (Array.isArray(r.rows)) {
    if (r.rows.length === 0) return '<iswc-tag>0 filas</iswc-tag>';
    const cols = Object.keys(r.rows[0]);
    const thead = '<tr>' + cols.map((c) => `<th>${esc(c)}</th>`).join('') + '</tr>';
    const tbody = r.rows.map((row: any) => '<tr>' + cols.map((c) => `<td>${esc(row[c])}</td>`).join('') + '</tr>').join('');
    return `<div class="meta">${esc(r.rowCount ?? r.rows.length)} filas</div><div class="tw"><table class="tab"><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>`;
  }
  return '<pre>' + esc(JSON.stringify(r, null, 2)) + '</pre>';
}

async function cargarBds(host: HTMLElement & { props: Partial<Props> }) {
  const s = sesion(); if (!s) return;
  host.props = { cargandoBds: true };
  try {
    const r = await fetch('/api/db-admin/databases', { headers: { authorization: 'Bearer ' + s.token } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json() as { databases: string[] };
    const bds: Db[] = (j.databases || []).map((n) => ({ nombre: n }));
    host.props = { bds, db: bds[0]?.nombre ?? '', cargandoBds: false };
  } catch (e) { host.props = { cargandoBds: false, error: (e as Error).message }; }
}

async function ejecutar(host: HTMLElement & { props: Partial<Props> }, token: string) {
  const s = sesion(); if (!s || !token) { host.props = { error: 'sin sesión' }; return; }
  const p = host.props as Props;
  if (!p.db) { host.props = { error: 'elige una base' }; return; }
  const sql = (p.sql || '').trim(); if (!sql) { host.props = { error: 'escribe una consulta' }; return; }
  const readonly = esReadonly(sql);
  const allowWrite = !!p.allowWrite && !readonly;
  host.props = { corriendo: true, error: '', resultado: null };
  try {
    const r = await fetch('/api/db-admin/' + encodeURIComponent(p.db) + '/query', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ sql, allowWrite }),
    });
    const txt = await r.text(); let data: any = null; try { data = txt ? JSON.parse(txt) : null; } catch {}
    if (!r.ok) { host.props = { corriendo: false, error: (data && (data.error || data.detail)) || ('HTTP ' + r.status) }; return; }
    host.props = { corriendo: false, resultado: data };
  } catch (e) { host.props = { corriendo: false, error: (e as Error).message }; }
}

define('erp-consola', ErpConsola);