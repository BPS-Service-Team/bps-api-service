import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Modal } from 'antd';
import { Routes } from '../../Share/Routes';
//Hooks
import { useNavigation } from '../../Hooks/Nav.hook';
import { useI18n } from '../../Hooks/i18n.hook';
import { useAuth } from '../../Hooks/Auth.hook';

const MenuDashboard = ({ ...props }) => {
  const [, getLabel] = useI18n();
  const [{ pathname, query }, nav] = useNavigation();
  const [{ role }] = useAuth();

  const _getActive = () => {
    return pathname.replace('/dashboard', '') || '/';
  };
  const _renderRoutes = () => {
    const routes = Routes || [];
    const aRoutesEnabled = routes.filter(
      oRoute => oRoute.roles.includes('*') || oRoute.roles.includes(role.rol)
    );
    //TODO agregar función de cancelar workstation
    const _navHook = path => {
      //Previene que naveguen a otra ruta
      if (
        pathname === '/dashboard/agf-workstation' &&
        Object.keys(query).length > 0
      ) {
        Modal.confirm({
          title: 'Are you sure to leave this site?',
          content: 'You may have pending changes',
          onOk: () => nav(path),
          centered: true,
        });
      } else {
        nav(path);
      }
    };
    return aRoutesEnabled.map(({ title, childs, slug, path, icon }) => {
      return childs.length === 0 ? (
        <Menu.Item
          key={path}
          onClick={() => _navHook(`/dashboard${path}`)}
          icon={icon}
        >
          {getLabel(title)}
        </Menu.Item>
      ) : (
        <Menu.SubMenu title={getLabel(title)} key={slug} icon={icon}>
          {childs.map(data => {
            return (
              <Menu.Item
                key={path + data.path}
                onClick={() => _navHook(`/dashboard${path}${data.path}`)}
                icon={data?.icon || icon}
              >
                {getLabel(data.title)}
              </Menu.Item>
            );
          })}
        </Menu.SubMenu>
      );
    });
  };
  return (
    <div className="main-menu">
      <Menu
        selectedKeys={[_getActive()]}
        mode="inline"
        theme="dark"
        style={{ width: 'auto' }}
        {...props}
      >
        {_renderRoutes()}
      </Menu>
    </div>
  );
};
MenuDashboard.propTypes = {
  drawerOptions: PropTypes.shape({
    visible: PropTypes.bool,
    handler: PropTypes.func,
  }),
};
export default MenuDashboard;
