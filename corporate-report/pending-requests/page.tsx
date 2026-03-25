'use client';
import React, { useEffect, useState } from 'react';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { changeTitle } from '@/utils/breadCrumbUtil';
import { TITLE } from '@/constants/Title';
import { Box, useTheme } from '@mui/material';
import { AntDesignOutlined, RedoOutlined } from '@ant-design/icons';
import CustomTable from '@/components/common/CustomTable';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNotify } from '@/contexts/NotificationContext';
import { usePermission } from '@/contexts/PermissionProvider';
import { fetchData, submitData } from '@/utils/api';
import { PageResponse } from '@/interfaces/common/PageResponse';
import { getErrorMessage } from '@/utils/errorUtil';
import { Badge, Menu, MenuProps, Row, Space, TableColumnsType, TableColumnType } from 'antd';
import { CenteredHeader } from '@/components/common/CenteredHeader/CenteredHeader';
import { RowAction } from '@/components/common/RowAction';
import { formatDate } from '@/utils/dateUtil';
import AnimatedSubPage from '@/components/common/AnimatedSubPage';
import { ThinButton } from '@/components/common/ThinButton';
import { getNestedPermissions } from '@/utils/permissionUtils';
import {
  ACTION_TYPE_LABEL,
  CorpProfilePendingRequest,
  IncomingPendingRequest,
  MENU_PENDING_REQUEST,
  RequestType,
} from '@/interfaces/corporate-report/PendingRequest';
import { API_CORPORATE_REPORT } from '@/constants/api/ApiCorporateReport';
import { formatAccountNo } from '@/utils/formatUtils';

const CORPORATE_PROFILE_TAB = 'corporateProfile';
const INCOMING_PROFILE_TAB = 'incomingProfile';

