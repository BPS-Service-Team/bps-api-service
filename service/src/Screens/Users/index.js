import React, { useEffect } from 'react';
import UserTable from '../../Components/Users/UserTable';
const UserScreen = () => {
  useEffect(() => {
    document.title = 'Users | BPS Dashboard';
    return () => {
      document.title = 'BPS Dashboard';
    };
  }, []);
  return (
    <div className="default-screen users-screen fadeIn">
      <div className="wrapper">
        <div className="content">
          <UserTable />
        </div>
      </div>
    </div>
  );
};

export default UserScreen;
