const { Router } = require('express');
const { Op }        = require('sequelize');
const { authenticate } = require('../middleware/authMiddleware');
const { Medicamento }  = require('../models');

const router = Router();

router.get('/buscar', authenticate, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json([]);

    const rows = await Medicamento.findAll({
      where: { nombre: { [Op.like]: `%${q}%` }, activo: true },
      attributes: ['id', 'nombre', 'numero_registro'],
      order: [['nombre', 'ASC']],
      limit: 50,
    });

    const qLow = q.toLowerCase();
    const results = rows
      .sort((a, b) => {
        const aStarts = a.nombre.toLowerCase().startsWith(qLow) ? 0 : 1;
        const bStarts = b.nombre.toLowerCase().startsWith(qLow) ? 0 : 1;
        return aStarts - bStarts || a.nombre.localeCompare(b.nombre);
      })
      .slice(0, 10);

    res.json(results);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al buscar medicamentos' });
  }
});

module.exports = router;
