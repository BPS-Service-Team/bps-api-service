import React from 'react';
import { Button, Card, Col, Row, Modal } from 'antd';
import { backupDatabase } from '../../Services/API';

const DbBackup = () => {
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
    await backupDatabase(sCollection, sExtras)
      .then(response => response.blob())
      .then(response => {
        downloadBlob(response, `mongo-init.js`);
      });
  };

  return (
    <>
      <Card
        style={{
          height: '100%',
          justifyContent: 'center',
          display: 'flex',
          alignItems: 'center',
        }}
        className="fadeIn"
      >
        <h2>Generate Database backup script</h2>
        <div>
          <Row gutter={[30, 30]} justify="center">
            <Col className="pick-zone-result large info">
              <Button
                onClick={() =>
                  Modal.confirm({
                    title: 'Do you want to perform this action?',
                    centered: true,
                    onOk: _handleGetCollection,
                    okText: 'Yes',
                  })
                }
                type="primary"
              >
                Generate
              </Button>
            </Col>
          </Row>
        </div>
      </Card>
    </>
  );
};

export default DbBackup;
