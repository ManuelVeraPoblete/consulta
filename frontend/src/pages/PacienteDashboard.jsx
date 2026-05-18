import React, { useState } from 'react';
import PacienteSidebar from '../components/paciente/PacienteSidebar';
import PacienteHeader  from '../components/paciente/PacienteHeader';
import InicioTab       from '../components/paciente/tabs/InicioTab';
import MedicosTab      from '../components/paciente/tabs/MedicosTab';
import HistorialTab    from '../components/paciente/tabs/HistorialTab';
import CitasTab        from '../components/paciente/tabs/CitasTab';
import styles from './PacienteDashboard.module.css';

const PacienteDashboard = () => {
  const [activeSection, setActiveSection] = useState('inicio');
  const [searchQuery,   setSearchQuery]   = useState('');

  const renderContent = () => {
    switch (activeSection) {
      case 'inicio':
        return (
          <InicioTab
            onIrMedicos={() => setActiveSection('medicos')}
            onIrHistorial={() => setActiveSection('historial')}
          />
        );
      case 'historial':  return <HistorialTab />;
      case 'medicos':    return <MedicosTab />;
      case 'citas':      return <CitasTab />;
      case 'examenes':   return <PlaceholderTab title="Exámenes" desc="Próximamente podrás ver y descargar tus exámenes aquí." />;
      case 'ajustes':    return <PlaceholderTab title="Ajustes" desc="Configuración de cuenta y preferencias." />;
      default:           return null;
    }
  };

  return (
    <div className={styles.layout}>
      <PacienteSidebar active={activeSection} onNavigate={setActiveSection} />
      <div className={styles.mainArea}>
        <PacienteHeader searchQuery={searchQuery} onSearch={setSearchQuery} />
        <div className={styles.content}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const PlaceholderTab = ({ title, desc }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300, gap:12, color:'#94a3b8' }}>
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <div style={{ fontSize:18, fontWeight:700, color:'#cbd5e1' }}>{title}</div>
    <div style={{ fontSize:14, color:'#cbd5e1', textAlign:'center', maxWidth:300 }}>{desc}</div>
  </div>
);

export default PacienteDashboard;
