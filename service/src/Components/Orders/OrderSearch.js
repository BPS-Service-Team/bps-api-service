import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Col, Input, Row, Select } from 'antd';

import DatePickerDay from '../Antd/DatePickerDay';
import readQrParse from '../../Utils/read_qr_parse';
const { RangePicker } = DatePickerDay;

export const OrderSearch = ({ queries = [], queryHandler, updater }) => {
  const [searchInputValue, setSearchInputValue] = useState(queries[0].value);
  return (
    <Row gutter={[10, 10]}>
      <Col>
        <b>Type: </b>
        <Select
          style={{ minWidth: 100 }}
          placeholder="Filter"
          value={queries[3].value !== '' ? queries[3].value : 'All'}
          onChange={e => {
            let aTemp = [...queries];
            if (e === 'all') {
              aTemp[3].value = '';
            } else {
              aTemp[3].value = e;
            }
            queryHandler(aTemp);
          }}
        >
          <Select.Option value="all">All</Select.Option>
          <Select.Option value="putaway">Putaway</Select.Option>
          <Select.Option value="picking">Picking</Select.Option>
          <Select.Option value="return">Return</Select.Option>
          <Select.Option value="relocation">Relocation</Select.Option>
        </Select>
      </Col>
      <Col>
        <Input
          placeholder="Search by Order"
          value={searchInputValue}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              updater();
            }
          }}
          onChange={e => {
            let filterInput = e.target.value;
            let aTemp = [...queries];
            const filterValue = readQrParse(filterInput);
            setSearchInputValue(filterValue);
            aTemp[0].value = filterValue;
            queryHandler(aTemp);
          }}
          autoFocus
        />
      </Col>
      <Col>
        <b> Status: </b>
        <Select
          style={{ minWidth: 100 }}
          placeholder="Filter"
          value={queries[4].value !== '' ? queries[4].value : 'All'}
          onChange={e => {
            let aTemp = [...queries];
            if (e === 'all') {
              aTemp[4].value = '';
            } else {
              aTemp[4].value = e;
            }
            queryHandler(aTemp);
          }}
        >
          <Select.Option value="">All</Select.Option>
          <Select.Option value="1">Open</Select.Option>
          <Select.Option value="2">In process</Select.Option>
          <Select.Option value="3">Finish</Select.Option>
          <Select.Option value="4">Error</Select.Option>
          <Select.Option value="5">Cancelled</Select.Option>
        </Select>
      </Col>
      <Col>
        <RangePicker
          onChange={values => {
            const aTemp = [...queries];
            if (values === null) {
              aTemp[1].value = undefined;
              aTemp[2].value = undefined;
            } else {
              aTemp[1].value = values[0].startOf('day');
              aTemp[2].value = values[1].endOf('day');
            }
            queryHandler(aTemp);
          }}
          value={[queries[1].value, queries[2].value]}
        />
      </Col>
      <Col>
        <Button type="primary" onClick={updater}>
          Filter
        </Button>
      </Col>
    </Row>
  );
};

OrderSearch.propTypes = {
  queries: PropTypes.array,
  queryHandler: PropTypes.func,
  updater: PropTypes.func,
};
