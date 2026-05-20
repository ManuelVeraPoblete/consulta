import React, { useState, useEffect, useCallback } from 'react';
import { getMisRecetas } from '../../../services/medicoService';
import { useAuth } from '../../../context/AuthContext';
import styles from './RecetasTab.module.css';

/* ── Helpers ───────────────────────────────────────────────── */

const fmtFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });

const calcEdad = (fechaNac) => {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  if (
    hoy.getMonth() < nac.getMonth() ||
    (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())
  ) edad--;
  return edad;
};

const imprimirReceta = (receta, doctor) => {
  const fecha   = receta.atencion?.cita?.fecha_hora ?? receta.createdAt;
  const items   = receta.items ?? [];
  const p       = receta.paciente;
  const perfil  = doctor?.perfil;

  const docNombre    = doctor ? `Dr. ${doctor.nombre} ${doctor.apellido}` : '';
  const docTitulo    = perfil?.titulo_profesional ?? '';
  const docEsp       = perfil?.especialidad?.nombre ?? '';
  const docRegistro  = perfil?.numero_registro ? `Reg. N° ${perfil.numero_registro}` : '';
  const docDireccion = perfil?.direccion_consulta ?? '';
  const docTelefono  = perfil?.telefono_consulta ?? '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Receta Médica</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;padding:32px 40px;max-width:680px;margin:0 auto}
    .top{border-bottom:2px solid #1d4ed8;padding-bottom:14px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
    .doc-nombre{font-size:17px;font-weight:800;color:#1d4ed8;margin-bottom:3px}
    .doc-titulo{font-size:12px;color:#475569;margin-bottom:1px}
    .doc-esp{font-size:12px;font-weight:600;color:#334155;margin-bottom:1px}
    .doc-reg{font-size:11px;color:#94a3b8}
    .doc-contacto{margin-top:6px;font-size:11.5px;color:#64748b;line-height:1.6}
    .fecha-box{text-align:right;font-size:12px;color:#64748b;flex-shrink:0}
    .fecha-box strong{display:block;font-weight:700;color:#334155;margin-bottom:2px}
    .rx{font-size:32px;font-weight:900;color:#1d4ed8;font-style:italic;margin-bottom:10px}
    .pac{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:20px}
    .pac-lbl{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}
    .pac-nombre{font-size:16px;font-weight:700;color:#0f172a}
    .pac-sub{font-size:12px;color:#64748b;margin-top:2px}
    .items{display:flex;flex-direction:column;gap:16px}
    .item{border-left:3px solid #1d4ed8;padding-left:14px}
    .item-n{font-size:10px;font-weight:700;color:#94a3b8;margin-bottom:3px;text-transform:uppercase;letter-spacing:.04em}
    .item-med{font-size:15px;font-weight:700;color:#0f172a;margin-bottom:4px}
    .item-det{font-size:12.5px;color:#475569;line-height:1.7}
    .obs{margin-top:20px;padding-top:14px;border-top:1px dashed #e2e8f0}
    .obs-lbl{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}
    .obs-txt{font-size:13px;color:#475569;line-height:1.6}
    .firma{margin-top:48px;padding-top:14px;border-top:1px solid #cbd5e1;display:flex;justify-content:space-between;align-items:flex-end}
    .firma-linea{font-size:12px;color:#64748b}
    .firma-nombre{font-size:11.5px;font-weight:700;color:#334155;margin-top:4px}
    .firma-reg{font-size:11px;color:#94a3b8}
    @media print{body{padding:16px}}
  </style>
</head>
<body>
  <div class="top">
    <div>
      ${docNombre    ? `<div class="doc-nombre">${docNombre}</div>` : '<div class="doc-nombre">Consulta Médica Online</div>'}
      ${docTitulo    ? `<div class="doc-titulo">${docTitulo}</div>` : ''}
      ${docEsp       ? `<div class="doc-esp">${docEsp}</div>` : ''}
      ${docRegistro  ? `<div class="doc-reg">${docRegistro}</div>` : ''}
      ${(docDireccion || docTelefono) ? `
        <div class="doc-contacto">
          ${docDireccion ? `📍 ${docDireccion}<br>` : ''}
          ${docTelefono  ? `📞 ${docTelefono}` : ''}
        </div>` : ''}
    </div>
    <div class="fecha-box">
      <strong>Fecha de atención</strong>
      ${fmtFecha(fecha)}
    </div>
  </div>

  <div class="rx">Rx</div>

  <div class="pac">
    <div class="pac-lbl">Paciente</div>
    <div class="pac-nombre">${p?.nombre ?? ''} ${p?.apellido ?? ''}</div>
    <div class="pac-sub">${p?.rut ? `RUT: ${p.rut}` : ''}${p?.prevision_salud ? ` &nbsp;·&nbsp; ${p.prevision_salud.toUpperCase()}` : ''}</div>
  </div>

  <div class="items">
    ${items.map((it, i) => `
      <div class="item">
        <div class="item-n">Medicamento ${i + 1}</div>
        <div class="item-med">${it.medicamento}</div>
        <div class="item-det">
          ${it.dosis        ? `Dosis: ${it.dosis}<br>` : ''}
          ${it.frecuencia   ? `Frecuencia: ${it.frecuencia}<br>` : ''}
          ${it.duracion     ? `Duración: ${it.duracion}<br>` : ''}
          ${it.indicaciones ? `Indicaciones: ${it.indicaciones}` : ''}
        </div>
      </div>`).join('')}
  </div>

  ${receta.observaciones ? `
    <div class="obs">
      <div class="obs-lbl">Observaciones</div>
      <div class="obs-txt">${receta.observaciones}</div>
    </div>` : ''}

  <div class="firma">
    <div>
      <div class="firma-linea">_________________________________</div>
      <div class="firma-nombre">${docNombre}</div>
      ${docRegistro ? `<div class="firma-reg">${docRegistro}</div>` : ''}
    </div>
    ${docEsp ? `<div style="font-size:11.5px;color:#64748b;text-align:right">${docEsp}</div>` : ''}
  </div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=720,height=940');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
};

/* ── Modal detalle de atención ─────────────────────────────── */

const SeccionModal = ({ icono, titulo, texto }) => {
  if (!texto?.trim()) return null;
  return (
    <div className={styles.seccion}>
      <div className={styles.seccionHead}>
        <span>{icono}</span>
        <span className={styles.seccionTitulo}>{titulo}</span>
      </div>
      <p className={styles.seccionTexto}>{texto}</p>
    </div>
  );
};

const SignoItem = ({ label, valor, unidad }) => {
  if (!valor) return null;
  return (
    <div className={styles.signoItem}>
      <div className={styles.signoVal}>{valor}</div>
      <div className={styles.signoMeta}>{unidad}</div>
      <div className={styles.signoLbl}>{label}</div>
    </div>
  );
};

const AtencionDetalleModal = ({ receta, onClose, doctor }) => {
  const { atencion, paciente, items = [] } = receta;
  const fecha = atencion?.cita?.fecha_hora ?? receta.createdAt;
  const edad = calcEdad(paciente?.fecha_nacimiento);

  const tieneSignos = atencion && (
    atencion.presion_sistolica || atencion.frecuencia_cardiaca ||
    atencion.temperatura       || atencion.saturacion_oxigeno  ||
    atencion.peso              || atencion.talla
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalAvatar}>
              {paciente?.nombre?.[0]}{paciente?.apellido?.[0]}
            </div>
            <div>
              <div className={styles.modalNombre}>
                {paciente?.nombre} {paciente?.apellido}
              </div>
              <div className={styles.modalMeta}>
                {edad !== null && <span>{edad} años</span>}
                {paciente?.rut && <span>· RUT {paciente.rut}</span>}
                {paciente?.prevision_salud && (
                  <span>· {paciente.prevision_salud.toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Sub-header: fecha */}
        <div className={styles.modalSubHeader}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Atención del {fmtFecha(fecha)}
          {atencion?.cie10 && (
            <span className={styles.cieBadge}>{atencion.cie10}</span>
          )}
        </div>

        {/* Body */}
        <div className={styles.modalBody}>

          {/* Signos vitales */}
          {tieneSignos && (
            <div className={styles.signosSection}>
              <div className={styles.signosSectionTitle}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                Signos vitales
              </div>
              <div className={styles.signosGrid}>
                <SignoItem
                  label="Presión arterial"
                  valor={atencion.presion_sistolica ? `${atencion.presion_sistolica}/${atencion.presion_diastolica}` : null}
                  unidad="mmHg"
                />
                <SignoItem label="Frec. cardíaca" valor={atencion.frecuencia_cardiaca} unidad="lpm" />
                <SignoItem label="Temperatura"    valor={atencion.temperatura}         unidad="°C"  />
                <SignoItem label="Saturación O₂"  valor={atencion.saturacion_oxigeno}  unidad="%"   />
                <SignoItem label="Peso"            valor={atencion.peso}                unidad="kg"  />
                <SignoItem label="Talla"           valor={atencion.talla}               unidad="cm"  />
              </div>
            </div>
          )}

          <SeccionModal icono="🩺" titulo="Motivo de consulta"        texto={atencion?.motivo_consulta}  />
          <SeccionModal icono="📖" titulo="Anamnesis"                 texto={atencion?.anamnesis}        />
          <SeccionModal icono="🔍" titulo="Examen físico"             texto={atencion?.examen_fisico}    />
          <SeccionModal icono="🏥" titulo="Diagnóstico"               texto={atencion?.diagnostico}      />
          <SeccionModal icono="💉" titulo="Plan de tratamiento"       texto={atencion?.plan_tratamiento} />
          <SeccionModal icono="📝" titulo="Indicaciones al paciente"  texto={atencion?.indicaciones}     />

          {/* Medicamentos recetados */}
          {items.length > 0 && (
            <div className={styles.medSection}>
              <div className={styles.medSectionTitle}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
                Medicamentos recetados
              </div>
              <div className={styles.medList}>
                {items.map((it, i) => (
                  <div key={i} className={styles.medItem}>
                    <div className={styles.medNum}>{i + 1}</div>
                    <div className={styles.medInfo}>
                      <div className={styles.medNombre}>{it.medicamento}</div>
                      <div className={styles.medDetalle}>
                        {[
                          it.dosis      && `Dosis: ${it.dosis}`,
                          it.frecuencia && `Frecuencia: ${it.frecuencia}`,
                          it.duracion   && `Duración: ${it.duracion}`,
                        ].filter(Boolean).join(' · ')}
                      </div>
                      {it.indicaciones && (
                        <div className={styles.medIndicaciones}>{it.indicaciones}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {receta.observaciones && (
                <div className={styles.obsBox}>
                  <span className={styles.obsLbl}>Observaciones:</span> {receta.observaciones}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.btnCerrar} onClick={onClose}>Cerrar</button>
          <button className={styles.btnImprimir} onClick={() => imprimirReceta(receta, doctor)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Reimprimir receta
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Componente principal ──────────────────────────────────── */

const RecetasTab = () => {
  const { user } = useAuth();
  const [recetas,   setRecetas]   = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState(null);
  const [busqueda,  setBusqueda]  = useState('');
  const [detalle,   setDetalle]   = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getMisRecetas();
      setRecetas(data);
    } catch {
      setError('No se pudieron cargar las recetas.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtradas = busqueda.trim()
    ? recetas.filter(r => {
        const term = busqueda.toLowerCase();
        const nombre = `${r.paciente?.nombre ?? ''} ${r.paciente?.apellido ?? ''}`.toLowerCase();
        const rut    = (r.paciente?.rut ?? '').toLowerCase();
        return nombre.includes(term) || rut.includes(term);
      })
    : recetas;

  return (
    <div className={styles.wrapper}>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.searchInput}
            placeholder="Buscar por paciente o RUT…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button className={styles.clearBtn} onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda">
              ×
            </button>
          )}
        </div>
        {!cargando && !error && (
          <span className={styles.count}>
            {filtradas.length} receta{filtradas.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Estados */}
      {cargando && (
        <div className={styles.emptyState}>
          <div className={styles.spinner} />
          Cargando recetas…
        </div>
      )}

      {!cargando && error && (
        <div className={styles.errorMsg}>{error}</div>
      )}

      {!cargando && !error && filtradas.length === 0 && (
        <div className={styles.emptyState}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <p>{busqueda ? 'Sin resultados para la búsqueda.' : 'No hay recetas emitidas aún.'}</p>
        </div>
      )}

      {/* Lista */}
      {!cargando && !error && filtradas.length > 0 && (
        <div className={styles.list}>
          {filtradas.map(receta => {
            const fecha  = receta.atencion?.cita?.fecha_hora ?? receta.createdAt;
            const p      = receta.paciente;
            const items  = receta.items ?? [];

            return (
              <div key={receta.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardLeft}>
                    <div className={styles.cardAvatar}>
                      {p?.nombre?.[0]}{p?.apellido?.[0]}
                    </div>
                    <div>
                      <div className={styles.cardPaciente}>
                        {p?.nombre} {p?.apellido}
                      </div>
                      <div className={styles.cardSub}>
                        {p?.rut && <span>{p.rut}</span>}
                        {p?.prevision_salud && (
                          <span className={styles.prevision}>
                            {p.prevision_salud.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={styles.cardFecha}>{fmtFecha(fecha)}</div>
                </div>

                {/* Chips de medicamentos */}
                {items.length > 0 && (
                  <div className={styles.meds}>
                    {items.slice(0, 4).map((it, i) => (
                      <span key={i} className={styles.med}>{it.medicamento}</span>
                    ))}
                    {items.length > 4 && (
                      <span className={styles.medMore}>+{items.length - 4} más</span>
                    )}
                  </div>
                )}

                {receta.observaciones && (
                  <div className={styles.cardObs}>{receta.observaciones}</div>
                )}

                <div className={styles.actions}>
                  <button
                    className={styles.btnVer}
                    onClick={() => setDetalle(receta)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                      <rect x="9" y="3" width="6" height="4" rx="1"/>
                    </svg>
                    Ver atención completa
                  </button>
                  <button
                    className={styles.btnImpr}
                    onClick={() => imprimirReceta(receta, user)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 6 2 18 2 18 9"/>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                      <rect x="6" y="14" width="12" height="8"/>
                    </svg>
                    Reimprimir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal detalle atención */}
      {detalle && (
        <AtencionDetalleModal
          receta={detalle}
          onClose={() => setDetalle(null)}
          doctor={user}
        />
      )}
    </div>
  );
};

export default RecetasTab;
