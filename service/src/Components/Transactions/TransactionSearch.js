import React from 'react';
import PropTypes from 'prop-types';
import { Button, Col, Input, Row, Select } from 'antd';
import DatePickerDay from '../Antd/DatePickerDay';
const { RangePicker } = DatePickerDay;

export const TransactionSearch = ({ queries = [], queryHandler, updater }) => {
  return (
    <Row gutter={[10, 10]}>
      <Col>
        <Select
          style={{ minWidth: 100, marginBottom: 15 }}
          placeholder="Filter"
          value={queries[1].value !== '' ? queries[1].value : 'All'}
          onChange={e => {
            let aTemp = [...queries];
            if (e === 'all') {
              aTemp[1].value = '';
            } else {
              aTemp[1].value = e;
            }
            queryHandler(aTemp);
          }}
        >
          <Select.Option value="all">All</Select.Option>
          <Select.Option value="putaway">Putaway</Select.Option>
          <Select.Option value="picking">Picking</Select.Option>
          <Select.Option value="return">Return</Select.Option>
          <Select.Option value="relocation">Relocation</Select.Option>
          <Select.Option value="adjustment">Adjustment</Select.Option>
        </Select>
      </Col>
      <Col>
        <Input
          placeholder="Search by Order ID"
          value={queries[0].value}
          onChange={e => {
            let aTemp = [...queries];
            aTemp[0].value = e.target.value;
            queryHandler(aTemp);
          }}
        />
      </Col>
      <Col>
        <Input
          placeholder="Search by Stock No"
          value={queries[4].value}
          onChange={e => {
            let aTemp = [...queries];
            aTemp[4].value = e.target.value;
            queryHandler(aTemp);
          }}
        />
      </Col>
      <Col>
        <RangePicker
          onChange={values => {
            console.log(values);
            const aTemp = [...queries];
            if (values === null) {
              aTemp[2].value = undefined;
              aTemp[3].value = undefined;
            } else {
              aTemp[2].value = values[0].startOf('day');
              aTemp[3].value = values[1].endOf('day');
            }
            queryHandler(aTemp);
          }}
          value={[queries[2].value, queries[3].value]}
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

TransactionSearch.propTypes = {
  queries: PropTypes.array,
  queryHandler: PropTypes.func,
  updater: PropTypes.func,
};
