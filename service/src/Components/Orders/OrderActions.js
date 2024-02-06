import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Modal,
  Input,
  Button,
  Form,
  message,
  Descriptions,
  Result,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import ItemForm from '../Form/Item.form';
import PalletsTable from './PalletsTable';
//Hooks
import { useNavigation } from '../../Hooks/Nav.hook';
import { useWorkstation } from '../../Hooks/Workstation.hook';
//Services
import {
  scanPallet,
  palletReady,
  updatePickupZone,
  getAgfTasks,
  getOrders,
  getPickZones,
} from '../../Services/API';
let pendingInterval;
const OrderActions = () => {
  const [palletIdModal, setPalletIdModal] = useState(false);
  const [itemDetail, setItemDetail] = useState({});
  const [confModal, setConfModal] = useState(false);
  const [itemText, setItemText] = useState('');
  const [itemModal, setItemModal] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [hasShortComing, setHasShortComing] = useState(false);
  const [shortComingModal, setShortComingModal] = useState(false);
  const [checkFailedModal, setCheckFailedModal] = useState(false);
  const [formRef] = Form.useForm();
  const [finishLoading, setFinishLoading] = useState(false);
  const [palleteModalLoading, setPaletteModalLoading] = useState(false);
  const [finishButtonEnabled, setFinishButtonDisabled] = useState(true);
  const [
    {
      items,
      orderDetail,
      pallet,
      pickup,
      pending,
      pickZones,
      taskFinish,
      taskResult,
    },
    setWorkstation,
  ] = useWorkstation();
  const [
    {
      query: { order_id },
    },
    nav,
  ] = useNavigation();
  const [inputTxt, setInputTxt] = useState('');
  useEffect(() => {
    if (pending !== null && !taskFinish) {
      pendingInterval = setInterval(async () => {
        let response = await getAgfTasks([
          { field: 'task_no', value: pending?.agf_task_no },
        ]);
        if (response.ok) {
          if (response.data?.data.length > 0) {
            if (response.data?.data[0]) {
              const [oTask] = response.data.data;

              if (oTask.status === 3 && checkFailedModal === false) {
                const { check_result } = oTask;
                if (check_result.height === 1 && check_result.width === 1) {
                  clearDataSended();
                } else {
                  message.error('Check Failed!');
                  setCheckFailedModal(true);
                  clearInterval(pendingInterval);
                  pendingInterval = null;
                }
                if (oTask?.check) {
                  setWorkstation({
                    taskFinish: false,
                    taskResult: oTask,
                  });
                }
              } else if (oTask.status === 4) {
                clearInterval(pendingInterval);
                pendingInterval = null;
                setWorkstation({
                  taskFinish: true,
                  taskResult: oTask,
                });
              }
            }
          }
        }
      }, 5000);
    } else {
      clearInterval(pendingInterval);
      pendingInterval = null;
    }
    return () => {
      clearInterval(pendingInterval);
      pendingInterval = null;
    };
  }, [pending]);
  useEffect(() => {
    return () => {
      setWorkstation({ items: [] });
    };
  }, []);
  const _handleSetPallet = async () => {
    setPaletteModalLoading(true);
    let response = await scanPallet({
      order_id,
      pallet_id: inputTxt,
      operation: 'reserve',
    });
    if (response.ok) {
      if (pallet) {
        const oReleaseResponse = await scanPallet({
          operation: 'release',
          order_id,
          pallet_id: pallet.id,
        });
        if (!oReleaseResponse.ok) {
          message.error('Error releaseing pallet');
        }
      }
      setWorkstation({
        pallet: {
          id: inputTxt,
          ...response.data,
        },
      });
      setInputTxt('');
      setPalletIdModal(false);
    }
    setPaletteModalLoading(false);
  };
  const _keyListener = e => {
    if (e.key === 'Enter') {
      _handleSetPallet();
    }
  };
  const _handleSubmitForm = values => {
    formRef.resetFields();
    if (itemDetail._id) {
      if (itemDetail.sug_pa_qty > itemDetail.pa_qty + parseFloat(values.qty)) {
        setHasShortComing(true);
      }
      setWorkstation({
        items: [
          ...items,
          {
            STOCK_NO: itemDetail.stock_no,
            ITM_NAME: itemDetail.itm_name,
            BATCH_NO: itemDetail.batch_no,
            PACK_KEY: itemDetail.pack_key,
            SERIAL_NO: itemDetail.serial_no,
            VAL_TYPE: itemDetail.val_type,
            SHORT_COMING: false,
            QTY: parseFloat(values.qty),
          },
        ],
      });
      message.success('Item added');
      if (parseFloat(values.qty) > 0) {
        setFinishButtonDisabled(false);
      }
    }
    setItemDetail({});
    setItemText();
  };
  const _handleFinishPallet = async (isShortComing = false) => {
    let aItems = [...items];
    setFinishLoading(true);
    if (isShortComing) {
      aItems = aItems.map(oItem => {
        let oTemp = { ...oItem };
        let oExist = orderDetail.agf.find(
          item =>
            item.STOCK_NO === oItem.STOCK_NO &&
            item.ITM_NAME === oItem.ITM_NAME &&
            item.PACK_KEY === oItem.PACK_KEY &&
            item.VAL_TYPE === oItem.VAL_TYPE
        );

        if (oExist) {
          if (oExist.SUG_PA_QTY > (oExist.PA_QTY || 0) + oItem.QTY) {
            oTemp.SHORT_COMING = true;
          }
        }

        return oTemp;
      });
    }
    let response = await palletReady({
      items: isShortComing ? aItems : items,
      label: pickup.label,
      order_id,
      pallet_id: pallet.id,
    });
    if (response.ok) {
      setConfModal(false);
      message.success(
        orderDetail?.type === 'return'
          ? 'Return confirmed'
          : 'Putaway confirmed'
      );
      setWorkstation({
        pending: response.data,
      });
    }
    setFinishLoading(false);
  };
  const _handleOnCancel = async () => {
    setCancelLoading(true);

    if (pickup !== null) {
      let responseStatus = await updatePickupZone(pickup.id, {
        status: 1,
      });
      if (responseStatus.ok) {
        message.success('Pickup zone free');
      }
    }
    if (pallet !== null) {
      let responsePallet = await scanPallet({
        order_id,
        pallet_id: pallet.id,
        operation: 'release',
      });
      if (responsePallet.ok) {
        message.success('Pallet free');
      }
    }
    message.success('All actions are cancelled');
    await _handleRestoreInitData();
    setCancelLoading(false);
  };
  const _handleRestoreInitData = async () => {
    let responseOrder = await getOrders([
      {
        field: 'order_id',
        value: order_id,
      },
    ]);
    let responsePickupZones = await getPickZones([
      {
        field: 'status',
        value: 1,
      },
    ]);
    if (responseOrder.ok && responsePickupZones.ok) {
      if (responseOrder.data?.data.length > 0) {
        const [oResponseOrder] = responseOrder.data.data;
        let aLeftItems = [];
        if (taskResult !== null) {
          for (let oItem of oResponseOrder.agf) {
            let oExist = taskResult.request.find(
              oElem =>
                oElem.STOCK_NO === oItem.STOCK_NO &&
                oElem.ITM_NAME === oItem.ITM_NAME &&
                oElem.PACK_KEY === oItem.PACK_KEY &&
                oElem.VAL_TYPE === oItem.VAL_TYPE &&
                oElem.BATCH_NO === oItem.BATCH_NO
            );

            if (!oExist) {
              aLeftItems.push(oItem);
            } else {
              if (oItem.SUG_PA_QTY >= oExist.QTY) {
                if (!oItem.PA_QTY) {
                  oItem.PA_QTY = oExist.QTY;
                }
              }
              aLeftItems.push(oItem);
            }
          }
        }
        let tempPickupZone = pickZones;
        for (let zone of responsePickupZones.data.data) {
          for (let index in tempPickupZone) {
            if (pickZones[index].label === zone.label) {
              tempPickupZone = tempPickupZone.updateIn(index, row =>
                row.merge({
                  status: 1,
                  id: zone._id,
                })
              );
            }
          }
        }
        if (oResponseOrder.status === 3 || !aLeftItems.length) {
          setWorkstation({
            orderDetail: null,
            pickZones: tempPickupZone,
            items: [],
            taskFinish: false,
            taskResult: null,
            pallet: null,
            pending: null,
            pickup: null,
            pickup_id: null,
          });
          nav('/dashboard/agf-workstation?step=order-collection');
        } else {
          setWorkstation({
            orderDetail: {
              ...oResponseOrder,
              agf: aLeftItems,
            },
            pickZones: tempPickupZone,
            items: [],
            taskFinish: false,
            taskResult: null,
            pallet: null,
            pending: null,
            pickup: null,
            pickup_id: null,
          });
        }
      }
    }
  };
  const _handleContinueTask = async () => {
    setContinueLoading(true);
    await _handleRestoreInitData();
    setContinueLoading(false);
  };
  const _handleRedo = () => {
    setCheckFailedModal(false);
    setWorkstation({
      items: [],
      pending: null,
    });
  };
  const _handleTransfer = () => {
    setCheckFailedModal(false);
    setWorkstation({
      pending: null,
    });
    setPalletIdModal(true);
  };
  const clearDataSended = () => {
    setWorkstation({
      pallet: null,
      items: [],
      pickup: null,
    });
  };
  return (
    <>
      <Modal
        title="Scan Pallet ID"
        visible={palletIdModal}
        onCancel={() => setPalletIdModal(false)}
        centered
        destroyOnClose
        okButtonProps={{ loading: palleteModalLoading }}
        okText="Set Pallet"
        onOk={_handleSetPallet}
      >
        <Input
          autoFocus
          placeholder="Enter or scan pallet ID"
          value={inputTxt}
          onKeyDown={_keyListener}
          onChange={e => setInputTxt(e.target.value)}
        />
      </Modal>
      <Modal
        visible={pending !== null}
        title={
          <h2 style={{ textAlign: 'center', fontWeight: 'bolder' }}>
            {taskFinish ? 'Task Result' : 'Waiting for robot response'}
          </h2>
        }
        closable={false}
        destroyOnClose
        centered
        footer={[]}
      >
        {taskFinish ? (
          <Result
            status="success"
            title="Task finished"
            extra={
              <Button
                type="primary"
                onClick={_handleContinueTask}
                loading={continueLoading}
              >
                Continue
              </Button>
            }
          />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div className="lds-grid">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            {taskResult?.check && <h3>Task checked successfully!</h3>}
          </div>
        )}
      </Modal>
      <Modal
        title={
          orderDetail?.type === 'return'
            ? 'Confirm Return Execution'
            : 'Confirm Putaway Execution'
        }
        visible={confModal}
        onCancel={() => setConfModal(false)}
        centered
        zIndex={1}
        destroyOnClose
        okText={
          orderDetail?.type === 'return' ? 'Confirm return' : 'Confirm putaway'
        }
        okButtonProps={{
          loading: finishLoading,
        }}
        onOk={() => {
          if (hasShortComing) {
            setShortComingModal(true);
          } else {
            _handleFinishPallet(false);
          }
        }}
      >
        <Descriptions title="Details" style={{ marginBottom: 10 }}>
          <Descriptions.Item label="Order No.">{order_id}</Descriptions.Item>
          <Descriptions.Item label="Workstation">
            {pickup?.label}
          </Descriptions.Item>
          <Descriptions.Item label="Pallet No.">{pallet?.id}</Descriptions.Item>
        </Descriptions>
        <PalletsTable items={items} />
      </Modal>
      <Modal
        title="Add Item"
        visible={itemModal}
        onCancel={() => setItemModal(false)}
        centered
        cancelButtonProps={{
          onClick: () => {
            formRef.submit();
            setItemModal(false);
          },
        }}
        destroyOnClose
        okText="Another"
        cancelText="Finish"
        onOk={() => formRef.submit()}
        okButtonProps={{
          disabled: !itemDetail._id,
        }}
      >
        <ItemForm
          formRef={formRef}
          itemDetail={itemDetail}
          setItemDetail={setItemDetail}
          onSubmit={_handleSubmitForm}
          inputTxt={itemText}
          setInputTxt={setItemText}
          orderDetail={orderDetail}
        />
      </Modal>
      <Modal
        cancelButtonProps={{
          onClick: () => {
            setShortComingModal(false);
            _handleFinishPallet(false);
          },
        }}
        cancelText="No"
        centered
        destroyOnClose
        okText="Yes"
        onCancel={() => {
          setShortComingModal(false);
          _handleFinishPallet(false);
        }}
        onOk={() => {
          setShortComingModal(false);
          _handleFinishPallet(true);
        }}
        title="Set short coming?"
        visible={shortComingModal}
      >
        Quantity is lower than Suggested. Is it a Short Comming Order?
      </Modal>
      <Modal
        cancelButtonProps={{
          onClick: () => _handleRedo(),
        }}
        cancelText="Redo"
        centered
        destroyOnClose
        okText="Transfer"
        onCancel={_handleRedo}
        onOk={_handleTransfer}
        title="AGF Check Failed!"
        visible={checkFailedModal}
      >
        What do you want to do?
      </Modal>
      <Row justify="end" gutter={[10]}>
        <Col>
          <Button
            type="primary"
            onClick={() => {
              if (!pickup || !pickup?.label) {
                message.error('There is not Pickup reserved!');
                return;
              }
              setConfModal(true);
            }}
            disabled={finishButtonEnabled || orderDetail?.status > 2}
          >
            Finish
          </Button>
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={_handleOnCancel}
            loading={cancelLoading}
            disabled={orderDetail?.status > 2}
          >
            Cancel
          </Button>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={pallet === null || orderDetail?.status > 2}
            onClick={() => setItemModal(true)}
          >
            Add
          </Button>
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={() => setPalletIdModal(true)}
            disabled={pallet !== null || orderDetail?.status > 2}
          >
            Pallet ID
          </Button>
        </Col>
      </Row>
    </>
  );
};

export default OrderActions;
