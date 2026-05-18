require('dotenv').config();
const { sequelize, Paciente } = require('../models');

/* ── Verificador dígito RUT chileno ── */
function dvRut(n) {
  let s = 0, f = 2;
  for (let i = n.toString().length - 1; i >= 0; i--) {
    s += parseInt(n.toString()[i]) * f;
    f = f < 7 ? f + 1 : 2;
  }
  const r = 11 - (s % 11);
  return r === 11 ? '0' : r === 10 ? 'K' : r.toString();
}
function fmtRut(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dvRut(n);
}

/* ── Datos base ── */
const NOMBRES_M = [
  'Alejandro','Andrés','Benjamín','Carlos','Cristóbal','Daniel','David','Diego',
  'Eduardo','Emilio','Esteban','Fabián','Felipe','Fernando','Francisco','Gabriel',
  'Gonzalo','Guillermo','Héctor','Ignacio','Iván','Javier','Jorge','José',
  'Juan','Julio','Leonardo','Luis','Manuel','Marcelo','Mario','Martín',
  'Matías','Miguel','Nicolás','Pablo','Patricio','Pedro','Rafael','Raúl',
  'Ricardo','Roberto','Rodrigo','Sebastián','Sergio','Tomás','Vicente','Víctor',
  'Agustín','Alberto','Alfredo','Álvaro','Arturo','Bruno','Claudio','Cristian',
  'Dante','Ernesto','Evaristo','Félix','Germán','Gustavo','Hugo','Isidro',
  'Jaime','Jonathan','Lorenzo','Lucas','Marco','Mauricio','Maximiliano','Nelson',
  'Omar','Orlando','Oscar','Osvaldo','Ramón','René','Rolando','Rubén',
  'Salvador','Samuel','Santiago','Simón','Tadeo','Ubaldo','Valentín','Wilfredo',
];

const NOMBRES_F = [
  'Alejandra','Alicia','Amanda','Amelia','Ana','Andrea','Antonia','Bárbara',
  'Beatriz','Camila','Carmen','Catalina','Cecilia','Claudia','Constanza','Cristina',
  'Daniela','Diana','Elena','Elisa','Emilia','Eva','Fernanda','Francisca',
  'Gabriela','Gloria','Graciela','Ignacia','Isabel','Javiera','Jennifer','Jessica',
  'Josefina','Julia','Karen','Laura','Lorena','Lucía','Luisa','Magdalena',
  'Marcela','María','Mariana','Marisol','Mónica','Natalia','Nicole','Pamela',
  'Patricia','Paulina','Pilar','Raquel','Renata','Rosa','Sandra','Silvia',
  'Sofía','Soledad','Susana','Tamara','Teresa','Valentina','Valeria','Verónica',
  'Victoria','Ximena','Yasna','Yolanda','Adriana','Agustina','Angélica','Carolina',
  'Carla','Cindy','Denisse','Esther','Florencia','Gladys','Ingrid','Iris',
  'Karina','Lilian','Macarena','Margarita','Meritxell','Miriam','Nancy','Norma',
  'Olga','Priscila','Rebeca','Regina','Romina','Sara','Trinidad','Viviana',
];

const APELLIDOS = [
  'Acuña','Aguilera','Aguirre','Albornoz','Alvarado','Álvarez','Araya','Arenas',
  'Baeza','Barrera','Becerra','Bravo','Bustos','Cabrera','Cáceres','Campos',
  'Cárdenas','Carrasco','Castillo','Castro','Cerda','Cifuentes','Contreras','Córdoba',
  'Cortés','Cruz','Cuevas','Delgado','Díaz','Donoso','Durán','Espinoza',
  'Faúndez','Figueroa','Flores','Fuentes','Galindo','Gallardo','García','Godoy',
  'González','Guerra','Gutiérrez','Guzmán','Herrera','Hidalgo','Ibáñez','Iturra',
  'Jara','Jiménez','Lagos','Lara','Leiva','León','López','Loyola',
  'Lucero','Luna','Magaña','Maldonado','Marín','Martínez','Medina','Mejías',
  'Mendoza','Molina','Monroy','Monsalve','Montecinos','Morales','Moreno','Muñoz',
  'Naranjo','Navarro','Nieto','Núñez','Ojeda','Olivares','Ortega','Ortiz',
  'Oyanedel','Palma','Paredes','Peña','Peralta','Pérez','Pino','Poblete',
  'Ponce','Quintero','Quiroga','Ramos','Reyes','Rivera','Robledo','Rodríguez',
  'Rojas','Romero','Ruiz','Salazar','Salgado','Sandoval','Santana','Sepúlveda',
  'Silva','Soto','Suárez','Tapia','Torres','Ulloa','Uribe','Valdivia',
  'Valencia','Valenzuela','Vargas','Vásquez','Vera','Villalobos','Villarreal','Yáñez',
];

