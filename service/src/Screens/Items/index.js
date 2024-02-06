import React, { useEffect } from 'react';
import ItemsTable from '../../Components/Items/ItemsTable';
const ItemsScreen = () => {
  useEffect(() => {
    document.title = 'Items | BPS Dashboard';
    return () => {
      document.title = 'BPS Dashboard';
    };
  }, []);
  return (
    <div className="default-screen fadeIn">
      <div className="wrapper">
        <div className="content">
          <ItemsTable />
        </div>
      </div>
    </div>
  );
};

export default ItemsScreen;
