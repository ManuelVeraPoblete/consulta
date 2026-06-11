const { User, MedicoPerfil, Prevision, Especialidad, Subespecialidad, MedicoSubespecialidad, SecretariaMedico, ROLES } = require('../models');

const listarUsuarios = async (req, res) => {
  try {
    const { rol, activo } = req.query;
    const where = {};
    if (rol) where.rol = rol;
    if (activo !== undefined) where.activo = activo === 'true';

    const include = [{
      model: MedicoPerfil,
      as: 'perfil',
      required: false,
      include: [
        { model: Prevision,       as: 'previsiones'       },
        { model: Especialidad,    as: 'especialidad'      },
        { model: Subespecialidad, as: 'subespecialidades' },
      ],
    }];

    if (!rol || rol === ROLES.SECRETARIA) {
      include.push({
        model: User,
        as: 'medicosAsignados',
        required: false,
        attributes: ['id', 'nombre', 'apellido'],
        include: [{
          model: MedicoPerfil, as: 'perfil', required: false,
          include: [{ model: Especialidad, as: 'especialidad' }],
        }],
      });
    }

    const usuarios = await User.findAll({ where, include, order: [['createdAt', 'DESC']] });
    res.json({ usuarios });
  } catch {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

const crearMedico = async (req, res) => {
  try {
    const { nombre, apellido, rut, email, password, perfil } = req.body;

    if (!nombre || !apellido || !rut || !email || !password)
      return res.status(400).json({ message: 'Todos los campos de usuario son requeridos' });
    if (!perfil?.numero_registro)
      return res.status(400).json({ message: 'El número de registro prestador es requerido' });
    if (!perfil?.titulo_profesional)
      return res.status(400).json({ message: 'El título profesional es requerido' });
    if (!perfil?.especialidad_id)
      return res.status(400).json({ message: 'La especialidad es requerida' });
    if (!perfil.modalidad_presencial && !perfil.modalidad_telemedicina)
      return res.status(400).json({ message: 'Debe seleccionar al menos una modalidad de atención' });
    if (!perfil.prevision_ids?.length && !perfil.acepta_particular)
      return res.status(400).json({ message: 'Debe seleccionar al menos un convenio' });
    if (perfil.acepta_particular && (!perfil.valor_particular || perfil.valor_particular <= 0))
      return res.status(400).json({ message: 'El valor de consulta particular es requerido' });

    const rutExiste = await User.findOne({ where: { rut } });
    if (rutExiste) return res.status(409).json({ message: 'El RUT ya está registrado' });

    const emailExiste = await User.findOne({ where: { email } });
    if (emailExiste) return res.status(409).json({ message: 'El email ya está registrado' });

    const usuario = await User.create({ nombre, apellido, rut, email, password, rol: ROLES.MEDICO });

    const medicoPerfil = await MedicoPerfil.create({
      usuario_id:                usuario.id,
      numero_registro:           perfil.numero_registro           || null,
      fecha_registro_prestador:  perfil.fecha_registro_prestador  || null,
      titulo_profesional:        perfil.titulo_profesional        || null,
      especialidad_id:           perfil.especialidad_id,
      entidad_certificadora:     perfil.entidad_certificadora     || null,
      vigencia_especialidad:     perfil.vigencia_especialidad     || null,
      descripcion:               perfil.descripcion               || '',
      modalidad_presencial:      perfil.modalidad_presencial      || false,
      modalidad_telemedicina:    perfil.modalidad_telemedicina    || false,
      acepta_particular:         perfil.acepta_particular         || false,
      valor_particular:          perfil.acepta_particular ? perfil.valor_particular : null,
    });

    if (perfil.prevision_ids?.length) {
      await medicoPerfil.setPrevisiones(perfil.prevision_ids);
    }
    if (perfil.subespecialidad_ids?.length) {
      await medicoPerfil.setSubespecialidades(perfil.subespecialidad_ids);
    }

    const resultado = await User.findByPk(usuario.id, {
      include: [{
        model: MedicoPerfil,
        as: 'perfil',
        include: [
          { model: Prevision,       as: 'previsiones'      },
          { model: Especialidad,    as: 'especialidad'     },
          { model: Subespecialidad, as: 'subespecialidades' },
        ],
      }],
    });

    res.status(201).json({ usuario: resultado, message: 'Médico creado exitosamente' });
  } catch (error) {
    const msg = /ya (está|existe)|requerido|inválido/i.test(error.message)
      ? error.message
      : 'Error al crear médico';
    res.status(400).json({ message: msg });
  }
};

const crearUsuario = async (req, res) => {
  try {
    const { nombre, apellido, rut, email, password, rol, perfil } = req.body;

    if (!nombre || !apellido || !email || !password || !rol) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
    if (!Object.values(ROLES).includes(rol)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    if (rut) {
      const rutExiste = await User.findOne({ where: { rut } });
      if (rutExiste) return res.status(409).json({ message: 'El RUT ya está registrado' });
    }

    const emailExiste = await User.findOne({ where: { email } });
    if (emailExiste) return res.status(409).json({ message: 'El correo ya está registrado' });

    const usuario = await User.create({ nombre, apellido, rut: rut || null, email, password, rol });

    if (rol === ROLES.MEDICO) {
      if (!perfil?.especialidad) {
        await usuario.destroy();
        return res.status(400).json({ message: 'La especialidad es requerida para médicos' });
      }
      await MedicoPerfil.create({
        usuario_id:             usuario.id,
        especialidad:           perfil.especialidad,
        descripcion:            perfil.descripcion || '',
        modalidad_presencial:   perfil.modalidad_presencial   || false,
        modalidad_telemedicina: perfil.modalidad_telemedicina || false,
        acepta_isapre:          perfil.acepta_isapre          || false,
        acepta_fonasa:          perfil.acepta_fonasa          || false,
        acepta_particular:      perfil.acepta_particular      || false,
        valor_particular:       perfil.valor_particular       || null,
      });
    }

    const resultado = await User.findByPk(usuario.id, {
      include: [{ model: MedicoPerfil, as: 'perfil', required: false }],
    });

    res.status(201).json({ usuario: resultado, message: 'Usuario creado exitosamente' });
  } catch (error) {
    const msg = /ya (está|existe)|requerido|inválido/i.test(error.message)
      ? error.message
      : 'Error al crear usuario';
    res.status(400).json({ message: msg });
  }
};

const getUsuario = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.params.id, {
      include: [{ model: MedicoPerfil, as: 'perfil', required: false }],
    });
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ usuario });
  } catch {
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.params.id, {
      include: [{ model: MedicoPerfil, as: 'perfil', required: false }],
    });
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (usuario.rol === ROLES.ADMIN) {
      return res.status(403).json({ message: 'No se puede editar un usuario administrador' });
    }

    const { nombre, apellido, email, rut, telefono, perfil } = req.body;

    if (email && email !== usuario.email) {
      const existe = await User.findOne({ where: { email } });
      if (existe) return res.status(409).json({ message: 'El email ya está en uso' });
    }
    if (rut && rut !== usuario.rut) {
      const existe = await User.findOne({ where: { rut } });
      if (existe) return res.status(409).json({ message: 'El RUT ya está registrado' });
    }

    await usuario.update({
      ...(nombre    && { nombre }),
      ...(apellido  && { apellido }),
      ...(email     && { email }),
      ...(rut  !== undefined && { rut: rut || null }),
      ...(telefono !== undefined && { telefono: telefono || null }),
    });

    if (usuario.rol === ROLES.MEDICO && perfil) {
      if (usuario.perfil) {
        await usuario.perfil.update({
          ...(perfil.especialidad_id      !== undefined && { especialidad_id: perfil.especialidad_id }),
          ...(perfil.descripcion          !== undefined && { descripcion: perfil.descripcion }),
          ...(perfil.acepta_isapre        !== undefined && { acepta_isapre: perfil.acepta_isapre }),
          ...(perfil.acepta_fonasa        !== undefined && { acepta_fonasa: perfil.acepta_fonasa }),
          ...(perfil.acepta_particular    !== undefined && { acepta_particular: perfil.acepta_particular }),
          ...(perfil.valor_particular     !== undefined && { valor_particular: perfil.acepta_particular ? perfil.valor_particular : null }),
          ...(perfil.modalidad_presencial   !== undefined && { modalidad_presencial: perfil.modalidad_presencial }),
          ...(perfil.modalidad_telemedicina !== undefined && { modalidad_telemedicina: perfil.modalidad_telemedicina }),
        });
      } else {
        await MedicoPerfil.create({
          usuario_id: usuario.id,
          especialidad_id:        perfil.especialidad_id      || null,
          descripcion:            perfil.descripcion          || '',
          acepta_isapre:          perfil.acepta_isapre        || false,
          acepta_fonasa:          perfil.acepta_fonasa        || false,
          acepta_particular:      perfil.acepta_particular    || false,
          valor_particular:       perfil.acepta_particular ? perfil.valor_particular : null,
          modalidad_presencial:   perfil.modalidad_presencial   || false,
          modalidad_telemedicina: perfil.modalidad_telemedicina || false,
        });
      }
    }

    const resultado = await User.findByPk(usuario.id, {
      include: [{
        model: MedicoPerfil, as: 'perfil', required: false,
        include: [{ model: Especialidad, as: 'especialidad' }],
      }],
    });
    res.json({ usuario: resultado, message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    const msg = /ya (está|existe)|requerido|inválido/i.test(error.message)
      ? error.message
      : 'Error al actualizar usuario';
    res.status(400).json({ message: msg });
  }
};

