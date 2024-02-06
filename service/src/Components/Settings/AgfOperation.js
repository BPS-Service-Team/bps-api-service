import React, { useState } from 'react';
import { Table, Card, Form, message, Modal, Button } from 'antd';
import { EditFilled } from '@ant-design/icons';

import AgfSingleForm from '../Form/AgfSingle.form';
//Hooks
import { useFetchAgfSingle } from '../../Hooks/AgfSingle.hook';

//Services
import { updateAgfSingle } from '../../Services/API';

const AgfOperation = () => {
  const [items, loading, , change, updater] = useFetchAgfSingle();
  const [itemModal, setItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formRef] = Form.useForm();
  const columns = [
    {
      title: 'Device Name',
      dataIndex: 'device_name',
    },
    {
      title: 'Code',
      dataIndex: 'code',
    },
    {
      title: 'Message Code',
      dataIndex: 'message_code',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render(status) {
        switch (status) {
          case 0:
            return 'Idle';
          case 1:
            return 'Busy';
          case 2:
            return 'Paused';
          case 3:
            return 'Charging';
          case 4:
            return 'Locked';
          case 5:
            return 'Error';
          default:
            return status;
        }
      },
    },
    {
      title: '',
      dataIndex: '_id',
      render(_, row) {
        return (
          <Button
            icon={<EditFilled />}
            onClick={() => {
              setSelectedItem(row);
              formRef.setFieldsValue(row);
              setItemModal(true);
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
    let response = await updateAgfSingle(selectedItem._id, values);
    if (response.ok) {
      message.success('Success');
      updater();
      setItemModal(false);
      setSelectedItem(null);
    }
    setModalLoading(false);
  };
  return (
    <Card>
      <Modal
        visible={itemModal}
        centered
        title={selectedItem?._id ? 'Update Agf' : 'Add new Agf'}
        okText={selectedItem?._id ? 'Update' : 'Add'}
        destroyOnClose
        okButtonProps={{ loading: modalLoading }}
        zIndex={1}
        onOk={() => {
          formRef.submit();
        }}
        onCancel={() => {
          setItemModal(false);
          setSelectedItem(null);
          formRef.resetFields();
        }}
      >
        <AgfSingleForm
          formRef={formRef}
          onSubmit={_handleSubmit}
          add={selectedItem === null}
          status={selectedItem?.status}
        />
      </Modal>
      <div className="fluid-container">
        <Table
          loading={loading}
          columns={columns}
          dataSource={items.data}
          rowKey={row => row._id}
          pagination={{
            total: items.total,
            current: items.params.skip / 10 + 1,
            onChange: e => change(items.params.queries, (e - 1) * 10),
            pageSizeOptions: [10],
          }}
        />
      </div>
    </Card>
  );
};
export default AgfOperation;
