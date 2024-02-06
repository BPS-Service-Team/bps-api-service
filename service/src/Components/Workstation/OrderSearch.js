import React, { useState } from 'react';
import { Card, Input, Button, message } from 'antd';

import { useNavigation } from '../../Hooks/Nav.hook';
import readQrParse from '../../Utils/read_qr_parse';

const OrderSearch = () => {
  const [inputTxt, setInputTxt] = useState('');
  const [, nav] = useNavigation();
  const _onFind = code => {
    nav(`/dashboard/agf-workstation?step=order-details&order_id=${code}`);
  };
  const _isValid = (txt = '') => {
    return txt.indexOf('-1') > -1;
  };
  const _keyListener = e => {
    if (e.key === 'Enter') {
      if (_isValid(inputTxt)) {
        let sCode = inputTxt.split('-1');
        _onFind(sCode[0]);
      } else {
        message.error('Incorrect order format');
      }
    }
  };
  const _handleFind = () => {
    if (_isValid(inputTxt)) {
      let sCode = inputTxt.split('-1');
      _onFind(sCode[0]);
    } else {
      message.error('Incorrect order format');
    }
  };
  return (
    <Card className="order-search" bordered={false}>
      <h1>
        Putaway / Picking / Stock Return / Stock Relocation / Cycle count Order
        Number
      </h1>
      <div className="input-container">
        <Input
          autoFocus
          placeholder="Please scan or input"
          onChange={e => {
            let filterValue = readQrParse(e.target.value);
            if (filterValue !== e.target.value) {
              filterValue += '-1';
            }
            setInputTxt(filterValue);
          }}
          onKeyDown={_keyListener}
          value={inputTxt}
        />
        <Button type="primary" onClick={_handleFind} disabled={!inputTxt}>
          Determine
        </Button>
      </div>
    </Card>
  );
};

export default OrderSearch;
