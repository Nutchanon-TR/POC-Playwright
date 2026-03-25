'use client';
import AnimatedSubPage from '@/components/common/AnimatedSubPage';
import { CenteredHeader } from '@/components/common/CenteredHeader/CenteredHeader';
import CustomTable from '@/components/common/CustomTable';
import { RowAction } from '@/components/common/RowAction';
import { ThinButton } from '@/components/common/ThinButton';
import { THEME_COLORS } from '@/configs/customThemeConfig';
import { TITLE } from '@/constants/Title';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { useNotify } from '@/contexts/NotificationContext';
import { usePermission } from '@/contexts/PermissionProvider';
import { PageResponse } from '@/interfaces/common/PageResponse';
import { IncomingProfile, IncomingProfileDropdownList } from '@/interfaces/corporate-report/IncomingProfile';
import { cleanObject, setUrlParams } from '@/utils/appUtils';
import { changeTitle } from '@/utils/breadCrumbUtil';
import { formatDate, formatISODateToDDMMYYYY } from '@/utils/dateUtil';
import { formatAccountNo } from '@/utils/formatUtils';
import { fetchData, submitData } from '@/utils/api';
import { useFormValues } from '@/utils/stateUtil';
import { ClearOutlined, PlusOutlined, RedoOutlined, SearchOutlined } from '@ant-design/icons';
import { Autocomplete, FormControl, Stack, TextField } from '@mui/material';
import { Button, DatePicker, Row, Space, TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import { getErrorMessage } from '@/utils/errorUtil';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { API_CORPORATE_REPORT } from '@/constants/api/ApiCorporateReport';


const StyledRangePicker = styled(DatePicker.RangePicker)`
  &.ant-picker-range {
    border: 1px solid rgba(196, 196, 196, 1);
  }
  .ant-picker-input input {
    color: rgba(0, 0, 0, 0.88);
  }
  .ant-picker-input input::placeholder,
  .ant-picker-separator,
  .ant-picker-suffix {
    color: rgba(102, 102, 102, 1);
  }
`;

const renderStatus = (isActive: boolean) => {
  const value = isActive ? "Active" : "Inactive";
  const color = isActive ? '#52c41a' : '#ff4d4f';
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color,
          display: 'inline-block',
        }}
      />
      <span>{value}</span>
    </span>
  );
};

