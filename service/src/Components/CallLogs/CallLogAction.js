import React, { useState } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import { Alert, Button, Modal, message, Tabs, Descriptions } from 'antd';
import ReactJson from 'react-json-view';
import XMLViewer from 'react-xml-viewer';
import { customResendCall } from '../../Services/API';

const { TabPane } = Tabs;

export const CallLogAction = ({
  logModal = {
    handler: () => ({}),
    visible: false,
  },
  logFn = {
    selected: {},
    handler: () => ({}),
    handlerSelected: () => ({}),
  },
}) => {
  const [loading, setLoading] = useState(false);

  const _resendAgv = async () => {
    setLoading(true);
    const oResponse = await customResendCall({
      command: 'agvs/create',
      order_id: logFn.selected.order_id,
      task_id: logFn.selected.task._id,
    });
    setLoading(false);
    logModal.handler(false);
    logFn.handlerSelected({});

    if (oResponse?.ok) {
      const { data } = oResponse;

      if (!data?.status) {
        message.error('Error resending AGV Create');
      } else {
        message.success('AGV Created successfully');
      }
    }
  };

  return (
    <Modal
      centered
      destroyOnClose
      onCancel={() => {
        logModal.handler(false);
        logFn.handlerSelected({});
      }}
      footer={[
        <Button
          key="close"
          onClick={() => {
            logModal.handler(false);
            logFn.handlerSelected({});
          }}
          type="primary"
        >
          Close
        </Button>,
      ]}
      title="Log Detail"
      visible={logModal.visible}
    >
      <Descriptions column={2}>
        <Descriptions.Item label="Order">
          {logFn.selected.order_id}
        </Descriptions.Item>
        <Descriptions.Item label="Date">
          {dayjs(logFn.selected.created_at).format('DD/MM/YYYY HH:mm')}
        </Descriptions.Item>
        <Descriptions.Item label="From">
          {logFn.selected?.from?.text}({logFn.selected?.from?.domain})
        </Descriptions.Item>
        <Descriptions.Item label="TO">
          {logFn.selected?.to?.text}({logFn.selected?.to?.domain})
        </Descriptions.Item>
        <Descriptions.Item label="COMMAND">
          {logFn.selected?.command}
        </Descriptions.Item>
      </Descriptions>
      {logFn?.selected?.task?.status === 4 && (
        <Button loading={loading} onClick={_resendAgv}>
          Retry AGV Create
        </Button>
      )}
      <Tabs className="content-log-history" gutter={[30, 30]}>
        <TabPane key="req" tab="Request">
          <div className="log-wrapper">
            {typeof logFn.selected.request === 'string' ? (
              logFn.selected.request.indexOf('xmlns') > -1 ? (
                <XMLViewer xml={logFn.selected.request} overflowBreak={true} />
              ) : (
                <h3>{logFn.selected.request}</h3>
              )
            ) : (
              <ReactJson src={logFn.selected.request} />
            )}
          </div>
        </TabPane>
        <TabPane key="res" tab="Reply">
          <div className="log-wrapper">
            {typeof logFn?.selected?.reply === 'string' ? (
              logFn.selected?.reply?.indexOf('xmlns') > -1 ? (
                <XMLViewer xml={logFn.selected.reply} overflowBreak={true} />
              ) : (
                <h3>{logFn.selected?.reply || 'Waiting for reply'}</h3>
              )
            ) : logFn.selected?.reply ? (
              <ReactJson src={logFn.selected.reply} />
            ) : (
              <Alert message="Waiting for reply" type="warning" showIcon />
            )}
          </div>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

CallLogAction.propTypes = {
  logModal: PropTypes.shape({
    handler: PropTypes.func,
    visible: PropTypes.bool,
  }),
};