const CIUDADES = [
  'Santiago','Santiago','Santiago','Santiago','Viña del Mar','Valparaíso',
  'Concepción','Temuco','La Serena','Antofagasta','Iquique','Puerto Montt',
  'Rancagua','Talca','Arica','Osorno','Los Ángeles','Calama','Coquimbo',
  'Valdivia','Punta Arenas','Chillán','Copiapó','Curicó','Quillota','San Antonio',
  'Linares','Ovalle','Illapel','Tocopilla','Caldera','Alto Hospicio','Pudahuel',
  'Maipú','La Florida','Puente Alto','San Bernardo','Quilicura','Ñuñoa','Macul',
];

const CALLES = [
  'Av. Providencia','Calle Los Aromos','Av. Las Condes','Pasaje Los Pinos',
  'Av. O\'Higgins','Calle Colón','Calle Balmaceda','Av. Alemania','Calle Maipú',
  'Av. Independencia','Calle San Martín','Av. Errázuriz','Pasaje Los Robles',
  'Calle Arturo Prat','Av. Vicuña Mackenna','Calle Carrera','Av. Bulnes',
  'Calle Lord Cochrane','Av. Irarrázaval','Calle Zenteno','Av. Matta',
  'Calle Serrano','Av. Grecia','Calle Bellavista','Calle Morandé',
  'Av. Santa Rosa','Calle Riquelme','Av. Tobalaba','Calle Moneda','Av. Manuel Montt',
];

const ISAPRRES = ['Banmédica','Cruz Blanca','Colmena','Vida Tres','Consalud','Esencial','Nueva Masvida','Más Vida','Ecuasalud'];
const AFPS     = ['Capital','Cuprum','Habitat','Modelo','PlanVital','Provida','Uno'];
const FONASA_TRAMOS = ['A','B','B','C','C','D'];
const GRUPOS_SANG   = ['O+','O+','O+','A+','A+','B+','AB+','O-','A-','B-','AB-','desconocido'];

const ALERGIAS = [
  null, null, null,
  'Penicilina',
  'Ibuprofeno',
  'Aspirina',
  'Sulfonamidas',
  'Cefalosporinas',
  'AINEs en general',
  'Látex',
  'Penicilina, Cefalosporinas',
  'Ibuprofeno, Aspirina',
  'Metformina',
  'Contraste yodado',
  'Polen y ácaros',
  'Mariscos',
  'Amoxicilina',
  'Tramadol',
  'Morfina',
  'Codeína',
];

const ANTECEDENTES = [
  null, null,
  'Hipertensión arterial en tratamiento',
  'Diabetes mellitus tipo 2',
  'Diabetes mellitus tipo 1, insulinodependiente',
  'Hipotiroidismo en tratamiento con levotiroxina',
  'Hipertiroidismo en seguimiento',
  'Asma bronquial desde la infancia',
  'EPOC moderado, ex fumador',
  'Insuficiencia cardíaca congestiva compensada',
  'Cardiopatía coronaria, bypass 2019',
  'Arritmia cardíaca, fibrilación auricular',
  'Hipercolesterolemia en tratamiento farmacológico',
  'Obesidad grado II, en tratamiento nutricional',
  'Artritis reumatoide en seguimiento reumatológico',
  'Lupus eritematoso sistémico',
  'Enfermedad de Crohn en remisión',
  'Gastritis crónica, H. pylori erradicado',
  'Reflujo gastroesofágico crónico',
  'Insuficiencia renal crónica estadio 2',
  'Cirrosis hepática Child-Pugh A, seguimiento',
  'Epilepsia controlada con medicación',
  'Migraña crónica, profilaxis con topiramato',
  'Depresión mayor en tratamiento',
  'Trastorno de ansiedad generalizada',
  'Esquizofrenia en tratamiento, estable',
  'Hipoacusia bilateral, uso de audífonos',
  'Glaucoma en tratamiento tópico',
  'Catarata operada, sin complicaciones',
  'Escoliosis lumbar leve',
  'Gonartrosis bilateral grado II-III',
  'Fractura de cadera operada 2021',
  'Prótesis de rodilla derecha 2020',
  'VIH/SIDA en tratamiento antirretroviral',
  'Hepatitis C crónica, tratada',
  'Tuberculosis pulmonar tratada y curada',
  'Hiperprolactinemia en tratamiento',
  'Síndrome de ovario poliquístico',
  'Endometriosis grado III',
  'Embarazo de 28 semanas, control prenatal',
];

