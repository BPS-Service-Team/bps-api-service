import React, { useEffect, useState } from 'react';
import immutable from 'seamless-immutable';
import {
  Button,
  Col,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Skeleton,
  Card,
  Tabs,
} from 'antd';
import { ChromePicker } from 'react-color';

import { getConfig, updateConfig } from '../../Services/API';
import { useI18n } from '../../Hooks/i18n.hook';

const { TabPane } = Tabs;
/**
 * Stringify  json value
 * @param {Array} data
 * @returns data parsed
 */
function parseData(data) {
  for (let index in data) {
    for (let sIndex in data[index].elements) {
      if (data[index].elements[sIndex].type === 'json') {
        data[index].elements[sIndex].value = JSON.stringify(
          data[index].elements[sIndex].value
        );
      }
    }
  }
  return data;
}
/**
 * Restore json format
 * @param {Object} data
 * @returns initial structured object
 */
function restoreData(elements) {
  let sElements = [];
  for (let element of elements) {
    if (element.type === 'json') {
      sElements.push(
        element.merge({
          value: JSON.parse(element.value),
        })
      );
    } else {
      sElements.push(element);
    }
  }

  return sElements;
}
const GeneralView = () => {
  const [data, setData] = useState(immutable([]));
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [, l] = useI18n();
  //Change page title
  useEffect(() => {
    async function get() {
      setLoading(true);
      let response = await getConfig();
      if (response.ok) {
        let parsed = parseData(response.data.data);
        setData(immutable(parsed));
      }
      setLoading(false);
    }
    get();
  }, []);

  const _handleSave = async () => {
    let blnError = false;
    setBtnLoading(true);
    for (let { _id, elements } of data) {
      let response = await updateConfig(_id, {
        elements: restoreData(elements),
      });

      if (!response.ok) {
        message.error(l('_ERROR_SAVE_CONFIG'));
        blnError = true;
        break;
      }
    }
    setBtnLoading(false);
    if (!blnError) {
      message.success(l('DONE'));
    }
  };

  const _handleChangeValue = (value, index) => {
    setData(data.updateIn(index, row => row.merge({ value })));
  };

  const _renderInput = (node, index) => {
    switch (node.type) {
      case 'select':
        return (
          <Select
            value={node.value}
            style={{ width: '100%' }}
            onChange={e => _handleChangeValue(e, index)}
          >
            {node?.options?.map((item, key) => (
              <Select.Option key={key} value={item.value}>
                {item.label}
              </Select.Option>
            ))}
          </Select>
        );
      case 'number':
        return (
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            value={node.value}
            onChange={e => _handleChangeValue(e, index)}
          />
        );
      case 'json':
        return (
          <Input.TextArea
            value={node.value}
            onChange={e => _handleChangeValue(e, index)}
          />
        );
      case 'color':
        return (
          <ChromePicker
            color={node.value}
            onChange={e => _handleChangeValue(e.hex, index)}
          />
        );
      default:
        return (
          <Input
            style={{ width: '100%' }}
            value={node.value}
            onChange={e => _handleChangeValue(e.target.value, index)}
          />
        );
    }
  };

  const _renderElements = (elements, index) => {
    return (
      <Row gutter={[0, 15]} justify="center">
        {elements.asMutable().map((element, i) => (
          <Col key={element.slug} span={20}>
            <Row gutter={[10, 0]} align="middle">
              <Col md={6} className="text-right">
                {element.name}
              </Col>
              <Col flex="1">{_renderInput(element, [...index, i])}</Col>
            </Row>
          </Col>
        ))}
      </Row>
    );
  };

  const _renderContent = () => {
    if (loading) {
      return <Skeleton active />;
    }

    return (
      <Tabs gutter={[30, 30]}>
        {data.asMutable().map((row, i) => (
          <TabPane tab={row.name} key={row.slug}>
            {_renderElements(row.elements, [i, 'elements'])}
          </TabPane>
        ))}
      </Tabs>
    );
  };

  return (
    <Card className="container" style={{ height: '100%' }}>
      <Row justify="end">
        <Col>
          <Button type="primary" onClick={_handleSave} loading={btnLoading}>
            {l('SAVE')}
          </Button>
        </Col>
      </Row>
      {_renderContent()}
    </Card>
  );
};

export default GeneralView;
