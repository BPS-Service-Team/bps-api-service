import React from 'react';
import { Table, Card, Row, Col } from 'antd';
import dayjs from 'dayjs';
import OrderStatus from '../../Share/OrderStatus';
import { useFetchAgvOrders } from '../../Hooks/AgvPendingOrders.hook';
const AgvPendingOrdersTable = () => {
  const [orders, loading, , update] = useFetchAgvOrders();
  const columns = [
    {
      title: 'Order No.',
      dataIndex: 'order_id',
    },
    {
      title: 'Type',
      dataIndex: 'type',
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
    {
      title: 'Status',
      dataIndex: 'status',
      render(text) {
        let status = OrderStatus.filter(row => row.id === text);
        return status[0].title;
      },
    },
  ];
  return (
    <Card>
      <Row justify="space-between">
        <Col>
          <h1>AGV Pending Orders</h1>
        </Col>
      </Row>
      <div className="fluid-container">
        <Table
          columns={columns}
          dataSource={orders.data}
          rowKey={row => row._id}
          loading={loading}
          pagination={{
            total: orders.total,
            current: orders.params.skip / 10 + 1,
            onChange: e => update(orders.params.query, (e - 1) * 10),
          }}
        />
      </div>
    </Card>
  );
};

export default AgvPendingOrdersTable;
