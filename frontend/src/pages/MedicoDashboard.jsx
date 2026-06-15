import React, { useState } from 'react';
import MedicoSidebar    from '../components/medico/MedicoSidebar';
import MedicoHeader     from '../components/medico/MedicoHeader';
import InicioTab        from '../components/medico/tabs/InicioTab';
import AgendaTab        from '../components/medico/tabs/AgendaTab';
import AdminAgendaTab   from '../components/medico/tabs/AdminAgendaTab';
import PacientesTab     from '../components/medico/tabs/PacientesTab';
import HistorialTab     from '../components/medico/tabs/HistorialTab';
import RecetasTab       from '../components/medico/tabs/RecetasTab';
import OrdenesTab       from '../components/medico/tabs/OrdenesTab';
import ConfiguracionTab from '../components/medico/tabs/ConfiguracionTab';
import FloatingAgent    from '../components/common/FloatingAgent';
import styles from './MedicoDashboard.module.css';

const TITLES = {
  inicio:       'Inicio',
  agenda:       'Agenda',
  adminAgenda:  'Administración de Agenda',
  pacientes:    'Pacientes',
  historial:    'Historial clínico',
  recetas:      'Recetas',
  ordenes:      'Órdenes de examen',
  config:       'Configuración',
};

const MedicoDashboard = () => {
  const [active, setActive] = useState('inicio');

  const renderTab = () => {
    switch (active) {
      case 'inicio':      return <InicioTab onNavigate={setActive} />;
      case 'agenda':      return <AgendaTab />;
      case 'adminAgenda': return <AdminAgendaTab />;
      case 'pacientes':   return <PacientesTab />;
      case 'historial':   return <HistorialTab />;
      case 'recetas':     return <RecetasTab />;
      case 'ordenes':     return <OrdenesTab />;
      case 'config':      return <ConfiguracionTab />;
      default:          return null;
    }
  };

  return (
    <div className={styles.layout}>
      <MedicoSidebar active={active} onNavigate={setActive} />
      <div className={styles.mainArea}>
        <MedicoHeader />
        <div className={styles.content}>
          {renderTab()}
        </div>
      </div>
      <FloatingAgent
        endpoint="/agent/medico"
        title="Asistente Clínico IA"
        welcomeMessage="¡Hola, doctor/a! Soy tu asistente clínico. Puedo ayudarte a revisar historial del paciente, verificar alergias e interacciones, buscar códigos CIE-10, guardar borradores de consulta y más. ¿Con qué paciente o cita trabajamos hoy?"
      />
    </div>
  );
};

export default MedicoDashboard;
