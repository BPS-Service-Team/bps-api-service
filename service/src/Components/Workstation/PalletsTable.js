import React from 'react';
import { Table } from 'antd';
const PalletsTable = ({ items }) => {
  const columns = [
    {
      title: 'Stock Number',
      dataIndex: 'STOCK_NO',
    },
    {
      title: 'Item Name',
      dataIndex: 'ITM_NAME',
    },
    {
      title: 'Batch Number',
      dataIndex: 'BATCH_NO',
    },
    {
      title: 'Quantity',
      dataIndex: 'QTY',
    },
  ];
  return (
    <div className="fluid-container">
      <Table
        columns={columns}
        dataSource={items}
        rowKey={e => e.STOCK_NO}
        pagination={false}
      />
    </div>
  );
};

export default PalletsTable;
