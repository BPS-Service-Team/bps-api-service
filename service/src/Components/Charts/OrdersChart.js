import React from 'react';
import { Column } from '@ant-design/charts';

function parseData(data = {}) {
  let records = [];
  for (let key of Object.keys(data)) {
    records.push({
      date: key,
      total: data[key],
    });
  }
  return records;
}
const OrdersChart = ({ data = [] }) => {
  const config = {
    data: parseData(data),
    xField: 'date',
    yField: 'total',
    color: '#D8001E',
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        formatter: txt => txt,
      },
    },
    tooltip: {
      customContent: title => {
        return (
          <div className="tooltip-chart">
            <h5>{title}</h5>
          </div>
        );
      },
    },
    legend: false,
    autoFit: true,
    height: 250,
  };
  return (
    <div className="orders-chart">
      <h1>Total orders</h1>
      <Column {...config} />
    </div>
  );
};

export default OrdersChart;
