'use client';
import AnimatedSubPage from '@/components/common/AnimatedSubPage';
import { CenteredHeader } from '@/components/common/CenteredHeader/CenteredHeader';
import CustomTable from '@/components/common/CustomTable';
import { RowAction } from '@/components/common/RowAction';
import { ThinButton } from '@/components/common/ThinButton';
import { API_CORPORATE_REPORT } from '@/constants/api/ApiCorporateReport';
import { TITLE } from '@/constants/Title';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { useNotify } from '@/contexts/NotificationContext';
import { usePermission } from '@/contexts/PermissionProvider';
import { PageResponse } from '@/interfaces/common/PageResponse';
import { CorporateProfile, CorporateProfileDropdown } from '@/interfaces/corporate-report/Profile';
import { fetchData, submitData } from '@/utils/api';
import { cleanObject, setUrlParams } from '@/utils/appUtils';
import { changeTitle } from '@/utils/breadCrumbUtil';
import { formatDate } from '@/utils/dateUtil';
import { getErrorMessage } from '@/utils/errorUtil';
import { useFormValues } from '@/utils/stateUtil';
import { ClearOutlined, PlusOutlined, RedoOutlined, SearchOutlined } from '@ant-design/icons';
import { Autocomplete } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { Badge, Button, Row, Space, TableColumnsType } from 'antd';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CorporateProfilesPage() {
  const layoutContext = useLayoutContext();
  const notify = useNotify();
  const router = useRouter();
  const searchParams = useSearchParams();

  const permission =
    usePermission().pathToPermission[TITLE.CORP_REPORT_CORP_PROFILES.urlPath]?.filter(
      (item) => item !== 'view'
    ) || [];

  const initialPage = Number(searchParams.get('page') || 1);
  const initialPageSize = Number(searchParams.get('pageSize') || 10);

  const { values, update, reset } = useFormValues({
    corporateId: searchParams.get('corporateId') || '',
    corporateNameThai: searchParams.get('corporateNameThai') || '',
    corporateNameEnglish: searchParams.get('corporateNameEnglish') || '',
  });

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [profile, setProfile] = useState<CorporateProfile[]>([]);
  const [totalElement, setTotalElement] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [searchValues, setSearchValue] = useState<typeof values>(values);
  const [trigger, setTrigger] = useState(0);

  const [dropdownList, setDropdownList] = useState<CorporateProfileDropdown[]>();
  const [corporateIdDropdown, setGroupCodeDropdown] = useState<string[]>();
  const [corporateNameThaiDropdown, setCorporateNameThaiDropdown] = useState<string[]>();
  const [corporateNameEnglishDropdown, setCorporateNameEnglishDropdown] = useState<string[]>();

  const handleSelect = (
    type: 'corporateId' | 'corporateNameThai' | 'corporateNameEnglish',
    selectedValue: string
  ) => {
    update(type, selectedValue ?? '');

    const newDropdownList =
      Array.from(new Set(dropdownList?.filter((item) => item[type] === selectedValue))) ?? [];

    setDropdownList(newDropdownList);
  };

  const handleAction = (data: CorporateProfile, path: 'view' | 'edit') => {
    const uuid = crypto.randomUUID();
    sessionStorage.setItem(
      uuid,
      JSON.stringify({
        corporateId: data.corporateId,
        corporateNameThai: data.corporateNameThai,
        corporateNameEnglish: data.corporateNameEnglish,
      })
    );
    router.push(`${TITLE.CORP_REPORT_CORP_PROFILES.urlPath}/${path}?id=${uuid}`);
  };

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPage(page);
    setPageSize(pageSize);
  };

  const clearFormValues = () => {
    update('corporateId', '');
    update('corporateNameThai', '');
    update('corporateNameEnglish', '');
    loadStaticData();
  };

  const setSearchUrl = () => {
    const url = new URL(window.location.href);
    setUrlParams(url, values);
    url.searchParams.set('page', String(page));
    url.searchParams.set('pageSize', String(pageSize));

    window.history.replaceState(null, '', url.toString());
  };

  const loadStaticData = () => {
    fetchData<CorporateProfileDropdown[]>(API_CORPORATE_REPORT.GET_CORP_PROFILE_DROPDOWN, {})
      .then((it) => {
        setDropdownList(Array.isArray(it) ? it : []);
      })
      .catch((e) => {
        notify.error({ message: getErrorMessage(e) });
      });
  };

  const loadData = () => {
    setSearchUrl();
    setLoading(true);

    fetchData<PageResponse<CorporateProfile>>(API_CORPORATE_REPORT.GET_CORP_PROFILE, {
      page: page,
      size: pageSize,
      ...cleanObject(searchValues),
    })
      .then((it) => {
        setHasError(false);
        setProfile(it.content);
        setTotalElement(it.totalElements);
      })
      .catch((e) => {
        setHasError(true);
        notify.error({ message: getErrorMessage(e) });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const actionDelete = (record: CorporateProfile) => {
    submitData(API_CORPORATE_REPORT.DELETE_CORP_PROFILE, { id: record.id })
      .then(() => {
        loadData();
        notify.success({ message: 'Your submission is pending approval.' });
      })
      .catch((e) => {
        notify.error({ message: getErrorMessage(e) });
      });
  };

  const actionComponent = (
    <Row justify="end">
      <Space>
        {permission?.includes('create') ? (
          <Link href="/corporate-report/corporate-profiles/add">
            <ThinButton type="primary" icon={<PlusOutlined />} size="large">
              Add New
            </ThinButton>
          </Link>
        ) : null}
        <ThinButton
          icon={<RedoOutlined />}
          onClick={() => {
            loadData();
            loadStaticData();
          }}
          size="large"
        >
          Reload
        </ThinButton>
      </Space>
    </Row>
  );

  useEffect(() => {
    loadStaticData();
  }, []);

  useEffect(() => {
    const uniqueCorporateId = Array.from(
      new Set((dropdownList ?? []).map((item) => item.corporateId).filter(Boolean))
    );
    setGroupCodeDropdown(uniqueCorporateId);

    const uniqueCorporateNameThai = Array.from(
      new Set((dropdownList ?? []).map((item) => item.corporateNameThai).filter(Boolean))
    );
    setCorporateNameThaiDropdown(uniqueCorporateNameThai);

    const uniqueCorporateNameEn = Array.from(
      new Set((dropdownList ?? []).map((item) => item.corporateNameEnglish).filter(Boolean))
    );
    setCorporateNameEnglishDropdown(uniqueCorporateNameEn);
  }, [dropdownList]);

  useEffect(() => {
    layoutContext.setSubComponentRight(actionComponent);
    loadData();
  }, [page, pageSize, searchValues, trigger]);

  changeTitle(
    layoutContext,
    [TITLE.CORP_REPORT, TITLE.CORP_REPORT_CORP_PROFILES],
    null,
    actionComponent
  );

  const columns: TableColumnsType<CorporateProfile> = [
    {
      title: 'ID',
      dataIndex: 'id',
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
      title: 'Corporate Name (Thai)',
      dataIndex: 'corporateNameThai',
      render: (val?: string) => (val ? val : '-'),
    },
    {
      title: 'Corporate Name (English)',
      dataIndex: 'corporateNameEnglish',
      render: (val?: string) => (val ? val : '-'),
    },
    {
      title: 'Remark',
      dataIndex: 'remark',
      render: (val?: string) => (val ? val : '-'),
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
    {
      title: 'Incoming Status',
      dataIndex: 'incomingStatus',
      render: (value: boolean) => (
        <Badge color={value ? 'green' : 'red'} text={value ? 'Active' : 'Inactive'} />
      ),
    },
  ];

  if (permission.includes('view') || permission.includes('delete') || permission.includes('edit')) {
    columns.push({
      title: <CenteredHeader>Actions</CenteredHeader>,
      width: 50,
      fixed: 'right',
      render: (_: unknown, record: CorporateProfile) => (
        <RowAction
          record={record}
          rowActionDetail={{
            edit: {
              action: (data) => {
                handleAction(data, 'edit');
              },
            },
            delete: {
              action: () => {
                actionDelete(record);
              },
            },
          }}
          permission={permission}
        />
      ),
    });
  }

  return (
    <AnimatedSubPage>
      <div>
        <Stack spacing={1} direction="row" sx={{ paddingBottom: 2 }}>
          <FormControl size="small" sx={{ m: 1, minWidth: 200 }}>
            <Autocomplete
              size="small"
              options={corporateIdDropdown ?? []}
              value={values.corporateId}
              onChange={(_, newValue) => {
                handleSelect('corporateId', newValue);
              }}
              disableClearable
              isOptionEqualToValue={(o, v) => o === v}
              renderInput={(params) => <TextField {...params} label="Corporate ID" />}
            />
          </FormControl>
          <FormControl size="small" sx={{ m: 1, minWidth: 200 }}>
            <Autocomplete
              size="small"
              options={corporateNameThaiDropdown ?? []}
              value={values.corporateNameThai ?? []}
              onChange={(_, newValue) => {
                handleSelect('corporateNameThai', newValue ?? '');
              }}
              disableClearable
              isOptionEqualToValue={(o, v) => o === v}
              renderInput={(params) => <TextField {...params} label="Corporate Name (Thai)" />}
            />
          </FormControl>
          <FormControl size="small" sx={{ m: 1, minWidth: 200 }}>
            <Autocomplete
              size="small"
              options={corporateNameEnglishDropdown ?? []}
              value={values.corporateNameEnglish ?? []}
              onChange={(_, newValue) => {
                handleSelect('corporateNameEnglish', newValue ?? '');
              }}
              disableClearable
              isOptionEqualToValue={(o, v) => o === v}
              renderInput={(params) => <TextField {...params} label="Corporate Name (English)" />}
            />
          </FormControl>

          <Button icon={<ClearOutlined />} size="large" onClick={clearFormValues}>
            Clear
          </Button>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            size="large"
            onClick={() => {
              setSearchValue(values);
              setPage(1);
              setTrigger(trigger + 1);
            }}
          >
            Search
          </Button>
        </Stack>
      </div>
      <CustomTable<CorporateProfile>
        rowKey="id"
        hasError={hasError}
        onRetry={loadData}
        columns={columns}
        dataSource={profile}
        loading={loading}
        size="small"
        scroll={{ x: 'max-content' }}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: totalElement,
          onChange: (newPage, newPageSize) => {
            handlePaginationChange(newPage, newPageSize);
          },
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} items`,
        }}
      />
    </AnimatedSubPage>
  );
}
