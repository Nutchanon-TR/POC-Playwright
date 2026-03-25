'use client';
import { BackButton } from '@/components/common/BackButton';
import { ConfirmEditItem } from '@/components/common/ConfirmEditItem';
import { CopyButton } from '@/components/common/CopyButton';
import { EmailListFormItem } from '@/components/common/EmailListFormItem';
import { TopicDetail } from '@/components/common/TopicDetail';
import { API_CORPORATE_REPORT } from '@/constants/api/ApiCorporateReport';
import { validateIsRequired, validateLenghtMax, validateLenghtMin } from '@/constants/message';
import { TITLE } from '@/constants/Title';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { useGlobalModal } from '@/contexts/ModalProvider';
import { useNavigationGuard } from '@/contexts/NavigationGuardProvider';
import { useNotify } from '@/contexts/NotificationContext';
import { PageResponse } from '@/interfaces/common/PageResponse';
import { TitleDetail } from '@/interfaces/common/TitleDetail';
import { CorporateProfile, CorporateProfileFormValue } from '@/interfaces/corporate-report/Profile';
import { fetchData, submitData } from '@/utils/api';
import { back, cleanObject } from '@/utils/appUtils';
import { changeTitle } from '@/utils/breadCrumbUtil';
import { getErrorMessage } from '@/utils/errorUtil';
import { areFormsEqual } from '@/utils/objectUtil';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  PlusOutlined,
  ProfileOutlined,
  RedoOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { Button, Checkbox, Form, Input, Layout, Radio, Select, Space } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const { Content } = Layout;

const SENDING_TYPES = [
  { label: 'sFTP', value: 'SFTP' },
  { label: 'Email', value: 'EMAIL' },
];

