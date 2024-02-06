import React, { useState } from 'react';
import { Table, Card, Row, Col, Select } from 'antd';
import dayjs from 'dayjs';
import OrderStatus from '../../Share/OrderStatus';
import { useFetchOrders } from '../../Hooks/Orders.hook';
import { useNavigation } from '../../Hooks/Nav.hook';

const AgfTable = () => {
  const [, nav] = useNavigation();
  const [queries, setQueries] = useState([
    {
      field: '$sort[created_at]',
      value: -1,
    },
    {
      field: 'status',
      operator: '$in',
      value: [1, 2],
    },
    {
      field: 'type',
      value: '',
    },
    {
      field: 'agf_status',
      value: 0,
    },
  ]);
  const [orders, loading, , update] = useFetchOrders(queries);

  const columns = [
    {
      title: 'No.',
      dataIndex: '_id',
      dataKey: 'no',
      render(_, _2, i) {
        return i + 1 + orders.skip;
      },
    },
    {
      title: 'Order No.',
      dataIndex: 'order_id',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      render(text, row) {
        if (row.relocation) {
          return 'Reallocation ' + text;
        }
        return text.charAt(0).toUpperCase() + text.slice(1);
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render(text) {
        if (OrderStatus) {
          let status = OrderStatus?.find(row => row.id === text);

          if (status) {
            return status.title;
          }
        }

        return text;
      },
    },
    {
      title: 'No. of Pallet',
      dataIndex: 'agf_pallets',
      render(pallets, row) {
        return pallets.length + row.agv_pallets.length;
      },
    },
    {
      title: 'No. of line',
      dataIndex: 'agf',
      render(agf) {
        return agf.length;
      },
    },
    {
      title: 'Receive Date',
      dataIndex: 'created_at',
      render(txt) {
        return dayjs(txt).format('DD/MM/YYYY');
      },
    },
    {
      title: 'Receive Time',
      dataIndex: 'created_at',
      render(txt) {
        return dayjs(txt).format('HH:mm');
      },
    },
  ];

  const _onFilter = filterValue => {
    let aTemp = [...queries],
      oTarget = aTemp.find(item => item.field === 'type');

    if (oTarget) {
      oTarget.value = filterValue === 'all' ? '' : filterValue;
    }

    setQueries(aTemp);
    update(aTemp, 0);
  };

  return (
    <Card>
      <Row justify="space-between">
        <Col>
          <h1>AGF Orders</h1>
        </Col>
        <Col>
          <Select
            style={{ minWidth: 200, marginBottom: 15 }}
            placeholder="Filter"
            defaultValue="all"
            onChange={_onFilter}
          >
            <Select.Option value="all">All</Select.Option>
            <Select.Option value="putaway">Putaway</Select.Option>
            <Select.Option value="picking">Picking</Select.Option>
            <Select.Option value="return">Return</Select.Option>
            <Select.Option value="relocation">Relocation</Select.Option>
          </Select>
        </Col>
      </Row>
      <div className="fluid-container">
        <Table
          columns={columns}
          className="click-row-selection"
          dataSource={orders.data}
          loading={loading}
          rowKey={row => row._id}
          pagination={{
            total: orders.total,
            current: orders.params.skip / 10 + 1,
            onChange: e => update(orders.params.queries, (e - 1) * 10),
          }}
          onRow={record => {
            return {
              onClick: () => {
                nav(
                  `/dashboard/agf-workstation?step=order-details&order_id=${record.order_id}`
                );
              },
            };
          }}
        />
      </div>
    </Card>
  );
};

export default AgfTable;