export default function CorpReportPendingReqestPage() {
  const theme = useTheme();
  const layoutContext = useLayoutContext();

  const searchParams = useSearchParams();
  const notify = useNotify();
  const router = useRouter();
  const { permissions } = usePermission();

  const basePath = [TITLE.CORP_REPORT.title, TITLE.CORP_REPORT_PENDING_REQUESTS.title];

  const pendingRequestCorpProfilePermissions =
    getNestedPermissions(permissions, [
      ...basePath,
      MENU_PENDING_REQUEST.PENDING_REQUESTS_CORPORATE_PROFILE,
    ])?.filter((item) => item !== 'view' && item !== 'delete') || [];

  const pendingRequestIncomingPermissions =
    getNestedPermissions(permissions, [
      ...basePath,
      MENU_PENDING_REQUEST.PENDING_REQUESTS_INCOMING_PROFILE,
    ])?.filter((item) => item !== 'view' && item !== 'delete') || [];

  const TAB_PERMISSION_MAP: Record<string, string[]> = {
    corporateProfile: pendingRequestCorpProfilePermissions,
    incomingProfile: pendingRequestIncomingPermissions,
  };

  const VALID_ACTIVE_TAB = [CORPORATE_PROFILE_TAB, INCOMING_PROFILE_TAB];
  const urlTab = searchParams.get('tab') || '';
  const initTab = VALID_ACTIVE_TAB.includes(urlTab) ? urlTab : CORPORATE_PROFILE_TAB;

  const initialPage = Number(searchParams.get('page') || 1);
  const initialPageSize = Number(searchParams.get('pageSize') || 10);

  const [activeTab, setActiveTab] = useState(initTab);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const [corporateProfiles, setCorporateProfiles] = React.useState<CorpProfilePendingRequest[]>([]);
  const [incomingProfiles, setIncomingProfiles] = React.useState<IncomingPendingRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [totalElement, setTotalElement] = useState(0);

  const [trigger, setTrigger] = useState(0);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    clearFormValues();
  };

  const loadData = () => {
    setSearchUrl();
    setLoading(true);

    if (activeTab === CORPORATE_PROFILE_TAB) {
      fetchData<PageResponse<CorpProfilePendingRequest>>(
        API_CORPORATE_REPORT.GET_CORP_PROFILE_PENDING_REQUEST,
        {
          page: page,
          size: pageSize,
        }
      )
        .then((it) => {
          setHasError(false);
          setCorporateProfiles(it.content.map((item) => ({ ...item })));
          setTotalElement(it.totalElements);
        })
        .catch((e) => {
          setHasError(true);
          notify.error({ message: getErrorMessage(e) });
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (activeTab === INCOMING_PROFILE_TAB) {
      fetchData<PageResponse<IncomingPendingRequest>>(
        API_CORPORATE_REPORT.GET_INCOMING_PROFILE_PENDING_REQUEST,
        {
          page: page,
          size: pageSize,
        }
      )
        .then((it) => {
          setHasError(false);
          setIncomingProfiles(it.content.map((item) => ({ ...item })));
          setTotalElement(it.totalElements);
        })
        .catch((e) => {
          setHasError(true);
          notify.error({ message: getErrorMessage(e) });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const clearFormValues = () => {
    setPage(1);
    setTrigger((t) => t + 1);
  };

  const actionApprove = (id: React.Key) => {
    const submitApi =
      activeTab === CORPORATE_PROFILE_TAB
        ? API_CORPORATE_REPORT.APPROVE_CORP_PROFILE_PENDING_REQUEST
        : API_CORPORATE_REPORT.APPROVE_INCOMING_PROFILE_PENDING_REQUEST

    submitData(submitApi, { id })
      .then(() => {
        loadData();
        setHasError(false);
        notify.success({ message: 'Your submission is approved.' });
      })
      .catch((e) => {
        setHasError(true);
        notify.error({ message: getErrorMessage(e) });
      });
  };

  const actionReject = (id: React.Key) => {
    const submitApi =
      activeTab === CORPORATE_PROFILE_TAB
        ? API_CORPORATE_REPORT.REJECT_CORP_PROFILE_PENDING_REQUEST
        : API_CORPORATE_REPORT.REJECT_INCOMING_PROFILE_PENDING_REQUEST

    submitData(submitApi, { id })
      .then(() => {
        loadData();
        setHasError(false);
        notify.success({ message: 'Your submission is rejected.' });
      })
      .catch((e) => {
        setHasError(true);
        notify.error({ message: getErrorMessage(e) });
      });
  };

  const actionComponent = (
    <Row justify="end">
      <Space>
        <ThinButton icon={<RedoOutlined />} onClick={loadData} size="large">
          Reload
        </ThinButton>
      </Space>
    </Row>
  );

  const setSearchUrl = () => {
    const url = new URL(window.location.href);

    url.searchParams.set('tab', activeTab);
    url.searchParams.set('page', String(page));
    url.searchParams.set('pageSize', String(pageSize));

    window.history.replaceState(null, '', url.toString());
  };

  const mappedRequestTypeToActionLabel = (requestType: string | undefined) => {
    return ACTION_TYPE_LABEL[requestType as RequestType] ?? '-';
  };

  const hasViewPermission = (tab: string) => {
    const perms = TAB_PERMISSION_MAP[tab];
    return perms?.includes('view');
  };

  useEffect(() => {
    if (!hasViewPermission(activeTab)) {
      const fallbackTab = ([CORPORATE_PROFILE_TAB, INCOMING_PROFILE_TAB] as const).find(
        hasViewPermission
      );

      if (fallbackTab) {
        setActiveTab(fallbackTab);
        router.replace(`${TITLE.CORP_REPORT_PENDING_REQUESTS.urlPath}?tab=${fallbackTab}`);
      } else {
        router.replace('/');
      }
    }
  }, [activeTab, permissions]);

  useEffect(() => {
    layoutContext.setSubComponentRight(actionComponent);
    loadData();
  }, [page, pageSize, trigger, activeTab]);

  changeTitle(
    useLayoutContext(),
    [TITLE.CORP_REPORT, TITLE.CORP_REPORT_PENDING_REQUESTS],
    null,
    actionComponent
  );

  const baseColumnsCorpProfile: TableColumnsType<CorpProfilePendingRequest> = [
    {
      title: 'ID',
      width: 60,
      render: (_: unknown, __: CorpProfilePendingRequest, index: number) => {
        return (page - 1) * pageSize + index + 1;
      },
    },
    {
      title: 'Sending Type',
      dataIndex: 'sendType',
    },
    {
      title: 'Corporate ID',
      dataIndex: 'corporateId',
    },
    {
      title: 'Corporate / Bank Name TH',
      dataIndex: 'corporateNameThai',
      render: (val?: string) => (val ? val : '-'),
    },
    {
      title: 'Corporate / Bank Name EN',
      dataIndex: 'corporateNameEnglish',
      render: (val?: string) => (val ? val : '-'),
    },
    {
      title: 'Remark',
      dataIndex: 'remark',
      render: (val?: string) => (val ? val : '-'),
    },
    {
      title: 'Action Type',
      dataIndex: 'requestType',
      render: (val?: string) => mappedRequestTypeToActionLabel(val),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdDate',
      render: (val?: string) => formatDate(val),
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
    },
    {
      title: 'Updated Date',
      dataIndex: 'updatedDate',
      render: (val?: string) => formatDate(val),
    },
    {
      title: 'Updated By',
      dataIndex: 'updatedBy',
      render: (val?: string) => (val ? val : '-'),
    },
  ];

  const baseColumnsIncomingProfile: TableColumnsType<IncomingPendingRequest> = [
    {
      title: 'ID',
      render: (_: any, __: IncomingPendingRequest, index: number) =>
        (page - 1) * pageSize + index + 1,
      width: 80,
    },
    {
      title: 'Sending Type',
      dataIndex: 'sendType',
    },
    {
      title: 'Corporate ID',
      dataIndex: 'corporateId',
    },
    {
      title: 'Account No',
      dataIndex: 'accountNo',
      render: (text: string) => formatAccountNo(text),
    },
    {
      title: 'Effective Date',
      dataIndex: 'effectiveDate',
      render: (val?: string) => formatDate(val),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      render: (value: boolean) => (
        <Badge
          color={value ? 'green' : 'red'}
          text={value ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      title: 'Remark',
      dataIndex: 'remark',
      render: (val?: string) => val ?? '-',
    },
    {
      title: 'Action Type',
      dataIndex: 'requestType',
      render: (val?: string) => mappedRequestTypeToActionLabel(val),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdDate',
      render: (val?: string) => formatDate(val),
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
    },
    {
      title: 'Updated Date',
      dataIndex: 'updatedDate',
      render: (val?: string) => formatDate(val),
    },
    {
      title: 'Updated By',
      dataIndex: 'updatedBy',
      render: (val?: string) => (val ? val : '-'),
    },
  ];

  function addActionsColumn<T extends { id: string | number }>(
    permission: string[],
    actionApprove: (id: string | number) => void,
    actionReject: (id: string | number) => void,
  ): TableColumnType<T> {
    const isApprover = permission.includes('approve') || permission.includes('reject');

    return {
      title: <CenteredHeader>Actions</CenteredHeader>,
      width: 50,
      fixed: 'right',
      render: (_: unknown, record: T) => {
        return (
          <RowAction
            record={record}
            rowActionDetail={{
              ...(isApprover && {
                approve: {
                  action: () => {
                    actionApprove(record.id);
                  },
                },
                reject: {
                  action: () => {
                    actionReject(record.id);
                  },
                },
              }),
            }}
            permission={permission}
          />
        );
      },
    };
  }

  let columnsCorpProfile: TableColumnsType<CorpProfilePendingRequest> = [];
  if (pendingRequestCorpProfilePermissions.includes('approve') && pendingRequestCorpProfilePermissions.includes('reject')) {
    columnsCorpProfile = [
      ...baseColumnsCorpProfile,
      addActionsColumn<CorpProfilePendingRequest>(
        pendingRequestCorpProfilePermissions,
        actionApprove,
        actionReject
      ),
    ];
  } else {
    columnsCorpProfile = baseColumnsCorpProfile
  }

  let columnsIncomingProfile: TableColumnsType<IncomingPendingRequest> = [];
  if (pendingRequestIncomingPermissions.includes('approve') && pendingRequestIncomingPermissions.includes('reject')) {
    columnsIncomingProfile = [
      ...baseColumnsIncomingProfile,
      addActionsColumn<IncomingPendingRequest>(
        pendingRequestIncomingPermissions,
        actionApprove,
        actionReject
      ),
    ];
  } else {
    columnsIncomingProfile = baseColumnsIncomingProfile;
  }

  const tabMenuItems: MenuProps['items'] = [
    {
      label: 'Corporate',
      key: CORPORATE_PROFILE_TAB,
      icon: <AntDesignOutlined />,
    },
    {
      label: 'Incoming',
      key: INCOMING_PROFILE_TAB,
      icon: <AntDesignOutlined />,
    },
  ];

  return (
    <AnimatedSubPage>
      <Menu
        onClick={({ key }) => handleTabChange(key)}
        selectedKeys={[activeTab]}
        mode="horizontal"
        items={tabMenuItems}
      />
      <Box sx={{ my: theme.spacing(3), p: 0 }}>
        {activeTab === CORPORATE_PROFILE_TAB && (
          <CustomTable<CorpProfilePendingRequest>
            rowKey="id"
            hasError={hasError}
            onRetry={loadData}
            columns={columnsCorpProfile}
            dataSource={corporateProfiles}
            loading={loading}
            size="small"
            scroll={{ x: 'max-content' }}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: totalElement,
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setPageSize(newPageSize);
              },
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} items`,
            }}
          />
        )}

        {activeTab === INCOMING_PROFILE_TAB && (
          <CustomTable<IncomingPendingRequest>
            rowKey="id"
            hasError={hasError}
            onRetry={loadData}
            columns={columnsIncomingProfile}
            dataSource={incomingProfiles}
            loading={loading}
            size="small"
            scroll={{ x: 'max-content' }}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: totalElement,
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setPageSize(newPageSize);
              },
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} items`,
            }}
          />
        )}
      </Box>
    </AnimatedSubPage>
  );
}
