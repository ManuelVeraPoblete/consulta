const { Op } = require('sequelize');
const { AgendaBloqueo } = require('../models');

// Reglas base de disponibilidad (sin considerar registros explícitos):
// - Sábado (6) y domingo (0) siempre bloqueados por defecto.
// - Mes siguiente en adelante: bloqueado por defecto.
// Un registro "liberacion" puede desbloquear cualquiera de los casos anteriores.
// Un registro "bloqueo" puede bloquear días que de otro modo estarían disponibles.
const estadoBase = (year, month, day) => {
  const dow = new Date(year, month - 1, day).getDay(); // 0=Dom, 6=Sáb
  if (dow === 0 || dow === 6) return 'bloqueado';

  const hoy      = new Date();
  const mesSig   = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
  const inicioM  = new Date(year, month - 1, 1);
  return inicioM >= mesSig ? 'bloqueado' : 'disponible';
};
const getEstadoMes = async (req, res) => {
  try {
    const medicoId = req.user.id;
    const year  = parseInt(req.query.year,  10);
    const month = parseInt(req.query.month, 10); // 1-12

    if (!year || !month || month < 1 || month > 12)
      return res.status(400).json({ message: 'Parámetros year y month requeridos (month: 1-12)' });

    const primerDia = `${year}-${String(month).padStart(2, '0')}-01`;
    const ultimoDia = new Date(year, month, 0).toISOString().split('T')[0];

    // Registros que se solapan con el mes consultado
    const registros = await AgendaBloqueo.findAll({
      where: {
        medico_id: medicoId,
        fecha_inicio: { [Op.lte]: ultimoDia },
        fecha_fin:    { [Op.gte]: primerDia },
      },
      order: [['createdAt', 'ASC']],
    });

    // Para cada día del mes, determinar su estado
    const hoy        = new Date();
    const mesSig     = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
    const inicioMes  = new Date(year, month - 1, 1);
    const esMesFuturo = inicioMes >= mesSig;

    const diasEnMes = new Date(year, month, 0).getDate();
    const dias = {};

    for (let d = 1; d <= diasEnMes; d++) {
      const fechaStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      let estado = estadoBase(year, month, d);
      const esFinDeSemana = [0, 6].includes(new Date(year, month - 1, d).getDay());

      for (const r of registros) {
        if (fechaStr >= r.fecha_inicio && fechaStr <= r.fecha_fin) {
          if (r.tipo === 'bloqueo') {
            estado = 'bloqueado';
          } else {
            // Una liberación de rango NO desbloquea fines de semana;
            // solo una liberación de día exacto (fecha_inicio === fecha_fin) puede hacerlo.
            if (!esFinDeSemana || r.fecha_inicio === r.fecha_fin) {
              estado = 'disponible';
            }
          }
        }
      }

      dias[fechaStr] = estado;
    }

    res.json({ year, month, dias, registros });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al obtener estado de agenda' });
  }
};

// Crea un bloqueo o liberación de rango de fechas
const crearRegistro = async (req, res) => {
  try {
    const medicoId = req.user.id;
    const { fecha_inicio, fecha_fin, tipo, motivo } = req.body;

    if (!fecha_inicio || !fecha_fin || !tipo)
      return res.status(400).json({ message: 'fecha_inicio, fecha_fin y tipo son requeridos' });

    if (!['bloqueo', 'liberacion'].includes(tipo))
      return res.status(400).json({ message: 'tipo debe ser "bloqueo" o "liberacion"' });

    if (fecha_inicio > fecha_fin)
      return res.status(400).json({ message: 'fecha_inicio no puede ser posterior a fecha_fin' });

    const registro = await AgendaBloqueo.create({
      medico_id: medicoId,
      fecha_inicio,
      fecha_fin,
      tipo,
      motivo: motivo || null,
    });

    res.status(201).json(registro);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al crear registro de agenda' });
  }
};

// Elimina un registro (solo el propio médico puede eliminarlo)
const eliminarRegistro = async (req, res) => {
  try {
    const medicoId = req.user.id;
    const { id }   = req.params;

    const registro = await AgendaBloqueo.findOne({ where: { id, medico_id: medicoId } });
    if (!registro) return res.status(404).json({ message: 'Registro no encontrado' });

    await registro.destroy();
    res.json({ message: 'Registro eliminado' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al eliminar registro' });
  }
};

// Utilidad interna: verifica si una fecha concreta está disponible para un médico.
// Usada por el controlador de citas al momento de crear una nueva cita.
const esFechaDisponible = async (medicoId, fechaISO) => {
  const fechaStr = fechaISO.split('T')[0];
  const [y, m, d] = fechaStr.split('-').map(Number);

  let disponible = estadoBase(y, m, d) === 'disponible';
  const esFinDeSemana = [0, 6].includes(new Date(y, m - 1, d).getDay());

  const registros = await AgendaBloqueo.findAll({
    where: {
      medico_id: medicoId,
      fecha_inicio: { [Op.lte]: fechaStr },
      fecha_fin:    { [Op.gte]: fechaStr },
    },
    order: [['createdAt', 'ASC']],
  });

  for (const r of registros) {
    if (r.tipo === 'bloqueo') {
      disponible = false;
    } else {
      if (!esFinDeSemana || r.fecha_inicio === r.fecha_fin) {
        disponible = true;
      }
    }
  }

  return disponible;
};

// Endpoint público (para secretaria): verifica disponibilidad de un día para un médico
const verificarDisponibilidad = async (req, res) => {
  try {
    const { medicoId, fecha } = req.query;
    if (!medicoId || !fecha)
      return res.status(400).json({ message: 'medicoId y fecha son requeridos' });

    const disponible = await esFechaDisponible(Number(medicoId), fecha);
    res.json({ disponible });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al verificar disponibilidad' });
  }
};

module.exports = { getEstadoMes, crearRegistro, eliminarRegistro, esFechaDisponible, verificarDisponibilidad };
