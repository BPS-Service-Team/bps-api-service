import React, { useEffect, useState } from 'react';
import { Row, Col, message, Modal, Button, Input, Form, Radio } from 'antd';
import ItemForm from '../Form/Item.form';
import { useNavigation } from '../../Hooks/Nav.hook';
import { useWorkstation, useWorkstationId } from '../../Hooks/Workstation.hook';
import {
  getAgfTasks,
  getPickZones,
  updatePickupZone,
  scanPallet,
  pickingReady,
  releasePicking,
  calculateProcessPicking,
} from '../../Services/API';
import PickingElementsTable from './PickingElementsTable';
import {
  findItemIndexInArrayEx,
  findItemIndexInArrayExactly,
} from '../../Utils/functions';
import ReactJson from 'react-json-view';
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
  // Flag to indicate that we are sending a release call
  const [sendingFinish, setSendingFinish] = useState(false);
  const [workstationId, setWorkstationId] = useWorkstationId();
  const [processedPallets, setProcessed] = useState([]);
  const [oWorkstation, setWorkstation] = useWorkstation();
  const {
    errorTask,
    pending,
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
    retry,
  } = oWorkstation;
  const [, nav] = useNavigation();

  const updatePickingArray = (aPicking, label, payload = {}) => {
    const nIndex = aPicking.findIndex(
      oItem => oItem.task && oItem.task.task_no === label
    );

    for (let iCounter = 0; iCounter < aPicking.length; iCounter++) {
      let blnProcessed = processedPallets.includes(
        aPicking[iCounter].pallet_id
      );
      if (blnProcessed) {
        aPicking[iCounter] = {
          ...aPicking[iCounter],
          ready: true,
        };
      }
    }
    if (nIndex > -1) {
      let blnProcessed = processedPallets.includes(aPicking[nIndex].pallet_id);
      aPicking[nIndex] = {
        ...aPicking[nIndex],
        task: null,
        ready: blnProcessed,
        ...payload,
      };
    }
  };

  useEffect(() => {
    if (picking && !mainLoading) {
      let canFinish = true;
      for (const oPicking of picking) {
        if (
          oPicking.ready ||
          oPicking.task === 'finish' ||
          processedPallets.includes(oPicking.pallet_id)
        ) {
          canFinish = canFinish && true;
        } else {
          canFinish = canFinish && false;
        }
      }
      if (canFinish) {
        _handleFinish();
        return;
      }
      if (!pendingInterval) {
        let workstationRedux = oWorkstation;
        // Check pallets already processed
        let aTempPicking = [...picking];
        for (const sPallet of processedPallets) {
          const nFindIndex = aTempPicking.findIndex(
            oE => oE.pallet_id === sPallet
          );
          if (nFindIndex > -1) {
            if (!aTempPicking[nFindIndex].ready) {
              workstationRedux = workstationRedux.merge({
                picking: aTempPicking,
              });
            }
          }
        }
        pendingInterval = setInterval(async () => {
          let taskResults = { ...taskResult },
            aPicking = [...picking],
            index = 0;

          for (let oPallet of workstationRedux.picking) {
            if (oPallet.workstation_id && oPallet.task && !oPallet.ready) {
              if (taskResults[oPallet.workstation_id]) {
                if (
                  oPallet.task?.task_no !==
                    taskResults[oPallet.workstation_id].task_no &&
                  taskResults[oPallet.workstation_id].status === 4
                ) {
                  taskResults[oPallet.workstation_id] = undefined;
                  taskResults = JSON.parse(JSON.stringify(taskResults));
                }
              }
              if (
                taskResults[oPallet.workstation_id]?.status !== 4 &&
                taskResults[oPallet.workstation_id]?.status !== 5
              ) {
                let response = await getAgfTasks([
                  { field: 'task_no', value: oPallet.task?.task_no },
                ]);
                if (response.ok) {
                  if (response.data?.data.length > 0) {
                    const oData = response.data?.data[0];
                    if (oData) {
                      taskResults[oPallet.workstation_id] = oData;
                    }
                  }
                }
              }
            }
          }
          for (let key of Object.keys(taskResults)) {
            if (taskResults[key]?.status === 3 && checkFailedModal === false) {
              const { check_result } = taskResults[key];
              if (check_result.height !== 1 || check_result.width !== 1) {
                message.error('Check Failed!');
                setCheckFailedModal(true);
              }

              if (taskResults[key]?.check) {
                index++;
              }
              if (taskResults[key].direction === 'in') {
                if (pickup && pickup[key]) {
                  await updatePickupZone(pickup[key], {
                    status: 1,
                  });
                }
                let aPickZones = [...pickZones];
                const nIndex = aPickZones.findIndex(
                  oItem => oItem.label === key
                );
                if (nIndex > -1) {
                  aPickZones[nIndex] = {
                    ...aPickZones[nIndex],
                    status: 1,
                  };
                  workstationRedux = workstationRedux.merge({
                    pickZones: aPickZones,
                  });
                }
                updatePickingArray(aPicking, taskResults[key].task_no, {
                  ready: true,
                  task: 'finish',
                });
                taskResults[key] = undefined;
                taskResults = JSON.parse(JSON.stringify(taskResults));
                workstationRedux = workstationRedux.merge({
                  taskResult: taskResults,
                  pending: null,
                  picking: aPicking,
                });
                let oNewWS = await _handleProcessItemWS(workstationRedux);
                if (oNewWS) {
                  workstationRedux = oNewWS;
                  if (
                    workstationRedux.taskResult &&
                    workstationRedux.taskResult[key]
                  ) {
                    taskResults[key] = workstationRedux.taskResult[key];
                  }
                  aPicking = [...workstationRedux.picking];
                }
              }
            } else if (
              taskResults[key]?.status === 4 ||
              taskResults[key]?.status === 5 ||
              taskResults[key]?.status === 6
            ) {
              index++;
              if (taskResults[key].direction === 'in') {
                if (pickup && pickup[key]) {
                  await updatePickupZone(pickup[key], {
                    status: 1,
                  });
                }
                let aPickZones = [...pickZones];
                const nIndex = aPickZones.findIndex(
                  oItem => oItem.label === key
                );
                if (nIndex > -1) {
                  aPickZones[nIndex] = {
                    ...aPickZones[nIndex],
                    status: 1,
                  };
                  workstationRedux = workstationRedux.merge({
                    pickZones: aPickZones,
                  });
                }
                updatePickingArray(aPicking, taskResults[key].task_no, {
                  ready: true,
                  task: 'finish',
                });
                taskResults[key] = undefined;
                taskResults = JSON.parse(JSON.stringify(taskResults));
                workstationRedux = workstationRedux.merge({
                  taskResult: taskResults,
                  pending: null,
                  picking: aPicking,
                });
                let oNewWS = await _handleProcessItemWS(workstationRedux);
                if (oNewWS) {
                  workstationRedux = oNewWS;
                  if (
                    workstationRedux.taskResult &&
                    workstationRedux.taskResult[key]
                  ) {
                    taskResults[key] = workstationRedux.taskResult[key];
                  }
                  aPicking = [...workstationRedux.picking];
                }
              } else {
                updatePickingArray(aPicking, taskResults[key].task_no);
              }
            }
          }

          if (index === Object.keys(taskResults).length) {
            clearInterval(pendingInterval);
            pendingInterval = null;
            workstationRedux = workstationRedux.merge({
              taskResult: taskResults,
              pending: null,
              picking: aPicking,
            });
          } else {
            workstationRedux = workstationRedux.merge({
              picking: aPicking,
              taskResult: taskResults,
            });
          }
          let oNewTempWS = { ...workstationRedux };
          delete oNewTempWS.items;
          setWorkstation(oNewTempWS);
        }, 5000);
      }
    } else {
      clearInterval(pendingInterval);
      pendingInterval = null;
    }
    return () => {
      clearInterval(pendingInterval);
      pendingInterval = null;
    };
  }, [pendingInterval, picking, mainLoading, processedPallets]);

  useEffect(() => {
    if (retry) {
      setWorkstation({
        retry: undefined,
      });
      _handleProcessItem();
    }
  }, [retry]);

  const _hasPalletsLeft = sPalletId => {
    const aOthers = [...picking].filter(oItem => oItem.pallet_id !== sPalletId);
    let canFinish = false;
    for (const oPicking of aOthers) {
      if (!oPicking.ready || oPicking.task !== 'finish') {
        canFinish = canFinish && true;
      }
      if (!processedPallets.includes(oPicking.pallet_id)) {
        canFinish = true;
      }
    }

    return canFinish;
  };

  const _handleSubmitForm = values => {
    setFormLoading(true);
    const oPickedItem = items.find(
        item =>
          item.STOCK_NO === itemDetail.STOCK_NO &&
          item.BATCH_NO === itemDetail.BATCH_NO &&
          item.VAL_TYPE === itemDetail.VAL_TYPE
      ),
      oCurrentPicking = picking.find(oPick => oPick.pallet_id === pallet.id),
      oCurrentStock = oCurrentPicking.stocks.find(
        oStock =>
          oStock.STOCK_NO === itemDetail.STOCK_NO &&
          oStock.BATCH_NO === itemDetail.BATCH_NO &&
          oStock.VAL_TYPE === itemDetail.VAL_TYPE
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
          const nIndex = findItemIndexInArrayExactly(
            aTempItems,
            itemDetail,
            orderDetail
          );
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
        const nIndex = findItemIndexInArrayEx(aTempItems, itemDetail);

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
      item =>
        item.STOCK_NO === itemDetail.STOCK_NO &&
        item.BATCH_NO === itemDetail.BATCH_NO &&
        item.VAL_TYPE === itemDetail.VAL_TYPE
    );
    // Calculate missing items
    const aLeft = items.filter(oElement => !oElement.QTY);
    const oCurrentItems = picking.find(oElem => oElem.pallet_id === pallet.id);
    const aStockLeft = [];
    oCurrentItems.stocks.map(oStock => {
      const oFinded = items.find(
        oElem =>
          oElem.STOCK_NO === oStock.STOCK_NO &&
          oElem.BATCH_NO === oStock.BATCH_NO &&
          oElem.VAL_TYPE === oStock.VAL_TYPE
      );
      if (!oFinded) {
        aStockLeft.push(oStock);
      }
    });
    if (
      (aLeft.length > 0 || aStockLeft.length) &&
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
          const aCurrentItems = aStockLeft.map(oStock => {
            let oTempStock = { ...oStock };

            delete oTempStock._id;
            delete oTempStock.ORDER_ID;
            delete oTempStock.TASK_NO;
            return {
              ...oTempStock,
              SHORT_COMING: false,
              QTY: 0,
            };
          });
          let blnMorePallets = _hasPalletsLeft(pallet.id);
          let response = await pickingReady({
            label: currentPickupZone,
            pallet_id: pallet.id,
            order_id: orderDetail?.order_id,
            items: [...items, ...aCurrentItems],
            more_pallets: blnMorePallets,
          });
          if (response.ok) {
            if (response.data.errno === 0) {
              let oTaskResult = { ...taskResult },
                aPicking = [...picking];
              const nPickingIndex = aPicking.findIndex(
                oItem => oItem.pallet_id === pallet.id
              );
              oTaskResult[currentPickupZone] = undefined;
              oTaskResult = JSON.parse(JSON.stringify(oTaskResult));
              if (response.data?.agf_task_no) {
                let oPending = { ...pending };
                oPending[currentPickupZone] = {
                  task_no: response.data.agf_task_no,
                };
                if (nPickingIndex > -1) {
                  aPicking[nPickingIndex] = {
                    ...aPicking[nPickingIndex],
                    task: { task_no: response.data.agf_task_no },
                  };
                }
                setWorkstation({
                  itemModalView: false,
                  items: [],
                  orderDetail: response.data?.order || orderDetail,
                  pending: oPending,
                  picking: aPicking,
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
                if (nPickingIndex > -1) {
                  aPicking[nPickingIndex] = {
                    ...aPicking[nPickingIndex],
                    ready: true,
                    task: 'finish',
                    workstation_id: null,
                  };
                }
                setWorkstation({
                  itemModalView: false,
                  items: [],
                  orderDetail: response.data?.order || orderDetail,
                  picking: aPicking,
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
            oStock.BATCH_NO === itemDetail.BATCH_NO &&
            oStock.VAL_TYPE === itemDetail.VAL_TYPE
        );
      if (
        parseFloat(values.qty) + (oPickedItem?.QTY || 0) >
        itemDetail?.SUG_PA_QTY
      ) {
        message.error('Item exceeds Sug Pick Quantity');
        setFormLoading(false);
        return;
      } else if (
        parseFloat(values.qty) + (oPickedItem?.QTY || 0) >
        oCurrentStock?.PICK_QTY
      ) {
        message.error('Item exceeds pallet quantity');
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
            const nItemIndex = findItemIndexInArrayExactly(
              aSendItems,
              itemDetail,
              orderDetail
            );
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
            const aCurrentItems = aStockLeft.map(oStock => {
              let oTempStock = { ...oStock };

              delete oTempStock._id;
              delete oTempStock.ORDER_ID;
              delete oTempStock.TASK_NO;
              return {
                ...oTempStock,
                SHORT_COMING: false,
                QTY: 0,
              };
            });
            let blnMorePallets = _hasPalletsLeft(pallet.id);
            let response = await pickingReady({
              label: currentPickupZone,
              pallet_id: pallet.id,
              order_id: orderDetail?.order_id,
              items: [...aSendItems, ...aCurrentItems],
              more_pallets: blnMorePallets,
            });
            if (response.ok) {
              clearInterval(pendingInterval);
              if (response.data.errno === 0) {
                let oTaskResult = { ...taskResult },
                  aPicking = [...picking];
                const nPickingIndex = aPicking.findIndex(
                  oItem => oItem.pallet_id === pallet.id
                );
                oTaskResult[currentPickupZone] = undefined;
                oTaskResult = JSON.parse(JSON.stringify(oTaskResult));
                if (response.data?.agf_task_no) {
                  let oPending = { ...pending };
                  oPending[currentPickupZone] = {
                    task_no: response.data.agf_task_no,
                  };
                  if (nPickingIndex > -1) {
                    aPicking[nPickingIndex] = {
                      ...aPicking[nPickingIndex],
                      task: { task_no: response.data.agf_task_no },
                    };
                  }
                  setWorkstation({
                    itemModalView: false,
                    items: [],
                    orderDetail: response.data?.order || orderDetail,
                    pending: oPending,
                    picking: aPicking,
                    taskFinish: false,
                    taskResult: oTaskResult,
                  });
                } else {
                  if (pickup && pickup[currentPickupZone]) {
                    await updatePickupZone(pickup[currentPickupZone], {
                      status: 1,
                    });
                  }
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
                  if (nPickingIndex > -1) {
                    aPicking[nPickingIndex] = {
                      ...aPicking[nPickingIndex],
                      ready: true,
                      task: 'finish',
                      workstation_id: null,
                    };
                  }
                  setWorkstation({
                    items: [],
                    orderDetail: response.data?.order || orderDetail,
                    picking: aPicking,
                    pickZones: aPickZones,
                    taskFinish: false,
                    taskResult: oTaskResult,
                  });
                  setProcessed(processedPallets.concat([pallet.id]));
                  _continueProcess();
                }
                formRef.resetFields();
                setItemText('');
                setFormLoading(false);
              }
            }
            setMainLoading(false);
          },
        });
      } else {
        formRef.resetFields();
        let aSendItems = [...items];
        if (itemDetail._id) {
          const nIndex = findItemIndexInArrayExactly(
            aSendItems,
            itemDetail,
            orderDetail
          );
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
        let blnMorePallets = _hasPalletsLeft(pallet.id);
        let response = await pickingReady({
          label: currentPickupZone,
          pallet_id: pallet.id,
          order_id: orderDetail?.order_id,
          items: aSendItems,
          more_pallets: blnMorePallets,
        });
        if (response.ok) {
          clearInterval(pendingInterval);
          if (response.data.errno === 0) {
            let oTaskResult = { ...taskResult },
              aPicking = [...picking];
            const nPickingIndex = aPicking.findIndex(
              oItem => oItem.pallet_id === pallet.id
            );
            oTaskResult[currentPickupZone] = undefined;
            oTaskResult = JSON.parse(JSON.stringify(oTaskResult));
            if (response.data?.agf_task_no) {
              let oPending = { ...pending };
              oPending[currentPickupZone] = {
                task_no: response.data.agf_task_no,
              };
              if (nPickingIndex > -1) {
                aPicking[nPickingIndex] = {
                  ...aPicking[nPickingIndex],
                  task: { task_no: response.data.agf_task_no },
                };
              }
              setWorkstation({
                itemModalView: false,
                items: [],
                orderDetail: response.data?.order || orderDetail,
                pending: oPending,
                picking: aPicking,
                taskFinish: false,
                taskResult: oTaskResult,
              });
            } else {
              if (pickup && pickup[currentPickupZone]) {
                await updatePickupZone(pickup[currentPickupZone], {
                  status: 1,
                });
              }
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
              if (nPickingIndex > -1) {
                aPicking[nPickingIndex] = {
                  ...aPicking[nPickingIndex],
                  ready: true,
                  task: 'finish',
                  workstation_id: null,
                };
              }
              setWorkstation({
                items: [],
                orderDetail: response.data?.order || orderDetail,
                picking: aPicking,
                pickZones: aPickZones,
                taskFinish: false,
                taskResult: oTaskResult,
              });
              setProcessed(processedPallets.concat([pallet.id]));
              _continueProcess();
            }
            setItemText('');
            setFormLoading(false);
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
      }
    }
  };
  const _handleSetPallet = async () => {
    setPalletLoading(true);
    setErrorMessage('');
    let sPalletInPZ;
    for (const sKey in currentStocks) {
      if (currentStocks[sKey].label === currentPickupZone) {
        sPalletInPZ = sKey;
      }
    }
    if (sPalletInPZ) {
      if (sPalletInPZ !== inputTxt) {
        setErrorMessage(
          `The pallet ${inputTxt} is not in the Pick Zone ${currentPickupZone}`
        );
        setPalletLoading(false);
        return;
      }
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
    let processRes = await calculateProcessPicking(
      'reserve',
      aPallets,
      orderDetail.order_id,
      picking
    );
    if (!processRes.ok) {
      message.error('Error reserving stocks');
    }
  };
  const _handleProcessItem = async () => {
    //Init auto call for pallet
    setProcessLoading(true);
    let pickupZonesRes = await getPickZones([
      {
        field: 'status',
        value: 1,
      },
    ]);
    if (pickupZonesRes.ok) {
      //Select pickup zones of the current workstation id
      let freePickup = false,
        pickups = [],
        aPicking = [...picking];
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
          oPickup = { ...pickup },
          aPickZones = pickZones,
          oCurrentStocks = { ...currentStocks },
          oTaskResults = { ...taskResult },
          i = 0,
          stockPosition = 0;
        //Select not used stock
        while (i < aPicking.length) {
          let selectedItem = aPicking[stockPosition];
          if (stockPosition >= aPicking.length) {
            //End
            break;
          }
          if (
            (typeof oCurrentStocks[selectedItem.pallet_id] === 'undefined' ||
              oCurrentStocks[selectedItem.pallet_id] === null) &&
            pickups[i]
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
              aPicking[stockPosition] = {
                ...aPicking[stockPosition],
                pickup: response.data._id,
                task: response.data.agf_task,
                task_no: response.data.agf_task?.task_no,
                workstation_id: response.data.label,
              };
              if (response.data?.agf_task) {
                oTaskResults[response.data.label] = response.data.agf_task;
              }
              oPickup[response.data.label] = response.data._id;
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
          picking: aPicking,
          pickup: oPickup,
          pickZones: aPickZones,
          palletModalView: false,
          currentStocks: {
            ...currentStocks,
            ...oCurrentStocks,
          },
          taskResult: oTaskResults,
        });
      } else {
        setProcessLoading(false);
      }
    }
  };

  const _handleProcessItemWS = async pWorkstation => {
    //Init auto call for pallet
    setProcessLoading(true);
    let pickupZonesRes = await getPickZones([
      {
        field: 'status',
        value: 1,
      },
    ]);
    if (pickupZonesRes.ok) {
      //Select pickup zones of the current workstation id
      let freePickup = false,
        pickups = [],
        aPicking = [...pWorkstation.picking];
      setMainLoading(true);
      for (let item of pickupZonesRes.data.data) {
        if (item.workstation_id === pWorkstation.workstationId) {
          freePickup = true;
          pickups.push(item);
        }
      }
      setMainLoading(false);
      //Return when order is completed
      if (
        Object.keys(pWorkstation.currentStocks).length ===
        pWorkstation.picking.length
      ) {
        return;
      }
      if (freePickup) {
        let oPending = {},
          oPickup = { ...pWorkstation.pickup },
          aPickZones = pWorkstation.pickZones,
          oCurrentStocks = { ...pWorkstation.currentStocks },
          oTaskResults = { ...pWorkstation.taskResult },
          i = 0,
          stockPosition = 0;
        //Select not used stock
        while (i < aPicking.length) {
          let selectedItem = aPicking[stockPosition];
          if (stockPosition >= aPicking.length) {
            //End
            break;
          }
          if (
            (typeof oCurrentStocks[selectedItem.pallet_id] === 'undefined' ||
              oCurrentStocks[selectedItem.pallet_id] === null) &&
            pickups[i]
          ) {
            let response = await updatePickupZone(pickups[i]._id, {
              status: 2,
              pallet_id: selectedItem.pallet_id,
              order_id: pWorkstation.orderDetail.order_id,
            });
            if (response.ok) {
              for (let j in aPickZones) {
                if (aPickZones[j].label === response.data.label) {
                  aPickZones = aPickZones.updateIn([j], row =>
                    row.merge({ status: 2, id: response.data._id })
                  );
                }
              }
              aPicking[stockPosition] = {
                ...aPicking[stockPosition],
                pickup: response.data._id,
                task: response.data.agf_task,
                task_no: response.data.agf_task?.task_no,
                workstation_id: response.data.label,
              };
              if (response.data?.agf_task) {
                oTaskResults[response.data.label] = response.data.agf_task;
              }
              oPickup[response.data.label] = response.data._id;
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
        return pWorkstation.merge({
          picking: aPicking,
          pickup: oPickup,
          pickZones: aPickZones,
          palletModalView: false,
          currentStocks: {
            ...currentStocks,
            ...oCurrentStocks,
          },
          taskResult: oTaskResults,
        });
      } else {
        setProcessLoading(false);
      }
    }

    return pWorkstation;
  };

  const _handleFinish = async () => {
    if (!sendingFinish) {
      setSendingFinish(true);
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
    }
  };
  const _renderStocksToPick = () => {
    if (picking && pallet) {
      const oPicking = picking.find(oItem => oItem.pallet_id === pallet.id);

      const aStocks = oPicking?.stocks.map(oStock => {
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
      for (let oPicking of picking) {
        if (!oPicking.ready) {
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
        visible={errorTask}
        title="Error Detail"
        zIndex={1}
        destroyOnClose
        onCancel={() => {
          setWorkstation({
            errorTask: undefined,
          });
        }}
      >
        <ReactJson src={errorTask} />
      </Modal>
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
        width={750}
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
