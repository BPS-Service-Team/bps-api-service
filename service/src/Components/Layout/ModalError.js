import React from 'react';
import { Button, Modal, Collapse, Tag, Descriptions, Alert } from 'antd';
import { useError } from '../../Hooks/Error.hook';

const { Panel } = Collapse;

const ModalError = () => {
  const [{ error, ...errorBody }, , clear] = useError();
  const _renderErrors = () => {
    if (errorBody.data.errors) {
      return Object.keys(errorBody.data.errors).map(key => {
        let sText = errorBody.data.errors[key],
          sKey = key;

        // Obtenemos el posible nombre del campo
        if (sText.indexOf('"') > -1) {
          sKey = sText.substring(
            sText.indexOf('"') + 1,
            sText.lastIndexOf('"')
          );
        }

        return (
          <Panel key={sKey} header={sKey}>
            {errorBody.data.errors[key]}
          </Panel>
        );
      });
    }

    return <></>;
  };
  return (
    <Modal
      title="Ups, there was a problem"
      visible={error}
      onCancel={clear}
      centered
      zIndex={999}
      footer={[
        <Button type="primary" onClick={clear} key="1">
          Close
        </Button>,
      ]}
    >
      <div className="ErrorMessage">
        <Descriptions size="small">
          <Descriptions.Item label="Error name" span={2}>
            {errorBody.data.name}
          </Descriptions.Item>
          <Descriptions.Item label="Status" span={1}>
            <Tag color="red">{errorBody.data.code}</Tag>
          </Descriptions.Item>
        </Descriptions>
        <Descriptions>
          <Descriptions.Item label="Message">
            {errorBody.data.message}
          </Descriptions.Item>
        </Descriptions>
        <Collapse>{_renderErrors()}</Collapse>
        <Alert
          style={{ marginTop: 10 }}
          message="NOTE"
          description="If errors persist please contact with the administrator"
          type="warning"
          showIcon
        />
      </div>
    </Modal>
  );
};
export default ModalError;
