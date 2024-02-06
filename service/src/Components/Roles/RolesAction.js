import React from 'react';
import PropTypes from 'prop-types';
import { Button, Row, Col, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import RoleForm from '../Form/Role.form';

const RolesAction = ({
  userModal = {
    visible: false,
    handler: () => ({}),
    form: {},
    submit: () => ({}),
    loading: false,
  },
  userFn = {
    selected: {},
    handlerSelected: () => ({}),
    handler: () => ({}),
  },
}) => {
  return (
    <>
      <Modal
        visible={userModal.visible}
        centered
        title={userFn.selected?._id ? 'Update role' : 'Add new role'}
        okText={userFn.selected?._id ? 'Update' : 'Add'}
        destroyOnClose
        width={900}
        zIndex={1}
        okButtonProps={{ loading: userModal.loading }}
        onOk={() => {
          userModal.form.submit();
        }}
        onCancel={() => {
          userModal.handler(false);
          userFn.handlerSelected({});
          userModal.form.resetFields();
        }}
      >
        <RoleForm
          formRef={userModal.form}
          edit={!!userFn.selected._id}
          onSubmit={userModal.submit}
          permissions={userFn?.selected?.permissions}
        />
      </Modal>
      <Row>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => userModal.handler(true)}
          >
            Add
          </Button>
        </Col>
      </Row>
    </>
  );
};
RolesAction.propTypes = {
  userModal: PropTypes.shape({
    visible: PropTypes.bool,
    handler: PropTypes.func,
    form: PropTypes.object,
  }),
};
export default RolesAction;
