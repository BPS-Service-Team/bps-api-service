import React from 'react';
import { useNavigation } from '../../Hooks/Nav.hook';
import WorkstationRoutes from '../../Share/WorkstationRoutes';
const TabBar = () => {
  const [
    {
      query: { step = 'order-collection' },
    },
  ] = useNavigation();

  const _renderContainer = () => {
    return WorkstationRoutes.map(item => {
      if (step === item.slug) {
        return (
          <div key={item.slug} className="tab-item active">
            {item.title}
          </div>
        );
      }
      return (
        <div key={item.slug} className="tab-item">
          {item.title}
        </div>
      );
    });
  };
  return (
    <div className="tab-bar">
      <div className="container-tab">{_renderContainer()}</div>
    </div>
  );
};

export default TabBar;
