import React, { useEffect } from 'react';
import CallLogsTable from '../../Components/CallLogs/CallLogsTable';

const CallLogsScreen = () => {
  useEffect(() => {
    document.title = 'Call Logs | BPS Dashboard';
    return () => {
      document.title = ' BPS Dashboard';
    };
  }, []);
  return (
    <div className="default-screen fadeIn">
      <div className="wrapper">
        <div className="content">
          <CallLogsTable />
        </div>
      </div>
    </div>
  );
};

export default CallLogsScreen;