const desactivarUsuario = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (usuario.id === req.user.id) {
      return res.status(400).json({ message: 'No puedes desactivarte a ti mismo' });
    }
    await usuario.update({ activo: false });
    res.json({ message: 'Usuario desactivado' });
  } catch {
    res.status(500).json({ message: 'Error al desactivar usuario' });
  }
};

const reactivarUsuario = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    await usuario.update({ activo: true });
    res.json({ message: 'Usuario reactivado' });
  } catch {
    res.status(500).json({ message: 'Error al reactivar usuario' });
  }
};

const crearSecretaria = async (req, res) => {
  try {
    const { nombre, apellido, rut, telefono, email, password, medico_ids } = req.body;

    if (!nombre || !apellido || !email || !password)
      return res.status(400).json({ message: 'Nombre, apellido, email y contraseña son requeridos' });
    if (!telefono?.trim())
      return res.status(400).json({ message: 'El teléfono es requerido' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'El email no es válido' });
    if (password.length < 8)
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });

    if (rut) {
      const rutExiste = await User.findOne({ where: { rut } });
      if (rutExiste) return res.status(409).json({ message: 'El RUT ya está registrado' });
    }
    const emailExiste = await User.findOne({ where: { email } });
    if (emailExiste) return res.status(409).json({ message: 'El email ya está registrado' });

    const secretaria = await User.create({
      nombre, apellido,
      rut: rut || null,
      telefono: telefono.trim(),
      email, password,
      rol: ROLES.SECRETARIA,
    });

    if (medico_ids?.length) {
      await secretaria.setMedicosAsignados(medico_ids);
    }

    const resultado = await User.findByPk(secretaria.id, {
      include: [{
        model: User, as: 'medicosAsignados', required: false,
        attributes: ['id', 'nombre', 'apellido'],
        include: [{
          model: MedicoPerfil, as: 'perfil', required: false,
          include: [{ model: Especialidad, as: 'especialidad' }],
        }],
      }],
    });

    res.status(201).json({ usuario: resultado, message: 'Secretaria creada exitosamente' });
  } catch (error) {
    const msg = /ya (está|existe)|requerido|inválido/i.test(error.message)
      ? error.message
      : 'Error al crear secretaria';
    res.status(400).json({ message: msg });
  }
};

