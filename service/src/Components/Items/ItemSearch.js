import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Input, Button } from 'antd';
const ItemSearch = ({ queries = [], queryHandler, updater }) => {
  return (
    <Row gutter={[10, 10]}>
      <Col>
        <Input
          placeholder="Search by Item name"
          value={queries[0].value}
          onChange={e =>
            queryHandler(
              queries.updateIn([0], row => row.merge({ value: e.target.value }))
            )
          }
        />
      </Col>
      <Col>
        <Input
          placeholder="Search by Stock Number"
          value={queries[1].value}
          onChange={e =>
            queryHandler(
              queries.updateIn([1], row => row.merge({ value: e.target.value }))
            )
          }
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
ItemSearch.propTypes = {
  queries: PropTypes.array,
  queryHandler: PropTypes.func,
  updater: PropTypes.func,
};
export default ItemSearch;
