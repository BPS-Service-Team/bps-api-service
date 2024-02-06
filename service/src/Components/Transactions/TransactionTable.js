import React, { useEffect, useState } from 'react';
import { Table, Card, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { useFetchTransactions } from '../../Hooks/Transactions.hook';
import { TransactionSearch } from './TransactionSearch';
import ExportTransactions from './ExportTransactions';

const TransactionTable = () => {
  const [disableExport, setDisableExport] = useState(true);
  const [queries, setQueries] = useState([
    {
      field: 'order_id',
      operator: '$regex',
      value: '',
    },
    {
      field: 'process',
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
      field: 'stock_no',
      value: '',
    },
  ]);
  const [orders, loading, , update] = useFetchTransactions();
  useEffect(() => {
    if (queries[2].value !== undefined && queries[3].value !== undefined) {
      setDisableExport(false);
    } else {
      setDisableExport(true);
    }
  }, [queries]);
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
      title: 'Transaction ID',
      dataIndex: '_id',
    },
    {
      title: 'Order ID',
      dataIndex: 'order_id',
    },
    {
      title: 'Process',
      dataIndex: 'process',
    },
    {
      title: 'From Location',
      dataIndex: 'from',
    },
    {
      title: 'To Location',
      dataIndex: 'to',
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
    },
    {
      title: 'Pallet ID',
      dataIndex: 'pallet_id',
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
      title: 'Valuation Type',
      dataIndex: 'val_type',
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
    },
    {
      title: 'User',
      dataIndex: 'user',
    },
    {
      title: 'Creation Date',
      dataIndex: 'created_at',
      render(txt) {
        return dayjs(txt).format('DD/MM/YYYY HH:mm');
      },
    },
  ];
  return (
    <Card>
      <Row justify="space-between">
        <Col>
          <h1>Transaction List</h1>
        </Col>
        <Col>
          <TransactionSearch
            queries={queries}
            queryHandler={setQueries}
            updater={() => update(queries, 0)}
          />
        </Col>
      </Row>
      <ExportTransactions queries={queries} disableButton={disableExport} />
      <div className="fluid-container">
        <Table
          columns={columns}
          dataSource={orders.data}
          rowKey={row =>
            row._id +
            row.created_at +
            row.stock_no +
            row.order_id +
            Math.random()
          }
          loading={loading}
          pagination={{
            total: orders.total,
            current: orders.params.skip / 10 + 1,
            onChange: e => update(orders.params.queries, (e - 1) * 10),
            pageSizeOptions: [10],
          }}
        />
      </div>
    </Card>
  );
};

export default TransactionTable;