const actualizarMedicosSecretaria = async (req, res) => {
  try {
    const secretaria = await User.findByPk(req.params.id);
    if (!secretaria) return res.status(404).json({ message: 'Secretaria no encontrada' });
    if (secretaria.rol !== ROLES.SECRETARIA)
      return res.status(400).json({ message: 'El usuario no es secretaria' });

    const { medico_ids } = req.body;
    await secretaria.setMedicosAsignados(medico_ids || []);

    const resultado = await User.findByPk(secretaria.id, {
      include: [{
        model: User, as: 'medicosAsignados', required: false,
        attributes: ['id', 'nombre', 'apellido'],
        include: [{
          model: MedicoPerfil, as: 'perfil', required: false,
          include: [{ model: Especialidad, as: 'especialidad' }],
        }],
      }],
    });
    res.json({ usuario: resultado, message: 'Médicos actualizados' });
  } catch {
    res.status(500).json({ message: 'Error al actualizar médicos de la secretaria' });
  }
};

const listarEspecialidades = async (req, res) => {
  try {
    const especialidades = await Especialidad.findAll({
      where: { activo: true },
      include: [{
        model: Subespecialidad,
        as: 'subespecialidades',
        where: { activo: true },
        required: false,
        order: [['nombre', 'ASC']],
      }],
      order: [['nombre', 'ASC']],
    });
    res.json({ especialidades });
  } catch {
    res.status(500).json({ message: 'Error al obtener especialidades' });
  }
};

const listarPrevisiones = async (req, res) => {
  try {
    const previsiones = await Prevision.findAll({
      where: { activo: true },
      order: [['tipo', 'ASC'], ['nombre', 'ASC']],
    });
    res.json({ previsiones });
  } catch {
    res.status(500).json({ message: 'Error al obtener previsiones' });
  }
};

module.exports = {
  listarUsuarios, crearMedico, crearSecretaria, crearUsuario,
  getUsuario, actualizarUsuario, actualizarMedicosSecretaria,
  desactivarUsuario, reactivarUsuario,
  listarPrevisiones, listarEspecialidades,
};
