import React, { useState } from 'react';
import immutable from 'seamless-immutable';
import {
  Table,
  Card,
  Row,
  Col,
  Button,
  Modal,
  message,
  Radio,
  Descriptions,
} from 'antd';
import { UnorderedListOutlined } from '@ant-design/icons';

import AgfQueueSearch from './AgfQueueSearch';
import TaskStatus from '../../Share/TaskStatus';
//Hooks
import { useFetchAgfTasks } from '../../Hooks/AgfTasks.hook';

//Services
import {
  cancelAgfTask,
  checkAgfTask,
  finishAgfTask,
  forceAgfTask,
  removeAgfTask,
  startAgfTask,
} from '../../Services/API';
const currentQueries = immutable([
  {
    field: 'order_id',
    operator: '$regex',
    value: '',
  },
  {
    field: 'task_no',
    operator: '$regex',
    value: '',
  },
  {
    field: 'status[$in][]',
    value: 1,
  },
  {
    field: 'status[$in][]',
    value: 2,
  },
  {
    field: 'status[$in][]',
    value: 3,
  },
]);
const allQueries = immutable([
  {
    field: 'order_id',
    value: '',
    operator: '$regex',
  },
  {
    field: 'task_no',
    value: '',
    operator: '$regex',
  },
  {
    field: 'status[$in][]',
    value: 4,
  },
  {
    field: 'status[$in][]',
    value: 5,
  },
]);
const filteredQueries = immutable([
  {
    field: 'order_id',
    value: '',
    operator: '$regex',
  },
  {
    field: 'task_no',
    value: '',
    operator: '$regex',
  },
  {
    field: 'status[$in][]',
    value: 1,
  },
]);
const AgfQueueTable = () => {
  const [view, setView] = useState('current');
  const [fQueries, setFilteredQueries] = useState(filteredQueries);
  const [queries, setQueries] = useState(currentQueries);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalAction, setModalAction] = useState(false);
  const [taskDetail, setTaskDetail] = useState(null);
  const [tasks, loading, , change, updater] = useFetchAgfTasks(queries);
  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'order_id',
    },
    {
      title: 'Task No.',
      dataIndex: 'task_no',
    },
    {
      title: 'Location Source',
      dataIndex: 'location_source',
    },
    {
      title: 'Location Destination',
      dataIndex: 'location_destination',
    },
    {
      title: 'Pallet Type',
      dataIndex: 'pallet_type',
    },
    {
      title: 'Direction',
      dataIndex: 'direction',
    },
    {
      title: 'Task Type',
      dataIndex: 'task_type',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render(txt) {
        let status = TaskStatus.filter(row => row.id === txt);
        return status[0].title;
      },
    },
    {
      title: '',
      dataIndex: '_id',
      render(_, row) {
        return (
          [1, 2, 3].indexOf(row.status) > -1 && (
            <Button
              icon={<UnorderedListOutlined />}
              onClick={() => {
                setTaskDetail(row);
                setModalAction(true);
              }}
            >
              Actions
            </Button>
          )
        );
      },
    },
    {
      render(_, record) {
        return (
          <Button
            type="primary"
            onClick={() => {
              Modal.confirm({
                title: 'Are you sure to remove this task?',
                onOk: () => _handleRemoveTask(record),
                centered: true,
              });
            }}
          >
            Remove
          </Button>
        );
      },
    },
  ];
  const _handleRemoveTask = async task => {
    setActionLoading(true);
    let response = await removeAgfTask({
      _id: task._id,
      createdAt: task.created_at,
    });
    if (response.data.errno !== 1) {
      message.success('Task removed');
      updater();
    } else {
      message.error(response.data.message || 'Error removing task');
    }
    setActionLoading(false);
  };
  const _handleCancel = async () => {
    setActionLoading(true);
    if (taskDetail !== null) {
      let response = await cancelAgfTask(taskDetail.task_no);
      if (response.ok) {
        setTaskDetail(null);
        message.success('Task cancelled');
        setModalAction(false);
        updater();
      }
    }
    setActionLoading(false);
  };
  const _handleForceStart = async () => {
    setActionLoading(true);
    if (taskDetail !== null) {
      let response = await forceAgfTask(taskDetail.task_no);
      if (response.ok) {
        setTaskDetail(null);
        message.success('Task Started!');
        setModalAction(false);
        updater();
      } else {
        setTaskDetail(null);
        setModalAction(false);
      }
    }
    setActionLoading(false);
  };
  const _handleForceFinish = async () => {
    setActionLoading(true);
    if (taskDetail !== null) {
      const { check, status, task_no } = taskDetail;

      if (status === 1) {
        const oStartResponse = await startAgfTask(task_no);
        if (oStartResponse.data?.errno === 0) {
          if (check) {
            const oCheckResponse = await checkAgfTask(task_no);
            const { data } = oCheckResponse;
            if (data?.errno === 0) {
              const oFinishResponse = await finishAgfTask(task_no);
              if (oFinishResponse?.data?.errno !== 0) {
                message.error(oFinishResponse?.data?.message);
              }
            } else {
              message.error(data?.message);
            }
          }
        } else {
          message.error(oStartResponse.data?.message);
        }
      } else if (status === 2) {
        if (check) {
          const oCheckResponse = await checkAgfTask(task_no);
          const { data } = oCheckResponse;
          if (data?.errno === 0) {
            const oFinishResponse = await finishAgfTask(task_no);

            if (oFinishResponse?.data?.errno !== 0) {
              message.error(oFinishResponse?.data?.message);
            }
          } else {
            message.error(data?.message);
          }
        } else {
          const oFinishResponse = await finishAgfTask(task_no);
          const { data } = oFinishResponse;
          if (data?.errno !== 0) {
            message.error(data?.message);
          }
        }
      } else if (status === 3) {
        const oFinishResponse = await finishAgfTask(task_no);

        if (oFinishResponse?.data?.errno !== 0) {
          message.error(oFinishResponse?.data?.message);
        }
      }
      message.success('Task Finished!');
      setModalAction(false);
      updater();
    }
    setActionLoading(false);
  };
  const _handleChangeView = value => {
    if (value === 'current') {
      setQueries(currentQueries);
      change(currentQueries, tasks.params.skip);
    } else {
      setQueries(allQueries);
      change(allQueries, tasks.params.skip);
    }

    setView(value);
  };
  const _handleClearFilters = () => {
    if (view === 'current') {
      setQueries(currentQueries);
      change(currentQueries, tasks.params.skip);
    } else {
      setQueries(allQueries);
      change(allQueries, tasks.params.skip);
    }
    setFilteredQueries(filteredQueries);
  };
  const _renderStatus = s => {
    if (!s) {
      return;
    }
    let status = TaskStatus.filter(row => row.id === s);
    return status[0]?.title;
  };
  return (
    <Card>
      <Modal
        visible={modalAction}
        title={<h3 style={{ textAlign: 'center' }}>Actions</h3>}
        onCancel={() => {
          setModalAction(false);
        }}
        centered
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => {
              setModalAction(false);
              setTaskDetail(null);
            }}
          >
            Close
          </Button>,
        ]}
      >
        <Descriptions style={{ marginBottom: 10 }}>
          <Descriptions.Item label="Order ID">
            {taskDetail?.order_id}
          </Descriptions.Item>
          <Descriptions.Item label="Task No">
            {taskDetail?.task_no}
          </Descriptions.Item>
          <Descriptions.Item label="Location Source">
            {taskDetail?.location_source}
          </Descriptions.Item>
          <Descriptions.Item label="Location Destination">
            {taskDetail?.location_destination}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {_renderStatus(taskDetail?.status)}
          </Descriptions.Item>
        </Descriptions>
        <Row gutter={[20, 20]}>
          <Col span={8} style={{ textAlign: 'center' }}>
            <Button onClick={_handleForceStart} loading={actionLoading}>
              Force Start
            </Button>
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <Button onClick={_handleForceFinish} loading={actionLoading}>
              Force Finish
            </Button>
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <Button onClick={_handleCancel} loading={actionLoading}>
              Cancel Task Queue
            </Button>
          </Col>
        </Row>
      </Modal>
      <Row justify="space-between" style={{ marginBottom: 10 }}>
        <Col>
          <h3 style={{ textAlign: 'left' }}>AGF Queue Tasks</h3>
        </Col>
        <Col>
          <Radio.Group
            options={[
              {
                value: 'current',
                label: 'Current',
              },
              {
                value: 'all',
                label: 'Finished',
              },
            ]}
            value={view}
            onChange={e => {
              _handleChangeView(e.target.value);
            }}
            defaultValue="current"
            optionType="button"
            buttonStyle="solid"
          />
        </Col>
      </Row>
      <Row justify="end" style={{ marginBottom: 10 }}>
        <Col>
          <AgfQueueSearch
            queries={fQueries}
            updater={() => change(fQueries, 0)}
            queryHandler={setFilteredQueries}
            queryCleaner={_handleClearFilters}
          />
        </Col>
      </Row>
      <div className="fluid-container">
        <Table
          loading={loading}
          columns={columns}
          dataSource={tasks.data}
          rowKey={row => row._id}
          pagination={{
            total: tasks.total,
            current: tasks.params.skip / 10 + 1,
            onChange: e => change(tasks.params.queries, (e - 1) * 10),
            pageSizeOptions: [10],
          }}
        />
      </div>
    </Card>
  );
};
export default AgfQueueTable;
