import React from 'react';
import PropTypes from 'prop-types';
import { Result, Button, Collapse, Card } from 'antd';

const { Panel } = Collapse;

const ErrorFallback = ({ error, componentStack, resetErrorBoundary }) => {
  return (
    <Card role="alert" className="fadeIn">
      <Result
        status="error"
        title="There was an unexpected error"
        subTitle="You may not have permissions to see this section, if the error persists consult your administrator."
        extra={[
          <Button type="primary" onClick={resetErrorBoundary} key="1">
            Try again
          </Button>,
        ]}
      >
        <div className="desc">
          <h3 style={{ textAlign: 'left' }}>Error Stack</h3>
          <Collapse>
            <Panel header={error.message} key="2">
              <pre>{componentStack}</pre>
            </Panel>
          </Collapse>
        </div>
      </Result>
    </Card>
  );
};
ErrorFallback.propTypes = {
  error: PropTypes.any,
  componentStack: PropTypes.any,
  resetErrorBoundary: PropTypes.func,
};
export default ErrorFallback;
