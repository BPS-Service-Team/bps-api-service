import React, { useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Row, Skeleton } from 'antd';
import { getCollections } from '../../Services/API';

const CollectionExport = () => {
  const [laoding] = useState(false);
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();

  if (laoding) {
    return (
      <div className="pick-zone loading">
        <Skeleton active />
      </div>
    );
  }

  function downloadBlob(blob, name = 'download') {
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      return window.navigator.msSaveOrOpenBlob(blob);
    }

    // For other browsers:
    // Create a link pointing to the ObjectURL containing the blob.
    const data = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = data;
    link.download = name;

    link.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );

    setTimeout(() => {
      // For Firefox it is necessary to delay revoking the ObjectURL
      window.URL.revokeObjectURL(data);
      link.remove();
    }, 100);
  }

  const _handleGetCollection = async (sCollection, sExtras = '') => {
    await getCollections(sCollection, sExtras)
      .then(response => response.blob())
      .then(response => {
        downloadBlob(response, `${sCollection}.json`);
      });
  };

  return (
    <>
      <Modal
        centered
        destroyOnClose
        footer={null}
        onCancel={() => setVisible(false)}
        title="Order Id"
        visible={visible}
      >
        <Form
          form={form}
          layout="vertical"
          name="logs-form"
          onFinish={async values => {
            let aOut = [];
            for (const sKey in values) {
              aOut.push(`${sKey}=${values[sKey]}`);
            }

            await _handleGetCollection('wmsLogs', aOut.join('&'));
            form.resetFields();
            setVisible(false);
          }}
        >
          <Form.Item
            label="Enter the order id to filter the logs"
            name="order_id"
            rules={[{ required: true, message: 'Order Id is required' }]}
          >
            <Input type="text" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Download
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Card style={{ height: '100%' }} className="fadeIn">
        <h2>Collections available to export</h2>
        <div className="pick-zones">
          <Row gutter={[30, 30]} justify="space-between">
            <Col className="pick-zone-result large info">
              <h3>Items</h3>
              <Button onClick={() => _handleGetCollection('items')}>
                Download
              </Button>
            </Col>
            <Col className="pick-zone-result large info">
              <h3>Stocks</h3>
              <Button onClick={() => _handleGetCollection('stocks')}>
                Download
              </Button>
            </Col>
            <Col className="pick-zone-result large info">
              <h3>Orders</h3>
              <Button onClick={() => _handleGetCollection('orders')}>
                Download
              </Button>
            </Col>
            <Col className="pick-zone-result large info">
              <h3>WMS Logs</h3>
              <Button onClick={() => setVisible(true)}>Download</Button>
            </Col>
          </Row>
        </div>
      </Card>
    </>
  );
};

export default CollectionExport;
