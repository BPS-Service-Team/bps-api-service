import React, { useEffect } from 'react';
import PathManager from '../../Components/Orders/PathManager';
const OrdersScreen = () => {
  useEffect(() => {
    document.title = 'Orders | BPS Dashboard';
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

export default OrdersScreen;
