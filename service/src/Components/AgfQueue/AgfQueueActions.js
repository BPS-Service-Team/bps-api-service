import React from 'react';
import PropTypes from 'prop-types';
import { Button, Row, Col } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const AgfQueueActions = ({
  userModal = {
    visible: false,
    handler: () => ({}),
    form: {},
    submit: () => ({}),
    loading: false,
  },
}) => {
  return (
    <>
      <Row>
        <Col>
          <Button
            type="primary"
            onClick={() => userModal.handler(true)}
            icon={<FontAwesomeIcon icon={faPlus} className="anticon pointer" />}
          >
            Cancel
          </Button>
        </Col>
      </Row>
    </>
  );
};
AgfQueueActions.propTypes = {
  userModal: PropTypes.shape({
    visible: PropTypes.bool,
    handler: PropTypes.func,
    form: PropTypes.object,
  }),
};
export default AgfQueueActions;
