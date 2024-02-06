import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Button, Card, Col, Row, Table } from 'antd';

import { useCallLogs } from '../../Hooks/CallLogs.hook';
import { CallLogsSearch } from './CallLogsSearch';
import { CallLogAction } from './CallLogAction';

const CallLogsTable = () => {
  const [queries, setQueries] = useState([
    {
      field: 'order_id',
      operator: '$regex',
      value: '',
    },
    {
      field: 'created_at',
      operator: '$gte',
      type: 'date',
      value: undefined,
    },
    {
      field: 'created_at',
      operator: '$lte',
      type: 'date',
      value: undefined,
    },
  ]);
  const [logs, loading, , change] = useCallLogs(queries);
  const [selectedLog, setSelectedLog] = useState({});
  const [logModal, setLogModal] = useState(false);
  const columns = [
    {
      title: 'Order',
      dataIndex: 'order_id',
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      render: e => dayjs(e).format('DD-MM-YYYY HH:mm:ss'),
    },
    {
      title: 'From',
      dataIndex: 'from',
      render: e => `${e.text} (${e.domain})`,
    },
    {
      title: 'To',
      dataIndex: 'to',
      render: to => `${to.text} (${to.domain})`,
    },
    {
      title: 'Command',
      dataIndex: 'command',
    },
    {
      title: '',
      dataIndex: '_id',
      render(data, row) {
        return (
          <Row>
            <Col>
              <Button
                onClick={() => {
                  setSelectedLog(row);
                  setLogModal(true);
                }}
              >
                Detail
              </Button>
            </Col>
          </Row>
        );
      },
    },
  ];
  return (
    <Card>
      <Row justify="space-between" style={{ marginBottom: 20 }}>
        <Col>
          <h3 style={{ textAlign: 'left' }}>Third Party Calls Log</h3>
        </Col>
        <Col>
          <CallLogsSearch
            queries={queries}
            queryHandler={setQueries}
            updater={() => change(queries, 0)}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <CallLogAction
            logModal={{
              handler: setLogModal,
              visible: logModal,
            }}
            logFn={{
              selected: selectedLog,
              handlerSelected: setSelectedLog,
            }}
          />
        </Col>
      </Row>
      <div className="fuild-container">
        <Table
          loading={loading}
          columns={columns}
          dataSource={logs.data}
          rowKey={row => row._id}
          pagination={{
            total: logs.total,
            current: logs.params.skip / 10 + 1,
            onChange: e => change(logs.params.queries, (e - 1) * 10),
            pageSizeOptions: [10],
          }}
        />
      </div>
    </Card>
  );
};

export default CallLogsTable;
