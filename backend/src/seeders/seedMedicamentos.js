require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { syncDatabase, Medicamento } = require('../models');

const CSV_PATH = '/home/manuel/Descargas/medicamentos_limpios_legibles.csv';

function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  // Saltar cabecera
  return lines.slice(1).map(line => {
    const commaIdx = line.indexOf(',');
    if (commaIdx === -1) return null;
    const registro = line.slice(0, commaIdx).trim();
    const nombre   = line.slice(commaIdx + 1).trim().replace(/^"|"$/g, '');
    if (!registro || !nombre) return null;
    return { numero_registro: registro, nombre };
  }).filter(Boolean);
}

const run = async () => {
  await syncDatabase();
  console.log('Tabla medicamentos sincronizada.\n');

  const content      = fs.readFileSync(CSV_PATH, 'utf-8');
  const medicamentos = parseCSV(content);
  console.log(`Medicamentos leídos del CSV: ${medicamentos.length}`);

  let insertados = 0, omitidos = 0, errores = 0;
  const BATCH = 100;

  for (let i = 0; i < medicamentos.length; i += BATCH) {
    const lote = medicamentos.slice(i, i + BATCH);
    try {
      const result = await Medicamento.bulkCreate(lote, {
        ignoreDuplicates: true,
        validate: true,
      });
      insertados += result.length;
    } catch (e) {
      // Si el bulk falla, insertar uno por uno para identificar el problema
      for (const m of lote) {
        try {
          await Medicamento.create(m);
          insertados++;
        } catch {
          omitidos++;
        }
      }
    }
    process.stdout.write(`\r  Procesados: ${Math.min(i + BATCH, medicamentos.length)}/${medicamentos.length}`);
  }

  console.log(`\n\n──────────────────────────────`);
  console.log(`Insertados: ${insertados}`);
  console.log(`Omitidos:   ${omitidos}`);
  console.log(`Errores:    ${errores}`);
  console.log(`──────────────────────────────`);
  process.exit(0);
};

run().catch(err => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});
