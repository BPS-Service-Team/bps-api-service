import React, { useState } from 'react';
import { Table, Row, Col, Form, Button, message } from 'antd';
import { EditFilled } from '@ant-design/icons';

import RoleACtions from './RolesAction';
//Hooks
import { useFetchRoles } from '../../Hooks/Roles.hook';

//Services
import { updateRole, createRole } from '../../Services/API';

const RolesTable = () => {
  const [users, loading, , change, updater] = useFetchRoles();
  const [userModal, setUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState({});
  const [modalLoading, setModalLoading] = useState(false);
  const [formRef] = Form.useForm();
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
    },
    {
      title: 'Group',
      dataIndex: 'group',
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
    console.log(values);
    if (selectedUser._id) {
      response = await updateRole(selectedUser._id, values);
      setSelectedUser({});
    } else {
      response = await createRole(values);
    }
    if (response.ok) {
      message.success('Success');
      updater();
      setUserModal(false);
    }
    setModalLoading(false);
  };
  return (
    <div>
      <Row justify="space-between" style={{ marginBottom: 20 }}>
        <Col>
          <h3 style={{ textAlign: 'left' }}>Roles</h3>
        </Col>
        <Col>
          <RoleACtions
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
          loading={loading}
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
    </div>
  );
};
export default RolesTable;
