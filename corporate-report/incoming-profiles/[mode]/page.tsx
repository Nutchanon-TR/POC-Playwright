'use client';
import React, { useEffect, useState } from 'react';
import { BackButton } from '@/components/common/BackButton';
import { ConfirmDeleteItem } from '@/components/common/ConfirmDeleteItem';
import { ConfirmEditItem } from '@/components/common/ConfirmEditItem';
import { TopicDetail } from '@/components/common/TopicDetail';
import { validateIsRequired, validateLenghtMax, validateLenghtMin } from '@/constants/message';
import { TITLE } from '@/constants/Title';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { useGlobalModal } from '@/contexts/ModalProvider';
import { useNavigationGuard } from '@/contexts/NavigationGuardProvider';
import { useNotify } from '@/contexts/NotificationContext';
import { getErrorMessage } from '@/utils/errorUtil';
import { PageResponse } from '@/interfaces/common/PageResponse';
import { TitleDetail } from '@/interfaces/common/TitleDetail';
import {
  IncomingProfileDropdownList,
  IncomingProfileFormValue,
} from '@/interfaces/corporate-report/IncomingProfile';
import { changeTitle } from '@/utils/breadCrumbUtil';
import { formatISODateToDDMMYYYY } from '@/utils/dateUtil';
import { areFormsEqual } from '@/utils/objectUtil';
import {
  ArrowLeftOutlined,
  ClearOutlined,
  DeleteOutlined,
  PlusOutlined,
  ProfileOutlined,
  RedoOutlined,
  SolutionOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { Button, DatePicker, Form, Input, Layout, Radio, Select, Space } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import dayjs from 'dayjs';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { back, cleanObject } from '@/utils/appUtils';
import { API_CORPORATE_REPORT } from '@/constants/api/ApiCorporateReport';
import { fetchData, submitData } from '@/utils/api';
import { SearchRequest } from '@/interfaces/common/request/SearchRequest';

const { Content } = Layout;
const ACCOUNT_TYPES = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
];

