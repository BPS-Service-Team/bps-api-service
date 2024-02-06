import React from 'react';
import SubRouter from '../SubRouter';
import AdminNavbar from './AdminNavbar';

const AdminContainer = () => {
  return (
    <div className="admin-container">
      <div className="wrapper">
        <div className="nav-bar">
          <AdminNavbar />
        </div>
        <SubRouter />
      </div>
    </div>
  );
};

export default AdminContainer;
