/* eslint-disable no-unused-vars */
import React, { Fragment, useEffect, useState } from 'react';
import { Select, Row, Col, Button, Checkbox } from 'antd';
import immutable from 'seamless-immutable';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

import { getServices } from '../../Services/API';

function parsePermissions(permissions = []) {
  let defaultPermission = immutable([
    {
      actions: ['get'],
      subject: [],
    },
    {
      actions: ['find'],
      subject: [],
    },
    {
      actions: ['patch'],
      subject: [],
    },
    {
      actions: ['create'],
      subject: [],
    },
    {
      actions: ['remove'],
      subject: [],
    },
  ]);
  if (permissions.length === 0) {
    return defaultPermission;
  }
  if (permissions[0]?.subject.includes('all')) {
    return immutable([
      {
        actions: ['get'],
        subject: ['all'],
      },
      {
        actions: ['find'],
        subject: ['all'],
      },
      {
        actions: ['patch'],
        subject: ['all'],
      },
      {
        actions: ['create'],
        subject: ['all'],
      },
      {
        actions: ['remove'],
        subject: ['all'],
      },
    ]);
  }
  for (let permission of permissions) {
    if (permission.actions.includes('manage')) {
      defaultPermission = defaultPermission.updateIn(
        [0, 'subject'],
        subject => [...subject, ...permission.subject]
      );
      defaultPermission = defaultPermission.updateIn(
        [1, 'subject'],
        subject => [...subject, ...permission.subject]
      );
      defaultPermission = defaultPermission.updateIn(
        [2, 'subject'],
        subject => [...subject, ...permission.subject]
      );
      defaultPermission = defaultPermission.updateIn(
        [3, 'subject'],
        subject => [...subject, ...permission.subject]
      );
      defaultPermission = defaultPermission.updateIn(
        [4, 'subject'],
        subject => [...subject, ...permission.subject]
      );
    } else {
      for (let index in defaultPermission) {
        if (defaultPermission[index].actions.includes(permission.actions[0])) {
          defaultPermission = defaultPermission.updateIn(
            [index, 'subject'],
            () => permission.subject
          );
        }
      }
    }
  }
  return defaultPermission;
}
function getRolePermissions(permissions = []) {
  let selectedPermissions = [];
  for (let permission of permissions) {
    for (let subject of permission.subject) {
      if (!selectedPermissions.includes(subject)) {
        selectedPermissions.push(subject);
      }
    }
  }
  return selectedPermissions;
}
const PermissionEditor = ({ rolePermissions, handler }) => {
  const [current, setCurrent] = useState(); //Current services
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState(
    getRolePermissions(rolePermissions)
  );
  const [permissions, setPermissions] = useState(
    parsePermissions(rolePermissions)
  );
  useEffect(() => {
    async function get() {
      let response = await getServices();
      if (response.ok) {
        setServices(response.data);
      }
    }
    get();
  }, []);
  useEffect(() => {
    //Update permissions
    handler(permissions);
  }, [permissions]);
  const _handleAddService = () => {
    if (current === 'all') {
      setSelectedServices([current]);
      setCurrent();
      setPermissions(
        immutable([
          {
            actions: ['get'],
            subject: ['all'],
          },
          {
            actions: ['find'],
            subject: ['all'],
          },
          {
            actions: ['patch'],
            subject: ['all'],
          },
          {
            actions: ['create'],
            subject: ['all'],
          },
          {
            actions: ['remove'],
            subject: ['all'],
          },
        ])
      );
    } else {
      if (!selectedServices.includes(current)) {
        setSelectedServices([...selectedServices, current]);
        setCurrent();
      }
    }
  };
  const _handleRemoveService = service => {
    let permission = permissions;
    setSelectedServices(selectedServices.filter(txt => service !== txt));
    //Revoke all permissions
    permission = permission.updateIn([0, 'subject'], subjects =>
      subjects.filter(row => row !== service)
    );
    permission = permission.updateIn([1, 'subject'], subjects =>
      subjects.filter(row => row !== service)
    );
    permission = permission.updateIn([2, 'subject'], subjects =>
      subjects.filter(row => row !== service)
    );
    permission = permission.updateIn([3, 'subject'], subjects =>
      subjects.filter(row => row !== service)
    );
    permission = permission.updateIn([4, 'subject'], subjects =>
      subjects.filter(row => row !== service)
    );
    setPermissions(permission);
  };
  const _parseCheckboxValue = (service, action) => {
    switch (action) {
      case 'create':
        return permissions[3].subject.includes(service);
      case 'read':
        return (
          permissions[0].subject.includes(service) &&
          permissions[1].subject.includes(service)
        );

      case 'update':
        return permissions[2].subject.includes(service);
      case 'delete':
        return permissions[4].subject.includes(service);
      default:
        return (
          permissions[0].subject.includes(service) &&
          permissions[1].subject.includes(service) &&
          permissions[2].subject.includes(service) &&
          permissions[3].subject.includes(service) &&
          permissions[4].subject.includes(service)
        );
    }
  };
  const _handleChangePermission = (service, action, value) => {
    let permission = permissions;
    switch (action) {
      case 'create':
        if (value) {
          setPermissions(
            permissions.updateIn([3, 'subject'], subjects => [
              ...subjects,
              service,
            ])
          );
        } else {
          setPermissions(
            permissions.updateIn([3, 'subject'], subjects =>
              subjects.filter(row => row !== service)
            )
          );
        }
        break;
      case 'read':
        if (value) {
          permission = permission.updateIn([0, 'subject'], subjects => [
            ...subjects,
            service,
          ]);
          permission = permission.updateIn([1, 'subject'], subjects => [
            ...subjects,
            service,
          ]);
        } else {
          permission = permission.updateIn([0, 'subject'], subjects =>
            subjects.filter(row => row !== service)
          );
          permission = permission.updateIn([1, 'subject'], subjects =>
            subjects.filter(row => row !== service)
          );
        }
        setPermissions(permission);
        break;
      case 'update':
        if (value) {
          setPermissions(
            permissions.updateIn([2, 'subject'], subjects => [
              ...subjects,
              service,
            ])
          );
        } else {
          setPermissions(
            permissions.updateIn([2, 'subject'], subjects =>
              subjects.filter(row => row !== service)
            )
          );
        }
        break;
      case 'delete':
        if (value) {
          setPermissions(
            permissions.updateIn([4, 'subject'], subjects => [
              ...subjects,
              service,
            ])
          );
        } else {
          setPermissions(
            permissions.updateIn([4, 'subject'], subjects =>
              subjects.filter(row => row !== service)
            )
          );
        }
        break;
      default:
        //Manage all

        if (value) {
          if (!permissions[0].subject.includes(service)) {
            permission = permission.updateIn([0, 'subject'], subjects => [
              ...subjects,
              service,
            ]);
          }

          if (!permissions[1].subject.includes(service)) {
            permission = permission.updateIn([1, 'subject'], subjects => [
              ...subjects,
              service,
            ]);
          }
          if (!permissions[2].subject.includes(service)) {
            permission = permission.updateIn([2, 'subject'], subjects => [
              ...subjects,
              service,
            ]);
          }
          if (!permissions[3].subject.includes(service)) {
            permission = permission.updateIn([3, 'subject'], subjects => [
              ...subjects,
              service,
            ]);
          }
          if (!permissions[4].subject.includes(service)) {
            permission = permission.updateIn([4, 'subject'], subjects => [
              ...subjects,
              service,
            ]);
          }
        } else {
          permission = permission.updateIn([0, 'subject'], subjects =>
            subjects.filter(row => row !== service)
          );
          permission = permission.updateIn([1, 'subject'], subjects =>
            subjects.filter(row => row !== service)
          );
          permission = permission.updateIn([2, 'subject'], subjects =>
            subjects.filter(row => row !== service)
          );
          permission = permission.updateIn([3, 'subject'], subjects =>
            subjects.filter(row => row !== service)
          );
          permission = permission.updateIn([4, 'subject'], subjects =>
            subjects.filter(row => row !== service)
          );
        }
        setPermissions(permission);
    }
  };
  const _renderSelected = () =>
    selectedServices.map(service => (
      <Fragment key={service}>
        <Col span={7}>{service}</Col>
        <Col span={3}>
          <Checkbox
            checked={_parseCheckboxValue(service, 'all')}
            onChange={value =>
              _handleChangePermission(service, 'all', value.target.checked)
            }
          />
        </Col>
        <Col span={3}>
          <Checkbox
            checked={_parseCheckboxValue(service, 'create')}
            onChange={value =>
              _handleChangePermission(service, 'create', value.target.checked)
            }
          />
        </Col>
        <Col span={3}>
          <Checkbox
            checked={_parseCheckboxValue(service, 'read')}
            onChange={value =>
              _handleChangePermission(service, 'read', value.target.checked)
            }
          />
        </Col>
        <Col span={3}>
          <Checkbox
            checked={_parseCheckboxValue(service, 'update')}
            onChange={value =>
              _handleChangePermission(service, 'update', value.target.checked)
            }
          />
        </Col>
        <Col span={3}>
          <Checkbox
            checked={_parseCheckboxValue(service, 'delete')}
            onChange={value =>
              _handleChangePermission(service, 'delete', value.target.checked)
            }
          />
        </Col>
        <Col span={2}>
          <FontAwesomeIcon
            onClick={() => _handleRemoveService(service)}
            className="anticon remove-trigger"
            icon={faTrash}
          />
        </Col>
      </Fragment>
    ));
  return (
    <div className="permission-editor">
      <h1>Permissions</h1>
      <Row justify="space-between" gutter={[10, 10]}>
        <Col span={12}>
          <Select
            style={{ width: '100%' }}
            placeholder="Select service"
            value={current}
            showSearch
            notFoundContent={null}
            onSelect={e => {
              setCurrent(e);
            }}
          >
            <Select.Option value="all" key="all">
              All
            </Select.Option>
            {services
              .filter(row => !selectedServices.includes(row))
              .map(row => (
                <Select.Option value={row} key={row}>
                  {row}
                </Select.Option>
              ))}
          </Select>
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Button
            disabled={
              selectedServices.includes(current) ||
              selectedServices.includes('all')
            }
            onClick={() => _handleAddService()}
          >
            Add
          </Button>
        </Col>
      </Row>
      <Row
        justify="space-between"
        style={{ marginTop: 10 }}
        className="permission-list"
      >
        <Col span={7}>Name:</Col>
        <Col span={3}>All</Col>
        <Col span={3}>Create</Col>
        <Col span={3}>Read</Col>
        <Col span={3}>Update</Col>
        <Col span={3}>Delete</Col>
        <Col span={2}></Col>
        {_renderSelected()}
      </Row>
    </div>
  );
};
PermissionEditor.propTypes = {
  rolePermissions: PropTypes.array,
  handler: PropTypes.func.isRequired,
};
export default PermissionEditor;
