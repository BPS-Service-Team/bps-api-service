import React from 'react';
import PropTypes from 'prop-types';
import { Button, Row, Col, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import UserForm from '../Form/User.form';

const UserActions = ({
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
        title={userFn.selected?._id ? 'Update User' : 'Add new user'}
        okText={userFn.selected?._id ? 'Update' : 'Add'}
        destroyOnClose
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
        <UserForm
          formRef={userModal.form}
          edit={!!userFn.selected._id}
          onSubmit={userModal.submit}
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
UserActions.propTypes = {
  userModal: PropTypes.shape({
    visible: PropTypes.bool,
    handler: PropTypes.func,
    form: PropTypes.object,
  }),
};
export default UserActions;
