const { Router } = require('express');
const { Op }        = require('sequelize');
const { authenticate } = require('../middleware/authMiddleware');
const { Medicamento }  = require('../models');

const router = Router();

router.get('/buscar', authenticate, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json([]);

    const results = await Medicamento.findAll({
      where: {
        nombre: { [Op.like]: `%${q}%` },
        activo: true,
      },
      attributes: ['id', 'nombre', 'numero_registro'],
      order: [
        // Primero los que empiezan con el término buscado
        [Medicamento.sequelize.literal(`CASE WHEN nombre LIKE '${q.replace(/'/g, "''")}%' THEN 0 ELSE 1 END`), 'ASC'],
        ['nombre', 'ASC'],
      ],
      limit: 10,
    });

    res.json(results);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al buscar medicamentos' });
  }
});

module.exports = router;
