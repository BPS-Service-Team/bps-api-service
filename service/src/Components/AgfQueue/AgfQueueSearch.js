import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Input, Button, Select } from 'antd';
import TaskStatus from '../../Share/TaskStatus';
const AgfQueueSearch = ({
  queries = [],
  queryHandler,
  updater,
  queryCleaner,
}) => {
  return (
    <Row gutter={[10, 10]}>
      <Col>
        <Input
          placeholder="Search by Order ID"
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
          placeholder="Search by Task Number"
          value={queries[1].value}
          onChange={e =>
            queryHandler(
              queries.updateIn([1], row => row.merge({ value: e.target.value }))
            )
          }
        />
      </Col>
      <Col>
        <Select
          style={{ minWidth: 100 }}
          placeholder="Select Status"
          onChange={e => {
            if (e === '') {
              const nIndex = queries.findIndex(
                oItem => oItem.field === 'status[$in][]'
              );
              if (nIndex > -1) {
                queryHandler(
                  queries.filter(oE => oE.field !== 'status[$in][]')
                );
              }
            } else {
              const nIndex = queries.findIndex(
                oItem => oItem.field === 'status[$in][]'
              );
              if (nIndex > -1) {
                queryHandler(
                  queries.updateIn([nIndex], row => row.merge({ value: e }))
                );
              } else {
                queries = queries.concat([
                  {
                    field: 'status[$in][]',
                    value: e,
                  },
                ]);
                queryHandler(queries);
              }
            }
          }}
        >
          <Select.Option value={''}>Any</Select.Option>
          {TaskStatus.map(order => (
            <Select.Option value={order.id} key={order.slug}>
              {order.title}
            </Select.Option>
          ))}
        </Select>
      </Col>
      <Col>
        <Button onClick={queryCleaner}>Clean</Button>
      </Col>
      <Col>
        <Button type="primary" onClick={updater}>
          Filter
        </Button>
      </Col>
    </Row>
  );
};
AgfQueueSearch.propTypes = {
  queries: PropTypes.array,
  queryHandler: PropTypes.func,
  updater: PropTypes.func,
};
export default AgfQueueSearch;
