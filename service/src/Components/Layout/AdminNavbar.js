import React, { useState } from 'react';
import { Drawer } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
//Hooks
import { useMobile } from '../../Hooks/Responsive.hook';
import MenuDashboard from './Menu';

const AdminNavbar = () => {
  const [mobile] = useMobile();
  const [visible, setVisible] = useState(false);
  const _renderContent = () => {
    if (mobile) {
      return (
        <>
          <FontAwesomeIcon
            className="anticon trigger"
            icon={faBars}
            onClick={() => setVisible(true)}
          />
          <Drawer
            visible={visible}
            placement="left"
            onClose={() => setVisible(false)}
          >
            <div className="menu-drawer">
              <MenuDashboard />
            </div>
          </Drawer>
        </>
      );
    }
    return (
      <>
        <MenuDashboard />
      </>
    );
  };
  return <div className="admin-navbar">{_renderContent()}</div>;
};

export default AdminNavbar;
