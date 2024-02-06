import React from 'react';
import { Pie } from '@ant-design/charts';

function parseData(data = []) {
  let records = [];
  for (let key of Object.keys(data)) {
    records.push({
      type: key,
      value: data[key],
    });
  }
  return records;
}
const OrderDailyChart = ({ data = [] }) => {
  const config = {
    data: parseData(data),
    appendPadding: 10,
    angleField: 'value',
    colorField: 'type',
    radius: 0.9,
    color: ['#D8001E', '#c0392b', '#e67e22'],
    label: {
      type: 'inner',
      offset: '-30%',
      content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
      style: {
        fontSize: 14,
        textAlign: 'center',
      },
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
  };
  return (
    <div className="orders-chart">
      <h1>Orders Daily Type</h1>
      <Pie {...config} />
    </div>
  );
};

export default OrderDailyChart;
