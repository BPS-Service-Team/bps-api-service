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
import ReactJson from 'react-json-view';

import ItemForm from '../Form/Item.form';
import PalletsTable from './PalletsTable';
//Hooks
import { useNavigation } from '../../Hooks/Nav.hook';
import { useWorkstation } from '../../Hooks/Workstation.hook';
//Services
import {
  cancelAgfTask,
  forceFinish,
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
  const [shortComingModal, setShortComingModal] = useState(false);
  const [checkFailedModal, setCheckFailedModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [formRef] = Form.useForm();
  const [finishLoading, setFinishLoading] = useState(false);
  const [palleteModalLoading, setPaletteModalLoading] = useState(false);
  const [finishButtonEnabled, setFinishButtonDisabled] = useState(true);
  const [transferLoading, setTransferLoading] = useState(false);
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
                if (oTask.check) {
                  if (check_result.height === 1 && check_result.width === 1) {
                    clearDataSended();
                  } else {
                    message.error('Check Failed!');
                    setCheckFailedModal(true);
                    clearInterval(pendingInterval);
                    pendingInterval = null;
                  }
                } else {
                  clearDataSended();
                }

                if (oTask?.check) {
                  setWorkstation({
                    taskFinish: false,
                    taskResult: oTask,
                  });
                }
              } else if (oTask.status === 4 || oTask.status === 5) {
                clearInterval(pendingInterval);
                pendingInterval = null;
                setWorkstation({
                  taskFinish: true,
                  taskResult: oTask,
                });
              } else if (oTask.status === 6) {
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
  useEffect(() => {
    if (pickup && !pallet && !palletIdModal) {
      setPalletIdModal(true);
    }
  }, [pickup]);
  const _handleSetPallet = async () => {
    setPaletteModalLoading(true);
    setErrorMessage(null);
    let response = await scanPallet({
      order_id,
      pallet_id: inputTxt,
      operation: 'reserve',
    });
    if (response.ok) {
      setWorkstation({
        pallet: {
          id: inputTxt,
          ...response.data,
        },
      });
      setInputTxt('');
      setPalletIdModal(false);
      if (!items || !items.length) {
        setItemModal(true);
      }
    } else {
      setErrorMessage(response?.data?.message);
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
    if (itemDetail.STOCK_NO) {
      let itemIndex = items.findIndex(obj => {
        return (
          obj.STOCK_NO === itemDetail.STOCK_NO &&
          obj.PACK_KEY === itemDetail.PACK_KEY &&
          obj.VAL_TYPE === itemDetail.VAL_TYPE &&
          obj.BATCH_NO === itemDetail.BATCH_NO
        );
      });
      let currentQty = 0;
      if (itemIndex !== -1) {
        currentQty = items[itemIndex].QTY;
      }
      if (itemIndex !== -1) {
        let palletItems = [...items];
        palletItems.splice(itemIndex, 1);
        setWorkstation({
          items: [
            {
              STOCK_NO: itemDetail.STOCK_NO,
              ITM_NAME: itemDetail.ITM_NAME,
              BATCH_NO: itemDetail.BATCH_NO,
              PACK_KEY: itemDetail.PACK_KEY,
              SERIAL_NO: itemDetail.SERIAL_NO,
              VAL_TYPE: itemDetail.VAL_TYPE,
              SHORT_COMING: false,
              QTY: parseFloat(values.qty) + currentQty,
            },
            ...palletItems,
          ],
        });
      } else {
        setWorkstation({
          items: [
            ...items,
            {
              STOCK_NO: itemDetail.STOCK_NO,
              ITM_NAME: itemDetail.ITM_NAME,
              BATCH_NO: itemDetail.BATCH_NO,
              PACK_KEY: itemDetail.PACK_KEY,
              SERIAL_NO: itemDetail.SERIAL_NO,
              VAL_TYPE: itemDetail.VAL_TYPE,
              SHORT_COMING: false,
              QTY: parseFloat(values.qty),
            },
          ],
        });
      }
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
        taskResult: {},
      });
    } else {
      const { data } = response.data;

      if (data?.cancelled) {
        nav('/dashboard/agf-workstation?step=order-collection');
      }
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
    nav('/dashboard/agf-workstation?step=order-collection');
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
                if (oItem.SUG_PA_QTY - oExist.QTY >= 0) {
                  aLeftItems.push(oItem);
                }
              } else {
                aLeftItems.push(oItem);
              }
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
        if (
          oResponseOrder.status === 3 ||
          oResponseOrder.agf_status === 1 ||
          !aLeftItems.length
        ) {
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
    if (taskResult?.error?.length) {
      setWorkstation({
        taskResult: {
          ...taskResult,
          error: null,
        },
      });
    }
    setContinueLoading(true);
    await _handleRestoreInitData();
    setContinueLoading(false);
  };
  const _handleErrorTask = () => {
    setContinueLoading(true);
    setWorkstation({
      pending: null,
      taskResult: null,
      taskFinish: false,
    });
    setContinueLoading(false);
  };
  const _handleRedo = async () => {
    // Change for call Task cancellation
    const { task_no } = taskResult;
    if (task_no) {
      const cancelResponse = await cancelAgfTask(task_no, 'clean');
      if (!cancelResponse.ok) {
        message.error('Error in task cancellation');
      }
    }
    setCheckFailedModal(false);
    setWorkstation({
      items: [],
      pending: null,
    });
  };
  const _handleTransfer = async () => {
    const { task_no } = taskResult;
    if (task_no) {
      setTransferLoading(true);
      const cancelResponse = await cancelAgfTask(task_no, 'rescan');
      if (!cancelResponse.ok) {
        message.error('Error in task cancellation');
      }
      setTransferLoading(false);
    }
    setCheckFailedModal(false);
    setWorkstation({
      pallet: null,
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
  const _handleForceFinish = async () => {
    const oForceResponse = await forceFinish(orderDetail.order_id);
    if (oForceResponse.ok) {
      setWorkstation({
        orderDetail: oForceResponse.data?.data || orderDetail,
      });
      nav('/dashboard/agf-workstation?step=order-collection');
    } else {
      message.error('Error in force finish');
    }
  };
  return (
    <>
      <Modal
        title="Scan Pallet ID"
        visible={palletIdModal}
        centered
        destroyOnClose
        onCancel={() => {
          setErrorMessage(null);
          setPalletIdModal(false);
        }}
        footer={[
          <Row key="row" wrap={false} align="middle">
            <Col flex="auto" style={{ textAlign: 'left' }}>
              <span className="error" key="error">
                {errorMessage}
              </span>
            </Col>
            <Col flex="none">
              <Button
                key="back"
                onClick={() => {
                  setErrorMessage(null);
                  setPalletIdModal(false);
                }}
              >
                Cancel
              </Button>
              <Button
                key="submit"
                loading={palleteModalLoading}
                onClick={_handleSetPallet}
                type="primary"
              >
                Set Pallet
              </Button>
            </Col>
          </Row>,
        ]}
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
          taskResult?.error?.length ? (
            <>
              <h3>
                There was an error with the task. You can check the log below.
              </h3>
              <ReactJson src={taskResult.error} />
              <Row justify="center">
                <Col>
                  <Button
                    type="primary"
                    onClick={_handleErrorTask}
                    loading={continueLoading}
                  >
                    Continue
                  </Button>
                </Col>
              </Row>
            </>
          ) : (
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
          )
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
        onOk={() => _handleFinishPallet(false)}
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
          disabled: !itemDetail.STOCK_NO,
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
          palletItems={items}
        />
      </Modal>
      <Modal
        centered
        destroyOnClose
        footer={[
          <Button key="close" onClick={() => setShortComingModal(false)}>
            Cancel
          </Button>,
          <Button
            key="no"
            onClick={() => {
              setShortComingModal(false);
              _handleFinishPallet(false);
            }}
          >
            No
          </Button>,
          <Button
            key="yes"
            onClick={() => {
              setShortComingModal(false);
              _handleFinishPallet(false);
            }}
            type="primary"
          >
            Yes
          </Button>,
        ]}
        onCancel={() => setShortComingModal(false)}
        title="Set short coming"
        visible={shortComingModal}
      >
        Do you have more pallets for receiving this order?.
      </Modal>
      <Modal
        centered
        destroyOnClose
        onCancel={() => {
          setCheckFailedModal(false);
          setWorkstation({
            pending: null,
          });
        }}
        title="AGF Check Failed!"
        visible={checkFailedModal}
        footer={[
          <div className="footer-col" key="col">
            <Button onClick={_handleRedo}>
              Clean the pallet and redo the whole process
            </Button>
            <Button
              loading={palleteModalLoading || transferLoading}
              onClick={_handleTransfer}
              type="primary"
            >
              Rescan the pallet id and keep all the products on the pallet
            </Button>
          </div>,
        ]}
      >
        What do you want to do?
      </Modal>
      <Row justify="end" gutter={[10]}>
        <Col>
          <Button
            type="primary"
            onClick={() => {
              Modal.confirm({
                title: 'Alert',
                content: 'Do you really want to finish this order?',
                onOk: _handleForceFinish,
              });
            }}
            disabled={
              pallet ||
              orderDetail?.status === 3 ||
              orderDetail?.status === 4 ||
              orderDetail?.cancelled
            }
          >
            Force Finish
          </Button>
        </Col>
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
            disabled={
              finishButtonEnabled ||
              orderDetail?.status === 3 ||
              orderDetail?.status === 4 ||
              pallet === null
            }
          >
            Finish
          </Button>
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={_handleOnCancel}
            loading={cancelLoading}
            disabled={orderDetail?.status === 3 || orderDetail?.status === 4}
          >
            Cancel
          </Button>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={
              pallet === null ||
              orderDetail?.status === 3 ||
              orderDetail?.status === 4
            }
            onClick={() => {
              setItemModal(true);
              setItemText('');
              formRef.resetFields();
            }}
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
