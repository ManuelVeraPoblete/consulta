// backend/src/controllers/agentAdminController.js

const Anthropic = require('@anthropic-ai/sdk');
const {
  User,
  MedicoPerfil,
  Especialidad,
  SecretariaMedico,
  Paciente,
  Cita,
  AtencionMedica,
  Receta,
  RecetaItem,
  AgendaBloqueo,
} = require('../models');
const { Op, fn, col, literal } = require('sequelize');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 5 });

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres el asistente de gestión operativa de una consulta médica privada en Chile.
Asistes al administrador con análisis de datos, reportes operativos y recomendaciones estratégicas basadas en datos reales.

PERMISOS (solo lectura analítica):
PUEDE:
- Consultar todas las tablas para análisis estadístico y operativo
- Generar reportes de ocupación, ausentismo, diagnósticos frecuentes
- Analizar distribución de pacientes por prevision_salud (ENUM: fonasa/isapre/particular)
- Revisar rendimiento de médicos y secretarias
- Detectar anomalías en agenda (AgendaBloqueo, baja ocupación)

NO PUEDE:
- Modificar datos clínicos (AtencionMedica, Receta, RecetaItem): registros médico-legales
- Eliminar registros de ningún tipo
- Revelar datos clínicos individuales de un paciente (diagnósticos, recetas, alergias): solo datos agregados y anonimizados

PROTOCOLO DE PRIVACIDAD (Ley 20.584):
- Los datos clínicos son reservados. Usa SIEMPRE datos agregados y anonimizados.
- Si piden historial clínico de paciente individual: responde que eso corresponde al médico tratante y que puedes dar estadísticas agregadas del sistema.
- NUNCA combinar nombre_paciente + diagnóstico en una misma respuesta.

ESTILO DE RESPUESTA:
- Usa números concretos de las queries, no estimaciones vagas
- Expresa tasas como porcentajes: "tasa de completado del 82%"
- Cuando detectes anomalía: da hipótesis + acción concreta
- Montos en CLP con punto de miles: "$45.000" no "45000"
- Compara siempre con mes anterior si los datos están disponibles
- Prioriza alertas: CRÍTICO (afecta operación hoy), ADVERTENCIA (tendencia negativa), INFORMACIÓN (dato de contexto)

