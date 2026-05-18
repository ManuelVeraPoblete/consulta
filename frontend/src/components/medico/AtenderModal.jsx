import React, { useState } from 'react';
import { crearAtencion } from '../../services/medicoService';
import { useAuth } from '../../context/AuthContext';
import MedicamentoInput from './MedicamentoInput';
import styles from './AtenderModal.module.css';

const EMPTY = {
  peso: '', talla: '',
  motivo_consulta: '', anamnesis: '', examen_fisico: '',
  diagnostico: '', cie10: '', plan_tratamiento: '', indicaciones: '',
};

const ITEM_VACIO = () => ({ medicamento: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' });

const fmtHora = (iso) =>
  new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

const calcEdad = (fechaNac) => {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

const esPediatra = (user) => {
  const esp = user?.perfil?.especialidad?.nombre ?? '';
  return /pediatr/i.test(esp);
};

const AtenderModal = ({ cita, onClose, onAtendida }) => {
  const { user } = useAuth();
  const pediatra  = esPediatra(user);

  const [form, setForm]       = useState({ ...EMPTY, motivo_consulta: cita.motivo || '' });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);
  const [tab, setTab]         = useState('consulta');
  const [recetaItems, setRecetaItems] = useState([ITEM_VACIO()]);
  const [recetaObs, setRecetaObs]     = useState('');

  const TABS = [
    ['consulta',    'Consulta'],
    ['tratamiento', 'Tratamiento'],
    ['receta',      'Receta'],
  ];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setItem = (idx, k, v) =>
    setRecetaItems(items => items.map((it, i) => i === idx ? { ...it, [k]: v } : it));

  const listRef = React.useRef(null);

  const addItem = () => {
    setRecetaItems(items => [...items, ITEM_VACIO()]);
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, 50);
  };
  const removeItem = (idx) => setRecetaItems(items => {
    const next = items.filter((_, i) => i !== idx);
    return next.length === 0 ? [ITEM_VACIO()] : next;
  });

  const itemsValidos = recetaItems.filter(i => i.medicamento.trim());

  const imprimirReceta = () => {
    if (itemsValidos.length === 0) return;
    const paciente    = cita.paciente;
    const edad        = calcEdad(paciente?.fecha_nacimiento);
    const hoy         = new Date();
    const fechaStr    = `${String(hoy.getDate()).padStart(2,'0')} / ${String(hoy.getMonth()+1).padStart(2,'0')} / ${hoy.getFullYear()}`;
    const especialidad     = user?.perfil?.especialidad?.nombre ?? 'Médico General';
    const numRegistro      = user?.perfil?.numero_registro ?? '';
    const rutMedico        = user?.rut ?? '';
    const direccionConsulta = user?.perfil?.direccion_consulta ?? '';
    const telefonoConsulta  = user?.perfil?.telefono_consulta  ?? '';
    const docNombre        = `${user?.nombre ?? ''} ${user?.apellido ?? ''}`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Receta Médica</title>
  <style>
    @page { size: A5; margin: 14mm 18mm 12mm; }
    *  { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #111;
      width: 148mm;
    }

    /* ── Cabecera centrada ── */
    .cabecera {
      text-align: center;
      padding-bottom: 10px;
      border-bottom: 1.5px solid #1a1a6e;
      margin-bottom: 14px;
    }
    .cab-nombre {
      font-size: 17px;
      font-weight: 900;
      color: #1a1a6e;
      margin-bottom: 3px;
      letter-spacing: -0.02em;
    }
    .cab-esp  { font-size: 12px; color: #333; margin-bottom: 6px; }
    .cab-info { font-size: 10.5px; color: #333; line-height: 1.65; }

    /* ── Campos fecha / paciente ── */
    .campo-linea {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      font-size: 11.5px;
      color: #111;
      margin-bottom: 9px;
    }
    .campo-etiqueta { font-weight: 400; white-space: nowrap; }
    .campo-valor {
      flex: 1;
      border-bottom: 1px solid #555;
      min-width: 80px;
      padding-bottom: 2px;
      font-style: italic;
      color: #1a1a6e;
      font-size: 12px;
    }
    .sep { border: none; border-top: 1px solid #aaa; margin: 12px 0; }

    /* ── Rp/ ── */
    .rp {
      font-size: 26px;
      font-weight: 400;
      font-style: italic;
      color: #111;
      margin-bottom: 10px;
      line-height: 1;
    }

    /* ── Medicamentos ── */
    .med-item { margin-bottom: 12px; padding-left: 6px; }
    .med-nombre {
      font-size: 12px;
      font-style: italic;
      color: #1a1a6e;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .med-detalle {
      font-size: 11px;
      font-style: italic;
      color: #1a1a6e;
      padding-left: 16px;
      line-height: 1.55;
    }

    /* ── Indicación general ── */
    .indicacion-box {
      font-style: italic;
      font-size: 11px;
      color: #1a1a6e;
      margin-top: 8px;
      line-height: 1.6;
    }

    /* ── Firma + Sello ── */
    .pie {
      margin-top: 32px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
    }
    .firma-bloque { text-align: center; }
    .firma-espacio {
      width: 130px;
      height: 36px;
      border-bottom: 1px solid #333;
      margin: 0 auto 5px;
    }
    .firma-nombre { font-size: 10.5px; font-weight: 700; color: #111; }
    .firma-sub    { font-size: 10px;   color: #444; line-height: 1.5; }

    /* Sello circular */
    .sello {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      border: 2px solid #1a1a6e;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 6px;
      color: #1a1a6e;
      position: relative;
    }
    .sello-nombre { font-size: 7.5px; font-weight: 700; line-height: 1.3; }
    .sello-rut    { font-size: 8.5px; font-weight: 900; margin: 2px 0; }
    .sello-esp    { font-size: 7px;   font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
    .sello-star   { font-size: 9px;   }

    /* ── Footer ── */
    .footer {
      margin-top: 18px;
      padding-top: 7px;
      border-top: 1px solid #ddd;
      font-size: 9px;
      color: #888;
      text-align: center;
    }

    @media print {
      html, body { width: 148mm; }
    }
  </style>
</head>
<body>

  <!-- CABECERA -->
  <div class="cabecera">
    <div class="cab-nombre">Dr. ${docNombre}</div>
    <div class="cab-esp">${especialidad}</div>
    <div class="cab-info">
      ${rutMedico   ? `RUT: ${rutMedico}<br>` : ''}
      ${numRegistro ? `Registro Superintendencia: ${numRegistro}<br>` : ''}
      ${direccionConsulta ? `Dirección: ${direccionConsulta}<br>` : ''}
      ${telefonoConsulta  ? `Teléfono: ${telefonoConsulta}` : ''}
    </div>
  </div>

  <!-- FECHA Y PACIENTE -->
  <div class="campo-linea">
    <span class="campo-etiqueta">Fecha:</span>
    <span class="campo-valor">${fechaStr}</span>
  </div>
  <div class="campo-linea">
    <span class="campo-etiqueta">Paciente:</span>
    <span class="campo-valor">${paciente?.nombre ?? ''} ${paciente?.apellido ?? ''}${edad !== null ? ` (${edad} años)` : ''}</span>
  </div>

  <hr class="sep">

  <!-- Rp/ -->
  <div class="rp">Rp/</div>

  <!-- MEDICAMENTOS -->
  ${itemsValidos.map((item, idx) => `
  <div class="med-item">
    <div class="med-nombre">${idx + 1}.&nbsp;&nbsp;${item.medicamento}${item.dosis ? ' ' + item.dosis : ''}</div>
    <div class="med-detalle">
      ${[item.frecuencia, item.duracion].filter(Boolean).join(' por ')}${[item.frecuencia, item.duracion].some(Boolean) ? '.' : ''}
      ${item.indicaciones ? '<br>' + item.indicaciones + '.' : ''}
    </div>
  </div>`).join('')}

  <!-- INDICACIÓN GENERAL -->
  ${recetaObs.trim() ? `<div class="indicacion-box"><em>Indicación:</em> ${recetaObs}</div>` : ''}

  <!-- PIE: FIRMA + SELLO -->
  <div class="pie">
    <div class="firma-bloque">
      <div class="firma-espacio"></div>
      <div class="firma-nombre">Dr. ${docNombre}</div>
      <div class="firma-sub">${especialidad}${rutMedico ? '<br>RUT: ' + rutMedico : ''}</div>
    </div>
    <div class="sello">
      <div class="sello-star">★</div>
      <div class="sello-nombre">Dr. ${docNombre}</div>
      <div class="sello-rut">${rutMedico}</div>
      <div class="sello-esp">${especialidad}</div>
      <div class="sello-star">★</div>
    </div>
  </div>

  <div class="footer">Receta válida por 30 días desde la fecha de emisión</div>

</body>
</html>`;

    const w = window.open('', '_blank', 'width=600,height=860');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 350);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.motivo_consulta.trim()) { setError('El motivo de consulta es requerido'); setTab('consulta'); return; }
    if (!form.diagnostico.trim())     { setError('El diagnóstico es requerido'); setTab('consulta'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        cita_id:     cita.id,
        paciente_id: cita.paciente?.id,
        motivo_consulta:  form.motivo_consulta,
        anamnesis:        form.anamnesis        || null,
        examen_fisico:    form.examen_fisico    || null,
        diagnostico:      form.diagnostico,
        cie10:            form.cie10            || null,
        plan_tratamiento: form.plan_tratamiento || null,
        indicaciones:     form.indicaciones     || null,
        ...(pediatra && {
          peso:  form.peso  ? parseFloat(form.peso)  : null,
          talla: form.talla ? parseFloat(form.talla) : null,
        }),
        receta: itemsValidos.length > 0 ? { items: itemsValidos, observaciones: recetaObs } : null,
      };
      const result = await crearAtencion(payload);
      onAtendida(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar la atención');
    } finally {
      setSaving(false);
    }
  };

  const paciente = cita.paciente;
  const edad     = calcEdad(paciente?.fecha_nacimiento);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>
              {paciente?.nombre?.[0]}{paciente?.apellido?.[0]}
            </div>
            <div>
              <div className={styles.pacienteNombre}>
                {paciente?.nombre} {paciente?.apellido}
              </div>
              <div className={styles.pacienteMeta}>
                {edad !== null && <span>{edad} años</span>}
                {paciente?.rut && <span>· RUT {paciente.rut}</span>}
                {paciente?.prevision_salud && (
                  <span>· {paciente.prevision_salud.toUpperCase()}</span>
                )}
              </div>
              <div className={styles.citaInfo}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Cita {fmtHora(cita.fecha_hora)}
                {cita.motivo && ` · ${cita.motivo}`}
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(([key, label]) => (
            <button key={key}
              className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
              onClick={() => setTab(key)}>
              {label}
              {key === 'receta' && itemsValidos.length > 0 && (
                <span className={styles.tabBadge}>{itemsValidos.length}</span>
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            {error && <div className={styles.errorMsg}>{error}</div>}

            {/* ── Consulta ── */}
            {tab === 'consulta' && (
              <div className={styles.section}>
                {pediatra && (
                  <div className={styles.pediSection}>
                    <div className={styles.pediTitle}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      Medidas antropométricas
                    </div>
                    <div className={styles.pediGrid}>
                      <div className={styles.signoCard}>
                        <div className={styles.signoLabel}>Peso</div>
                        <div className={styles.signoInline}>
                          <input className={styles.signoInputFull} type="number" step="0.1" placeholder="—"
                            value={form.peso} onChange={e => set('peso', e.target.value)} />
                          <span className={styles.signoUnit}>kg</span>
                        </div>
                      </div>
                      <div className={styles.signoCard}>
                        <div className={styles.signoLabel}>Talla</div>
                        <div className={styles.signoInline}>
                          <input className={styles.signoInputFull} type="number" step="0.1" placeholder="—"
                            value={form.talla} onChange={e => set('talla', e.target.value)} />
                          <span className={styles.signoUnit}>cm</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Motivo de consulta <span className={styles.req}>*</span>
                  </label>
                  <textarea className={styles.textarea} rows={3}
                    placeholder="Describa el motivo principal de la consulta…"
                    value={form.motivo_consulta}
                    onChange={e => set('motivo_consulta', e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Anamnesis</label>
                  <textarea className={styles.textarea} rows={4}
                    placeholder="Historia clínica del paciente, síntomas, evolución…"
                    value={form.anamnesis}
                    onChange={e => set('anamnesis', e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Examen físico</label>
                  <textarea className={styles.textarea} rows={4}
                    placeholder="Hallazgos del examen físico…"
                    value={form.examen_fisico}
                    onChange={e => set('examen_fisico', e.target.value)} />
                </div>
                <div className={styles.row2}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>
                      Diagnóstico <span className={styles.req}>*</span>
                    </label>
                    <textarea className={styles.textarea} rows={3}
                      placeholder="Diagnóstico principal y secundarios…"
                      value={form.diagnostico}
                      onChange={e => set('diagnostico', e.target.value)} />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Código CIE-10</label>
                    <input className={styles.input} placeholder="Ej: J06.9"
                      value={form.cie10}
                      onChange={e => set('cie10', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Tratamiento ── */}
            {tab === 'tratamiento' && (
              <div className={styles.section}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Plan de tratamiento</label>
                  <textarea className={styles.textarea} rows={6}
                    placeholder="Medicamentos, dosis, procedimientos indicados…"
                    value={form.plan_tratamiento}
                    onChange={e => set('plan_tratamiento', e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Indicaciones al paciente</label>
                  <textarea className={styles.textarea} rows={6}
                    placeholder="Reposo, dieta, cuidados, señales de alarma, control…"
                    value={form.indicaciones}
                    onChange={e => set('indicaciones', e.target.value)} />
                </div>
              </div>
            )}

            {/* ── Receta ── */}
            {tab === 'receta' && (
              <div className={styles.section}>
                <div className={styles.recetaHint}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  La receta es opcional. Se guarda junto con la atención y puede imprimirse antes de finalizar.
                </div>

                {/* Filas de medicamentos */}
                <div className={styles.recetaList} ref={listRef}>
                  {recetaItems.map((item, idx) => (
                    <div key={idx} className={styles.recetaCard}>
                      <div className={styles.recetaCardNum}>{idx + 1}</div>
                      <div className={styles.recetaCardFields}>
                        <div className={styles.recetaRow1}>
                          <div className={styles.recetaFieldGroup}>
                            <label className={styles.recetaLabel}>Medicamento</label>
                            <MedicamentoInput
                              value={item.medicamento}
                              onChange={v => setItem(idx, 'medicamento', v)}
                              placeholder="Buscar medicamento…"
                            />
                          </div>
                          <div className={styles.recetaFieldGroup} style={{ maxWidth: 110 }}>
                            <label className={styles.recetaLabel}>Dosis</label>
                            <input
                              className={styles.recetaInput}
                              placeholder="500mg"
                              value={item.dosis}
                              onChange={e => setItem(idx, 'dosis', e.target.value)}
                            />
                          </div>
                          <div className={styles.recetaFieldGroup} style={{ maxWidth: 130 }}>
                            <label className={styles.recetaLabel}>Frecuencia</label>
                            <input
                              className={styles.recetaInput}
                              placeholder="c/8 horas"
                              value={item.frecuencia}
                              onChange={e => setItem(idx, 'frecuencia', e.target.value)}
                            />
                          </div>
                          <div className={styles.recetaFieldGroup} style={{ maxWidth: 110 }}>
                            <label className={styles.recetaLabel}>Duración</label>
                            <input
                              className={styles.recetaInput}
                              placeholder="7 días"
                              value={item.duracion}
                              onChange={e => setItem(idx, 'duracion', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className={styles.recetaRow2}>
                          <div className={styles.recetaFieldGroup} style={{ flex: 1 }}>
                            <label className={styles.recetaLabel}>Indicaciones especiales</label>
                            <input
                              className={styles.recetaInput}
                              placeholder="Ej: Tomar con alimentos, evitar alcohol…"
                              value={item.indicaciones}
                              onChange={e => setItem(idx, 'indicaciones', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <button
                          type="button"
                          className={styles.recetaRemove}
                          onClick={() => removeItem(idx)}
                          title="Eliminar medicamento"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                    </div>
                  ))}
                </div>

                <button type="button" className={styles.btnAddMed} onClick={addItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Agregar medicamento
                </button>

                <div className={styles.fieldGroup} style={{ marginTop: 16 }}>
                  <label className={styles.fieldLabel}>Observaciones generales de la receta</label>
                  <textarea className={styles.textarea} rows={2}
                    placeholder="Ej: Controlar en 7 días, repetir examen de sangre…"
                    value={recetaObs}
                    onChange={e => setRecetaObs(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <div className={styles.footerNav}>
              {tab === 'tratamiento' && (
                <button type="button" className={styles.btnSecondary} onClick={() => setTab('consulta')}>
                  ← Consulta
                </button>
              )}
              {tab === 'receta' && (
                <button type="button" className={styles.btnSecondary} onClick={() => setTab('tratamiento')}>
                  ← Tratamiento
                </button>
              )}
              {tab === 'consulta' && (
                <button type="button" className={styles.btnSecondary} onClick={() => setTab('tratamiento')}>
                  Tratamiento →
                </button>
              )}
              {tab === 'tratamiento' && (
                <button type="button" className={styles.btnSecondary} onClick={() => setTab('receta')}>
                  Receta →
                </button>
              )}
            </div>
            <div className={styles.footerRight}>
              {tab === 'receta' && itemsValidos.length > 0 && (
                <button type="button" className={styles.btnImprimir} onClick={imprimirReceta}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  Imprimir receta
                </button>
              )}
              <button type="button" className={styles.btnCancel} onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className={styles.btnGuardar} disabled={saving}>
                {saving ? 'Guardando…' : '✓ Finalizar atención'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AtenderModal;
