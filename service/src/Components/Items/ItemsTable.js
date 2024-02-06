import React, { useState } from 'react';
import dayjs from 'dayjs';
import immutable from 'seamless-immutable';
import { Table, Card, Row, Col, Form, message, Button } from 'antd';
import { EditFilled } from '@ant-design/icons';

import ItemSearch from './ItemSearch';
import ExportItems from './ExportItems';
import ItemAction from './ItemAction';
//Hooks
import { useFetchItems } from '../../Hooks/Items.hook';
import { useAuth } from '../../Hooks/Auth.hook';

//Services
import { updateItem, createItem } from '../../Services/API';

const ItemsTable = () => {
  const [queries, setQueries] = useState(
    immutable([
      {
        field: 'itm_name',
        value: '',
        operator: '$regex',
      },
      {
        field: 'stock_no',
        value: '',
        operator: '$regex',
      },
    ])
  );
  const [{ role }] = useAuth();
  const [items, loading, , change, updater] = useFetchItems(queries);
  const [itemModal, setItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState({});
  const [modalLoading, setModalLoading] = useState(false);
  const [formRef] = Form.useForm();
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
      title: 'UOM',
      dataIndex: 'uom',
    },
    {
      title: 'Net Weight',
      dataIndex: 'net_weight',
    },
    {
      title: 'Length',
      dataIndex: 'length',
    },
    {
      title: 'Height',
      dataIndex: 'height',
    },
    {
      title: 'Width',
      dataIndex: 'width',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      render(txt) {
        return dayjs(txt).format('DD-MM-YYYY HH:mm');
      },
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      render(txt) {
        return dayjs(txt).format('DD-MM-YYYY HH:mm');
      },
    },
    {
      title: '',
      dataIndex: '_id',
      render(data, row) {
        if (role.rol !== 'admin') {
          return '';
        }

        return (
          <Row>
            <Col>
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
            </Col>
          </Row>
        );
      },
    },
  ];
  const _handleSubmit = async values => {
    setModalLoading(true);
    let response;
    if (selectedItem._id) {
      response = await updateItem(selectedItem._id, values);
      setSelectedItem({});
    } else {
      response = await createItem(values);
    }
    if (response.ok) {
      message.success('Success');
      updater();
      setItemModal(false);
    }
    setModalLoading(false);
  };
  return (
    <Card>
      <Row justify="space-between" style={{ marginBottom: 10 }}>
        <Col>
          <h3 style={{ textAlign: 'left' }}>WES Item Master List</h3>
        </Col>
        <Col>
          <ItemSearch
            queries={queries}
            updater={() => change(queries, 0)}
            queryHandler={setQueries}
          />
        </Col>
      </Row>
      <ItemAction
        itemModal={{
          visible: itemModal,
          handler: setItemModal,
          form: formRef,
          submit: _handleSubmit,
          loading: modalLoading,
        }}
        itemFn={{
          selected: selectedItem,
          handlerSelected: setSelectedItem,
          updater,
        }}
      />
      <Row style={{ marginBottom: 10 }} justify="end">
        <Col>
          <ExportItems queries={queries} />
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
export default ItemsTable;
