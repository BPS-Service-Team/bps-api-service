import React, { useState } from 'react';
import { Button } from 'antd';
import { exportCSV } from '../../Utils/export';
import { getStockR } from '../../Services/API';
import { normalizeQueries } from '../../Utils/query';
const PAGE_SIZE = 10;
function parseStatus(status) {
  switch (status) {
    case 200:
      return '200 Empty';
    case 201:
      return '201 Ready';
    case 202:
      return '202 In transit';
    default:
      return status;
  }
}
const ExportStocks = ({ queries = [] }) => {
  const [loading, setLoading] = useState(false);
  const _handleFormatStocks = stocks => {
    let aFormat = [];
    for (let stock of stocks) {
      aFormat.push({
        'Item Name': stock.itm_name,
        'Stock No.': stock.stock_no,
        'Batch No.': stock.batch_no,
        'Val Type': stock.val_type,
        Location: stock.location,
        'Pack Key': stock.pack_key,
        'Pallet ID': stock.pallet_id,
        QTY: stock.qty,
        Status: parseStatus(stock.status),
      });
    }
    return aFormat;
  };
  const _handleFetchStocks = async (stocks = [], skip = 0) => {
    let response = await getStockR(normalizeQueries(queries), skip);
    if (response.ok) {
      if (response.data.data.length === PAGE_SIZE) {
        return await _handleFetchStocks(
          [...stocks, ...response.data.data],
          skip + 10
        );
      } else {
        return [...stocks, ...response.data.data];
      }
    }
  };
  const _handleExportStocks = async () => {
    setLoading(true);
    const stocks = await _handleFetchStocks();
    exportCSV(_handleFormatStocks(stocks), 'STOCKS_LIST');
    setLoading(false);
  };
  return (
    <Button loading={loading} onClick={_handleExportStocks}>
      Export CSV
    </Button>
  );
};

export default ExportStocks;
