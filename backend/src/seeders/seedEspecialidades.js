require('dotenv').config();
const { sequelize, Especialidad, Subespecialidad, syncDatabase } = require('../models');

const DATA = [
  {
    nombre: 'Medicina Interna',
    subs: [
      'Cardiología', 'Endocrinología', 'Gastroenterología', 'Geriatría',
      'Hematología', 'Infectología', 'Nefrología', 'Neumología',
      'Oncología Médica', 'Reumatología',
    ],
  },
  {
    nombre: 'Cirugía General',
    subs: [
      'Cirugía Cardiovascular', 'Cirugía de Cabeza y Cuello', 'Cirugía de Tórax',
      'Cirugía Digestiva', 'Cirugía Plástica y Reparadora', 'Cirugía Vascular',
    ],
  },
  {
    nombre: 'Pediatría',
    subs: [
      'Cardiología Pediátrica', 'Endocrinología Pediátrica', 'Gastroenterología Pediátrica',
      'Neonatología', 'Neurología Pediátrica', 'Oncología Pediátrica', 'Neumología Pediátrica',
    ],
  },
  {
    nombre: 'Neurología',
    subs: ['Epilepsia', 'Esclerosis Múltiple', 'Neurología Vascular', 'Neuromuscular'],
  },
  {
    nombre: 'Psiquiatría',
    subs: [
      'Psiquiatría de la Infancia y Adolescencia',
      'Psiquiatría Forense',
      'Psiquiatría Geriátrica',
    ],
  },
  {
    nombre: 'Ginecología y Obstetricia',
    subs: [
      'Ginecología Oncológica', 'Medicina Materno-Fetal',
      'Medicina Reproductiva e Infertilidad', 'Uroginecología',
    ],
  },
  {
    nombre: 'Traumatología y Ortopedia',
    subs: [
      'Artroscopía', 'Columna Vertebral', 'Cirugía de Mano',
      'Medicina Deportiva', 'Rodilla y Cadera',
    ],
  },
  {
    nombre: 'Oftalmología',
    subs: ['Córnea y Superficie Ocular', 'Glaucoma', 'Retina y Vítreo', 'Estrabismo'],
  },
  {
    nombre: 'Otorrinolaringología',
    subs: ['Audiología', 'Laringología', 'Otología', 'Rinología'],
  },
  {
    nombre: 'Urología',
    subs: ['Andrología', 'Oncología Urológica', 'Urología Pediátrica', 'Uroginecología'],
  },
  {
    nombre: 'Dermatología',
    subs: ['Dermatología Oncológica', 'Dermatopatología', 'Tricología'],
  },
  {
    nombre: 'Radiología e Imágenes',
    subs: ['Neurorradiología', 'Radiología Intervencional', 'Ultrasonografía'],
  },
  {
    nombre: 'Anatomía Patológica',
    subs: ['Citopatología', 'Neuropatología', 'Patología Forense'],
  },
  {
    nombre: 'Anestesiología',
    subs: [
      'Anestesia Cardiovascular', 'Anestesia Pediátrica',
      'Cuidados Paliativos', 'Medicina del Dolor',
    ],
  },
  {
    nombre: 'Medicina Física y Rehabilitación',
    subs: ['Kinesiología Neurológica', 'Rehabilitación Cardíaca', 'Rehabilitación Deportiva'],
  },
  {
    nombre: 'Medicina de Urgencias',
    subs: ['Toxicología Clínica', 'Trauma'],
  },
  { nombre: 'Medicina Familiar',   subs: [] },
  { nombre: 'Medicina del Trabajo', subs: [] },
];

(async () => {
  try {
    await syncDatabase();

    let creadas = 0, omitidas = 0, subsCreadas = 0;

    for (const item of DATA) {
      const [esp, built] = await Especialidad.findOrCreate({
        where:    { nombre: item.nombre },
        defaults: { nombre: item.nombre, activo: true },
      });
      if (built) creadas++; else omitidas++;

      for (const subNombre of item.subs) {
        const [, subBuilt] = await Subespecialidad.findOrCreate({
          where:    { especialidad_id: esp.id, nombre: subNombre },
          defaults: { especialidad_id: esp.id, nombre: subNombre, activo: true },
        });
        if (subBuilt) subsCreadas++;
      }
    }

    console.log(`Especialidades: ${creadas} creadas, ${omitidas} ya existían`);
    console.log(`Subespecialidades: ${subsCreadas} creadas`);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
