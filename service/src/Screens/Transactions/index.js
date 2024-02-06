import React, { useEffect } from 'react';
import PathManager from '../../Components/Transactions/PathManager';
const TransactionsScreen = () => {
  useEffect(() => {
    document.title = 'Transactions | BPS Dashboard';
    return () => {
      document.title = 'BPS Dashboard';
    };
  }, []);
  return (
    <div className="default-screen workstation-screen fadeIn">
      <div className="wrapper">
        <div className="content">
          <PathManager />
        </div>
      </div>
    </div>
  );
};

export default TransactionsScreen;
