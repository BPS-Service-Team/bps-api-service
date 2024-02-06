import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'antd';
import ItemMasterForm from '../Form/ItemMaster.form';

const ItemAction = ({
  itemModal = {
    visible: false,
    handler: () => ({}),
    form: {},
    submit: () => ({}),
    loading: false,
  },
  itemFn = {
    selected: {},
    handlerSelected: () => ({}),
    handler: () => ({}),
  },
}) => {
  return (
    <>
      <Modal
        visible={itemModal.visible}
        centered
        title={itemFn.selected?._id ? 'Update Item' : 'Add new item'}
        okText={itemFn.selected?._id ? 'Update' : 'Add'}
        destroyOnClose
        okButtonProps={{ loading: itemModal.loading }}
        onOk={() => {
          itemModal.form.submit();
        }}
        onCancel={() => {
          itemModal.handler(false);
          itemFn.handlerSelected({});
          itemModal.form.resetFields();
        }}
      >
        <ItemMasterForm
          formRef={itemModal.form}
          edit={!!itemFn.selected._id}
          onSubmit={itemModal.submit}
        />
      </Modal>
    </>
  );
};
ItemAction.propTypes = {
  itemModal: PropTypes.shape({
    visible: PropTypes.bool,
    handler: PropTypes.func,
    form: PropTypes.object,
  }),
};
export default ItemAction;
