import React, { useState } from 'react';
import { Spin, Image as Img } from 'antd';
import { useI18n } from '../../Hooks/i18n.hook';

const Image = props => {
  const [loaded, setLoaded] = useState(false);
  const [, label] = useI18n();
  return (
    <>
      <Img
        {...props}
        onLoad={() => setLoaded(true)}
        onError={e => console.log(e)}
        style={{ display: loaded ? 'block' : 'none' }}
        alt="Item"
      />
      <div
        className="loading-image"
        style={{
          display: !loaded ? 'block' : 'none',
        }}
      >
        <Spin>
          <div
            className="loading-content"
            style={{ height: '100%', width: '100%' }}
          >
            {label('LOADING')}
          </div>
        </Spin>
      </div>
    </>
  );
};

export default Image;