export default function EditCorporateProfile() {
  const [form] = Form.useForm<CorporateProfileFormValue>();
  const [loading, setLoading] = useState(true);

  const [originalData, setOriginalData] = useState<CorporateProfile>({} as CorporateProfile);
  const [submittable, setSubmittable] = React.useState<boolean>(false);

  const values = Form.useWatch([], form);
  const sendType = Form.useWatch('sendType', form);
  const searchParams = useSearchParams();
  const layoutContext = useLayoutContext();
  const modal = useGlobalModal();
  const notify = useNotify();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  const mode = params.mode; // 'view' or 'add' or 'edit'
  const modeViewOrDelete = mode === 'view' || mode === 'delete';
  const { setUnsaved, confirmPush } = useNavigationGuard();

  const modalBack = () => confirmPush();
  const backButton = BackButton(() => modalBack(), <ArrowLeftOutlined />);

  const submitForm = (values: CorporateProfileFormValue) => {
    if (values?.emails && Array.isArray(values.emails)) {
      values.emails = values.emails.join(';');
    }
    const { id, sendEmailRound, ...rest } = values || {};
    const payload = {
      profileId: id,
      ...cleanObject(rest),
      ...mapFormToRounds(sendEmailRound),
    };
    setLoading(true);
    submitData(
      mode === 'add'
        ? API_CORPORATE_REPORT.CREATE_CORP_PROFILE
        : API_CORPORATE_REPORT.UPDATE_CORP_PROFILE,
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

  const mapFormToRounds = (rounds: number[] = []) => ({
    isRound1Enabled: rounds.includes(1),
    isRound2Enabled: rounds.includes(2),
    isRound3Enabled: rounds.includes(3),
  });

  const mapRoundsToForm = (data: CorporateProfile): number[] => {
    const rounds: number[] = [];
    if (data.isRound1Enabled) rounds.push(1);
    if (data.isRound2Enabled) rounds.push(2);
    if (data.isRound3Enabled) rounds.push(3);
    return rounds;
  };

  let title: TitleDetail =
    mode === 'add' ? TITLE.CORP_REPORT_CORP_PROFILES_ADD : TITLE.CORP_REPORT_CORP_PROFILES_EDIT;

  changeTitle(
    layoutContext,
    [TITLE.CORP_REPORT, TITLE.CORP_REPORT_CORP_PROFILES, title],
    backButton
  );

  useEffect(() => {
    setUnsaved(false);

    if (mode === 'add') {
      form.setFieldValue('sendType', SENDING_TYPES[0].value);
      setLoading(false);
    } else if (mode === 'edit') {
      setLoading(true);

      const jsonValue = sessionStorage.getItem(searchParams.get('id') || '');

      if (!searchParams.get('id') || !jsonValue) {
        router.push(TITLE.CORP_REPORT_CORP_PROFILES.urlPath);
        return;
      }

      const queryValue = JSON.parse(jsonValue);
      const editCorporateId = queryValue['corporateId'];
      const editCorporateNameThai = queryValue['corporateNameThai'];
      const editCorporateNameEnglish = queryValue['corporateNameEnglish'];
      sessionStorage.removeItem(searchParams.get('id') || '');
      router.replace(pathname);

      fetchData<PageResponse<CorporateProfile>>(API_CORPORATE_REPORT.GET_CORP_PROFILE, {
        corporateId: editCorporateId,
        corporateNameThai: editCorporateNameThai,
        corporateNameEnglish: editCorporateNameEnglish,
      })
        .then(async (it) => {
          const data = it.content[0];

          const emails =
            typeof data.emails === 'string'
              ? data.emails.split(';').map((e: string) => e.trim())
              : data.emails;
          const sendEmailRound = mapRoundsToForm(data);

          const formData = {
            ...data,
            emails,
            sendEmailRound,
          };

          setOriginalData(formData);
          form.setFieldsValue(formData);
        })
        .catch((e) => {
          notify.error({ message: getErrorMessage(e) });
        })
        .finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    const hasChanges = !areFormsEqual(form.getFieldsValue(), originalData);
    setUnsaved(hasChanges);
    form
      .validateFields({ validateOnly: true })
      .then(() => setSubmittable(hasChanges))
      .catch(() => setSubmittable(false));
  }, [form, values]);

  return (
    <>
      <Form<CorporateProfileFormValue>
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
        className="max-w-237.5"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 16 }}
        disabled={mode == 'delete'}
      >
        <TopicDetail icon={<ProfileOutlined />} title="Corporate Profile Details" />
        <div className="bg-white rounded-lg border border-gray-300 py-[3%]">
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Sending Type"
            name="sendType"
            className={modeViewOrDelete ? 'pointer-events-none' : ''}
            rules={[{ required: true }]}
          >
            <Radio.Group disabled={loading || modeViewOrDelete} buttonStyle="solid">
              {SENDING_TYPES.map((at) => (
                <Radio.Button key={at.value} value={at.value}>
                  {at.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="Corporate ID"
            name="corporateId"
            className={modeViewOrDelete ? 'pointer-events-none' : ''}
            rules={[
              { required: true },
              { max: 15, message: 'Must be 15 characters or less.' },
              {
                pattern: /^[a-zA-Z0-9-]+(?: [a-zA-Z0-9-]+)*$/,
                message:
                  'Please enter only letters, numbers, spaces and the symbols - are allowed. No leading or trailing spaces.',
              },
            ]}
          >
            <Input
              placeholder="Enter corporate ID"
              disabled={loading || modeViewOrDelete || mode === 'edit'}
            />
          </Form.Item>

          <Form.Item
            label="Corporate Name (Thai)"
            name="corporateNameThai"
            className={modeViewOrDelete ? 'pointer-events-none' : ''}
            rules={[
              { required: true },
              { max: 100, message: 'Must be 100 characters or less.' },
              {
                pattern: /^[\u0E00-\u0E7F0-9.,&\-()'?+/]+(?: [\u0E00-\u0E7F0-9.,&\-()'?+/]+)*$/,
                message:
                  "Please enter only Thai letters, numbers, spaces, and the symbols . , & - ' ( ) ? + / are allowed. No leading or trailing spaces.",
              },
            ]}
          >
            <Input
              placeholder="Enter corporate name in Thai"
              disabled={loading || modeViewOrDelete}
            />
          </Form.Item>

          <Form.Item
            label="Corporate Name (English)"
            name="corporateNameEnglish"
            className={modeViewOrDelete ? 'pointer-events-none' : ''}
            rules={[
              { required: true },
              { max: 100, message: 'Must be 100 characters or less.' },
              {
                pattern: /^[a-zA-Z0-9.,&\-()'?+/]+(?: [a-zA-Z0-9.,&\-()'?+/]+)*$/,
                message:
                  "Please enter only English letters, numbers, spaces, and the symbols . , & - ' ( ) ? + / are allowed. No leading or trailing spaces.",
              },
            ]}
          >
            <Input
              placeholder="Enter corporate name in English"
              disabled={loading || modeViewOrDelete}
            />
          </Form.Item>

          {sendType == SENDING_TYPES[1].value && ( // Email types
            <>
              <Form.Item
                label="Tax ID"
                name="taxId"
                className={modeViewOrDelete ? 'pointer-events-none' : ''}
                rules={[
                  { required: true },
                  {
                    pattern: /^\d+$/,
                    message: 'Please enter only numeric digits',
                  },
                  {
                    min: 13,
                    message: 'Please enter at least 13 numeric digits',
                  },
                  {
                    max: 25,
                    message: 'Please enter Tax ID with maximum of 25 digits',
                  },
                ]}
              >
                <Input placeholder="Enter tax id" disabled={loading || modeViewOrDelete} />
              </Form.Item>

              <EmailListFormItem
                form={form}
                name="emails"
                label="Email"
                required={true}
                copyButton={true}
                rules={{
                  maxCount: 10,
                  maxInputLength: 500
                }}
                isVisibleEmailCount={true}
              />

              <Form.Item
                label="Send Email Round"
                name="sendEmailRound"
                className={modeViewOrDelete ? 'pointer-events-none' : ''}
                rules={[{ required: true }]}
              >
                <Checkbox.Group
                  disabled={loading || modeViewOrDelete}
                  style={{ display: 'flex', flexDirection: 'column' }}
                >
                  <Checkbox value={1}>Round 1 (09.00)</Checkbox>
                  <Checkbox value={2}>Round 2 (13.00)</Checkbox>
                  <Checkbox value={3}>Round 3 (17.00)</Checkbox>
                </Checkbox.Group>
              </Form.Item>
            </>
          )}

          <Form.Item
            label="Remark"
            name="remark"
            className={modeViewOrDelete ? 'pointer-events-none' : ''}
            rules={[
              { required: false },
              {
                pattern: /^(?!\s)(?=.*\S)[a-zA-Z0-9\u0E00-\u0E7F .,!?()\[\]+\-_=/#@:\r\n]*(?<!\s)$/,
                message:
                  'Please enter only Thai/English letters, numbers, spaces, new line and the symbols . , ! ? ( ) [ ] + - _ = / # @ : are allowed. No leading or trailing spaces.',
              },
            ]}
          >
            <TextArea
              disabled={loading || modeViewOrDelete}
              placeholder="A tiny note could go a long way"
              showCount
              maxLength={200}
              allowClear
            />
          </Form.Item>
        </div>

        {/* Button Section */}
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
                      <SaveOutlined />
                      Save
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
