import React, { useEffect } from 'react';
import StocksTable from '../../Components/Stocks/StocksTable';
const StocksScreen = () => {
  useEffect(() => {
    document.title = 'Stocks | BPS Dashboard';
    return () => {
      document.title = 'BPS Dashboard';
    };
  }, []);
  return (
    <div className="default-screen users-screen fadeIn">
      <div className="wrapper">
        <div className="content">
          <StocksTable />
        </div>
      </div>
    </div>
  );
};

export default StocksScreen;
