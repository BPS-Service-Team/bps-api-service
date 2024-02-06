import React from 'react';
import { Pie } from '@ant-design/charts';

function parseData(data = []) {
  let records = [
    {
      type: 'Others',
      value: 0,
    },
  ];
  for (let status of data) {
    if (status._id === 3) {
      records.push({
        type: 'Finished',
        value: status.total,
      });
    } else {
      records[0].value += status.total;
    }
  }
  return records;
}
const OrdersStatusChart = ({ data = [] }) => {
  const config = {
    data: parseData(data),
    appendPadding: 10,
    angleField: 'value',
    colorField: 'type',
    color: ['#7f8c8d', '#D8001E'],
    radius: 0.9,
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
      <h1>Orders Status</h1>
      <Pie {...config} />
    </div>
  );
};

export default OrdersStatusChart;
