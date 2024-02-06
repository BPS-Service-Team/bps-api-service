import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Alert, Descriptions, Skeleton, message } from 'antd';
import PropTypes from 'prop-types';
import { getItems } from '../../Services/API';
import { useWorkstation } from '../../Hooks/Workstation.hook';
import { upperizeKeysObj } from '../../Utils/obj_keys_uppercase';

const ItemForm = ({
  onSubmit,
  formRef,
  itemDetail,
  setItemDetail,
  setQtyValid,
  inputTxt,
  setInputTxt,
  orderDetail,
  picking = false,
  isRecalculation = false,
}) => {
  const [loading, setLoading] = useState(false);
  const qtyInput = useRef();
  const itmInput = useRef();
  const [{ items, pallet, picking: oPicking }] = useWorkstation();

  useEffect(() => {
    if (!inputTxt) {
      itmInput.current.focus();
    }
    return () => {
      setItemDetail({});
      formRef.resetFields();
    };
  }, [inputTxt]);
  const _isValid = (txt = '') => {
    try {
      JSON.parse(txt);
      return true;
    } catch (error) {
      return false;
    }
  };
  const _keyListener = e => {
    if (e.key === 'Enter') {
      if (_isValid(inputTxt)) {
        _handleGetItem();
      } else {
        setItemDetail({});
      }
    }
  };
  const _keyListenerQty = e => {
    if (e.key === 'Enter') {
      if (_isValid(inputTxt)) {
        formRef.submit();
      }
    }
  };
  const _processNewObj = () => {
    const inputObj = JSON.parse(inputTxt);
    const {
      ID: stock_no,
      PACKKEY: pack_key,
      VTYPE: val_type,
      SN: serial_no,
      BATCH: batch_no,
    } = inputObj['MAT'];

    const newObj = {
      stock_no,
      pack_key,
      val_type,
      serial_no,
      batch_no,
    };
    return newObj;
  };
  const _sortAndConvertToArray = (obj, aKeys) => {
    let arrSorted = aKeys.map(key => obj[key]);
    arrSorted.map((_, index) => {
      if (arrSorted[index] === null) {
        arrSorted[index] = 'null';
      } else if (!arrSorted[index]) {
        arrSorted[index] = '';
      }
    });
    return arrSorted;
  };
  const _handleGetItem = async () => {
    setLoading(true);
    const aKeys = ['stock_no', 'pack_key', 'val_type', 'serial_no', 'batch_no'];
    const newObj = _processNewObj();
    let item = _sortAndConvertToArray(newObj, aKeys);
    item[3] = '';
    let aQueries = [];
    let blnIsValid = true;

    if (picking) {
      aKeys.map((sKey, nIndex) => {
        const oValue = item[nIndex];
        if (oValue && oValue !== 'null') {
          aQueries.push({
            field: sKey,
            value: oValue,
          });
        }
      });
      if (item[0] === '') {
        blnIsValid = false;
      } else {
        const sBatchNo = item[4] === '' ? null : item[4];
        const sValType = item[2] === '' ? null : item[2];
        let oCurrentStock;
        if (isRecalculation) {
          oCurrentStock = oPicking.find(
            oItem =>
              oItem.stock_no === item[0] &&
              oItem.batch_no === sBatchNo &&
              oItem.val_type === sValType
          );
          if (oCurrentStock) {
            oCurrentStock = upperizeKeysObj(oCurrentStock);
          }
        } else {
          const oCurrentPicking = oPicking.find(
            oItem => oItem.pallet_id === pallet.id
          );
          oCurrentStock = oCurrentPicking.stocks.find(
            oItem =>
              oItem.STOCK_NO === item[0] &&
              oItem.BATCH_NO === sBatchNo &&
              oItem.VAL_TYPE === sValType
          );
        }

        if (oCurrentStock) {
          if (oCurrentStock?.VAL_TYPE !== sValType) {
            blnIsValid = false;
          }
          if (oCurrentStock?.BATCH_NO !== sBatchNo) {
            blnIsValid = false;
          }
          if (blnIsValid) {
            let oRecordFounded = { ...oCurrentStock };
            if (!isRecalculation) {
              for (let record of orderDetail.agf) {
                if (
                  record.STOCK_NO === oCurrentStock.STOCK_NO &&
                  (record.BATCH_NO === null ||
                    record.BATCH_NO === oCurrentStock.BATCH_NO) &&
                  (record.VAL_TYPE === null ||
                    record.VAL_TYPE === oCurrentStock.VAL_TYPE)
                ) {
                  oRecordFounded.SUG_PA_QTY = record.SUG_PICK_QTY;
                }
              }
            }
            setItemDetail(oRecordFounded);
            qtyInput.current.focus();
          }
        }
      }
    } else {
      aQueries.push({
        field: 'stock_no',
        value: item[0],
      });
    }

    if (blnIsValid) {
      if (!picking) {
        let response = await getItems(aQueries);
        if (response.ok) {
          const { data } = response.data;

          if (!data.length) {
            message.error('Item not found');
          }
          if (response.data?.data?.length > 0) {
            let sBatchNo = item[4] === '' ? null : item[4],
              sValType = item[2] === '' ? null : item[2],
              sPackKey = item[1] === '' ? null : item[1];

            for (let oData of response.data.data) {
              const nRepeated = orderDetail.agf.filter(
                oElem => oElem.STOCK_NO === oData.stock_no
              ).length;
              let oFounded;
              if (nRepeated > 1) {
                oFounded = orderDetail.agf.find(
                  oElem =>
                    oElem.STOCK_NO === oData.stock_no &&
                    (sBatchNo
                      ? oElem.BATCH_NO === sBatchNo
                      : oElem.BATCH_NO === null || oElem.BATCH_NO === '') &&
                    (sValType
                      ? oElem.VAL_TYPE === sValType
                      : oElem.VAL_TYPE === null || oElem.VAL_TYPE === '') &&
                    (sPackKey
                      ? oElem.PACK_KEY === sPackKey
                      : oElem.PACK_KEY === null || oElem.PACK_KEY === '')
                );
              } else {
                oFounded = orderDetail.agf.find(
                  oElem =>
                    oElem.STOCK_NO === oData.stock_no &&
                    (oElem.BATCH_NO === '' || sBatchNo === oElem.BATCH_NO) &&
                    (oElem.PACK_KEY === '' || sPackKey === oElem.PACK_KEY) &&
                    (oElem.VAL_TYPE === '' || sValType === oElem.VAL_TYPE)
                );
              }
              if (oFounded) {
                setItemDetail(oFounded);
                qtyInput.current.focus();
              }
            }
          }
        }
      }
    } else {
      message.error('Invalid Item');
    }
    setLoading(false);
  };
  const _handleRenderResult = () => {
    if (!inputTxt || inputTxt === '') {
      return;
    }
    if (
      !_isValid(inputTxt) &&
      (!itemDetail || !Object.keys(itemDetail).length)
    ) {
      return (
        <div>
          <Alert message="Invalid Item" />
        </div>
      );
    }
    if (loading) {
      return <Skeleton active />;
    }
    return (
      <Descriptions title="Item Description" className="fadeIn" column={2}>
        <Descriptions.Item label="Name">
          {itemDetail.ITM_NAME}
        </Descriptions.Item>
        <Descriptions.Item label="Stock Number">
          {itemDetail.STOCK_NO}
        </Descriptions.Item>
        <Descriptions.Item label="Batch Number">
          {itemDetail.BATCH_NO}
        </Descriptions.Item>
        {!isRecalculation ? (
          <Descriptions.Item label="Order Quantity">
            {itemDetail?.SUG_PA_QTY}
          </Descriptions.Item>
        ) : itemDetail.REAL_COUNT ? (
          <Descriptions.Item label="Real Count">
            {itemDetail?.REAL_COUNT}
          </Descriptions.Item>
        ) : null}
        <Descriptions.Item label="Valuation Type">
          {itemDetail?.VAL_TYPE}
        </Descriptions.Item>
      </Descriptions>
    );
  };
  const handleChange = ({ target }) => {
    const { value } = target;
    if (typeof setQtyValid === 'function') {
      if (value && value !== '') {
        setQtyValid(true);
      } else {
        setQtyValid(false);
      }
    }
  };
  return (
    <Form
      name="Forgot"
      onFinish={onSubmit}
      layout="vertical"
      form={formRef}
      onResetCapture={() => {
        setInputTxt('');
      }}
    >
      <Form.Item label="Item">
        <Input
          ref={itmInput}
          placeholder="Please enter or scan item"
          autoFocus
          value={inputTxt}
          onKeyDown={_keyListener}
          onChange={e => {
            setInputTxt(e.target.value);
          }}
        />
      </Form.Item>
      {_handleRenderResult()}
      <Form.Item
        label="Quantity"
        name="qty"
        rules={[
          { required: true, message: 'Quantity is required!' },
          () => ({
            validator(rule, value = 0) {
              if (value < 0) {
                return Promise.reject('Quantity must be positive');
              }
              if (picking) {
                return Promise.resolve();
              } else {
                if (value === 0 || value === '0') {
                  return Promise.reject('Quantity must be greater than 0');
                }
                let oExist;
                let nRepeated = orderDetail.agf.filter(
                  oElem => oElem.STOCK_NO === itemDetail.STOCK_NO
                ).length;
                if (nRepeated > 1) {
                  oExist = orderDetail.agf.find(
                    oElem =>
                      oElem.STOCK_NO === itemDetail.STOCK_NO &&
                      oElem.BATCH_NO === itemDetail.BATCH_NO &&
                      oElem.VAL_TYPE === itemDetail.VAL_TYPE &&
                      oElem.PACK_KEY === itemDetail.PACK_KEY
                  );
                } else {
                  oExist = orderDetail.agf.find(
                    oElem =>
                      oElem.STOCK_NO === itemDetail.STOCK_NO &&
                      (oElem.BATCH_NO === null ||
                        oElem.BATCH_NO.toLowerCase() ===
                          itemDetail.BATCH_NO?.toLowerCase()) &&
                      (oElem.VAL_TYPE === null ||
                        oElem.VAL_TYPE.toLowerCase() ===
                          itemDetail.VAL_TYPE?.toLowerCase())
                  );
                }
                if (!oExist.PA_QTY) {
                  if (
                    parseInt(value) <=
                    (oExist.SUG_PA_QTY || itemDetail?.SUG_PA_QTY)
                  ) {
                    let oPickedItem = items.find(
                      oElem =>
                        oElem.STOCK_NO === itemDetail.STOCK_NO &&
                        oElem.BATCH_NO === itemDetail.BATCH_NO &&
                        (oElem.VAL_TYPE === itemDetail.VAL_TYPE ||
                          oElem.VAL_TYPE?.toLowerCase() ===
                            itemDetail.VAL_TYPE?.toLowerCase())
                    );
                    if (oPickedItem?.QTY) {
                      if (
                        oPickedItem.QTY + parseFloat(value) >
                        oExist.SUG_PA_QTY
                      ) {
                        return Promise.reject(
                          'Items exceeds suggested Quantity'
                        );
                      }
                    }
                    return Promise.resolve();
                  }
                } else {
                  const oItemSelected = items.find(
                    oElem =>
                      oElem.STOCK_NO === itemDetail.STOCK_NO &&
                      oElem.BATCH_NO === itemDetail.BATCH_NO &&
                      oElem.PACK_KEY === itemDetail.PACK_KEY &&
                      oElem.VAL_TYPE === itemDetail.VAL_TYPE
                  );
                  if (
                    parseInt(oExist?.PA_QTY) +
                      (oItemSelected?.QTY || 0) +
                      parseInt(value) >
                    oExist.SUG_PA_QTY
                  ) {
                    return Promise.reject('Item exceeds Suggested Quantity');
                  }
                  if (
                    parseInt(oExist?.PA_QTY) + parseInt(value) <=
                    (oExist.SUG_PA_QTY || itemDetail?.SUG_PA_QTY)
                  ) {
                    return Promise.resolve();
                  }
                }
              }
              return Promise.reject('Items exceeded limits of the pallet');
            },
          }),
        ]}
      >
        <Input
          disabled={!itemDetail || !Object.keys(itemDetail).length}
          onChange={handleChange}
          ref={qtyInput}
          onKeyDown={_keyListenerQty}
        />
      </Form.Item>
    </Form>
  );
};
ItemForm.propTypes = {
  onSubmit: PropTypes.func,
  formRef: PropTypes.any,
  itemDetail: PropTypes.any,
  setItemDetail: PropTypes.func,
  setQtyValid: PropTypes.func,
  orderDetail: PropTypes.object,
  picking: PropTypes.bool,
};
export default ItemForm;
