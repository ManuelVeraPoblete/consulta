require('dotenv').config();
const { sequelize, Cita, Paciente } = require('../models');

const MEDICO_IDS   = [16, 18];
const SECRETARIA_ID = null;

const HORARIOS = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30'];

const MOTIVOS = [
  'Control rutinario','Chequeo general','Dolor de cabeza persistente',
  'Revisión de exámenes','Hipertensión arterial en control','Control diabetes',
  'Dolor lumbar crónico','Consulta por tos y fiebre','Seguimiento post-operatorio',
  'Renovación de receta médica','Dolor abdominal','Dificultad para dormir',
  'Mareos frecuentes','Control colesterol','Consulta dermatológica',
  'Dolor de rodilla','Control tiroideos','Revisión presión arterial',
  'Fatiga crónica','Control cardíaco','Infección respiratoria',
  'Consulta nutrición','Dolor de espalda','Control prenatal',
  'Revisión de vacunas','Alergias estacionales','Consulta por ansiedad',
  'Control glaucoma','Revisión auditiva','Dolor articular',
];

function getDiasHabiles(inicio, fin) {
  const dias = [];
  const d = new Date(inicio);
  d.setHours(0, 0, 0, 0);
  const fFin = new Date(fin);
  fFin.setHours(23, 59, 59, 999);
  while (d <= fFin) {
    const dow = d.getDay(); // 0=dom, 6=sab
    if (dow !== 0 && dow !== 6) dias.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dias;
}

function estadoPorFecha(fecha) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fecha);
  f.setHours(0, 0, 0, 0);
  if (f < hoy)  return 'completada';
  if (f.getTime() === hoy.getTime()) return Math.random() < 0.6 ? 'confirmada' : 'programada';
  return Math.random() < 0.6 ? 'confirmada' : 'programada';
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const run = async () => {
  await sequelize.authenticate();
  console.log('Conectado a la base de datos.\n');

  const pacientes = await Paciente.findAll({ attributes: ['id'] });
  const pacIds = pacientes.map(p => p.id);
  if (pacIds.length === 0) { console.error('No hay pacientes.'); process.exit(1); }

  const dias = getDiasHabiles('2026-05-15', '2026-05-30');
  console.log(`Días hábiles encontrados: ${dias.length}`);

  let creadas = 0, errores = 0;

  for (const dia of dias) {
    const fechaStr = dia.toISOString().slice(0, 10);

    for (const medicoId of MEDICO_IDS) {
      const horariosDia = shuffle(HORARIOS).slice(0, 5);

      for (const hora of horariosDia) {
        const [hh, mm] = hora.split(':').map(Number);
        const fechaHora = new Date(`${fechaStr}T${hora}:00`);
        fechaHora.setHours(hh, mm, 0, 0);

        const pacienteId = pick(pacIds);
        const estado     = estadoPorFecha(fechaHora);
        const motivo     = pick(MOTIVOS);

        try {
          await Cita.create({
            paciente_id:   pacienteId,
            medico_id:     medicoId,
            secretaria_id: SECRETARIA_ID,
            fecha_hora:    fechaHora,
            duracion_min:  30,
            motivo,
            estado,
            notas: null,
          });
          creadas++;
        } catch (e) {
          console.error(`  ERROR ${fechaStr} ${hora} médico ${medicoId}: ${e.message}`);
          errores++;
        }
      }

      console.log(`  ${fechaStr} — médico ${medicoId}: 5 citas (${horariosDia.join(', ')})`);
    }
  }

  console.log(`\n──────────────────────────────`);
  console.log(`Citas creadas: ${creadas}`);
  console.log(`Errores:       ${errores}`);
  console.log(`──────────────────────────────`);
  process.exit(0);
};

run().catch(err => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});
