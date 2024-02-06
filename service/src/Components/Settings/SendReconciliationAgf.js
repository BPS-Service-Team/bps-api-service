import { Button, Card, Col, Row, notification } from 'antd';
import React, { useRef, useState } from 'react';
import { CSVLink } from 'react-csv';
import ReactJson from 'react-json-view';
import { sendReconciliation } from '../../Services/API';

const SendReconciliationAgf = () => {
  const [loading, setLoading] = useState(false);
  const [reconciliationJson, setReconciliationJson] = useState({});
  const csvLink = useRef();

  const handleSendReconcilition = async () => {
    setLoading(true);
    try {
      const res = await sendReconciliation({ fromWeb: true }, {}, true);
      if (res.ok) {
        setReconciliationJson(res.data);
        notification.success({
          message: 'Sent',
        });
      } else {
        notification.error({
          message: 'Error',
          description:
            res?.data?.header?.message || 'Error sending reconciliation',
        });
      }
    } catch (error) {
      setLoading(false);
      notification.error({
        message: 'Error',
        description: error.message || 'Error sending reconciliation',
      });
    }
    setLoading(false);
  };

  const downloadCsv = () => {
    csvLink.current.link.click();
  };

  return (
    <Card style={{ margin: 10 }}>
      <Row>
        <Col>
          <Button
            onClick={handleSendReconcilition}
            loading={loading}
            type="primary"
          >
            Send Reconciliation AGF
          </Button>
          <Button
            style={{ marginLeft: 10 }}
            type="primary"
            disabled={!reconciliationJson?.body?.data}
            onClick={downloadCsv}
          >
            Download as CSV
          </Button>
          <CSVLink
            data={reconciliationJson?.body?.data || []}
            className="_hidden"
            ref={csvLink}
            separator={';'}
            filename="reconciliation-item"
          />
        </Col>
      </Row>
      <Row style={{ paddingTop: 20, width: '100%' }}>
        <Col>
          <ReactJson src={reconciliationJson} />
        </Col>
      </Row>
    </Card>
  );
};

export default SendReconciliationAgf;
