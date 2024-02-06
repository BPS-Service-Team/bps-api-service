import React from 'react';
import { Button, Badge, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { useI18n } from './i18n.hook';
import { useNavigation } from './Nav.hook';

const UsersColumns = [
  {
    title: 'FULL_NAME',
    dataIndex: 'full_name',
    id: 'full_name',
  },
  {
    title: 'EMAIL',
    dataIndex: 'email',
    id: 'email',
  },
  {
    title: 'STATUS',
    dataIndex: 'status',
    id: 'status',
  },
];
const BrandColumns = [
  {
    title: 'NAME',
    dataIndex: 'name',
    id: 'name',
  },
  {
    title: 'BRAND',
    dataIndex: ['brand', 'name'],
    id: 'brand',
  },
  {
    title: 'DESCRIPTION',
    dataIndex: 'description',
    id: 'description',
  },
  {
    title: 'STATUS',
    dataIndex: 'status',
    id: 'status',
  },
];
const ColorColumns = [
  {
    title: 'NAME',
    dataIndex: 'name',
    id: 'name',
  },
  {
    title: 'DESCRIPTION',
    dataIndex: 'description',
    id: 'description',
  },
  {
    title: 'HEX',
    dataIndex: 'hexadecimal',
    id: 'hexadecimal',
  },
  {
    title: 'STATUS',
    dataIndex: 'status',
    id: 'status',
  },
];
const HiveColumns = [
  {
    title: 'NAME',
    dataIndex: 'name',
    id: 'name',
  },
  {
    title: 'DESCRIPTION',
    dataIndex: 'description',
    id: 'description',
  },
  {
    title: 'TYPE',
    dataIndex: 'type',
    id: 'type',
  },
  {
    title: 'STATUS',
    dataIndex: 'status',
    id: 'status',
  },
];
const PermissionColumn = [
  {
    title: 'FIELD',
    dataIndex: 'field',
    id: 'field',
  },
  {
    title: 'ENTITY',
    dataIndex: 'entity',
    id: 'entity',
  },
  {
    title: 'INDEX',
    dataIndex: 'index',
    id: 'index',
  },
];
const ContractorColumns = [
  {
    title: '',
    dataIndex: 'code',
    id: 'code',
  },
  {
    title: 'CONTRACTOR',
    dataIndex: 'name',
    id: 'name',
  },
  {
    title: 'TYPE_OF_SERVICE',
    dataIndex: 'works',
    id: 'works',
  },
  {
    title: 'SERVICE_PURPOSE',
    dataIndex: 'types',
    id: 'types',
  },
  {
    title: 'LOCATION',
    dataIndex: 'city',
    id: 'city',
  },
  {
    title: 'STATUS',
    dataIndex: 'status',
    id: 'status',
  },
];
const StoreColumns = [
  {
    title: 'NAME',
    dataIndex: 'name',
    id: 'name',
  },
  {
    title: 'CODE',
    dataIndex: 'code',
    id: 'code',
  },
  {
    title: 'USER',
    dataIndex: ['user', 'full_name'],
    id: 'user',
  },
  {
    title: 'BRAND',
    dataIndex: ['brand', 'name'],
    id: 'brand',
  },
  {
    title: 'STATUS',
    dataIndex: 'status',
    id: 'status',
  },
];
const SubcontractorColumns = [
  {
    title: 'USER',
    dataIndex: ['user', 'full_name'],
    id: 'user',
  },
  {
    title: 'CONTRACTOR',
    dataIndex: ['contractor', 'name'],
    id: 'contractor',
  },
  {
    title: 'HIRED_DATE',
    dataIndex: 'hired_at',
    id: 'date',
    render: e => dayjs(e).format('DD-MM-YYYY'),
  },
  {
    title: 'STATUS',
    dataIndex: 'status',
    id: 'status',
  },
];
const JobsColumns = [
  {
    title: 'BRAND',
    dataIndex: ['store', 'brand', 'name'],
    id: 'brand',
  },
  {
    title: 'SERVICE_LOCATION',
    dataIndex: ['store', 'address'],
    id: 'location',
  },
  {
    title: 'JOB_REQUEST_ON',
    dataIndex: 'created_at',
    id: 'created_at',
    render: txt => dayjs(txt).format('Do MMM YYYY'),
  },
  {
    title: 'LAST_UPDATE_ON',
    dataIndex: 'updated_at',
    id: 'updated_at',
    render: txt => dayjs(txt).format('Do MMM YYYY'),
  },
  {
    title: 'STATUS',
    dataIndex: 'status',
    id: 'status',
    render: (text, job) => {
      switch (text) {
        case 'requested':
          return <Badge dot color="blue" text="Pending your action" />;
        case 'assigned':
          return <Badge dot color="blue" text="Contractor reviewer" />;
        case 'rejected':
          if (job?.contracts?.length > 0) {
            return <Badge dot color="red" text="Contractor rejected" />;
          }
          break;
        case 'accepted':
          return <Badge dot color="blue" text="Pending payment settlement" />;
        case 'canceled':
        case 'cancel':
          return <Badge dot color="gray" text="Shop manager canceled" />;
        case 'decline':
          return <Badge dot color="gray" text="Admin canceled" />;
        case 'in-process':
          return <Badge dot color="blue" text="Pending job done" />;
        case 'disputed':
          return <Badge dot color="red" text="Shop manager reported issues" />;
        case 'payment':
          return <Badge dot color="blue" text="Paid out" />;
        case 'completed':
          return <Badge dot color="blue" text="Completed" />;
        case 'finished':
          return <Badge dot color="blue" text="Pending payment settlement" />;
        case 'send-invoice':
          return <Badge dot color="blue" text="Pending payment" />;
        case 'partially':
          return (
            <Badge dot color="blue" text="Contractor partially accepted" />
          );
        case 'pending':
          return <Badge dot color="blue" text="Shop manager reviewing" />;
        default:
          return text;
      }
    },
  },
  {
    title: '',
    dataIndex: '_id',
    id: 'action',
    render: (text, row) => {
      const [, push] = useNavigation();
      if (row.status === 'requested') {
        return (
          <div>
            <Button
              type="ghost"
              onClick={() => push(`/dashboard/assignments?id=${text}`)}
            >
              Assign Contractor
            </Button>
          </div>
        );
      }
      if (row.status === 'disputed') {
        return (
          <div>
            <Button
              type="ghost"
              onClick={() =>
                push(`/dashboard/assignments?id=${text}&mode=check`)
              }
            >
              Check with contractor
            </Button>
          </div>
        );
      }
      if (row.status === 'rejected') {
        return (
          <Row justify="space-between">
            <Col>
              <Button
                type="ghost"
                onClick={() => push(`/dashboard/assignments?id=${text}`)}
              >
                Reassign
              </Button>
            </Col>
            <Col>
              <Button type="ghost">Decline service</Button>
            </Col>
          </Row>
        );
      }
    },
  },
];
export function useUserColumn() {
  const [, t] = useI18n();
  function getColumn(key) {
    let obj = -1;
    for (let item of UsersColumns) {
      if (key === item.id) {
        //Translate title
        obj = {
          ...item,
          title: t(item.title),
        };
      }
    }
    return obj;
  }
  return [UsersColumns, getColumn];
}
export function useBrandColumn() {
  const [, t] = useI18n();
  function getColumn(key) {
    let obj = -1;
    for (let item of BrandColumns) {
      if (key === item.id) {
        //Translate title
        obj = {
          ...item,
          title: t(item.title),
        };
      }
    }
    return obj;
  }
  return [BrandColumns, getColumn];
}
export function useContractorColumn() {
  const [, t] = useI18n();
  function getColumn(key) {
    let obj = -1;
    for (let item of ContractorColumns) {
      if (key === item.id) {
        //Translate title
        obj = {
          ...item,
          title: t(item.title),
        };
      }
    }
    return obj;
  }
  return [ContractorColumns, getColumn];
}
export function useStoreColumn() {
  const [, t] = useI18n();
  function getColumn(key) {
    let obj = -1;
    for (let item of StoreColumns) {
      if (key === item.id) {
        //Translate title
        obj = {
          ...item,
          title: t(item.title),
        };
      }
    }
    return obj;
  }
  return [StoreColumns, getColumn];
}
export function useSubcontractorColumn() {
  const [, t] = useI18n();
  function getColumn(key) {
    let obj = -1;
    for (let item of SubcontractorColumns) {
      if (key === item.id) {
        //Translate title
        obj = {
          ...item,
          title: t(item.title),
        };
      }
    }
    return obj;
  }
  return [SubcontractorColumns, getColumn];
}
export function useJobsColumns() {
  const [, t] = useI18n();
  function getColumn(key) {
    let obj = -1;
    for (let item of JobsColumns) {
      if (key === item.id) {
        //Translate title
        obj = {
          ...item,
          title: t(item.title),
        };
      }
    }
    return obj;
  }
  return [JobsColumns, getColumn];
}
export function useColorColumn() {
  const [, t] = useI18n();
  function getColumn(key) {
    let obj = -1;
    for (let item of ColorColumns) {
      if (key === item.id) {
        //Translate title
        obj = {
          ...item,
          title: t(item.title),
        };
      }
    }
    return obj;
  }
  return [ColorColumns, getColumn];
}

export function useHivesColumns() {
  const [, t] = useI18n();
  function getColumn(key) {
    let obj = -1;
    for (let item of HiveColumns) {
      if (key === item.id) {
        //Translate title
        obj = {
          ...item,
          title: t(item.title),
        };
      }
    }
    return obj;
  }
  return [HiveColumns, getColumn];
}
export function usePermissionColumn() {
  const [, t] = useI18n();
  function getColumn(key) {
    let obj = -1;
    for (let item of PermissionColumn) {
      if (key === item.id) {
        //Translate title
        obj = {
          ...item,
          title: t(item.title),
        };
      }
    }
    return obj;
  }
  return [PermissionColumn, getColumn];
}
