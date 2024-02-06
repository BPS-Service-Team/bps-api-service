import React, { useState } from 'react';
import { Col, notification, Progress, Row, Upload } from 'antd';
import { sendReconciliation } from '../../Services/API';

const JsonFileTest = () => {
  const [defaultFileList, setDefaultFileList] = useState([]);
  const [progress, setProgress] = useState(0);

  const uploadImage = async options => {
    const { onSuccess, onError, file, onProgress } = options;

    const fmData = new FormData();
    const config = {
      onUploadProgress: event => {
        const percent = Math.floor((event.loaded / event.total) * 100);
        setProgress(percent);
        if (percent === 100) {
          setTimeout(() => setProgress(0), 1000);
        }
        onProgress({ percent: (event.loaded / event.total) * 100 });
      },
    };
    fmData.append('files', file);
    try {
      const res = await sendReconciliation(fmData, config);
      if (res?.ok) {
        notification.success({
          message: 'Uploaded!',
          description: JSON.stringify(res?.data),
        });
      } else {
        notification.success({
          message: 'Error',
          description: 'Error in process',
        });
      }

      onSuccess('Ok');
      console.log('server res: ', res);
    } catch (err) {
      console.log('Error: ', err);
      onError({ err });
    }
  };

  const handleOnChange = ({ fileList }) => {
    // Using Hooks to update the state to the current filelist
    setDefaultFileList(fileList);
  };

  return (
    <Row align="middle" justify="center">
      <Col span={24} style={{ textAlign: 'center' }}>
        <h4>Upload Reconciliation json file</h4>
        <Upload
          accept="application/json"
          customRequest={uploadImage}
          onChange={handleOnChange}
          listType="picture-card"
          defaultFileList={defaultFileList}
          className="image-upload-grid"
        >
          {defaultFileList.length >= 1 ? null : <div>Select File</div>}
        </Upload>
        {progress > 0 ? <Progress percent={progress} /> : null}
      </Col>
    </Row>
  );
};

export default JsonFileTest;
