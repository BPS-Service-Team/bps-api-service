import React, { useState } from 'react';
import { Alert, Row, Button, Table, Form, Modal, message } from 'antd';
import { Trash } from 'react-feather';
import { PlusOutlined } from '@ant-design/icons';

import { useFetchLabels } from '../../Hooks/Labels.hook';
import LabelForm from '../../Components/Form/Label.form';
import { updateLabel, createLabel, deleteLabel } from '../../Services/API';
import { useI18n } from '../../Hooks/i18n.hook';

const TagsView = () => {
  const [, l] = useI18n();
  const [modalLoading, setModalLoading] = useState(false);
  const [labelId, setLabelId] = useState(null);
  const [labels, loading, , , update] = useFetchLabels(
    [{ field: '$sort', value: true }],
    0,
    9999
  );
  const [formRef] = Form.useForm();
  const [modal, setModal] = useState(false);
  const columns = [
    {
      title: 'Slug',
      dataIndex: 'slug',
    },
    {
      title: l('COUNTRY'),
      dataIndex: 'country',
    },
    {
      title: l('LANGUAGE'),
      dataIndex: 'language',
    },
    {
      title: l('SECTION'),
      dataIndex: 'section',
    },
    {
      title: '',
      dataIndex: '_id',
      width: 230,
      render(e, row) {
        return (
          <Row justify="space-between" gutter={[10, 10]}>
            <Button
              type="primary"
              onClick={() => {
                setLabelId(e);
                formRef.setFieldsValue(row);
                setModal(true);
              }}
            >
              {l('VIEW')}
            </Button>
            <Button
              type="primary"
              danger
              onClick={() =>
                Modal.confirm({
                  title: l('DELETE_TAG_TITLE'),
                  content: l('DELETE_TAG_CONTENT'),
                  okText: l('YES'),
                  cancelText: l('NO'),
                  async onOk() {
                    let response = await deleteLabel(e);
                    if (response.ok) {
                      message.success(l('TAG_DELETED'));
                      update();
                    } else {
                      message.error(
                        l('ERROR_DELETING_TAG') + response.data.message
                      );
                    }
                  },
                })
              }
              icon={<Trash size={14} strokeWidth={2} className="anticon" />}
            >
              {l('DELETE')}
            </Button>
          </Row>
        );
      },
    },
  ];
  const onSubmit = async values => {
    setModalLoading(true);
    let response =
      labelId !== null
        ? await updateLabel(labelId, values)
        : await createLabel(values);
    if (response.ok) {
      message.success(labelId !== null ? l('TAG_UPDATED') : l('TAG_ADDED'));
      update();
      setLabelId(null);
      setModal(false);
      formRef.resetFields();
    } else {
      message.error(
        labelId !== null ? l('UPDATE_TAG_ERROR') : l('ADD_TAG_ERROR')
      );
    }
    setModalLoading(false);
  };
  return (
    <>
      <Modal
        visible={modal}
        title={labelId !== null ? l('DETAIL_TAG') : l('NEW_TAG')}
        okText={labelId !== null ? l('UPDATE') : l('ADD')}
        centered
        cancelText={l('CANCEL')}
        width={800}
        okButtonProps={{ loading: modalLoading }}
        onOk={() => formRef.submit()}
        onCancel={() => {
          setModal(false);
          formRef.resetFields();
          setLabelId(null);
        }}
      >
        <LabelForm
          formRef={formRef}
          onSubmit={onSubmit}
          layout="vertical"
          style={{ width: '100%' }}
        />
      </Modal>
      <Alert
        message={l('WARNING')}
        description={l('TAG_WARNING_CONTENT')}
        type="warning"
        showIcon
        closable
      />
      <Row justify="end" style={{ marginBottom: 20, marginTop: 20 }}>
        <Button
          type="primary"
          onClick={() => setModal(true)}
          icon={<PlusOutlined />}
        >
          {l('ADD')}
        </Button>
      </Row>
      <Table
        scroll={{ y: '40vh' }}
        loading={loading}
        dataSource={labels}
        rowKey={row => row._id}
        columns={columns}
        locale={{ emptyText: l('NO_LABELS') }}
      />
    </>
  );
};

export default TagsView;
