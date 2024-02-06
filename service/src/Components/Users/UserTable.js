import React, { useState } from 'react';
import { Table, Card, Row, Col, Form, Button, message } from 'antd';
import { EditFilled } from '@ant-design/icons';

import UserActions from './UserActions';
//Hooks
import { useFetchUsers } from '../../Hooks/Users.hook';
import { useFetchRoles } from '../../Hooks/Roles.hook';

//Services
import { updateUser, createUser } from '../../Services/API';

const UserTable = () => {
  const [users, loading, , change, updater] = useFetchUsers([
    {
      field: 'rol[$in][]',
      value: 'staff',
    },
    {
      field: 'rol[$in][]',
      value: 'admin',
    },
  ]);
  const [roles, loadingRoles] = useFetchRoles();
  const [userModal, setUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState({});
  const [modalLoading, setModalLoading] = useState(false);
  const [formRef] = Form.useForm();
  const columns = [
    {
      title: 'Full Name',
      dataIndex: 'full_name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
    },
    {
      title: 'Rol',
      dataIndex: 'rol_id',
      render(txt) {
        if (loadingRoles) {
          return 'Loading...';
        } else {
          let filtered = roles.data.filter(rol => rol._id === txt);
          return filtered[0]?.name;
        }
      },
    },
    {
      title: 'Country',
      dataIndex: 'country',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render(txt) {
        if (txt) {
          return 'Active';
        }
        return 'Disabled';
      },
    },
    {
      title: '',
      dataIndex: '_id',
      render(data, row) {
        return (
          <Button
            icon={<EditFilled />}
            onClick={() => {
              setSelectedUser(row);
              formRef.setFieldsValue(row);
              setUserModal(true);
            }}
          >
            Edit
          </Button>
        );
      },
    },
  ];
  const _handleSubmit = async values => {
    setModalLoading(true);
    let response;
    if (selectedUser._id) {
      response = await updateUser(selectedUser._id, values);
      setSelectedUser({});
    } else {
      response = await createUser(values);
    }
    if (response.ok) {
      message.success('Success');
      updater();
      setUserModal(false);
    }
    setModalLoading(false);
  };
  return (
    <Card>
      <Row justify="space-between" style={{ marginBottom: 20 }}>
        <Col>
          <h3 style={{ textAlign: 'left' }}>Users</h3>
        </Col>
        <Col>
          <UserActions
            userModal={{
              visible: userModal,
              handler: setUserModal,
              form: formRef,
              submit: _handleSubmit,
              loading: modalLoading,
            }}
            userFn={{
              selected: selectedUser,
              handlerSelected: setSelectedUser,
              updater,
            }}
          />
        </Col>
      </Row>
      <div className="fluid-container">
        <Table
          loading={loading && loadingRoles}
          columns={columns}
          dataSource={users.data}
          rowKey={row => row._id}
          pagination={{
            total: users.total,
            current: users.params.skip / 10 + 1,
            onChange: e => change(users.params.queries, (e - 1) * 10),
            pageSizeOptions: [10],
          }}
        />
      </div>
    </Card>
  );
};
export default UserTable;