const EMERGENCIA_NOMBRES_M = ['Carlos','Juan','Pedro','Luis','Jorge','Ricardo','Alberto','Mario','Diego','Andrés'];
const EMERGENCIA_NOMBRES_F = ['María','Carmen','Rosa','Ana','Laura','Patricia','Sandra','Gloria','Claudia','Teresa'];
const EMERGENCIA_RELACIONES = ['(esposa)','(esposo)','(madre)','(padre)','(hermano)','(hermana)','(hijo)','(hija)','(amigo)'];

/* ── Helpers ── */
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rnd   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const phone = () => `+56 9 ${rnd(1000,9999)} ${rnd(1000,9999)}`;

function fechaNacimiento() {
  const y = rnd(1944, 2005);
  const m = rnd(1, 12);
  const d = rnd(1, 28);
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function email(nombre, apellido, idx) {
  const dominios = ['gmail.com','hotmail.com','outlook.com','yahoo.com','empresa.cl','live.com'];
  const n = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s/g,'');
  const a = apellido.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  return `${n}.${a}${idx}@${pick(dominios)}`;
}

function generarPaciente(idx) {
  const genero = Math.random() < 0.52 ? 'femenino' : 'masculino';
  const nombre  = genero === 'femenino' ? pick(NOMBRES_F) : pick(NOMBRES_M);
  const ap1     = pick(APELLIDOS);
  let   ap2     = pick(APELLIDOS);
  while (ap2 === ap1) ap2 = pick(APELLIDOS);
  const apellido = `${ap1} ${ap2}`;

  const rutNum = 22000001 + idx;
  const rut    = fmtRut(rutNum);

  const prevision = (() => {
    const r = Math.random();
    if (r < 0.40) return 'fonasa';
    if (r < 0.75) return 'isapre';
    return 'particular';
  })();

  const prev_social = (() => {
    const r = Math.random();
    if (r < 0.65) return 'afp';
    if (r < 0.70) return 'ips';
    return 'ninguna';
  })();

  const ciudad = pick(CIUDADES);
  const calle  = pick(CALLES);
  const numero = rnd(100, 9999);
  const dpto   = Math.random() < 0.3 ? `, Dpto ${rnd(1,150)}` : '';

  const emergNombre = (genero === 'femenino' ? pick(EMERGENCIA_NOMBRES_M) : pick(EMERGENCIA_NOMBRES_F))
    + ' ' + pick(APELLIDOS) + ' ' + pick(EMERGENCIA_RELACIONES);

  return {
    nombre,
    apellido,
    rut,
    fecha_nacimiento: fechaNacimiento(),
    genero,
    telefono: phone(),
    email: email(nombre, ap1, rutNum),
    direccion: `${calle} ${numero}${dpto}`,
    ciudad,
    prevision_salud: prevision,
    nombre_isapre:   prevision === 'isapre' ? pick(ISAPRRES) : null,
    numero_fonasa:   prevision === 'fonasa' ? pick(FONASA_TRAMOS) : null,
    prevision_social: prev_social,
    nombre_afp:       prev_social === 'afp' ? pick(AFPS) : null,
    grupo_sanguineo: pick(GRUPOS_SANG),
    alergias:         Math.random() < 0.45 ? pick(ALERGIAS.filter(Boolean)) : null,
    antecedentes:     Math.random() < 0.55 ? pick(ANTECEDENTES.filter(Boolean)) : null,
    contacto_emergencia_nombre:   emergNombre,
    contacto_emergencia_telefono: phone(),
    activo: true,
  };
}

/* ── Runner ── */
const run = async () => {
  await sequelize.authenticate();
  console.log('Conectado a la base de datos.\n');

  let creados = 0, omitidos = 0, errores = 0;

  for (let i = 0; i < 300; i++) {
    const datos = generarPaciente(i);
    try {
      const existe = await Paciente.findOne({ where: { rut: datos.rut } });
      if (existe) {
        console.log(`  Omitido (ya existe): ${datos.rut}`);
        omitidos++;
        continue;
      }
      await Paciente.create(datos);
      console.log(`  [${i + 1}/300] ${datos.nombre} ${datos.apellido} — ${datos.rut} (${datos.prevision_salud})`);
      creados++;
    } catch (e) {
      console.error(`  ERROR en ${datos.rut}: ${e.message}`);
      errores++;
    }
  }

  console.log(`\n──────────────────────────────`);
  console.log(`Creados:  ${creados}`);
  console.log(`Omitidos: ${omitidos}`);
  console.log(`Errores:  ${errores}`);
  console.log(`──────────────────────────────`);
  process.exit(0);
};

run().catch(err => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});
