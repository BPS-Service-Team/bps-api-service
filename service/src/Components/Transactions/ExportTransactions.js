import React, { useState } from 'react';
import { Row, Col, Button } from 'antd';
import { exportCSV } from '../../Utils/export';
import { getTransactions } from '../../Services/API';

const PAGE_SIZE = 10;

const ExportTransactions = ({ queries = [], disableButton = true }) => {
  const [loading, setLoading] = useState(false);
  const _handleFormatTransactions = transactions => {
    let aFormat = [];
    for (let transaction of transactions) {
      aFormat.push({
        'Transaction ID': transaction._id,
        'Order ID': transaction.order_id,
        Process: transaction.process,
        'From Locatino': transaction.from,
        'To Location': transaction.to,
        Qty: transaction.qty,
        'Pallet ID': transaction.pallet_id,
        'Stock No.': transaction.stock_no,
        'Batch No.': transaction.batch_no,
        'Valuation Type': transaction.val_type,
        'Pack Key': transaction.pack_key,
        Reason: transaction.reason,
        Remarks: transaction.remarks,
        User: transaction.user,
        'Creation Date': transaction.created_at,
      });
    }
    return aFormat;
  };
  const _handleFetchTransactions = async (transactions = [], skip = 0) => {
    const aTemp = [...queries];
    const aQueries = aTemp.filter(oElem => oElem.value);

    let response = await getTransactions(aQueries, skip);
    if (response.ok) {
      if (response.data.data.length === PAGE_SIZE) {
        return await _handleFetchTransactions(
          [...transactions, ...response.data.data],
          skip + 10
        );
      } else {
        return [...transactions, ...response.data.data];
      }
    }
  };
  const _handleExportTransactions = async () => {
    setLoading(true);
    const transactions = await _handleFetchTransactions();
    exportCSV(_handleFormatTransactions(transactions), 'TRANSACTION_LIST');
    setLoading(false);
  };
  return (
    <Row style={{ marginBottom: 20 }} justify="end">
      <Col>
        <Button
          loading={loading}
          onClick={_handleExportTransactions}
          disabled={disableButton}
        >
          Export CSV
        </Button>
      </Col>
    </Row>
  );
};

export default ExportTransactions;
