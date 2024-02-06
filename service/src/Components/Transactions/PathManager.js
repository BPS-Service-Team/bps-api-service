import React from 'react';
import TransactionCollection from './TransactionCollection';
import { useNavigation } from '../../Hooks/Nav.hook';

const PathManager = () => {
  const [
    {
      query: { step = 'order-collection' },
    },
  ] = useNavigation();
  if (step === 'order-collection') {
    return <TransactionCollection />;
  }
  return <div></div>;
};

export default PathManager;
