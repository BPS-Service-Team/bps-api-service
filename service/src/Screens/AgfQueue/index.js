import React, { useEffect } from 'react';
import AgfQueueTable from '../../Components/AgfQueue/AgfQueueTable';

const AgfQueue = () => {
  useEffect(() => {
    document.title = 'AGF Queue | BPS Dashboard';
    return () => {
      document.title = 'BPS Dashboard';
    };
  }, []);
  return (
    <div className="default-screen fadeIn">
      <div className="wrapper">
        <div className="content">
          <AgfQueueTable />
        </div>
      </div>
    </div>
  );
};

export default AgfQueue;
