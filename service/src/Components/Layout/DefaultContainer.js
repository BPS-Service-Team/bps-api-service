import { useEffect, React } from 'react';
import { Layout, notification } from 'antd';
import { ErrorBoundary } from 'react-error-boundary';
import SubRouter from '../SubRouter';
import ErrorFallback from './ErrorFallback';
import HeaderDashboard from './Header';
import MenuDashboard from '../../Components/Layout/Menu';
import MenuMobile from '../../Components/Layout/MenuMobile';
import logo from '../../Assets/img/logo_s.png';

import { useDrawer } from '../../Hooks/App.hook';
import { useMobile } from '../../Hooks/Responsive.hook';
import { useAgfWebSocket } from '../../Hooks/AgfWebSocket.hook';
const { Sider } = Layout;

const DefaultContainer = () => {
  const [visible, handler] = useDrawer();
  const [isMobile] = useMobile();
  const [socketData, initSocket, socketConnect] = useAgfWebSocket();

  useEffect(() => {
    initSocket();
  }, []);

  useEffect(() => {
    socketConnect();
  }, [initSocket]);

  useEffect(() => {
    if (socketData.message_code !== undefined) {
      notification.open({
        message: 'AGF Status update',
        description: `Code: ${socketData.message_code} Status: ${socketData.status}`,
        className: 'notification-type-info',
      });
    }
  }, [socketData.message_code]);
  return (
    <Layout>
      {isMobile ? (
        <MenuMobile drawerOptions={{ visible, handler }} />
      ) : (
        <Sider collapsible className="sidebar-app">
          <div className="logo-wrapper">
            <img className="logo" src={logo} />
          </div>
          <MenuDashboard />
          <div className="version">v{process.env.REACT_APP_VERSION}</div>
        </Sider>
      )}
      {isMobile ? (
        <div className="default-container is-mobile">
          <HeaderDashboard />
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <SubRouter />
          </ErrorBoundary>
        </div>
      ) : (
        <div className="default-container">
          <HeaderDashboard />
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <SubRouter />
          </ErrorBoundary>
        </div>
      )}
    </Layout>
  );
};

export default DefaultContainer;
