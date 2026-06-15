import React, { useState } from 'react';
import AdminSidebar    from '../components/admin/AdminSidebar';
import AdminHeader     from '../components/admin/AdminHeader';
import InicioTab       from '../components/admin/tabs/InicioTab';
import UsuariosTab     from '../components/admin/tabs/UsuariosTab';
import MedicosTab      from '../components/admin/tabs/MedicosTab';
import SecretariasTab  from '../components/admin/tabs/SecretariasTab';
import FloatingAgent   from '../components/common/FloatingAgent';
import styles from './AdminDashboard.module.css';

const TITLES = {
  inicio:      'Inicio',
  usuarios:    'Gestión de Usuarios',
  medicos:     'Gestión de Médicos',
  secretarias: 'Gestión de Secretarias',
};

const AdminDashboard = () => {
  const [active, setActive] = useState('inicio');

  const renderTab = () => {
    switch (active) {
      case 'inicio':      return <InicioTab onNavigate={setActive} />;
      case 'usuarios':    return <UsuariosTab />;
      case 'medicos':     return <MedicosTab />;
      case 'secretarias': return <SecretariasTab />;
      default:            return null;
    }
  };

  return (
    <div className={styles.layout}>
      <AdminSidebar active={active} onNavigate={setActive} />
      <div className={styles.mainArea}>
        <AdminHeader title={TITLES[active]} />
        <div className={styles.content}>
          {renderTab()}
        </div>
      </div>
      <FloatingAgent
        endpoint="/agent/admin"
        title="Asistente Administrativo"
        welcomeMessage="¡Hola! Soy tu asistente de gestión operativa. Puedo ayudarte con reportes de ocupación, análisis de ausentismo, estadísticas de pacientes, rendimiento de médicos y más. ¿Qué necesitas saber hoy?"
      />
    </div>
  );
};

export default AdminDashboard;
