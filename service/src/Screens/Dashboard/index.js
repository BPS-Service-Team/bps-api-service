import React from 'react';
import { Layout } from 'antd';
import DefaultContainer from '../../Components/Layout/DefaultContainer';
import ModalError from '../../Components/Layout/ModalError';

const DashboardScreen = () => {
  const _renderView = () => {
    return <DefaultContainer />;
  };
  return (
    <Layout className="dashboard fadeIn">
      <ModalError />
      {_renderView()}
    </Layout>
  );
};

export default DashboardScreen;
