require('dotenv').config();
const { sequelize, Paciente } = require('../models');

const pacientes = [
  {
    nombre: 'Valentina', apellido: 'Morales Soto',
    rut: '12.345.678-9', fecha_nacimiento: '1990-03-15', genero: 'femenino',
    telefono: '+56 9 8123 4567', email: 'valentina.morales@gmail.com',
    direccion: 'Av. Providencia 1234, Dpto 52', ciudad: 'Santiago',
    prevision_salud: 'isapre', nombre_isapre: 'Banmédica',
    prevision_social: 'afp', nombre_afp: 'Habitat',
    grupo_sanguineo: 'O+',
    alergias: 'Penicilina',
    antecedentes: 'Hipertensión arterial en tratamiento',
    contacto_emergencia_nombre: 'Carlos Morales', contacto_emergencia_telefono: '+56 9 8234 5678',
  },
  {
    nombre: 'Diego', apellido: 'Fuentes Araya',
    rut: '15.678.901-2', fecha_nacimiento: '1985-07-22', genero: 'masculino',
    telefono: '+56 9 7654 3210', email: 'diego.fuentes@hotmail.com',
    direccion: 'Calle Los Aromos 456', ciudad: 'Viña del Mar',
    prevision_salud: 'fonasa', numero_fonasa: 'C',
    prevision_social: 'afp', nombre_afp: 'Provida',
    grupo_sanguineo: 'A+',
    alergias: null,
    antecedentes: 'Diabetes tipo 2, insulinodependiente',
    contacto_emergencia_nombre: 'Ana Araya', contacto_emergencia_telefono: '+56 9 7123 4567',
  },
  {
    nombre: 'Camila', apellido: 'Reyes Poblete',
    rut: '18.234.567-K', fecha_nacimiento: '1998-11-05', genero: 'femenino',
    telefono: '+56 9 9345 6789', email: 'camila.reyes@gmail.com',
    direccion: 'Pasaje Los Pinos 789', ciudad: 'Concepción',
    prevision_salud: 'fonasa', numero_fonasa: 'B',
    prevision_social: 'ninguna',
    grupo_sanguineo: 'B+',
    alergias: 'Ibuprofeno, Aspirina',
    antecedentes: 'Asma bronquial desde la infancia',
    contacto_emergencia_nombre: 'Roberto Reyes', contacto_emergencia_telefono: '+56 9 9456 7890',
  },
  {
    nombre: 'Sebastián', apellido: 'Castro Vidal',
    rut: '14.567.890-3', fecha_nacimiento: '1978-02-28', genero: 'masculino',
    telefono: '+56 9 6789 0123', email: 'sebastian.castro@empresa.cl',
    direccion: 'Av. Las Condes 5678, Of. 301', ciudad: 'Santiago',
    prevision_salud: 'isapre', nombre_isapre: 'Cruz Blanca',
    prevision_social: 'afp', nombre_afp: 'Capital',
    grupo_sanguineo: 'AB+',
    alergias: null,
    antecedentes: 'Colesterol alto, en dieta y tratamiento farmacológico',
    contacto_emergencia_nombre: 'María Castro', contacto_emergencia_telefono: '+56 9 6890 1234',
  },
  {
    nombre: 'Isabella', apellido: 'López Guerrero',
    rut: '20.123.456-7', fecha_nacimiento: '2001-09-14', genero: 'femenino',
    telefono: '+56 9 5678 9012', email: 'isabella.lopez@gmail.com',
    direccion: 'Calle Maipú 321', ciudad: 'Temuco',
    prevision_salud: 'fonasa', numero_fonasa: 'A',
    prevision_social: 'ninguna',
    grupo_sanguineo: 'O-',
    alergias: 'Látex',
    antecedentes: null,
    contacto_emergencia_nombre: 'Jorge López', contacto_emergencia_telefono: '+56 9 5789 0123',
  },
  {
    nombre: 'Matías', apellido: 'González Herrera',
    rut: '13.456.789-1', fecha_nacimiento: '1972-05-30', genero: 'masculino',
    telefono: '+56 9 4567 8901', email: 'matias.gonzalez@gmail.com',
    direccion: 'Av. O\'Higgins 999', ciudad: 'Valparaíso',
    prevision_salud: 'particular',
    prevision_social: 'afp', nombre_afp: 'Uno',
    grupo_sanguineo: 'A-',
    alergias: 'Sulfonamidas',
    antecedentes: 'Bypass coronario 2018, hipotiroidismo',
    contacto_emergencia_nombre: 'Lucía Herrera', contacto_emergencia_telefono: '+56 9 4678 9012',
  },
  {
    nombre: 'Fernanda', apellido: 'Muñoz Contreras',
    rut: '17.890.123-4', fecha_nacimiento: '1995-12-20', genero: 'femenino',
    telefono: '+56 9 3456 7890', email: 'fernanda.munoz@outlook.com',
    direccion: 'Calle Colón 654', ciudad: 'Antofagasta',
    prevision_salud: 'fonasa', numero_fonasa: 'D',
    prevision_social: 'afp', nombre_afp: 'Planvital',
    grupo_sanguineo: 'B-',
    alergias: null,
    antecedentes: 'Lupus eritematoso sistémico en seguimiento',
    contacto_emergencia_nombre: 'Patricia Contreras', contacto_emergencia_telefono: '+56 9 3567 8901',
  },
  {
    nombre: 'Nicolás', apellido: 'Rojas Espinoza',
    rut: '16.234.567-8', fecha_nacimiento: '1988-08-10', genero: 'masculino',
    telefono: '+56 9 2345 6789', email: 'nicolas.rojas@gmail.com',
    direccion: 'Pasaje Las Flores 147', ciudad: 'Rancagua',
    prevision_salud: 'isapre', nombre_isapre: 'Colmena',
    prevision_social: 'afp', nombre_afp: 'Modelo',
    grupo_sanguineo: 'AB-',
    alergias: 'Penicilina, Cefalosporinas',
    antecedentes: 'Migraña crónica, epilepsia controlada',
    contacto_emergencia_nombre: 'Sandra Espinoza', contacto_emergencia_telefono: '+56 9 2456 7890',
  },
  {
    nombre: 'Antonia', apellido: 'Vargas Núñez',
    rut: '19.567.890-5', fecha_nacimiento: '2003-04-03', genero: 'femenino',
    telefono: '+56 9 1234 5678', email: 'antonia.vargas@gmail.com',
    direccion: 'Av. Alemania 258', ciudad: 'Osorno',
    prevision_salud: 'fonasa', numero_fonasa: 'B',
    prevision_social: 'ninguna',
    grupo_sanguineo: 'O+',
    alergias: null,
    antecedentes: null,
    contacto_emergencia_nombre: 'Carmen Núñez', contacto_emergencia_telefono: '+56 9 1345 6789',
  },
  {
    nombre: 'Alejandro', apellido: 'Pérez Ibáñez',
    rut: '11.234.567-6', fecha_nacimiento: '1965-01-18', genero: 'masculino',
    telefono: '+56 9 9012 3456', email: 'alejandro.perez@gmail.com',
    direccion: 'Calle Balmaceda 369', ciudad: 'La Serena',
    prevision_salud: 'isapre', nombre_isapre: 'Vida Tres',
    prevision_social: 'ips',
    grupo_sanguineo: 'A+',
    alergias: 'AINEs en general',
    antecedentes: 'EPOC moderado, ex fumador 20 años. Insuficiencia renal crónica estadio 2',
    contacto_emergencia_nombre: 'Rosa Ibáñez', contacto_emergencia_telefono: '+56 9 9123 4567',
  },
];

const run = async () => {
  await sequelize.authenticate();
  console.log('Conectado a la base de datos.');

  let creados = 0;
  let omitidos = 0;

  for (const datos of pacientes) {
    const existe = await Paciente.findOne({ where: { rut: datos.rut } });
    if (existe) {
      console.log(`  Omitido (ya existe): ${datos.nombre} ${datos.apellido} — ${datos.rut}`);
      omitidos++;
      continue;
    }
    await Paciente.create(datos);
    console.log(`  Creado: ${datos.nombre} ${datos.apellido} — ${datos.rut}`);
    creados++;
  }

  console.log(`\nListo: ${creados} creados, ${omitidos} omitidos.`);
  process.exit(0);
};

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
