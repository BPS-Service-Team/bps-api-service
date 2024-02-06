import React from 'react';
import { Modal } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faBars } from '@fortawesome/free-solid-svg-icons';
import logoAlt from '../../Assets/img/bps-logo-small.png';

//Hooks
import { useAuth } from '../../Hooks/Auth.hook';
import { useMobile } from '../../Hooks/Responsive.hook';
import { useDrawer } from '../../Hooks/App.hook';
import { useFetchAgfInfo } from '../../Hooks/AgfInfo.hook';
const HeaderDashboard = () => {
  const [, , logOut] = useAuth();
  const [isMobile] = useMobile();
  const [oAGF] = useFetchAgfInfo();

  const [, setVisible] = useDrawer(false);
  return (
    <header className="header-dashboard">
      {isMobile && (
        <FontAwesomeIcon
          icon={faBars}
          className="anticon trigger"
          onClick={() => setVisible(true)}
        />
      )}
      <div className="items">
        {oAGF?.data && (
          <div className="agf-item">
            <h3 style={{ color: 'white' }}>
              AGF: {oAGF.data[0]?.message_code}
            </h3>
          </div>
        )}
        <img className="header-logo" src={logoAlt} />
        <div className="logout-trigger">
          <FontAwesomeIcon
            icon={faSignOutAlt}
            onClick={() =>
              Modal.confirm({
                title: 'Do you want logout?',
                onOk: logOut,
              })
            }
            style={{ cursor: 'pointer' }}
          >
            logOut
          </FontAwesomeIcon>
        </div>
      </div>
    </header>
  );
};

export default HeaderDashboard;
