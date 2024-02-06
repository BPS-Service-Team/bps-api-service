import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Drawer } from 'antd';
import { Routes } from '../../Share/Routes';
// Hooks
import { useNavigation } from '../../Hooks/Nav.hook';
import { useI18n } from '../../Hooks/i18n.hook';

// Import image
import logo from '../../Assets/img/logo_s.png';

const MenuMobile = ({
  drawerOptions = { visible: false, handler: () => ({}) },
  ...props
}) => {
  const [, getLabel] = useI18n();
  const [{ pathname }, nav] = useNavigation();

  const _getActive = () => {
    return pathname.replace('/dashboard', '') || '/';
  };
  const _renderRoutes = () => {
    const routes = Routes || [];
    return routes.map(({ title, childs, slug, path, icon }) => {
      return childs.length === 0 ? (
        <Menu.Item
          key={path}
          onClick={() => nav(`/dashboard${path}`)}
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
                onClick={() => nav(`/dashboard${path}${data.path}`)}
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
    <Drawer
      visible={drawerOptions.visible}
      onClose={() => drawerOptions.handler(false)}
      placement="left"
      closeIcon={null}
      width={220}
      className="menu-drawer-app"
    >
      <div className="logo-wrapper">
        <img className="logo" src={logo} />
      </div>
      <Menu
        selectedKeys={[_getActive()]}
        style={{ width: 'auto' }}
        {...props}
        mode="inline"
        theme="dark"
      >
        {_renderRoutes()}
      </Menu>
    </Drawer>
  );
};
MenuMobile.propTypes = {
  drawerOptions: PropTypes.shape({
    visible: PropTypes.bool,
    handler: PropTypes.func,
  }),
};
export default MenuMobile;
