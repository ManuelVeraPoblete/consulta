require('dotenv').config();
const { syncDatabase, User, ROLES } = require('../models');

const seedAll = async () => {
  await syncDatabase();

  const [admin, created] = await User.findOrCreate({
    where: { email: 'admin@consulta.com' },
    defaults: {
      nombre:   'Admin',
      apellido: 'Sistema',
      email:    'admin@consulta.com',
      password: 'admin123',
      rol:      ROLES.ADMIN,
    },
  });

  console.log(`${created ? 'Creado' : 'Ya existe'}: ${admin.email} (${admin.rol})`);
  console.log('\nCredenciales:');
  console.log('  Admin: admin@consulta.com / admin123');
  process.exit(0);
};

seedAll().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
