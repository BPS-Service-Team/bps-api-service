import React, { useState } from 'react';
import immutable from 'seamless-immutable';
import dayjs from 'dayjs';
import {
  Button,
  Card,
  Col,
  Form,
  message,
  Modal,
  Popconfirm,
  Row,
  Table,
} from 'antd';
import {
  CloseCircleOutlined,
  EditFilled,
  PlusOutlined,
} from '@ant-design/icons';

import StockSearch from './StockSearch';
import ExportStocks from './ExportStocks';
import StockForm from '../Form/Stock.form';
//Hooks
import { useFetchStocks } from '../../Hooks/Stocks.hook';
import { useAuth } from '../../Hooks/Auth.hook';

//Services
import { createStockR, updateStock, updateStockR } from '../../Services/API';

const StocksTable = () => {
  const [queries, setQueries] = useState(
    immutable([
      {
        field: 'pallet_id',
        value: '',
      },
      {
        field: 'label',
        value: '',
      },
      {
        field: 'batch_no',
        value: '',
      },
      {
        field: 'stock_no',
        value: '',
      },
      {
        field: 'status',
        value: '',
      },
    ])
  );
  const [{ role }] = useAuth();
  const [items, loading, , change, updater] = useFetchStocks(queries);
  const [itemModal, setItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formRef] = Form.useForm();
  const _handleFreeStock = async sId => {
    const response = await updateStock(sId, {
      pallet_id: '',
      status: 200,
    });

    if (response?.ok) {
      message.success('Stock free');
    }
  };
  const columns = [
    {
      title: 'Item Name',
      dataIndex: 'itm_name',
    },
    {
      title: 'Stock No.',
      dataIndex: 'stock_no',
    },
    {
      title: 'Batch No.',
      dataIndex: 'batch_no',
    },
    {
      title: 'Val Type',
      dataIndex: 'val_type',
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
    },
    {
      title: 'Location',
      dataIndex: 'location',
    },
    {
      title: 'Pallet ID',
      dataIndex: 'pallet_id',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render(status) {
        switch (status) {
          case 200:
            return '200 Empty';
          case 201:
            return '201 Ready';
          case 202:
            return '202 In transit';
          default:
            return status;
        }
      },
    },
    {
      title: 'Date',
      dataIndex: 'date',
      render(txt) {
        if (txt) {
          return dayjs(txt).format('DD-MM-YYYY HH:mm:ss');
        }
        return '-';
      },
    },
    {
      title: 'Update Date',
      dataIndex: 'updated_at',
      render(txt) {
        if (txt) {
          return dayjs(txt).format('DD-MM-YYYY HH:mm:ss');
        }
        return '-';
      },
    },
    {
      title: '',
      dataIndex: '_id',
      render(_, row) {
        if (role.rol !== 'admin') {
          return '';
        }

        return (
          <>
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
            {row?.empty_stock && (
              <Popconfirm
                onConfirm={() => _handleFreeStock(row._id)}
                style={{ padding: '4px' }}
                title="Do you really want to free this stock?"
              >
                <Button icon={<CloseCircleOutlined />}>Free Stock</Button>
              </Popconfirm>
            )}
          </>
        );
      },
    },
  ];
  const _handleSubmit = async values => {
    setModalLoading(true);
    let response,
      parsedValue = {};
    for (let key of Object.keys(values)) {
      if (
        (values[key] === '' || typeof values[key] === 'undefined') &&
        key !== 'remark' &&
        key !== 'reason'
      ) {
        parsedValue[key] = null;
      } else {
        parsedValue[key] = values[key];
      }
    }
    if (selectedItem === null) {
      response = await createStockR(parsedValue);
    } else {
      response = await updateStockR(selectedItem._id, parsedValue);
    }
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
        title={selectedItem?._id ? 'Update Stock' : 'Add new stock'}
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
        <StockForm
          formRef={formRef}
          onSubmit={_handleSubmit}
          add={selectedItem === null}
          status={selectedItem?.status}
        />
      </Modal>
      <Row justify="space-between" style={{ marginBottom: 10 }}>
        <Col>
          <h3 style={{ textAlign: 'left' }}>WES Stock List</h3>
        </Col>
        <Col>
          <StockSearch
            queries={queries}
            updater={() => change(queries, 0)}
            queryHandler={setQueries}
          />
        </Col>
      </Row>
      <Row gutter={[10, 10]} justify="end" style={{ marginBottom: 10 }}>
        {role.rol === 'admin' && (
          <Col span="auto">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setItemModal(true);
              }}
            >
              Add
            </Button>
          </Col>
        )}
        <Col span="auto">
          <ExportStocks queries={queries} />
        </Col>
      </Row>
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
export default StocksTable;
