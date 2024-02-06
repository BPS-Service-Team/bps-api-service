import React from 'react';
import PropTypes from 'prop-types';
import { Button, Col, Input, Row } from 'antd';

import DatePickerDay from '../Antd/DatePickerDay';
const { RangePicker } = DatePickerDay;

export const CallLogsSearch = ({ queries = [], queryHandler, updater }) => {
  return (
    <Row gutter={[10, 10]}>
      <Col>
        <Input
          placeholder="Search by Order"
          value={queries[0].value}
          onChange={e => {
            let aTemp = [...queries];
            aTemp[0].value = e.target.value;
            queryHandler(aTemp);
          }}
        />
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

CallLogsSearch.propTypes = {
  queries: PropTypes.array,
  queryHandler: PropTypes.func,
  updater: PropTypes.func,
};
