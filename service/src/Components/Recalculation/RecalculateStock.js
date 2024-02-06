import { Button, Card, Col, Input, Row, message } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import immutable from 'seamless-immutable';
import { useFetchStocks } from '../../Hooks/Stocks.hook';
import {
  useClearWorkstation,
  useWorkstation,
  useWorkstationId,
} from '../../Hooks/Workstation.hook';
import { createAgfTask, getStocks, updateStock } from '../../Services/API';
import ItemDetail from '../Workstation/ItemDetail';
import ItemDetailTable from '../Workstation/ItemDetailTable';

const RecalculateStock = () => {
  const [queries, setQueries] = useState(
    immutable([
      {
        field: 'label',
        value: '',
      },
    ])
  );
  const [btnPress, setBtnPress] = useState(false);
  const [items, fetchingStocks, , change] = useFetchStocks(queries);
  const [disableTableBtns, setDisableTableBtns] = useState(false);
  const [loadingBtnRecalculation, setLoadingBtnRecalculation] = useState(false);
  const [{ pickup }, setWorkstation] = useWorkstation();
  const clearWorkstation = useClearWorkstation();
  const [workstationId] = useWorkstationId();
  const inputSearchRef = useRef(null);

  useEffect(() => {
    return () => {
      clearWorkstation();
    };
  }, []);

  const itemFound = useMemo(() => {
    if (
      items?.data?.length &&
      btnPress &&
      !fetchingStocks &&
      queries[0].value !== ''
    ) {
      return items.data;
    }
    return [];
  }, [items, queries]);

  const startRecalculation = async () => {
    setLoadingBtnRecalculation(true);
    const tempItemsArr = [];
    let palletSize = '';
    items.data?.map(item => {
      if (item.pallet_id && !palletSize) {
        palletSize = item.pallet_id[0];
      }
      tempItemsArr.push({
        BATCH_NO: item.batch_no,
        ITM_NAME: item.itm_name,
        QTY: item.qty,
        SERIAL_NO: '',
        STOCK_NO: item.stock_no,
        VAL_TYPE: item.val_type,
      });
    });
    const response = await createAgfTask({
      order_id: 'RC888',
      direction: 'out',
      task_no: `T${new Date().getTime()}`,
      force_type: 'picking',
      type: 'create',
      request: tempItemsArr,
      check: false,
      payload: {
        lpn: queries[0]?.value,
        taskNo: `T${new Date().getTime()}`,
        taskType: 'Inbound',
        locationSource: `WS${workstationId}`,
        locationDestination: queries[0]?.value,
        palletType: palletSize === 'S' ? '800' : '1000',
        checkWidth: 'N',
        checkHeight: 'N',
      },
    });
    if (response.ok) {
      message.success('Recalculation confirmed');
      const stock = await getStocks([
        { field: 'label[$regex]', value: queries[0]?.value },
      ]);
      if (stock?.data?.data?.length) {
        setWorkstation({
          recalculationStock: {
            _id: stock.data.data[0]._id,
            status: 202,
            label: queries[0]?.value,
          },
        });
        updateStock(stock.data.data[0]._id, { status: 202 });
      }
      setWorkstation({
        pending: response.data,
        taskResult: {},
        taskFinish: false,
      });
    } else {
      message.error('Error starting recalculation');
    }
    setLoadingBtnRecalculation(false);
  };

  const onScanInputLocation = async () => {
    const stock = await getStocks([
      { field: 'label[$regex]', value: queries[0]?.value },
    ]);
    if (stock?.data?.data?.length) {
      if (stock.data.data[0].status === 202) {
        return message.info(
          `Current location ${queries[0]?.value} is occupied`
        );
      }
    }
    setWorkstation({ pickup: null });
    change(queries, 0);
    setBtnPress(true);
  };

  return (
    <Card>
      <Row>
        <Col>
          <h1 className="screen-title">Recalculate Stock</h1>
        </Col>
      </Row>
      <Row>
        <Col span={12} className="top-recalculation">
          <Input
            placeholder="Please scan or input Location"
            onChange={e =>
              setQueries(
                queries.updateIn([0], row =>
                  row.merge({ value: e.target.value })
                )
              )
            }
            value={queries[0]?.value}
            ref={inputSearchRef}
          />
          <Button
            type="primary"
            onClick={onScanInputLocation}
            disabled={!queries[0]?.value}
          >
            Determine
          </Button>
        </Col>
      </Row>
      <Row className="bottom-recalculation">
        <Col span={24}>
          <ItemDetail disableComponents={!itemFound.length} />
        </Col>
        <Col span={24} className="aux-bottom-recalculation">
          <Button
            type="primary"
            disabled={!pickup || disableTableBtns}
            onClick={startRecalculation}
            loading={loadingBtnRecalculation}
          >
            START
          </Button>
        </Col>
        {itemFound.length ? (
          <Col span={24}>
            <ItemDetailTable
              items={itemFound}
              disableTableBtns={disableTableBtns}
              setDisableTableBtns={setDisableTableBtns}
            />
          </Col>
        ) : null}
      </Row>
    </Card>
  );
};

export default RecalculateStock;
