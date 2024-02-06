import { PlusOutlined } from '@ant-design/icons';
import { Button, Col, Form, Modal, Result, Row, message } from 'antd';
import React, { useEffect, useState } from 'react';
import ReactJson from 'react-json-view';
import {
  useClearWorkstation,
  usePickupZones,
  useWorkstation,
  useWorkstationId,
} from '../../Hooks/Workstation.hook';
import {
  finishRecalculation,
  getAgfTasks,
  getPickZones,
  updatePickupZone,
  updateStock,
} from '../../Services/API';
import ItemForm from '../Form/Item.form';

let pendingInterval;
const ItemActions = ({
  disableTableBtns,
  setDisableTableBtns,
  itemDetail,
  setItemDetail,
  setTableData,
  tableData,
}) => {
  const [itemCountModal, setItemCountModal] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false);
  const [finishLoading, setFinishLoading] = useState(false);
  const [disableBtnFinish, setDisableFinishBtn] = useState(true);
  const [loadingCancelBtn, setLoadingCancelBtn] = useState(false);
  const [recalculationFinish, setRecalculationFinish] = useState(false);
  const [itemText, setItemText] = useState('');
  const [formRef] = Form.useForm();
  const [workstationId] = useWorkstationId();
  const [pickZones, update] = usePickupZones();
  const [
    {
      items,
      orderDetail,
      pending,
      taskFinish,
      taskResult,
      pickup,
      recalculationStock,
    },
    setWorkstation,
  ] = useWorkstation();
  const clearWorkstation = useClearWorkstation();

  const _handleSubmitForm = values => {
    if (disableBtnFinish) {
      setDisableFinishBtn(false);
    }
    formRef.resetFields();
    setItemText();
    setTableData(prevData =>
      prevData.map(item => {
        if (item._id === itemDetail._ID) {
          return {
            ...item,
            real_count:
              (parseInt(item?.real_count) || 0) + parseInt(values.qty),
          };
        }
        return item;
      })
    );
  };

  const _handleUpdatePickupZones = async () => {
    let response = await getPickZones([]);
    if (response.ok) {
      let tempPickupZone = pickZones;
      for (let zone of response.data.data) {
        for (let index in tempPickupZone) {
          if (pickZones[index].label === zone.label) {
            tempPickupZone = tempPickupZone.updateIn(index, row =>
              row.merge({
                status: zone.status,
                id: zone._id,
              })
            );
          }
        }
      }
      update(tempPickupZone);
    }
  };

  const _handleReleasePickupZone = async () => {
    let response = await updatePickupZone(pickup.id, { status: 1 });
    if (response.ok) {
      _handleUpdatePickupZones();
    }
  };

  const refreshRecalculation = async () => {
    clearWorkstation();
    window.location.reload();
  };

  const _handleFinishRecalculation = async () => {
    setFinishLoading(true);
    if (tableData.length) {
      const recalculationFinished = await finishRecalculation({
        label: tableData[0].location,
        workstation_id: `WS${workstationId}`,
        stocks: tableData.map(item => ({
          _id: item._id,
          stock_no: item?.stock_no,
          pack_key: item?.pack_key,
          itm_name: item?.itm_name,
          batch_no: item?.batch_no,
          val_type: item?.val_type,
          qty: parseInt(item?.real_count) || 0,
        })),
      });
      if (recalculationFinished.ok) {
        if (!recalculationFinished.data.task_no) {
          await _handleReleasePickupZone();
        }
        if (recalculationStock) {
          setWorkstation({
            recalculationStock: { ...recalculationStock, status: 201 },
          });
          updateStock(recalculationStock._id, { status: 201 });
        }
        setRecalculationFinish(true);
        setWorkstation({
          pending: recalculationFinished.data,
          taskResult: {},
          taskFinish: false,
        });
      } else {
        message.error('Error ending recalculation');
      }
    } else {
      message.info("There aren't items");
    }
    setFinishLoading(false);
  };

  const _handleContinueTask = async () => {
    setContinueLoading(false);
    setWorkstation({ pending: null });
    setDisableTableBtns(true);
    if (recalculationFinish) {
      refreshRecalculation();
    }
  };

  const _handleCancelRecalculation = async () => {
    setLoadingCancelBtn(true);
    await _handleReleasePickupZone();
    refreshRecalculation();
    setLoadingCancelBtn(false);
  };

  const _handleErrorTask = () => {
    setContinueLoading(false);
    setWorkstation({ pending: null });
  };
  const clearDataSended = () => {
    setWorkstation({
      pallet: null,
      items: [],
      pickup: null,
    });
  };
  useEffect(() => {
    if (pending !== null && !taskFinish) {
      pendingInterval = setInterval(async () => {
        let response = await getAgfTasks([
          { field: 'task_no', value: pending?.task_no },
        ]);
        if (response.ok) {
          if (response.data?.data.length > 0) {
            if (response.data?.data[0]) {
              const [oTask] = response.data.data;

              if (oTask.status === 3) {
                const { check_result } = oTask;
                if (oTask.check) {
                  if (check_result.height === 1 && check_result.width === 1) {
                    clearDataSended();
                  } else {
                    message.error('Check Failed!');
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

  return (
    <>
      <Row justify="end" gutter={[10]}>
        <Col>
          <Button
            type="primary"
            onClick={() => setItemCountModal(true)}
            icon={<PlusOutlined />}
            disabled={!disableTableBtns}
          >
            Scan Item
          </Button>
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={_handleFinishRecalculation}
            loading={finishLoading}
            disabled={disableBtnFinish}
          >
            Finish
          </Button>
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={_handleCancelRecalculation}
            loading={loadingCancelBtn}
          >
            Cancel
          </Button>
        </Col>
      </Row>
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
        title="Item Count"
        visible={itemCountModal}
        onCancel={() => setItemCountModal(false)}
        centered
        cancelButtonProps={{
          onClick: () => {
            formRef.submit();
            setItemCountModal(false);
          },
        }}
        destroyOnClose
        okText="Another"
        cancelText="Finish"
        onOk={() => formRef.submit()}
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
          picking
          isRecalculation
        />
      </Modal>
    </>
  );
};

export default ItemActions;