export default function IncomingProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const layoutContext = useLayoutContext();
  const notify = useNotify();
  const permission = usePermission().pathToPermission[TITLE.CORP_REPORT_INCOMING_PROFILE.urlPath]?.filter((item) => item !== 'view') || [];

  const handleAction = (data: IncomingProfile, path: 'view' | 'edit' | 'delete') => {
    const uuid = crypto.randomUUID();
    //Update case
    sessionStorage.setItem(
      uuid,
      JSON.stringify({
        incomingProfileId: data.id,
        // profileId: data.profileId,
        corporateId: data.corporateId,
        accountNo: data.accountNo,
        effectiveDate: data.effectiveDate,
        isActive: data.isActive,
        remark: data.remark,
      })
    );
    router.push(`${TITLE.CORP_REPORT_INCOMING_PROFILE.urlPath}/${path}?id=${uuid}`);
  };

  const actionDelete = (record: IncomingProfile) => {
    submitData(API_CORPORATE_REPORT.DELETE_INCOMING_PROFILE, { id: record.id })
      .then(() => {
        loadData();
        notify.success({ message: 'Your submission is pending approval.' });
      })
      .catch((e) => {
        notify.error({ message: getErrorMessage(e) });
      });
  };

  const columns: TableColumnsType<IncomingProfile> = [
    {
      title: 'ID',
      dataIndex: 'id',
      render: (_: any, __: IncomingProfile, index: number) => index + 1,
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
      render: (text: string) => formatISODateToDDMMYYYY(text),
    },
    {
      title: 'Remark',
      dataIndex: 'remark',
      ellipsis: true,
      render: (val?: string) => (val ? val : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      render: (isActive: boolean) => renderStatus(isActive),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdDate',
      width: 200,
      render: (val?: string) => formatDate(val),
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
    },
    {
      title: 'Updated Date',
      dataIndex: 'updatedDate',
      width: 200,
      render: (val?: string) => formatDate(val),
    },
    {
      title: 'Updated By',
      dataIndex: 'updatedBy',
      render: (val?: string) => (val ? val : '-'),
    },
  ];


  if (permission.includes('view') || permission.includes('delete') || permission.includes('edit')) {
    columns.push({
      title: <CenteredHeader>Actions</CenteredHeader>,
      width: 50,
      fixed: 'right',
      render: (_: unknown, record: IncomingProfile) => (
        <RowAction
          record={record}
          rowActionDetail={{
            view: {
              action: (data) => {
                handleAction(data, 'view');
              },
            },
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

  const { values, update, reset } = useFormValues({
    profileId: searchParams.get('profileId') || '',
    isActive: searchParams.get('isActive') || '',
    accountNo: searchParams.get('accountNo') || '',
    startDate: searchParams.get('startDate')?.trim() || '',
    endDate: searchParams.get('endDate')?.trim() || '',
  });

  const initialPage = Number(searchParams.get('page') || 1);
  const initialPageSize = Number(searchParams.get('pageSize') || 10);

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [loading, setLoading] = useState(true);
  const [searchValues, setSearchValue] = useState<typeof values>(values);
  const [profile, setProfile] = React.useState<IncomingProfile[]>([]);
  const [totalElement, setTotalElement] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [trigger, setTrigger] = useState(0);
  const [dropdownList, setDropdownList] = useState<IncomingProfileDropdownList[]>();
  const [corporateIdDropdown, setCorporateIdDropdown] = useState<string[]>();
  const [statusDropdown, setStatusDropdown] = useState<string[]>();

  async function loadData() {
    setSearchUrl();
    setLoading(true);

    const foundProfileId = dropdownList?.find(i => i.corporateId === searchValues.profileId)

    fetchData<PageResponse<IncomingProfile>>(API_CORPORATE_REPORT.GET_INCOMING_PROFILE, {
      page: page,
      size: pageSize,
      ...cleanObject(searchValues),
      isActive: searchValues.isActive === "Active" ? true : searchValues.isActive === "Inactive" ? false : null,
      profileId: foundProfileId ? foundProfileId.id : null,
    }).then((it) => {
      setHasError(false);
      setProfile(it.content);
      setTotalElement(it.totalElements);
    })
      .catch((e: any) => {
        setHasError(true);
        notify.error({ message: getErrorMessage(e) });
      })
      .finally(() => {
        setLoading(false);
      });
  }


  async function loadStaticData() {
    fetchData<IncomingProfileDropdownList[]>(API_CORPORATE_REPORT.GET_INCOMING_PROFILE_DROPDOWN, { type: "CORPORATEIDFORINQUIRY" }
    )
      .then((it) => {
        setDropdownList(Array.isArray(it) ? it : []);
      })
      .catch((error) => {
        notify.error({ message: getErrorMessage(error) });
      });
  };

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPage(page);
    setPageSize(pageSize);
  };

  const handleSelect = (
    type: 'profileId' | 'isActive',
    selectedValue: string
  ) => {
    update(type, selectedValue ?? '');
  };


  useEffect(() => {
    loadData();
  }, [page, pageSize, searchValues, trigger]);


  const clearFormValues = () => {
    update('profileId', '');
    update('isActive', '');
    update('accountNo', '');
    update('startDate', '');
    update('endDate', '');
    loadStaticData();
  };

  const actionComponent = (
    <Row justify="end">
      <Space>
        {permission?.includes('create') ? (
          <Link href="/corporate-report/incoming-profiles/add">
            <ThinButton type="primary" icon={<PlusOutlined />} size="large">
              Add New
            </ThinButton>
          </Link>
        ) : null}
        <ThinButton icon={<RedoOutlined />} onClick={loadData} size="large">
          Reload
        </ThinButton>
      </Space>
    </Row>
  );

  changeTitle(
    layoutContext,
    [TITLE.CORP_REPORT, TITLE.CORP_REPORT_INCOMING_PROFILE],
    null,
    actionComponent
  );

  const setSearchUrl = () => {
    const url = new URL(window.location.href);
    setUrlParams(url, values);
    url.searchParams.set('page', String(page));
    url.searchParams.set('pageSize', String(pageSize));

    window.history.replaceState(null, '', url.toString());
  };

  useEffect(() => {
    const uniqueGroupCodes = Array.from(
      new Set((dropdownList ?? []).map((item) => item.corporateId))
    );
    setCorporateIdDropdown(uniqueGroupCodes);
    setStatusDropdown(["Active", "Inactive"]);
  }, [dropdownList]);

  useEffect(() => {
    layoutContext.setSubComponentRight(actionComponent);
    loadData();
  }, [page, pageSize, searchValues, trigger]);

  useEffect(() => {
    loadStaticData();
  }, []);

  return (
    <AnimatedSubPage>
      <div>
        <Stack spacing={1} direction="row" sx={{ paddingBottom: 2 }}>
          <FormControl size="small" sx={{ m: 1, minWidth: 200 }}>
            <Autocomplete
              size="small"
              options={corporateIdDropdown ?? []}
              value={values.profileId}
              onChange={(_, newValue) => {
                handleSelect('profileId', newValue);
              }}
              disableClearable
              isOptionEqualToValue={(o, v) => o === v}
              renderInput={(params) => <TextField {...params} label="Corporate ID" />}
            />
          </FormControl>
          <FormControl size="small" sx={{ m: 1, minWidth: 200 }}>
            <Autocomplete
              size="small"
              options={statusDropdown ?? []}
              value={values.isActive ?? []}
              onChange={(_, newValue) => {
                handleSelect('isActive', newValue);
              }}
              disableClearable
              isOptionEqualToValue={(o, v) => o === v}
              renderInput={(params) => <TextField {...params} label="Status" />}
            />
          </FormControl>
          <FormControl size="small" sx={{ m: 1, minWidth: 200 }}>
            <StyledRangePicker
              value={[
                values.startDate ? dayjs(values.startDate) : null,
                values.endDate ? dayjs(values.endDate) : null,
              ]}
              onChange={(dates) => {
                update('startDate', dates?.[0]?.format('YYYY-MM-DD') || '');
                update('endDate', dates?.[1]?.format('YYYY-MM-DD') || '');
              }}
              format="YYYY-MM-DD"
              placeholder={['Start Date', 'End Date']}
              allowClear
              style={{ height: 40, width: '100%' }}
            />
          </FormControl>
          <TextField
            id="outlined-basic"
            label="Search By Allow Account"
            variant="outlined"
            size="small"
            fullWidth
            value={values.accountNo}
            onChange={(e) => update('accountNo', e.target.value)}
          />
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

      <CustomTable<IncomingProfile>
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
  )
}
