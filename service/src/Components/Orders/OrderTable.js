import React, { useState } from 'react';
import { Table, Card, Row, Col } from 'antd';
import dayjs from 'dayjs';
import OrderStatus from '../../Share/OrderStatus';
import { useFetchOrders } from '../../Hooks/Orders.hook';
import { OrderSearch } from './OrderSearch';
import { useNavigation } from '../../Hooks/Nav.hook';

const OrderTable = () => {
  const [, nav] = useNavigation();
  const [queries, setQueries] = useState([
    {
      field: 'order_id',
      operator: '$regex',
      value: '',
    },
    {
      field: 'created_at',
      operator: '$gte',
      type: 'date',
      value: undefined,
    },
    {
      field: 'created_at',
      operator: '$lte',
      type: 'date',
      value: undefined,
    },
    {
      field: 'type',
      value: '',
    },
    {
      field: 'status',
      value: '',
    },
    {
      field: 'relocation',
      value: 'null',
    },
  ]);
  const [orders, loading, , update] = useFetchOrders(queries);
  const columns = [
    {
      title: 'No.',
      dataIndex: '_id',
      dataKey: 'no',
      render(txt, row, i) {
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
    },
    {
      title: 'AGF',
      dataIndex: 'agf',
      render(agfArray, row) {
        if (agfArray.length === 0) {
          if (row.type === 'relocation') {
            return 'N/A';
          }
          return 'Empty';
        } else {
          return 'Orders';
        }
      },
    },
    {
      title: 'AGV',
      dataIndex: 'agv',
      render(agvArray, row) {
        if (agvArray.length === 0) {
          if (row.type === 'relocation') {
            return 'N/A';
          }
          return 'Empty';
        } else {
          return 'Orders';
        }
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render(text) {
        let status = OrderStatus.filter(row => row.id === text);
        return status[0].title;
      },
    },
    {
      title: 'No. of line',
      dataIndex: 'agf',
      render(agf, row) {
        return agf.length + row.agv.length;
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
  return (
    <Card>
      <Row justify="space-between">
        <Col>
          <h1>Orders List</h1>
        </Col>
        <Col>
          <OrderSearch
            queries={queries}
            queryHandler={setQueries}
            updater={() => update(queries, 0)}
          />
        </Col>
      </Row>
      <div className="fluid-container">
        <Table
          loading={loading}
          columns={columns}
          rowKey={row => row._id}
          dataSource={orders.data}
          className="click-row-selection"
          onRow={record => {
            return {
              onClick: () => {
                if (record.type === 'relocation') {
                  nav(
                    `/dashboard/orders?step=relocation-detail&order_id=${record.order_id}`
                  );
                } else {
                  nav(
                    `/dashboard/orders?step=order-details&order_id=${record.order_id}`
                  );
                }
              },
            };
          }}
          pagination={{
            total: orders.total,
            current: orders.params.skip / 10 + 1,
            onChange: e => update(orders.params.queries, (e - 1) * 10),
          }}
        />
      </div>
    </Card>
  );
};

export default OrderTable;
