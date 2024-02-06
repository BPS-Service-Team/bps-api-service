import { useEffect, useState, React } from 'react';
import { Card, List, Row, Col } from 'antd';
import { useFetchAgfInfo } from '../../Hooks/AgfInfo.hook';
import { DICT_AGF_CODE } from '../../Utils/agf_codes.js';
import { useAgfWebSocket } from '../../Hooks/AgfWebSocket.hook';

const AgfStatusTable = () => {
  const [agfData, setAgfData] = useState([[]]);
  const [agfInfo, loading] = useFetchAgfInfo();
  const [socketData, initSocket, socketConnect] = useAgfWebSocket();

  useEffect(() => {
    initSocket();
  }, []);

  useEffect(() => {
    socketConnect();
  }, [initSocket]);

  useEffect(() => {
    let indAgf = agfInfo.data.findIndex(item => item._id === socketData._id);
    if (indAgf !== -1) {
      let agfData_ = [...agfData];
      agfData_[indAgf].data[1] = 'Status: ' + socketData.status;
      agfData_[indAgf].data[2] = 'Code: ' + socketData.message_code;
      setAgfData(agfData_);
    }
  }, [socketData.message_code, socketData.status, socketData._id]);

  useEffect(() => {
    if (agfInfo.data.length !== 0) {
      let data_ = [];
      let datai;
      for (let i = 0; i < agfInfo.data.length; i++) {
        datai = { data: [] };
        datai.data.push('Name: ' + agfInfo.data[i].device_name);
        datai.data.push('Status: ' + agfInfo.data[i].status);
        datai.data.push('Code: ' + DICT_AGF_CODE[agfInfo.data[i].code]);
        data_.push(datai);
      }
      setAgfData(data_);
    }
  }, [agfInfo.data]);

  return (
    <Row>
      {agfData.map((AgfItem, key) => (
        <Col key={key}>
          <Card>
            <div className="fluid-container">
              <List
                header={<div>AGF</div>}
                loading={loading}
                dataSource={AgfItem.data}
                renderItem={item => <List.Item> {item} </List.Item>}
              />
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default AgfStatusTable;
