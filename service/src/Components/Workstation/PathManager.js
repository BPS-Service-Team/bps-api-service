import React from 'react';
import OrderCollection from './OrderCollection';
import OrderDetail from './OrderDetail';
import { useNavigation } from '../../Hooks/Nav.hook';

const PathManager = () => {
  const [
    {
      query: { step = 'order-collection' },
    },
  ] = useNavigation();
  if (step === 'order-collection') {
    return <OrderCollection />;
  }
  if (step === 'order-details') {
    return <OrderDetail />;
  }
  return <div></div>;
};

export default PathManager;
