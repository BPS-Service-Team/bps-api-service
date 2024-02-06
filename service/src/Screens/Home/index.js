import React from 'react';
import Dashboard from '../../Components/Dashboard/Dashboard';
const HomeScreen = () => {
  return (
    <div className="default-screen not-background fadeIn">
      <div className="wrapper">
        <div className="content">
          <Dashboard />
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
