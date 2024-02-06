import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Input, Button, Select } from 'antd';
const StockSearch = ({
  queries = [],
  queryHandler,
  updater,
  withoutBach = false,
}) => {
  return (
    <Row gutter={[10, 10]}>
      <Col>
        <Input
          placeholder="Pallet ID"
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
          placeholder="Location"
          value={queries[1].value}
          onChange={e =>
            queryHandler(
              queries.updateIn([1], row => row.merge({ value: e.target.value }))
            )
          }
        />
      </Col>
      {!withoutBach && (
        <>
          <Col>
            <Input
              placeholder="Batch No"
              value={queries[2].value}
              onChange={e =>
                queryHandler(
                  queries.updateIn([2], row =>
                    row.merge({ value: e.target.value })
                  )
                )
              }
            />
          </Col>
          <Col>
            <Input
              placeholder="Stock No"
              value={queries[3].value}
              onChange={e =>
                queryHandler(
                  queries.updateIn([3], row =>
                    row.merge({ value: e.target.value })
                  )
                )
              }
            />
          </Col>
        </>
      )}

      <Col>
        <b> Status: </b>
        <Select
          style={{ minWidth: 100 }}
          placeholder="Status"
          value={queries[4].value !== '' ? queries[4].value : 'All'}
          onChange={e =>
            queryHandler(queries.updateIn([4], row => row.merge({ value: e })))
          }
        >
          <Select.Option value=""> All</Select.Option>
          <Select.Option value={202}> 202 In transit</Select.Option>
          <Select.Option value={201}> 201 Ready</Select.Option>
          <Select.Option value={200}> 200 Empty</Select.Option>
          <Select.Option value={100}> On use Stock</Select.Option>
        </Select>
      </Col>
      <Col>
        <Button type="primary" onClick={updater}>
          Filter
        </Button>
      </Col>
    </Row>
  );
};
StockSearch.propTypes = {
  queries: PropTypes.array,
  queryHandler: PropTypes.func,
  updater: PropTypes.func,
};
export default StockSearch;
