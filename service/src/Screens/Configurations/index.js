import {
  faBoxOpen,
  faChartPie,
  faCogs,
  faDatabase,
  faFileExport,
  faListAlt,
  faShare,
  faTasks,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Layout, Menu } from 'antd';
import React, { useEffect, useState } from 'react';

import AgfOperation from '../../Components/Settings/AgfOperation';
import ChartsInfo from '../../Components/Settings/ChartsInfo';
import CollectionExport from '../../Components/Settings/CollectionExport';
import DbBackup from '../../Components/Settings/DbBackup';
import GeneralView from '../../Components/Settings/GeneralView';
import InventoryExport from '../../Components/Settings/InventoryExport';
import JsonFileTest from '../../Components/Settings/JsonFileTest';
import PickZonesManager from '../../Components/Settings/PickZonesManager';
import RolesConfig from '../../Components/Settings/RolesConfig';

import StockOperation from '../../Components/Settings/StockOperation';
import { useAuth } from '../../Hooks/Auth.hook';
import { useNavigation } from '../../Hooks/Nav.hook';
import SendReconciliationAgf from '../../Components/Settings/SendReconciliationAgf';
const { Content, Sider } = Layout;

const ConfigScreen = () => {
  const [{ role }] = useAuth();
  const [{ hash = '' }] = useNavigation();
  const [view, setView] = useState(
    role?.rol === 'admin' ? 'system' : 'pickup_zones'
  );

  useEffect(() => {
    document.title = 'Configurations | BPS Dashboard';
    return () => {
      document.title = 'BPS Dashboard';
    };
  }, []);
  const _renderView = () => {
    switch (view) {
      case 'system':
        return (
          <div className="content">
            <GeneralView />
          </div>
        );
      case 'agf_operation':
        return (
          <div className="content">
            <AgfOperation />
          </div>
        );
      case 'inventory_export':
        return (
          <div className="content">
            <InventoryExport />
          </div>
        );
      case 'collection_export':
        return (
          <div className="content">
            <CollectionExport />
          </div>
        );
      case 'test':
        return (
          <div className="content">
            <JsonFileTest />
          </div>
        );
      case 'charts':
        return (
          <div className="content">
            <ChartsInfo />
          </div>
        );
      case 'roles':
        return (
          <div className="content">
            <RolesConfig />
          </div>
        );
      case 'stocks_operations':
        return (
          <div className="content">
            <StockOperation />
          </div>
        );
      case 'database_backup':
        return (
          <div className="content">
            <DbBackup />
          </div>
        );
      case 'send_reconciliation_agf':
        return (
          <div className="content">
            <SendReconciliationAgf />
          </div>
        );
      default:
        return (
          <div className="content">
            <PickZonesManager />
          </div>
        );
    }
  };
  const _renderMenu = () => {
    //Show all menu
    if (hash === '#devmode') {
      return (
        <>
          <Menu.Item
            key="system"
            icon={<FontAwesomeIcon className="anticon" icon={faCogs} />}
          >
            System
          </Menu.Item>
          <Menu.Item
            key="pickup_zones"
            icon={<FontAwesomeIcon className="anticon" icon={faBoxOpen} />}
          >
            Pickup Zones
          </Menu.Item>
          <Menu.Item
            key="agf_operation"
            icon={<FontAwesomeIcon className="anticon" icon={faTasks} />}
          >
            AGF Operation
          </Menu.Item>
          <Menu.Item
            key="inventory_export"
            icon={<FontAwesomeIcon className="anticon" icon={faFileExport} />}
          >
            Inventory Operation
          </Menu.Item>
          <Menu.Item
            key="collection_export"
            icon={<FontAwesomeIcon className="anticon" icon={faDatabase} />}
          >
            Collection Export
          </Menu.Item>
          <Menu.Item
            key="database_backup"
            icon={<FontAwesomeIcon className="anticon" icon={faDatabase} />}
          >
            Database export
          </Menu.Item>
          <Menu.Item
            icon={<FontAwesomeIcon className="anticon" icon={faDatabase} />}
            key="test"
          >
            Reconciliation Test
          </Menu.Item>
          <Menu.Item
            icon={<FontAwesomeIcon className="anticon" icon={faChartPie} />}
            key="charts"
          >
            Chart Information
          </Menu.Item>
          <Menu.Item
            icon={<FontAwesomeIcon className="anticon" icon={faUsers} />}
            key="roles"
          >
            Roles
          </Menu.Item>
        </>
      );
    }
    return (
      <>
        <Menu.Item
          key="system"
          icon={<FontAwesomeIcon className="anticon" icon={faCogs} />}
        >
          System
        </Menu.Item>
        <Menu.Item
          key="pickup_zones"
          icon={<FontAwesomeIcon className="anticon" icon={faBoxOpen} />}
        >
          Pickup Zones
        </Menu.Item>
        <Menu.Item
          key="inventory_export"
          icon={<FontAwesomeIcon className="anticon" icon={faFileExport} />}
        >
          Inventory Operation
        </Menu.Item>
        <Menu.Item
          key="stocks_operations"
          icon={<FontAwesomeIcon className="anticon" icon={faListAlt} />}
        >
          Stock Operations
        </Menu.Item>
        <Menu.Item
          key="send_reconciliation_agf"
          icon={<FontAwesomeIcon className="anticon" icon={faShare} />}
        >
          Send Reconciliation AGF
        </Menu.Item>
      </>
    );
  };
  return (
    <div className="default-screen fadeIn">
      <div className="wrapper">
        <Layout
          className="site-layout-background"
          style={{ padding: '24px 0' }}
        >
          <Sider className="site-layout-background" width={200}>
            <Menu
              mode="inline"
              selectedKeys={[view]}
              onSelect={e => setView(e.key)}
              style={{ height: '100%' }}
            >
              {role?.rol === 'admin' ? (
                _renderMenu()
              ) : (
                <>
                  <Menu.Item
                    key="pickup_zones"
                    icon={
                      <FontAwesomeIcon className="anticon" icon={faBoxOpen} />
                    }
                  >
                    Pickup Zones
                  </Menu.Item>
                </>
              )}
            </Menu>
          </Sider>
          <Content style={{ padding: '0 24px', minHeight: 280 }}>
            {_renderView()}
          </Content>
        </Layout>
      </div>
    </div>
  );
};

export default ConfigScreen;
