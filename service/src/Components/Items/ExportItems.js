import React, { useState } from 'react';
import { Button } from 'antd';
import { exportCSV } from '../../Utils/export';
import { getItems } from '../../Services/API';
import { normalizeQueries } from '../../Utils/query';

const PAGE_SIZE = 10;
const ExportItems = ({ queries = [] }) => {
  const [loading, setLoading] = useState(false);
  const _handleFormatItems = items => {
    let aFormat = [];
    for (let item of items) {
      aFormat.push({
        'Item Name': item.itm_name,
        'Stock No.': item.stock_no,
        'Batch No.': item.batch_no,
        UOM: item.uom,
        'Net Weight': item.net_weight,
        Length: item.length,
        Height: item.height,
        Width: item.width,
      });
    }
    return aFormat;
  };
  const _handleFetchItems = async (items = [], skip = 0) => {
    let response = await getItems(normalizeQueries(queries), skip);
    if (response.ok) {
      if (response.data.data.length === PAGE_SIZE) {
        return await _handleFetchItems(
          [...items, ...response.data.data],
          skip + 10
        );
      } else {
        return [...items, ...response.data.data];
      }
    }
  };
  const _handleExportItems = async () => {
    setLoading(true);
    const items = await _handleFetchItems();
    exportCSV(_handleFormatItems(items), 'ITEMS_MASTER_LIST');
    setLoading(false);
  };
  return (
    <Button loading={loading} onClick={_handleExportItems}>
      Export CSV
    </Button>
  );
};

export default ExportItems;
