import React, { useState } from 'react';
import SecretariaSidebar  from '../components/secretaria/SecretariaSidebar';
import SecretariaHeader   from '../components/secretaria/SecretariaHeader';
import InicioTab          from '../components/secretaria/tabs/InicioTab';
import AgendaTab          from '../components/secretaria/tabs/AgendaTab';
import PacientesTab       from '../components/secretaria/tabs/PacientesTab';
import MedicosSecTab      from '../components/secretaria/tabs/MedicosSecTab';
import AtencionesTab      from '../components/secretaria/tabs/AtencionesTab';
import InformesTab        from '../components/secretaria/tabs/InformesTab';
import ConfiguracionTab   from '../components/secretaria/tabs/ConfiguracionTab';
import styles from './SecretariaDashboard.module.css';

const SecretariaDashboard = () => {
  const [activeSection, setActiveSection] = useState('inicio');
  const [searchQuery,   setSearchQuery]   = useState('');

  const renderContent = () => {
    switch (activeSection) {
      case 'inicio':     return <InicioTab onNavigate={setActiveSection} />;
      case 'agenda':     return <AgendaTab />;
      case 'pacientes':  return <PacientesTab />;
      case 'medicos':    return <MedicosSecTab />;
      case 'atenciones': return <AtencionesTab />;
      case 'informes':   return <InformesTab />;
      case 'config':     return <ConfiguracionTab />;
      default:           return null;
    }
  };

  return (
    <div className={styles.layout}>
      <SecretariaSidebar active={activeSection} onNavigate={setActiveSection} />
      <div className={styles.mainArea}>
        <SecretariaHeader searchQuery={searchQuery} onSearch={setSearchQuery} />
        <div className={styles.content}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SecretariaDashboard;