FORMATO OBLIGATORIO:
- Texto plano únicamente. Prohibido usar markdown.
- Sin asteriscos (*), sin almohadillas (#), sin guiones bajos (_), sin comillas invertidas.
- Para listas usa un guion al inicio de la línea: "- item"
- Separa secciones con una línea en blanco.
- Sé directo y conciso. Solo la información solicitada.
- NUNCA muestres IDs numéricos (id, paciente_id, medico_id, cita_id, etc.). Usa siempre el nombre, descripción o referencia legible para el usuario.`;

// ─────────────────────────────────────────────────────────────────────────────
// TOOL DEFINITIONS (14 tools)
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_TOOLS = [
  {
    name: 'get_occupancy_report',
    description: 'Reporte de ocupación de citas por período. Agrupa por médico, estado, día o semana.',
    input_schema: {
      type: 'object',
      properties: {
        fecha_inicio: { type: 'string', description: 'YYYY-MM-DD' },
        fecha_fin:    { type: 'string', description: 'YYYY-MM-DD' },
        medico_id:    { type: 'integer', description: 'Filtrar por médico (opcional)' },
        agrupar_por:  { type: 'string', enum: ['medico', 'estado', 'dia', 'semana'] },
      },
      required: ['fecha_inicio', 'fecha_fin'],
    },
  },
  {
    name: 'get_no_show_rate',
    description: 'Tasa de ausentismo/cancelaciones por día de semana, hora o médico.',
    input_schema: {
      type: 'object',
      properties: {
        fecha_inicio: { type: 'string' },
        fecha_fin:    { type: 'string' },
        medico_id:    { type: 'integer' },
        agrupar_por:  { type: 'string', enum: ['dia_semana', 'hora', 'medico'] },
      },
      required: ['fecha_inicio', 'fecha_fin'],
    },
  },
  {
    name: 'get_revenue_summary',
    description: 'Estimación de ingresos por citas completadas. Solo particular tiene precio fijo (MedicoPerfil.valor_particular).',
    input_schema: {
      type: 'object',
      properties: {
        fecha_inicio: { type: 'string' },
        fecha_fin:    { type: 'string' },
        medico_id:    { type: 'integer' },
      },
      required: ['fecha_inicio', 'fecha_fin'],
    },
  },
  {
    name: 'get_patient_stats',
    description: 'Estadísticas de pacientes: total, activos, por previsión, por género.',
    input_schema: {
      type: 'object',
      properties: {
        agrupar_por:       { type: 'string', enum: ['prevision_salud', 'genero', 'ciudad'] },
        incluir_inactivos: { type: 'boolean' },
      },
    },
  },
  {
    name: 'get_doctor_performance',
    description: 'Rendimiento de médicos: citas completadas, canceladas, pacientes únicos, tasa de completado.',
    input_schema: {
      type: 'object',
      properties: {
        fecha_inicio: { type: 'string' },
        fecha_fin:    { type: 'string' },
        medico_id:    { type: 'integer' },
        limite:       { type: 'integer', default: 10 },
      },
      required: ['fecha_inicio', 'fecha_fin'],
    },
  },
  {
    name: 'get_diagnosis_frequency',
    description: 'Diagnósticos más frecuentes del período. Agrupados por código CIE-10.',
    input_schema: {
      type: 'object',
      properties: {
        fecha_inicio:   { type: 'string' },
        fecha_fin:      { type: 'string' },
        medico_id:      { type: 'integer' },
        top_n:          { type: 'integer', default: 20 },
        solo_con_cie10: { type: 'boolean', default: false },
      },
      required: ['fecha_inicio', 'fecha_fin'],
    },
  },
  {
    name: 'get_medication_frequency',
    description: 'Medicamentos más recetados en el período.',
    input_schema: {
      type: 'object',
      properties: {
        fecha_inicio: { type: 'string' },
        fecha_fin:    { type: 'string' },
        top_n:        { type: 'integer', default: 15 },
      },
      required: ['fecha_inicio', 'fecha_fin'],
    },
  },
  {
    name: 'get_prevision_breakdown',
    description: 'Comparativa demanda (pacientes) vs oferta (médicos que aceptan cada previsión).',
    input_schema: {
      type: 'object',
      properties: {
        incluir_detalle_medicos: { type: 'boolean', default: false },
      },
    },
  },
  {
    name: 'detect_schedule_anomalies',
    description: 'Detecta anomalías de agenda: bloqueos con citas sin reagendar, médicos sin actividad, alta tasa de no-shows.',
    input_schema: {
      type: 'object',
      properties: {
        dias_analisis:         { type: 'integer', default: 30 },
        umbral_ocupacion_min:  { type: 'number',  default: 0.6 },
        umbral_ausentismo_max: { type: 'number',  default: 0.25 },
      },
    },
  },
  {
    name: 'get_secretary_performance',
    description: 'Carga y rendimiento de secretarias: citas gestionadas, médicos asignados, citas sin secretaria.',
    input_schema: {
      type: 'object',
      properties: {
        fecha_inicio:  { type: 'string' },
        fecha_fin:     { type: 'string' },
        secretaria_id: { type: 'integer' },
      },
      required: ['fecha_inicio', 'fecha_fin'],
    },
  },
  {
    name: 'get_monthly_comparison',
    description: 'Comparativa mes actual vs mes anterior para citas y pacientes.',
    input_schema: {
      type: 'object',
      properties: {
        mes_referencia: { type: 'string', description: 'YYYY-MM (mes de referencia)' },
      },
      required: ['mes_referencia'],
    },
  },
  {
    name: 'get_active_doctors_stats',
    description: 'Lista de médicos activos con perfil, especialidad, modalidades y previsiones.',
    input_schema: {
      type: 'object',
      properties: {
        especialidad_id:     { type: 'integer' },
        acepta_fonasa:       { type: 'boolean' },
        acepta_isapre:       { type: 'boolean' },
        acepta_telemedicina: { type: 'boolean' },
      },
    },
  },
  {
    name: 'search_patient_admin',
    description: 'Busca pacientes por nombre, apellido, RUT, email o teléfono. Solo retorna datos operativos, NO datos clínicos.',
    input_schema: {
      type: 'object',
      properties: {
        query:           { type: 'string', description: 'Texto a buscar en nombre, apellido, RUT, email, teléfono' },
        prevision_salud: { type: 'string', enum: ['fonasa', 'isapre', 'particular'] },
        ciudad:          { type: 'string' },
        activo:          { type: 'boolean', default: true },
        limit:           { type: 'integer', default: 20 },
      },
    },
  },
  {
    name: 'get_system_health',
    description: 'Estado general del sistema: usuarios por rol, citas hoy, citas próximas, bloqueos activos.',
    input_schema: {
      type: 'object',
      properties: {
        incluir_proximos_dias: { type: 'integer', default: 7 },
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TOOL EXECUTOR
// ─────────────────────────────────────────────────────────────────────────────
async function executeToolForAdmin(toolName, input) {
  switch (toolName) {

    // ── Tool 1: get_occupancy_report ──────────────────────────────────────────
    case 'get_occupancy_report': {
      const { fecha_inicio, fecha_fin, medico_id } = input;
      const where = {
        fecha_hora: { [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin + 'T23:59:59')] },
      };
      if (medico_id) where.medico_id = medico_id;

      const citas = await Cita.findAll({
        where,
        include: [{ model: User, as: 'medico', attributes: ['id', 'nombre', 'apellido'] }],
        attributes: ['medico_id', 'estado', [fn('COUNT', col('Cita.id')), 'total']],
        group: ['medico_id', 'estado', 'medico.id', 'medico.nombre', 'medico.apellido'],
        raw: false,
      });

      const porMedico = {};
      for (const c of citas) {
        const mid = c.medico_id;
        if (!porMedico[mid]) {
          porMedico[mid] = {
            medico_id: mid,
            nombre: c.medico ? `${c.medico.nombre} ${c.medico.apellido}` : 'Desconocido',
            programada: 0, confirmada: 0, cancelada: 0, completada: 0, total: 0,
          };
        }
        const cnt = parseInt(c.getDataValue('total'), 10);
        porMedico[mid][c.estado] = cnt;
        porMedico[mid].total += cnt;
      }

      const result = Object.values(porMedico).map(m => ({
        ...m,
        tasa_completado: m.total > 0 ? ((m.completada / m.total) * 100).toFixed(1) + '%' : '0%',
      }));

      return { medicos: result, periodo: { fecha_inicio, fecha_fin } };
    }

    // ── Tool 2: get_no_show_rate ──────────────────────────────────────────────
    case 'get_no_show_rate': {
      const { fecha_inicio, fecha_fin, medico_id } = input;
      const where = {
        fecha_hora: { [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin + 'T23:59:59')] },
      };
      if (medico_id) where.medico_id = medico_id;

      const citas = await Cita.findAll({
        where,
        attributes: [
          'estado',
          [fn('DAYOFWEEK', col('fecha_hora')), 'dia_semana'],
          [fn('HOUR', col('fecha_hora')), 'hora'],
          [fn('COUNT', col('id')), 'total'],
        ],
        group: ['estado', literal('DAYOFWEEK(fecha_hora)'), literal('HOUR(fecha_hora)')],
        raw: true,
      });

      return { ausentismo: citas, periodo: { fecha_inicio, fecha_fin } };
    }

    // ── Tool 3: get_revenue_summary ───────────────────────────────────────────
    case 'get_revenue_summary': {
      const { fecha_inicio, fecha_fin, medico_id } = input;
      const where = {
        estado: 'completada',
        fecha_hora: { [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin + 'T23:59:59')] },
      };
      if (medico_id) where.medico_id = medico_id;

      const citas = await Cita.findAll({
        where,
        include: [
          {
            model: User,
            as: 'medico',
            attributes: ['id', 'nombre', 'apellido'],
            include: [{ model: MedicoPerfil, as: 'perfil', attributes: ['valor_particular', 'acepta_particular'] }],
          },
          { model: Paciente, as: 'paciente', attributes: ['prevision_salud'] },
        ],
      });

      const porMedico = {};
      let totalParticular = 0;

      for (const c of citas) {
        const mid = c.medico_id;
        if (!porMedico[mid]) {
          porMedico[mid] = {
            medico_id: mid,
            nombre: c.medico ? `${c.medico.nombre} ${c.medico.apellido}` : 'Desconocido',
            valor_particular: c.medico?.perfil?.valor_particular || 0,
            citas_particular: 0, citas_fonasa: 0, citas_isapre: 0,
          };
        }
        const prev = c.paciente?.prevision_salud;
        if (prev === 'particular') {
          porMedico[mid].citas_particular++;
          totalParticular += porMedico[mid].valor_particular;
        } else if (prev === 'fonasa') {
          porMedico[mid].citas_fonasa++;
        } else if (prev === 'isapre') {
          porMedico[mid].citas_isapre++;
        }
      }

      const resultado = Object.values(porMedico).map(m => ({
        ...m,
        ingreso_particular_estimado_clp: m.citas_particular * m.valor_particular,
      }));

      return { total_particular_clp: totalParticular, por_medico: resultado, periodo: { fecha_inicio, fecha_fin } };
    }

    // ── Tool 4: get_patient_stats ─────────────────────────────────────────────
    case 'get_patient_stats': {
      const { incluir_inactivos = false } = input;
      const where = incluir_inactivos ? {} : { activo: true };

      const [total, porPrevision, porGenero] = await Promise.all([
        Paciente.count({ where }),
        Paciente.findAll({
          where,
          attributes: ['prevision_salud', [fn('COUNT', col('id')), 'cantidad']],
          group: ['prevision_salud'],
          raw: true,
        }),
        Paciente.findAll({
          where,
          attributes: ['genero', [fn('COUNT', col('id')), 'cantidad']],
          group: ['genero'],
          raw: true,
        }),
      ]);

      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      const nuevosMes = await Paciente.count({
        where: { ...where, createdAt: { [Op.gte]: inicioMes } },
      });

      return { total_pacientes: total, nuevos_este_mes: nuevosMes, por_prevision: porPrevision, por_genero: porGenero };
    }

    // ── Tool 5: get_doctor_performance ───────────────────────────────────────
    case 'get_doctor_performance': {
      const { fecha_inicio, fecha_fin, medico_id, limite = 10 } = input;
      const where = {
        fecha_hora: { [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin + 'T23:59:59')] },
      };
      if (medico_id) where.medico_id = medico_id;

      const citas = await Cita.findAll({
        where,
        include: [
          {
            model: User,
            as: 'medico',
            attributes: ['id', 'nombre', 'apellido'],
            include: [{
              model: MedicoPerfil,
              as: 'perfil',
              attributes: ['especialidad_id'],
              include: [{ model: Especialidad, as: 'especialidad', attributes: ['nombre'] }],
            }],
          },
        ],
      });

      const porMedico = {};
      for (const c of citas) {
        const mid = c.medico_id;
        if (!porMedico[mid]) {
          porMedico[mid] = {
            medico_id: mid,
            nombre: c.medico ? `${c.medico.nombre} ${c.medico.apellido}` : 'Desconocido',
            especialidad: c.medico?.perfil?.especialidad?.nombre || 'Sin especialidad',
            completadas: 0, canceladas: 0, programadas: 0, pacientes: new Set(),
          };
        }
        if (c.estado === 'completada') porMedico[mid].completadas++;
        if (c.estado === 'cancelada') porMedico[mid].canceladas++;
        if (c.estado === 'programada' || c.estado === 'confirmada') porMedico[mid].programadas++;
        porMedico[mid].pacientes.add(c.paciente_id);
      }

      const result = Object.values(porMedico)
        .map(m => ({
          medico_id: m.medico_id,
          nombre: m.nombre,
          especialidad: m.especialidad,
          citas_completadas: m.completadas,
          citas_canceladas: m.canceladas,
          citas_programadas: m.programadas,
          pacientes_unicos: m.pacientes.size,
          tasa_completado: (m.completadas + m.canceladas) > 0
            ? ((m.completadas / (m.completadas + m.canceladas)) * 100).toFixed(1) + '%'
            : '0%',
        }))
        .sort((a, b) => b.citas_completadas - a.citas_completadas)
        .slice(0, Math.min(limite, 20));

      return { medicos: result, periodo: { fecha_inicio, fecha_fin } };
    }

    // ── Tool 6: get_diagnosis_frequency ──────────────────────────────────────
    case 'get_diagnosis_frequency': {
      const { fecha_inicio, fecha_fin, medico_id, top_n = 20, solo_con_cie10 = false } = input;
      const where = {
        createdAt: { [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin + 'T23:59:59')] },
      };
      if (medico_id) where.medico_id = medico_id;
      if (solo_con_cie10) where.cie10 = { [Op.ne]: null };

      const diags = await AtencionMedica.findAll({
        where,
        attributes: [
          'cie10',
          [fn('COUNT', col('AtencionMedica.id')), 'frecuencia'],
          [fn('COUNT', fn('DISTINCT', col('paciente_id'))), 'pacientes_distintos'],
        ],
        group: ['cie10'],
        order: [[literal('frecuencia'), 'DESC']],
        limit: Math.min(top_n, 50),
        raw: true,
      });

      return { diagnosticos: diags, periodo: { fecha_inicio, fecha_fin } };
    }

    // ── Tool 7: get_medication_frequency ─────────────────────────────────────
    case 'get_medication_frequency': {
      const { fecha_inicio, fecha_fin, top_n = 15 } = input;

      const items = await RecetaItem.findAll({
        include: [{
          model: Receta,
          as: 'receta',
          where: { createdAt: { [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin + 'T23:59:59')] } },
          attributes: [],
        }],
        attributes: [
          'medicamento',
          [fn('COUNT', col('RecetaItem.id')), 'veces_recetado'],
        ],
        group: ['medicamento'],
        order: [[literal('veces_recetado'), 'DESC']],
        limit: Math.min(top_n, 30),
        raw: true,
      });

      return { medicamentos: items, periodo: { fecha_inicio, fecha_fin } };
    }

    // ── Tool 8: get_prevision_breakdown ──────────────────────────────────────
    case 'get_prevision_breakdown': {
      const [porPrevision, medicos] = await Promise.all([
        Paciente.findAll({
          where: { activo: true },
          attributes: ['prevision_salud', [fn('COUNT', col('id')), 'cantidad']],
          group: ['prevision_salud'],
          raw: true,
        }),
        MedicoPerfil.findAll({
          include: [{ model: User, as: 'usuario', where: { activo: true, rol: 'medico' }, attributes: [] }],
          attributes: ['acepta_fonasa', 'acepta_isapre', 'acepta_particular'],
          raw: true,
        }),
      ]);

      const oferta = { fonasa: 0, isapre: 0, particular: 0 };
      for (const m of medicos) {
        if (m.acepta_fonasa)     oferta.fonasa++;
        if (m.acepta_isapre)    oferta.isapre++;
        if (m.acepta_particular) oferta.particular++;
      }

      const demanda = {};
      for (const p of porPrevision) demanda[p.prevision_salud] = parseInt(p.cantidad, 10);

      const alertas = [];
      if (oferta.isapre < 3 && (demanda.isapre || 0) > 100)
        alertas.push(`Solo ${oferta.isapre} médico(s) acepta(n) ISAPRE pero hay ${demanda.isapre} pacientes ISAPRE`);
      if (oferta.fonasa < 2 && (demanda.fonasa || 0) > 50)
        alertas.push(`Solo ${oferta.fonasa} médico(s) acepta(n) FONASA pero hay ${demanda.fonasa} pacientes FONASA`);

      return { demanda, oferta, alertas };
    }

    // ── Tool 9: detect_schedule_anomalies ────────────────────────────────────
    case 'detect_schedule_anomalies': {
      const { dias_analisis = 30, umbral_ausentismo_max = 0.25 } = input;
      const hoy = new Date();
      const inicio = new Date(hoy);
      inicio.setDate(inicio.getDate() - dias_analisis);

      const [bloqueos, citasRecientes] = await Promise.all([
        AgendaBloqueo.findAll({
          where: {
            tipo: 'bloqueo',
            fecha_inicio: { [Op.lte]: hoy.toISOString().slice(0, 10) },
            fecha_fin:    { [Op.gte]: hoy.toISOString().slice(0, 10) },
          },
          include: [{ model: User, as: 'medico', attributes: ['id', 'nombre', 'apellido'] }],
        }),
        Cita.findAll({
          where: { fecha_hora: { [Op.between]: [inicio, hoy] } },
          attributes: ['medico_id', 'estado', [fn('COUNT', col('id')), 'total']],
          group: ['medico_id', 'estado'],
          raw: true,
        }),
      ]);

      const bloqueosMedicos = bloqueos.map(b => b.medico_id);
      const citasBloqueadas = bloqueosMedicos.length > 0
        ? await Cita.count({
            where: {
              medico_id: { [Op.in]: bloqueosMedicos },
              fecha_hora: { [Op.gte]: hoy },
              estado: { [Op.in]: ['programada', 'confirmada'] },
            },
          })
        : 0;

      const porMedico = {};
      for (const c of citasRecientes) {
        const mid = c.medico_id;
        if (!porMedico[mid]) porMedico[mid] = { completadas: 0, canceladas: 0, other: 0, total: 0 };
        const key = c.estado === 'cancelada' ? 'canceladas' : c.estado === 'completada' ? 'completadas' : 'other';
        porMedico[mid][key] = (porMedico[mid][key] || 0) + parseInt(c.total, 10);
        porMedico[mid].total += parseInt(c.total, 10);
      }

      const medicosAltoAusentismo = Object.entries(porMedico)
        .filter(([, m]) => m.total > 0 && (m.canceladas / m.total) > umbral_ausentismo_max)
        .map(([mid, m]) => ({
          medico_id: parseInt(mid),
          tasa_ausentismo: ((m.canceladas / m.total) * 100).toFixed(1) + '%',
        }));

      const medicosConActividad = new Set(citasRecientes.map(c => c.medico_id));
      const todosMedicos = await User.findAll({
        where: { rol: 'medico', activo: true },
        attributes: ['id', 'nombre', 'apellido'],
        raw: true,
      });
      const medicosSinActividad = todosMedicos.filter(m => !medicosConActividad.has(m.id));

      return {
        bloqueos_activos: bloqueos.length,
        citas_en_periodo_bloqueado: citasBloqueadas,
        medicos_alto_ausentismo: medicosAltoAusentismo,
        medicos_sin_actividad: medicosSinActividad,
        periodo_analisis_dias: dias_analisis,
      };
    }

    // ── Tool 10: get_secretary_performance ───────────────────────────────────
    case 'get_secretary_performance': {
      const { fecha_inicio, fecha_fin, secretaria_id } = input;
      const where = {
        fecha_hora: { [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin + 'T23:59:59')] },
      };
      if (secretaria_id) where.secretaria_id = secretaria_id;

      const [citas, secretarias, sinSecretaria] = await Promise.all([
        Cita.findAll({
          where: { ...where, secretaria_id: { [Op.ne]: null } },
          include: [{ model: User, as: 'secretaria', attributes: ['id', 'nombre', 'apellido'] }],
        }),
        User.findAll({
          where: { rol: 'secretaria', activo: true },
          attributes: ['id', 'nombre', 'apellido'],
          include: [{ model: User, as: 'medicosAsignados', attributes: ['id', 'nombre', 'apellido'] }],
        }),
        Cita.count({ where: { ...where, secretaria_id: null } }),
      ]);

      const porSecretaria = {};
      for (const c of citas) {
        const sid = c.secretaria_id;
        if (!porSecretaria[sid]) {
          porSecretaria[sid] = {
            secretaria_id: sid,
            nombre: c.secretaria ? `${c.secretaria.nombre} ${c.secretaria.apellido}` : 'Desconocida',
            total: 0, completadas: 0, canceladas: 0,
          };
        }
        porSecretaria[sid].total++;
        if (c.estado === 'completada') porSecretaria[sid].completadas++;
        if (c.estado === 'cancelada') porSecretaria[sid].canceladas++;
      }

      for (const s of secretarias) {
        if (porSecretaria[s.id]) {
          porSecretaria[s.id].medicos_asignados = s.medicosAsignados?.length || 0;
        }
      }

      return {
        secretarias: Object.values(porSecretaria),
        citas_sin_secretaria: sinSecretaria,
        periodo: { fecha_inicio, fecha_fin },
      };
    }

    // ── Tool 11: get_monthly_comparison ──────────────────────────────────────
    case 'get_monthly_comparison': {
      const { mes_referencia } = input;
      const [year, month] = mes_referencia.split('-').map(Number);

      const inicioActual   = new Date(year, month - 1, 1);
      const finActual      = new Date(year, month, 0, 23, 59, 59);
      const inicioAnterior = new Date(year, month - 2, 1);
      const finAnterior    = new Date(year, month - 1, 0, 23, 59, 59);

      const [citasActual, citasAnterior, pacActual, pacAnterior] = await Promise.all([
        Cita.count({ where: { fecha_hora: { [Op.between]: [inicioActual, finActual] } } }),
        Cita.count({ where: { fecha_hora: { [Op.between]: [inicioAnterior, finAnterior] } } }),
        Paciente.count({ where: { createdAt: { [Op.between]: [inicioActual, finActual] } } }),
        Paciente.count({ where: { createdAt: { [Op.between]: [inicioAnterior, finAnterior] } } }),
      ]);

      const deltaCitas = citasAnterior > 0
        ? (((citasActual - citasAnterior) / citasAnterior) * 100).toFixed(1)
        : null;
      const deltaPac = pacAnterior > 0
        ? (((pacActual - pacAnterior) / pacAnterior) * 100).toFixed(1)
        : null;

      return {
        citas: { actual: citasActual, anterior: citasAnterior, delta_pct: deltaCitas },
        nuevos_pacientes: { actual: pacActual, anterior: pacAnterior, delta_pct: deltaPac },
        mes_referencia,
      };
    }

    // ── Tool 12: get_active_doctors_stats ────────────────────────────────────
    case 'get_active_doctors_stats': {
      const { especialidad_id, acepta_fonasa, acepta_isapre, acepta_telemedicina } = input;
      const perfilWhere = {};
      if (especialidad_id !== undefined) perfilWhere.especialidad_id = especialidad_id;
      if (acepta_fonasa !== undefined) perfilWhere.acepta_fonasa = acepta_fonasa;
      if (acepta_isapre !== undefined) perfilWhere.acepta_isapre = acepta_isapre;
      if (acepta_telemedicina !== undefined) perfilWhere.modalidad_telemedicina = acepta_telemedicina;

      const medicos = await User.findAll({
        where: { rol: 'medico', activo: true },
        include: [{
          model: MedicoPerfil,
          as: 'perfil',
          where: perfilWhere,
          required: Object.keys(perfilWhere).length > 0,
          include: [{ model: Especialidad, as: 'especialidad', attributes: ['nombre'] }],
        }],
        attributes: ['id', 'nombre', 'apellido', 'email'],
        order: [['apellido', 'ASC']],
      });

      return {
        medicos: medicos.map(m => ({
          id: m.id,
          nombre: `${m.nombre} ${m.apellido}`,
          especialidad: m.perfil?.especialidad?.nombre || 'Sin especialidad',
          acepta_fonasa: m.perfil?.acepta_fonasa || false,
          acepta_isapre: m.perfil?.acepta_isapre || false,
          acepta_particular: m.perfil?.acepta_particular || false,
          valor_particular: m.perfil?.valor_particular || null,
          modalidad_presencial: m.perfil?.modalidad_presencial || false,
          modalidad_telemedicina: m.perfil?.modalidad_telemedicina || false,
        })),
      };
    }

    // ── Tool 13: search_patient_admin ─────────────────────────────────────────
    case 'search_patient_admin': {
      const { query, prevision_salud, ciudad, activo = true, limit = 20 } = input;
      const where = { activo };
      if (prevision_salud) where.prevision_salud = prevision_salud;
      if (ciudad) where.ciudad = { [Op.like]: `%${ciudad}%` };

      if (query && query.length >= 2 && query.length <= 100) {
        where[Op.or] = [
          { nombre:   { [Op.like]: `%${query}%` } },
          { apellido: { [Op.like]: `%${query}%` } },
          { rut:      { [Op.like]: `%${query}%` } },
          { email:    { [Op.like]: `%${query}%` } },
          { telefono: { [Op.like]: `%${query}%` } },
        ];
      }

      const pacientes = await Paciente.findAll({
        where,
        attributes: ['id', 'nombre', 'apellido', 'rut', 'email', 'telefono', 'ciudad', 'prevision_salud', 'activo', 'createdAt'],
        order: [['apellido', 'ASC']],
        limit: Math.min(limit, 50),
      });

      return { pacientes, total: pacientes.length };
    }

    // ── Tool 14: get_system_health ────────────────────────────────────────────
    case 'get_system_health': {
      const { incluir_proximos_dias = 7 } = input;
      const hoy = new Date();
      const hoyInicio = new Date(hoy); hoyInicio.setHours(0, 0, 0, 0);
      const hoyFin    = new Date(hoy); hoyFin.setHours(23, 59, 59, 999);
      const proxFin   = new Date(hoy); proxFin.setDate(proxFin.getDate() + incluir_proximos_dias);

      const [usuariosPorRol, citasHoy, citasProximas, bloqueos] = await Promise.all([
        User.findAll({
          where: { activo: true },
          attributes: ['rol', [fn('COUNT', col('id')), 'cantidad']],
          group: ['rol'],
          raw: true,
        }),
        Cita.count({
          where: {
            fecha_hora: { [Op.between]: [hoyInicio, hoyFin] },
            estado: { [Op.in]: ['programada', 'confirmada'] },
          },
        }),
        Cita.count({
          where: {
            fecha_hora: { [Op.between]: [hoy, proxFin] },
            estado: { [Op.in]: ['programada', 'confirmada'] },
          },
        }),
        AgendaBloqueo.findAll({
          where: {
            tipo: 'bloqueo',
            fecha_inicio: { [Op.lte]: hoyFin.toISOString().slice(0, 10) },
            fecha_fin:    { [Op.gte]: hoyInicio.toISOString().slice(0, 10) },
          },
          include: [{ model: User, as: 'medico', attributes: ['nombre', 'apellido'] }],
        }),
      ]);

      const roles = {};
      for (const r of usuariosPorRol) roles[r.rol] = parseInt(r.cantidad, 10);

      return {
        usuarios_por_rol: roles,
        citas_hoy: citasHoy,
        [`citas_proximos_${incluir_proximos_dias}_dias`]: citasProximas,
        bloqueos_activos: bloqueos.map(b => ({
          medico: b.medico ? `${b.medico.nombre} ${b.medico.apellido}` : 'Desconocido',
          motivo: b.motivo,
          fecha_inicio: b.fecha_inicio,
          fecha_fin: b.fecha_fin,
        })),
      };
    }

    default:
      throw new Error(`Tool desconocida: ${toolName}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLER — agentic loop
// ─────────────────────────────────────────────────────────────────────────────
const agentAdmin = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Se requiere el array messages' });
    }
    if (messages.length > 50) {
      return res.status(400).json({ message: 'Demasiados mensajes en el historial (máximo 50)' });
    }
    if (messages.some(m => typeof m?.content !== 'string' || m.content.length > 4000)) {
      return res.status(400).json({ message: 'Mensaje demasiado largo (máximo 4000 caracteres)' });
    }

    const MAX_ROUNDS = 8;
    let currentMessages = [...messages];
    let rounds = 0;

    while (rounds < MAX_ROUNDS) {
      rounds++;
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: ADMIN_TOOLS,
        messages: currentMessages,
      });

      if (response.stop_reason === 'end_turn') {
        const textBlock = response.content.find(b => b.type === 'text');
        return res.json({ reply: textBlock?.text || '' });
      }

      if (response.stop_reason === 'tool_use') {
        currentMessages.push({ role: 'assistant', content: response.content });

        const toolResults = [];
        for (const block of response.content) {
          if (block.type !== 'tool_use') continue;
          let result;
          try {
            result = await executeToolForAdmin(block.name, block.input);
          } catch (err) {
            result = { error: err.message };
          }
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }

        currentMessages.push({ role: 'user', content: toolResults });
        continue;
      }

      // stop_reason inesperado
      break;
    }

    return res.status(500).json({ message: 'El agente no pudo completar la respuesta' });
  } catch (error) {
    console.error('agentAdmin error:', error);
    return res.status(500).json({ message: 'Error interno del agente' });
  }
};

module.exports = { agentAdmin };