export default function AddIncomingProfile() {
  const DATE_FORMAT = 'DD/MM/YYYY';
  const [form] = Form.useForm<IncomingProfileFormValue>();
  const [loading, setLoading] = useState(true);
  const values = Form.useWatch([], form);
  const searchParams = useSearchParams();
  const layoutContext = useLayoutContext();
  const modal = useGlobalModal();
  const notify = useNotify();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const mode = params.mode; // 'add' or 'edit' or 'delete'
  const modeViewOrDelete = mode === 'view' || mode === 'delete';
  const { setUnsaved, confirmPush } = useNavigationGuard();
  const MAX_LIMIT_STR = '999,999,999,999.00';
  const MAX_INT_LENGTH = MAX_LIMIT_STR.split('.')[0].replace(/,/g, '').length;
  const modalBack = () => confirmPush();
  const [originalData, setOriginialData] = useState<IncomingProfileFormValue>(
    {} as IncomingProfileFormValue
  );
  const backButton = BackButton(() => modalBack(), <ArrowLeftOutlined />);
  const [submittable, setSubmittable] = React.useState<boolean>(false);
  const [corporateIdDropdown, setCorporateIdDropdown] =
    useState<(IncomingProfileDropdownList & { label: string; value: number })[]>();

  const submitForm = (values: IncomingProfileFormValue) => {
    setLoading(true);
    const profileId = corporateIdDropdown?.find((i) => i.corporateId == values.corporateId)?.id;
    const payload = {
      ...cleanObject(values),
      incomingProfileId: originalData.id,
      profileId: profileId,
      effectiveDate: dayjs(values.effectiveDate, 'DD/MM/YYYY').format('YYYY-MM-DD'),
    };
    submitData(
      mode === 'add'
        ? API_CORPORATE_REPORT.CREATE_INCOMING_PROFILE
        : API_CORPORATE_REPORT.UPDATE_INCOMING_PROFILE,
      payload
    )
      .then(() => {
        setUnsaved(false);
        setLoading(false);
        back(router, layoutContext);
        modal.success({
          icon: <CheckCircleOutlined />,
          title: 'Request Submitted!',
          content: 'Your submission is pending approval.',
        });
      })
      .catch((e) => {
        setLoading(false);
        notify.error({ message: getErrorMessage(e) });
      });
  };

  const resetData = () => {
    form.resetFields();
    form.setFieldsValue(originalData);
  };

  let title: TitleDetail =
    mode === 'add'
      ? TITLE.CORP_REPORT_INCOMING_PROFILE_ADD
      : TITLE.CORP_REPORT_INCOMING_PROFILE_EDIT;

  changeTitle(
    layoutContext,
    [TITLE.CORP_REPORT, TITLE.CORP_REPORT_INCOMING_PROFILE, title],
    backButton
  );

  useEffect(() => {
    setUnsaved(false);

    if (mode === 'add') {
      setLoading(false);
    } else if (mode === 'edit') {
      setLoading(true);

      const jsonValue = sessionStorage.getItem(searchParams.get('id') || '');
      if (!searchParams.get('id') || !jsonValue) {
        router.push(TITLE.CORP_REPORT_INCOMING_PROFILE.urlPath);
        return;
      }
      const queryValue = JSON.parse(jsonValue);
      const editIncomingProfileId = queryValue['incomingProfileId'];
      const editCorporateId = queryValue['corporateId'];
      const editAccountNo = queryValue['accountNo'];
      const editEffectiveDate = queryValue['effectiveDate'];
      const editActive = queryValue['isActive'];
      const editRemark = queryValue['remark'];
      sessionStorage.removeItem(searchParams.get('id') || '');
      router.replace(pathname);

      fetchData<PageResponse<IncomingProfileFormValue>>(API_CORPORATE_REPORT.GET_INCOMING_PROFILE, {
        incomingProfileId: editIncomingProfileId,
        corporateId: editCorporateId,
        accountNo: editAccountNo,
        effectiveDate: editEffectiveDate,
        isActive: editActive,
        remark: editRemark,
      })
        .then((it) => {
          const item = it.content[0];
          item.effectiveDate = formatISODateToDDMMYYYY(item.effectiveDate);
          setOriginialData(item);
          form.setFieldsValue(item);
        })
        .catch((e) => {
          notify.error({ message: getErrorMessage(e) });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  useEffect(() => {
    fetchData<IncomingProfileDropdownList[]>(API_CORPORATE_REPORT.GET_INCOMING_PROFILE_DROPDOWN, {
      type: 'CORPORATEIDFORCREATE',
    })
      .then((it) => {
        const mapped = it.map((code: any) => ({
          corporateId: code.corporateId,
          id: code.id,
          label: code.corporateId,
          value: code.corporateId,
        }));
        setCorporateIdDropdown(mapped);
      })
      .catch((e) => {
        notify.error({ message: getErrorMessage(e) });
      });
  }, []);

  useEffect(() => {
    const hasChanges = !areFormsEqual(form.getFieldsValue(), originalData);
    setUnsaved(hasChanges);
    form
      .validateFields({ validateOnly: true })
      .then(() => setSubmittable(hasChanges))
      .catch(() => setSubmittable(false));
  }, [form, values]);

  useEffect(() => {
    if (mode === 'add') {
      form.setFieldsValue({
        corporateId: undefined,
        isActive: true,
      });
    }
  }, [mode, form]);

  return (
    <>
      <Form
        form={form}
        name="validateOnly"
        validateMessages={{
          required: validateIsRequired,
          string: {
            min: validateLenghtMin,
            max: validateLenghtMax,
          },
        }}
        onFinish={submitForm}
        variant={'outlined'}
        layout="horizontal"
        className="max-w-[950px]"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 16 }}
        disabled={modeViewOrDelete}
      >
        <TopicDetail icon={<SolutionOutlined />} title="Corporate Information" />

        <div className="bg-white rounded-lg border border-gray-300 py-[3%]">
          <Form.Item label="Corporate Id" name="corporateId" rules={[{ required: true }]}>
            <Select
              placeholder="Select Corporate ID"
              options={corporateIdDropdown ?? []}
              onChange={(value) => {
                form.setFieldValue('corporateId', value);
              }}
              disabled={mode != 'add'}
            />
          </Form.Item>
        </div>

        <div className="mt-5">
          <TopicDetail icon={<ProfileOutlined />} title="Incoming Profile Details" />
          <div className="bg-white rounded-lg border border-gray-300 py-[3%]">
            <Form.Item
              label="Account No"
              name="accountNo"
              rules={[
                { required: true },
                {
                  pattern: /^\d{10}$/,
                  message: 'Please enter only numbers and must be 10 digits.',
                },
              ]}
            >
              <Input
                placeholder="Enter Account No"
                disabled={loading || modeViewOrDelete}
                maxLength={50}
                allowClear
              />
            </Form.Item>
            <Form.Item
              label="Effective Date"
              name="effectiveDate"
              rules={[{ required: true }]}
              getValueProps={(value) => ({ value: value ? dayjs(value, DATE_FORMAT) : null })}
              getValueFromEvent={(_, dateString) => dateString}
            >
              <DatePicker
                format={DATE_FORMAT}
                style={{ width: '100%' }}
                placeholder="Select Date"
                allowClear
                disabledDate={(current) => {
                  const effectiveDate = form.getFieldValue('effectiveDate');
                  const today = dayjs().startOf('day');
                  return (
                    (effectiveDate && current && current.isAfter(dayjs(effectiveDate), 'day')) ||
                    (current && current.isBefore(today, 'day'))
                  );
                }}
              />
            </Form.Item>
            <Form.Item label="Status" name="isActive" rules={[{ required: true }]}>
              <Radio.Group
                disabled={loading || modeViewOrDelete}
                buttonStyle="solid"
                className={modeViewOrDelete ? 'pointer-events-none' : ''}
              >
                {ACCOUNT_TYPES.map((at) => (
                  <Radio.Button key={at.label} value={at.value}>
                    {at.label}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Form.Item>
            <Form.Item
              label="Remark"
              name="remark"
              rules={[
                { required: false },
                {
                  pattern:
                    /^(?!\s)(?=.*\S)[a-zA-Z0-9\u0E00-\u0E7F .,!?()\[\]+\-_=/#@:\r\n]*(?<!\s)$/,
                  message:
                    'Please enter only Thai/English letters, numbers, spaces, new line and the symbols . , ! ? ( ) [ ] + - _ = / # @ : are allowed. No leading or trailing spaces.',
                },
              ]}
            >
              <TextArea placeholder="Enter Remark" showCount maxLength={200} />
            </Form.Item>
          </div>
        </div>

        <Content className="pt-5">
          <Form.Item wrapperCol={{ span: 24 }}>
            <div className="flex flex-col items-center">
              <Space>
                {mode == 'add' ? (
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    disabled={loading || !submittable}
                  >
                    <PlusOutlined />
                    Submit
                  </Button>
                ) : null}

                {mode == 'edit' ? (
                  <ConfirmEditItem
                    onConfirm={() => {
                      form.submit();
                    }}
                  >
                    <Button type="primary" loading={loading} disabled={loading || !submittable}>
                      <DeleteOutlined />
                      Submit
                    </Button>
                  </ConfirmEditItem>
                ) : null}

                {mode == 'add' || mode == 'edit' ? (
                  <Button danger disabled={loading} className="mx-2" onClick={() => modalBack()}>
                    Cancel
                  </Button>
                ) : null}

                {mode == 'add' ? (
                  <Button
                    disabled={loading}
                    className="thin-text"
                    icon={<ClearOutlined />}
                    onClick={resetData}
                  >
                    Clear
                  </Button>
                ) : null}

                {mode == 'edit' ? (
                  <Button
                    disabled={loading}
                    className="thin-text"
                    icon={<RedoOutlined />}
                    onClick={resetData}
                  >
                    Reset
                  </Button>
                ) : null}

                {mode == 'delete' ? (
                  <ConfirmDeleteItem
                    onConfirm={() => {
                      form.submit();
                    }}
                  >
                    <Button type="primary" danger loading={loading} disabled={loading}>
                      <DeleteOutlined />
                      Delete
                    </Button>
                  </ConfirmDeleteItem>
                ) : null}

                {modeViewOrDelete ? (
                  <Button
                    disabled={loading}
                    className="mx-2"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => modalBack()}
                  >
                    Back
                  </Button>
                ) : null}
              </Space>
            </div>
          </Form.Item>
        </Content>
      </Form>
    </>
  );
}
