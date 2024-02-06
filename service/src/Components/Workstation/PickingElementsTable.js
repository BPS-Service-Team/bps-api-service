import React from 'react';
import { Table } from 'antd';
import { useWorkstation } from '../../Hooks/Workstation.hook';
const PickingElementsTable = ({ items }) => {
  const [{ orderDetail, items: aPickedItems }] = useWorkstation();
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
      title: 'Valuation Type',
      dataIndex: 'VAL_TYPE',
    },
    {
      title: 'Picked Qty',
      render: (_, row) => {
        const nRepeated = orderDetail.agf.filter(
          oElem => oElem.STOCK_NO === row.STOCK_NO
        ).length;
        let oPicked;
        if (nRepeated > 1) {
          oPicked = orderDetail?.agf?.find(
            item =>
              item.STOCK_NO === row.STOCK_NO &&
              item.BATCH_NO === row.BATCH_NO &&
              item.VAL_TYPE === row.VAL_TYPE &&
              item.PACK_KEY === row.PACK_KEY
          );
        } else {
          oPicked = orderDetail?.agf?.find(
            item =>
              item.STOCK_NO === row.STOCK_NO &&
              (item.BATCH_NO === null ||
                item.BATCH_NO?.toLowerCase() === row.BATCH_NO?.toLowerCase()) &&
              (item.VAL_TYPE === null ||
                item.VAL_TYPE.toLowerCase() === row.VAL_TYPE?.toLowerCase())
          );
        }

        return oPicked?.PICK_QTY || 0;
      },
    },
    {
      title: 'Sug Qty',
      dataIndex: 'PICK_QTY',
    },
    {
      title: 'Scanned Qty',
      render: (_, row) => {
        const oPicked = aPickedItems.find(
          item =>
            item.STOCK_NO === row.STOCK_NO &&
            (row.BATCH_NO === item.BATCH_NO ||
              item.BATCH_NO?.toLowerCase() === row.BATCH_NO?.toLowerCase()) &&
            (row.VAL_TYPE === item.VAL_TYPE ||
              item.VAL_TYPE?.toLowerCase() === row.VAL_TYPE?.toLowerCase())
        );

        return oPicked?.QTY || 0;
      },
    },
  ];
  return (
    <div className="fluid-container">
      <Table
        columns={columns}
        dataSource={items}
        rowKey={e => `${e.STOCK_NO}-${e.BATCH_NO}-${e.VAL_TYPE}`}
        pagination={false}
        scroll={{ y: 300 }}
      />
    </div>
  );
};

export default PickingElementsTable;
