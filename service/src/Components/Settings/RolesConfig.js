import React from 'react';
import { Card } from 'antd';
import RolesTable from '../Roles/RolesTable';

const RolesConfig = () => {
  return (
    <Card className="container" style={{ height: '100%' }}>
      <RolesTable />
    </Card>
  );
};

export default RolesConfig;
