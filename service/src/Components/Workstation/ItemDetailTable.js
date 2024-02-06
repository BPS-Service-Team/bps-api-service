import { Button, Card, Col, Modal, Row, Table } from 'antd';
import React, { useEffect, useState } from 'react';
import { useWorkstation } from '../../Hooks/Workstation.hook';
import ItemActions from './ItemActions';

const ItemDetailTable = ({
  items = [],
  disableTableBtns,
  setDisableTableBtns,
}) => {
  const [itemDetail, setItemDetail] = useState({});
  const [tableData, setTableData] = useState(items);
  const [{ pallet }, setWorkstation] = useWorkstation();
  const columns = [
    {
      title: 'Stock Location',
      dataIndex: 'location',
      key: 'StockLocation',
    },
    {
      title: 'Pallet ID',
      dataIndex: 'pallet_id',
      key: 'PalletID',
    },
    {
      title: 'Item ID',
      dataIndex: 'stock_no',
      key: 'ItemID',
    },
    {
      title: 'Item Name',
      dataIndex: 'itm_name',
      key: 'ItemName',
    },
    {
      title: 'Batch Number',
      dataIndex: 'batch_no',
      key: 'BatchNumber',
    },
    {
      title: 'Val Type',
      dataIndex: 'val_type',
      key: 'ValType',
    },
    {
      title: 'Pallet Quantity',
      dataIndex: 'qty',
      key: 'PalletQuantity',
    },
    {
      title: 'Real Count',
      dataIndex: 'real_count',
      key: 'RealCount',
    },
    {
      render(_, record) {
        return (
          <Button
            type="primary"
            onClick={() => {
              Modal.confirm({
                title: 'Are you sure to remove this item?',
                onOk: () => removeItem(record),
                centered: true,
              });
            }}
          >
            Remove
          </Button>
        );
      },
    },
  ];

  const removeItem = record => {
    if (record) {
      const tableDataTemp = [...tableData];
      const itemTemp = tableDataTemp.filter(item => item?._id === record?._id);
      if (itemTemp.length) {
        itemTemp[0].real_count = 0;
        setTableData(tableDataTemp);
      }
    }
  };

  useEffect(() => {
    setWorkstation({ picking: items });
  }, []);

  return (
    <Card>
      <Row justify="space-between">
        <Col>
          <h3 style={{ textAlign: 'left' }}>
            Stock Details. {pallet?.id && `Pallet: ${pallet.id}`}
          </h3>
        </Col>
        <Col>
          <ItemActions
            disableTableBtns={disableTableBtns}
            setDisableTableBtns={setDisableTableBtns}
            itemDetail={itemDetail}
            setItemDetail={setItemDetail}
            setTableData={setTableData}
            tableData={tableData}
          />
        </Col>
      </Row>
      <div className="fluid-container">
        <Table
          columns={columns}
          dataSource={tableData.filter(item => {
            if (typeof item.real_count !== 'undefined') {
              if (parseInt(item.real_count) === 0) {
                return null;
              }
            }
            return item;
          })}
          rowKey={row => `${row._id}-${row.itm_name}`}
        />
      </div>
    </Card>
  );
};

export default ItemDetailTable;
