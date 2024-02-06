import React, { useState } from 'react';
import immutable from 'seamless-immutable';
import dayjs from 'dayjs';
import { Button, Card, Table, Row, Col, message, Modal } from 'antd';

import StockSearch from '../Stocks/StockSearch';
import { useFetchStocks } from '../../Hooks/Stocks.hook';
import { updateStock } from '../../Services/API';

const StockOperation = () => {
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
      {
        field: 'stock_issue',
        value: true,
      },
    ])
  );
  const [items, loading, , change, update] = useFetchStocks(queries);

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
      render(id) {
        async function handler() {
          Modal.confirm({
            title: 'Do you want to release this stock?',
            content: 'This action can be revert',
            onOk: async () => {
              const response = await updateStock(id, {
                stocks: [],
                pallet_id: '',
                status: 200,
              });
              if (response.ok) {
                message.success('Stock released');
                update();
              } else {
                message.error('Unable to update stock');
              }
            },
          });
        }
        return <Button onClick={handler}>Release</Button>;
      },
    },
  ];
  return (
    <Card>
      <Row justify="space-between" style={{ marginBottom: 10 }}>
        <Col>
          <h3 style={{ textAlign: 'left' }}>WES Stock List</h3>
        </Col>
        <Col>
          <StockSearch
            queries={queries}
            updater={() => change(queries, 0)}
            queryHandler={setQueries}
            withoutBach
          />
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

export default StockOperation;
