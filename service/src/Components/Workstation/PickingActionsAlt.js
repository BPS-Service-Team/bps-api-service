import React, { useEffect, useState } from 'react';
import { Row, Col, message, Modal, Button, Input, Form, Radio } from 'antd';
import ItemForm from '../Form/Item.form';
import { useNavigation } from '../../Hooks/Nav.hook';
import { useWorkstation, useWorkstationId } from '../../Hooks/Workstation.hook';
import {
  getAgfTasks,
  getOrders,
  getPickZones,
  updatePickupZone,
  scanPallet,
  pickingReady,
  releasePicking,
  calculateProcessPicking,
} from '../../Services/API';
import PickingElementsTable from './PickingElementsTable';
import { findItemIndexInArray } from '../../Utils/functions';
let pendingInterval;
const PickingActions = () => {
  const [checkFailedModal, setCheckFailedModal] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [inputTxt, setInputTxt] = useState('');
  const [itemDetail, setItemDetail] = useState({});
  const [itemText, setItemText] = useState('');
  const [formRef] = Form.useForm();
  const [formLoading, setFormLoading] = useState(false);
  const [palletLoading, setPalletLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isQtyValid, setQtyValid] = useState(false);
  // Flag for waiting API response in task. And remove the start button
  const [mainLoading, setMainLoading] = useState(false);
  const [workstationId, setWorkstationId] = useWorkstationId();
  const [
    {
      pending,
      taskFinish,
      picking,
      pickup,
      orderDetail,
      items,
      palletModalView,
      itemModalView,
      pickZones,
      pallet,
      currentPickupZone,
      currentStocks,
      taskResult,
    },
    setWorkstation,
  ] = useWorkstation();
  const [, nav] = useNavigation();
  useEffect(() => {
    if (!mainLoading && pending !== null && !taskFinish) {
      pendingInterval = setInterval(async () => {
        let taskResults = { ...taskResult },
          index = 0;
        for (let key of Object.keys(pending)) {
          // Search in taskResults[key] if status !== 4, if it's then make getAGF for that pending
          if (
            taskResults[key]?.status !== 4 &&
            taskResults[key]?.status !== 5
          ) {
            let response = await getAgfTasks([
              { field: 'task_no', value: pending[key]?.task_no },
            ]);
            if (response.ok) {
              if (response.data?.data.length > 0) {
                if (response.data?.data[0]) {
                  const [oTask] = response.data.data;
                  taskResults[key] = oTask;
                }
              }
            }
          }
        }
        for (let key of Object.keys(taskResults)) {
          if (taskResults[key]?.status === 3 && checkFailedModal === false) {
            const { check_result } = taskResults[key];
            if (check_result.height === 1 && check_result.width === 1) {
              clearDataSended();
            } else {
              message.error('Check Failed!');
              setCheckFailedModal(true);
            }
            if (taskResults[key]?.check) {
              index++;
            }
            if (taskResult[key].direction === 'in') {
              if (pickup && pickup[key]) {
                await updatePickupZone(pickup[key], {
                  status: 1,
                });
              }
              let aPickZones = [...pickZones];
              const nIndex = aPickZones.findIndex(oItem => oItem.label === key);
              if (nIndex > -1) {
                aPickZones[nIndex] = {
                  ...aPickZones[nIndex],
                  status: 1,
                };
                setWorkstation({
                  pickZones: aPickZones,
                });
              }
              delete taskResults[key];
            }
          } else if (
            taskResults[key]?.status === 4 ||
            taskResults[key]?.status === 5
          ) {
            index++;
          }
        }
        if (index === Object.keys(taskResults).length) {
          clearInterval(pendingInterval);
          pendingInterval = null;
          setWorkstation({
            taskResult: taskResults,
            pending: null,
          });
          _handleProcessItem();
        } else {
          const oPending = {};
          for (let key of Object.keys(taskResults)) {
            if (
              taskResults[key]?.status !== 4 &&
              taskResults[key]?.status !== 5
            ) {
              oPending[key] = taskResults[key];
            }
          }
          setWorkstation({
            taskResult: taskResults,
            pending: oPending,
          });
          _handleProcessItem();
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
  }, [mainLoading, pending, taskResult]);
  const _handleSubmitForm = values => {
    setFormLoading(true);
    const oPickedItem = items.find(
        item => item.STOCK_NO === itemDetail.STOCK_NO
      ),
      oCurrentPicking = picking.find(oPick => oPick.pallet_id === pallet.id),
      oCurrentStock = oCurrentPicking.stocks.find(
        oStock => oStock.STOCK_NO === itemDetail.STOCK_NO
      );

    if (
      parseFloat(values.qty) + (oPickedItem?.QTY || 0) >
      itemDetail?.PICK_QTY
    ) {
      message.error('Item exceeds Sug Pick Quantity');
      setFormLoading(false);
      return;
    } else if (parseFloat(values.qty) > oCurrentStock?.QTY) {
      message.error(`There are only ${oCurrentStock?.QTY} in the pallet`);
      setFormLoading(false);
      return;
    } else if (
      parseFloat(values.qty) + (oPickedItem?.QTY || 0) <
      itemDetail?.PICK_QTY
    ) {
      Modal.confirm({
        title: 'Alert',
        content:
          'The quantities do not match, are you sure you wish to continue',
        okText: 'Yes',
        onOk: async () => {
          let aTempItems = [...items];
          const nIndex = findItemIndexInArray(aTempItems, itemDetail);

          if (nIndex === -1) {
            aTempItems.push({
              STOCK_NO: itemDetail.STOCK_NO,
              ITM_NAME: itemDetail.ITM_NAME,
              BATCH_NO: itemDetail.BATCH_NO,
              PACK_KEY: itemDetail.PACK_KEY,
              SERIAL_NO: itemDetail.SERIAL_NO,
              VAL_TYPE: itemDetail.VAL_TYPE,
              SHORT_COMING: false,
              QTY: parseFloat(values.qty),
            });
          } else {
            aTempItems[nIndex] = {
              ...aTempItems[nIndex],
              QTY: aTempItems[nIndex].QTY + parseFloat(values.qty),
            };
          }
          setWorkstation({
            items: aTempItems,
          });
          message.success('Item added');
          setItemDetail({});
          setItemText();
          setFormLoading(false);
        },
      });
    } else {
      formRef.resetFields();
      if (itemDetail._id) {
        let aTempItems = [...items];
        const nIndex = findItemIndexInArray(aTempItems, itemDetail);

        if (nIndex === -1) {
          aTempItems.push({
            STOCK_NO: itemDetail.STOCK_NO,
            ITM_NAME: itemDetail.ITM_NAME,
            BATCH_NO: itemDetail.BATCH_NO,
            PACK_KEY: itemDetail.PACK_KEY,
            SERIAL_NO: itemDetail.SERIAL_NO,
            VAL_TYPE: itemDetail.VAL_TYPE,
            SHORT_COMING: false,
            QTY: parseFloat(values.qty),
          });
        } else {
          aTempItems[nIndex] = {
            ...aTempItems[nIndex],
            QTY: aTempItems[nIndex].QTY + parseFloat(values.qty),
          };
        }
        setWorkstation({
          items: aTempItems,
        });
      } else {
        message.success('Item added');
      }
      setItemDetail({});
      setItemText();
      setFormLoading(false);
    }
  };
  const _continueProcess = async () => {
    await setWorkstation({
      itemModalView: false,
      currentPickupZone: null,
    });

    setItemDetail({});
    setItemText();
    setFormLoading(false);
    _handleProcessItem();
  };
  const _handleFinishForm = async () => {
    setFormLoading(true);
    const values = formRef.getFieldsValue();
    // Validate Qty lower than Sug Qty
    const oPickedItem = items.find(
      item => item.STOCK_NO === itemDetail.STOCK_NO
    );
    // Calculate missing items
    const aLeft = items.filter(oElement => !oElement.QTY);
    if (
      aLeft.length > 0 &&
      !oPickedItem &&
      (!values.qty || values.qty === '')
    ) {
      Modal.confirm({
        title: 'Alert',
        content: `There aren't items picked, the picking lines will be processed any way. Do You want to continue?`,
        onCancel: () => {
          setFormLoading(false);
        },
        onOk: async () => {
          setMainLoading(true);
          const oCurrentItems = picking.find(
            oElem => oElem.pallet_id === pallet.id
          );
          const aCurrentItems = oCurrentItems.stocks.map(oStock => {
            let oTempStock = { ...oStock };

            delete oTempStock._id;
            delete oTempStock.ORDER_ID;
            delete oTempStock.TASK_NO;
            return {
              ...oTempStock,
              SHORT_COMING: false,
              QTY: oTempStock.STOCK_NO === itemDetail.STOCK_NO ? values.qty : 0,
            };
          });
          let response = await pickingReady({
            label: currentPickupZone,
            pallet_id: pallet.id,
            order_id: orderDetail?.order_id,
            items: [...items, ...aCurrentItems],
          });
          if (response.ok) {
            if (response.data.errno === 0) {
              let oTaskResult = { ...taskResult };
              delete oTaskResult[currentPickupZone];
              if (pickup && pickup[currentPickupZone]) {
                await updatePickupZone(pickup[currentPickupZone], {
                  status: 1,
                });
              }
              if (response.data?.agf_task_no) {
                let oPending = { ...pending };
                oPending[currentPickupZone] = {
                  task_no: response.data.agf_task_no,
                };
                setWorkstation({
                  itemModalView: false,
                  items: [],
                  orderDetail: response.data?.order || orderDetail,
                  pending: oPending,
                  taskFinish: false,
                  taskResult: oTaskResult,
                });
              } else {
                Modal.success({
                  title: 'Info',
                  content: `Please remove the pallet ${pallet.id} from the workstation ${currentPickupZone}`,
                });
                let aPickZones = [...pickZones];
                const nIndex = aPickZones.findIndex(
                  oItem => oItem.label === currentPickupZone
                );
                if (nIndex > -1) {
                  aPickZones[nIndex] = {
                    ...aPickZones[nIndex],
                    status: 1,
                  };
                }
                setWorkstation({
                  itemModalView: false,
                  items: [],
                  orderDetail: response.data?.order || orderDetail,
                  pickZones: aPickZones,
                  taskFinish: false,
                  taskResult: oTaskResult,
                });
              }
              formRef.resetFields();
              setFormLoading(false);
              _continueProcess();
            } else {
              setFormLoading(false);
              let sErrors = '';
              for (let sKey in response.data.errors) {
                sErrors += response.data.errors[sKey];
              }
              Modal.warning({
                title: response.data.message,
                content: sErrors,
              });
            }
            setMainLoading(false);
          }
        },
      });
    } else {
      const oCurrentPicking = picking.find(
          oPick => oPick.pallet_id === pallet.id
        ),
        oCurrentStock = oCurrentPicking.stocks.find(
          oStock =>
            oStock.STOCK_NO === itemDetail.STOCK_NO &&
            oStock.BATCH_NO === itemDetail.BATCH_NO
        );
      if (
        parseFloat(values.qty) + (oPickedItem?.QTY || 0) >
        itemDetail?.SUG_PA_QTY
      ) {
        message.error('Item exceeds Sug Pick Quantity');
        setFormLoading(false);
        return;
      } else if (parseFloat(values.qty) > oCurrentStock?.QTY) {
        message.error(`There are only ${oCurrentStock.QTY} in the pallet`);
        setFormLoading(false);
        return;
      } else if (
        parseFloat(values.qty) + (oPickedItem?.QTY || 0) <
        oCurrentStock?.PICK_QTY
      ) {
        Modal.confirm({
          title: 'Alert',
          content:
            'The quantities do not match, are you sure you wish to continue',
          okText: 'Yes',
          onCancel: () => {
            setFormLoading(false);
          },
          onOk: async () => {
            setMainLoading(true);
            let aSendItems = [...items];
            const nItemIndex = findItemIndexInArray(aSendItems, itemDetail);
            if (nItemIndex === -1) {
              aSendItems.push({
                STOCK_NO: itemDetail.STOCK_NO,
                ITM_NAME: itemDetail.ITM_NAME,
                BATCH_NO: itemDetail.BATCH_NO,
                PACK_KEY: itemDetail.PACK_KEY,
                SERIAL_NO: itemDetail.SERIAL_NO,
                VAL_TYPE: itemDetail.VAL_TYPE,
                SHORT_COMING: false,
                QTY: parseFloat(values.qty),
              });
            } else {
              aSendItems[nItemIndex] = {
                ...aSendItems[nItemIndex],
                QTY: aSendItems[nItemIndex].QTY + (parseFloat(values.qty) || 0),
              };
            }
            let response = await pickingReady({
              label: currentPickupZone,
              pallet_id: pallet.id,
              order_id: orderDetail?.order_id,
              items: aSendItems,
            });
            if (response.ok) {
              if (response.data.errno === 0) {
                let oTaskResult = {
                  ...taskResult,
                };
                delete oTaskResult[currentPickupZone];
                if (pickup && pickup[currentPickupZone]) {
                  await updatePickupZone(pickup[currentPickupZone], {
                    status: 1,
                  });
                }
                if (response.data?.agf_task_no) {
                  let oPending = { ...pending };
                  oPending[currentPickupZone] = {
                    task_no: response.data.agf_task_no,
                  };
                  setWorkstation({
                    itemModalView: false,
                    items: [],
                    orderDetail: response.data?.order || orderDetail,
                    pending: oPending,
                    taskFinish: false,
                    taskResult: oTaskResult,
                  });
                } else {
                  Modal.success({
                    title: 'Info',
                    content: `Please remove the pallet ${pallet.id} from the workstation ${currentPickupZone}`,
                  });
                  let aPickZones = [...pickZones];
                  const nIndex = aPickZones.findIndex(
                    oItem => oItem.label === currentPickupZone
                  );
                  if (nIndex > -1) {
                    aPickZones[nIndex] = {
                      ...aPickZones[nIndex],
                      status: 1,
                    };
                  }
                  setWorkstation({
                    items: [],
                    orderDetail: response.data?.order || orderDetail,
                    pickZones: aPickZones,
                    taskFinish: false,
                    taskResult: oTaskResult,
                  });
                }
                formRef.resetFields();
                setFormLoading(false);
                _continueProcess();
              }
            }
            setMainLoading(false);
          },
        });
      } else {
        formRef.resetFields();
        let aSendItems = [...items];
        if (itemDetail._id) {
          const nIndex = findItemIndexInArray(aSendItems, itemDetail);
          if (nIndex === -1) {
            aSendItems.push({
              STOCK_NO: itemDetail.STOCK_NO,
              ITM_NAME: itemDetail.ITM_NAME,
              BATCH_NO: itemDetail.BATCH_NO,
              PACK_KEY: itemDetail.PACK_KEY,
              SERIAL_NO: itemDetail.SERIAL_NO,
              VAL_TYPE: itemDetail.VAL_TYPE,
              SHORT_COMING: false,
              QTY: parseFloat(values.qty) || 0,
            });
          } else {
            aSendItems[nIndex] = {
              ...aSendItems[nIndex],
              QTY: aSendItems[nIndex].QTY + (parseFloat(values.qty) || 0),
            };
          }
        }
        let response = await pickingReady({
          label: currentPickupZone,
          pallet_id: pallet.id,
          order_id: orderDetail?.order_id,
          items: aSendItems,
        });
        setMainLoading(true);
        if (response.ok) {
          if (response.data.errno === 0) {
            let oTaskResult = { ...taskResult };
            delete oTaskResult[currentPickupZone];
            if (pickup && pickup[currentPickupZone]) {
              await updatePickupZone(pickup[currentPickupZone], {
                status: 1,
              });
            }
            if (response.data?.agf_task_no) {
              let oPending = { ...pending };
              oPending[currentPickupZone] = {
                task_no: response.data.agf_task_no,
              };
              setWorkstation({
                itemModalView: false,
                items: [],
                orderDetail: response.data?.order || orderDetail,
                pending: oPending,
                taskFinish: false,
                taskResult: oTaskResult,
              });
            } else {
              Modal.success({
                title: 'Info',
                content: `Please remove the pallet ${pallet.id} from the workstation ${currentPickupZone}`,
              });
              let aPickZones = [...pickZones];
              const nIndex = aPickZones.findIndex(
                oItem => oItem.label === currentPickupZone
              );
              if (nIndex > -1) {
                aPickZones[nIndex] = {
                  ...aPickZones[nIndex],
                  status: 1,
                };
              }
              setWorkstation({
                items: [],
                orderDetail: response.data?.order || orderDetail,
                pickZones: aPickZones,
                taskFinish: false,
                taskResult: oTaskResult,
              });
            }
            setItemText('');
            setFormLoading(false);
            _continueProcess();
          } else {
            setFormLoading(false);
            let sErrors = '';
            for (let sKey in response.data.errors) {
              sErrors += `${response.data.errors[sKey]}\n`;
            }
            Modal.warning({
              title: response.data?.message,
              content: sErrors,
            });
          }
        }
        setMainLoading(false);
      }
    }
  };
  const _handleSetPallet = async () => {
    setPalletLoading(true);
    setErrorMessage('');
    const oPickingFounded = picking.find(oItem => oItem.pallet_id === inputTxt);
    if (!oPickingFounded) {
      setErrorMessage(`The pallet isn't in the required by the order`);
      setPalletLoading(false);
      return;
    }
    let response = await scanPallet({
      order_id: orderDetail.order_id,
      pallet_id: inputTxt,
      operation: 'picking',
    });
    if (response.ok) {
      setWorkstation({
        pallet: {
          id: inputTxt,
          ...response.data,
        },
        palletModalView: false,
        itemModalView: true,
      });
      setInputTxt('');
    }
    setPalletLoading(false);
  };
  const _keyListener = e => {
    if (e.key === 'Enter') {
      _handleSetPallet();
    }
  };
  const _callProcess = async () => {
    const aPallets = picking.map(oPick => oPick.pallet_id);
    let processRes = await calculateProcessPicking('reserve', aPallets);
    if (!processRes.ok) {
      message.error('Error reserving stocks');
    }
  };
  const _handleProcessItem = async () => {
    //Init auto call for pallet
    setProcessLoading(true);
    let responseOrder = await getOrders([
      {
        field: 'order_id',
        value: orderDetail.order_id,
      },
    ]);
    if (responseOrder?.ok) {
      const [oResponseOrder] = responseOrder.data.data;
      if (oResponseOrder?.agf_status === 1) {
        console.log('Redirecting');
      }
    }
    let pickupZonesRes = await getPickZones([
      {
        field: 'status',
        value: 1,
      },
    ]);
    if (pickupZonesRes.ok) {
      //Select pickup zones of the current workstation id
      let freePickup = false,
        pickups = [];
      setMainLoading(true);
      for (let item of pickupZonesRes.data.data) {
        if (item.workstation_id === workstationId) {
          freePickup = true;
          pickups.push(item);
        }
      }
      setMainLoading(false);
      //Return when order is completed
      if (Object.keys(currentStocks).length === picking.length) {
        return;
      }
      if (freePickup) {
        let oPending = {},
          oPickup = {},
          aPickZones = pickZones,
          oCurrentStocks = {
            ...currentStocks,
          },
          i = 0,
          stockPosition = 0;
        //Select not used stock
        while (i < pickups.length) {
          let selectedItem = picking[stockPosition];
          if (stockPosition >= picking.length) {
            //End
            message.error('No actions');
            break;
          }
          if (
            typeof oCurrentStocks[selectedItem.pallet_id] === 'undefined' ||
            oCurrentStocks[selectedItem.pallet_id] === null
          ) {
            let response = await updatePickupZone(pickups[i]._id, {
              status: 2,
              pallet_id: selectedItem.pallet_id,
              order_id: orderDetail.order_id,
            });
            if (response.ok) {
              for (let j in aPickZones) {
                if (aPickZones[j].label === response.data.label) {
                  aPickZones = aPickZones.updateIn([j], row =>
                    row.merge({ status: 2, id: response.data._id })
                  );
                }
              }
              oPickup[response.data.label] = response.data._id;
              oPending[response.data.label] = response.data.agf_task;
              oCurrentStocks[selectedItem.pallet_id] = {
                label: response.data.label,
                finished: false,
              };
            }
            i++;
          } else {
            stockPosition++;
          }
        }
        if (Object.keys(oPending).length === 0) {
          oPending = null;
        }
        setWorkstation({
          pickup: oPickup,
          pickZones: aPickZones,
          pending: oPending,
          palletModalView: false,
          currentStocks: {
            ...currentStocks,
            ...oCurrentStocks,
          },
        });
      } else {
        setProcessLoading(false);
      }
    }
  };
  const _handleFinish = async () => {
    const aUsedPickedZones = pickZones.filter(oPZ => oPZ.status === 2);
    let oReleaseRes = await releasePicking({
      label: aUsedPickedZones.map(oPZ => oPZ.label),
      order_id: orderDetail.order_id,
    });
    if (oReleaseRes.ok) {
      setWorkstation({
        items: [],
        orderDetail: null,
        pallet: null,
        picking: null,
        taskFinish: false,
        taskResult: null,
      });
      nav('/dashboard/agf-workstation?step=order-collection');
    }
  };
  const _renderStocksToPick = () => {
    if (picking && pallet) {
      const oPicking = picking.find(oItem => oItem.pallet_id === pallet.id);

      const aStocks = oPicking.stocks.map(oStock => {
        let oOrderItem = orderDetail.agf.find(
          item =>
            item.STOCK_NO === oStock.STOCK_NO &&
            (item.BATCH_NO === null ||
              item.BATCH_NO.toLowerCase() === oStock.BATCH_NO?.toLowerCase()) &&
            (item.PACK_KEY === null ||
              item.PACK_KEY.toLowerCase() === oStock.PACK_KEY?.toLowerCase()) &&
            (item.VAL_TYPE === null ||
              item.VAL_TYPE.toLowerCase() === oStock.VAL_TYPE?.toLowerCase()) &&
            (item.SERIAL_NO === null ||
              item.SERIAL_NO.toLowerCase() === oStock.SERIAL_NO?.toLowerCase())
        );

        return {
          ...oStock,
          SUG_PICK_QTY: oOrderItem?.SUG_PICK_QTY || 0,
        };
      });

      if (oPicking) {
        return <PickingElementsTable items={aStocks} />;
      }
    }

    return null;
  };
  const clearDataSended = () => {
    setWorkstation({
      pallet: null,
      items: [],
      pickup: null,
    });
  };
  const _canFinish = () => {
    if (orderDetail?.status === 1 && !picking) {
      return false;
    }
    if (orderDetail?.status > 2) {
      return true;
    } else {
      if (pending) {
        return true;
      }
      let blnCanFinish = false;
      for (let oDetail of orderDetail.agf) {
        if (oDetail.PICK_QTY === null || oDetail.PICK_QTY === undefined) {
          blnCanFinish = true;
        }
      }

      return blnCanFinish;
    }
  };
  return (
    <>
      <Modal
        centered
        visible={palletModalView}
        title="Scan Pallet"
        zIndex={1}
        destroyOnClose
        onCancel={() => {
          setErrorMessage('');
          setInputTxt('');
          setWorkstation({
            palletModalView: null,
          });
        }}
        footer={[
          <span
            className="error"
            style={{
              color: 'red',
            }}
            key="error"
          >
            {errorMessage}
          </span>,
          <Button
            key="cancel"
            onClick={() => {
              setErrorMessage('');
              setInputTxt('');
              setWorkstation({
                palletModalView: null,
              });
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            loading={palletLoading}
            onClick={_handleSetPallet}
            type="primary"
          >
            Set Pallet
          </Button>,
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
        title="Remove Item"
        visible={itemModalView}
        centered
        destroyOnClose
        onCancel={() => {
          setFormLoading(false);
          formRef.resetFields();
          setItemText('');
          setWorkstation({
            itemModalView: null,
            items: [],
          });
        }}
        footer={[
          <Button
            className="error"
            key="finish"
            onClick={() => _handleFinishForm()}
            loading={formLoading}
          >
            Finish
          </Button>,
          <Button
            key="cancel"
            onClick={() => {
              setFormLoading(false);
              formRef.resetFields();
              setItemText('');
              setWorkstation({
                itemModalView: null,
                items: [],
              });
            }}
          >
            Cancel
          </Button>,
          <Button
            disabled={!itemDetail._id || !isQtyValid}
            key="another"
            onClick={() => formRef.submit()}
          >
            Another
          </Button>,
        ]}
      >
        <>
          {_renderStocksToPick()}
          <ItemForm
            formRef={formRef}
            itemDetail={itemDetail}
            setItemDetail={setItemDetail}
            qtyValid={isQtyValid}
            setQtyValid={setQtyValid}
            onSubmit={_handleSubmitForm}
            inputTxt={itemText}
            setInputTxt={setItemText}
            orderDetail={orderDetail}
            picking
          />
        </>
      </Modal>
      <Row justify="space-between">
        <Col span={4}>
          <Button
            type="primary"
            onClick={() => {
              _callProcess();
              _handleProcessItem();
            }}
            disabled={processLoading || orderDetail?.status > 2 || !picking}
            loading={processLoading}
          >
            Start
          </Button>
          <Button
            disabled={_canFinish()}
            onClick={_handleFinish}
            type="primary"
          >
            Finish
          </Button>
        </Col>
        <Col span={4}>
          <Row justify="space-between">
            <Col>
              <h3>Workstation ID</h3>
            </Col>
            <Col>
              <Radio.Group
                options={[
                  {
                    label: '1',
                    value: '1',
                  },
                  {
                    label: '2',
                    value: '2',
                  },
                ]}
                value={workstationId}
                onChange={e => setWorkstationId(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  );
};

export default PickingActions;
