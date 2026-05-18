require('dotenv').config();
const { syncDatabase, Prevision } = require('../models');

const PREVISIONES = [
  { nombre: 'FONASA',               tipo: 'fonasa' },
  { nombre: 'Banmédica S.A.',       tipo: 'isapre' },
  { nombre: 'Colmena Golden Cross S.A.', tipo: 'isapre' },
  { nombre: 'Consalud S.A.',        tipo: 'isapre' },
  { nombre: 'Cruz Blanca S.A.',     tipo: 'isapre' },
  { nombre: 'Cruz del Norte Ltda.', tipo: 'isapre' },
  { nombre: 'Nueva Masvida S.A.',   tipo: 'isapre' },
  { nombre: 'Vida Tres S.A.',       tipo: 'isapre' },
  { nombre: 'Esencial S.A.',        tipo: 'isapre' },
];

const run = async () => {
  await syncDatabase();
  for (const p of PREVISIONES) {
    const [, created] = await Prevision.findOrCreate({ where: { nombre: p.nombre }, defaults: p });
    console.log(`${created ? 'Creada' : 'Ya existe'}: ${p.nombre} (${p.tipo})`);
  }
  console.log('\nPrevisiones listas.');
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
