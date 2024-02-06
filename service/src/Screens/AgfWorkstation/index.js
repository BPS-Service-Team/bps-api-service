import React, { useEffect } from 'react';
import TabBar from '../../Components/Workstation/TabBar';
import PathManager from '../../Components/Workstation/PathManager';
const AgfWorkstation = () => {
  useEffect(() => {
    document.title = 'AGF Workstation | BPS Dashboard';
    return () => {
      document.title = 'BPS Dashboard';
    };
  }, []);
  return (
    <div className="default-screen workstation-screen fadeIn">
      <TabBar />
      <div className="wrapper">
        <div className="content">
          <PathManager />
        </div>
      </div>
    </div>
  );
};

export default AgfWorkstation;
