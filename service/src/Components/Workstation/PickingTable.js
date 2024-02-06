import React, { useState } from 'react';
import { Table, Button, Modal } from 'antd';
import PickZoneSearch from './PickZoneSearch';
import { useWorkstation } from '../../Hooks/Workstation.hook';
const PickingTable = ({ items }) => {
  const [zonesModal, setZonesModal] = useState(false);
  const [palletId, setPalletId] = useState(null);
  const [{ orderDetail }] = useWorkstation();
  const columns = [
    {
      title: 'Pallet ID',
      dataIndex: 'pallet_id',
      render: (pallet_id, row) => (
        <span style={{ textDecoration: row.ready ? 'line-through' : 'none' }}>
          {pallet_id}
        </span>
      ),
    },
  ];
  const expandedRowRender = row => {
    const columnsItems = [
      {
        title: 'Task No',
        dataIndex: 'TASK_NO',
      },
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
        title: 'Order Qty',
        render: (_, oRow) => {
          const oOrderItem = orderDetail.agf.find(
            item =>
              item.STOCK_NO === oRow.STOCK_NO &&
              (item.BATCH_NO === null || item.BATCH_NO === oRow.BATCH_NO) &&
              (item.VAL_TYPE === null || item.VAL_TYPE === oRow.VAL_TYPE) &&
              item.PACK_KEY === oRow.PACK_KEY
          );

          return oOrderItem?.SUG_PICK_QTY || 0;
        },
      },
      {
        title: 'Pallet Qty',
        dataIndex: 'QTY',
      },
      {
        title: 'Val Type',
        dataIndex: 'VAL_TYPE',
      },
    ];
    if (Array.isArray(row.stocks)) {
      return (
        <Table
          columns={columnsItems}
          rowKey={e => `${e.STOCK_NO}-${e.BATCH_NO}-${e.VAL_TYPE}`}
          dataSource={row.stocks}
          pagination={false}
        />
      );
    }
    return (
      <Table
        rowKey={e => `${e.STOCK_NO}-${e.BATCH_NO}-${e.VAL_TYPE}`}
        columns={columnsItems}
        dataSource={[row.stocks]}
        pagination={false}
      />
    );
  };
  return (
    <div className="fluid-container">
      <Modal
        title="Determine pickup Zone"
        visible={zonesModal}
        onCancel={() => setZonesModal(false)}
        centered
        width={800}
        footer={[
          <Button
            key={1}
            onClick={() => {
              setZonesModal(false);
              setPalletId(null);
            }}
          >
            Cancel
          </Button>,
        ]}
      >
        <PickZoneSearch
          inModal
          modalHandler={setZonesModal}
          picking
          pallet_id={palletId}
        />
      </Modal>
      <Table
        columns={columns}
        dataSource={items}
        rowKey={e => e.pallet_id}
        pagination={false}
        expandedRowRender={expandedRowRender}
      />
    </div>
  );
};

export default PickingTable;
