import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Switch,
  Select,
  Image,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { newsService, NewsArticle } from '@/services/news.service';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import axiosInstance from '@/lib/axios';

const { TextArea } = Input;

export default function NewsManagement() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPublished, setFilterPublished] = useState<string>('all');
  const [form] = Form.useForm();

  // Fetch danh sách tin tức
  const { data: newsData, isLoading } = useQuery({
    queryKey: ['news', filterCategory, filterPublished, searchText],
    queryFn: () =>
      newsService.getAllNews({
        search: searchText || undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        is_published: filterPublished === 'published' ? true : filterPublished === 'draft' ? false : undefined,
      }),
  });

  // Tạo slug từ title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Mutation: Tạo mới
  const createMutation = useMutation({
    mutationFn: (data: any) => newsService.createNews(data),
    onSuccess: () => {
      message.success('Tạo bài viết thành công');
      queryClient.invalidateQueries({ queryKey: ['news'] });
      setModalOpen(false);
      form.resetFields();
      setEditingNews(null);
    },
    onError: (err: any) => {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Có lỗi xảy ra';
      message.error(errorMessage);
    },
  });

  // Mutation: Cập nhật
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      newsService.updateNews(id, data),
    onSuccess: () => {
      message.success('Cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['news'] });
      setModalOpen(false);
      form.resetFields();
      setEditingNews(null);
    },
    onError: (err: any) => {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Có lỗi xảy ra';
      message.error(errorMessage);
    },
  });

  // Mutation: Xóa
  const deleteMutation = useMutation({
    mutationFn: (id: string) => newsService.deleteNews(id),
    onSuccess: () => {
      message.success('Đã xóa bài viết');
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
    onError: () => message.error('Không thể xóa bài viết'),
  });

  // Xử lý submit form
  const handleSubmit = async (values: any) => {
    // Tự động tạo slug nếu chưa có hoặc là temp-slug
    if (!values.slug || values.slug === 'temp-slug') {
      values.slug = generateSlug(values.title);
    }

    if (editingNews) {
      updateMutation.mutate({ id: editingNews.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  // Lấy danh sách categories từ dữ liệu
  const categories = Array.from(
    new Set(
      newsData?.data
        ?.map((item) => item.category)
        .filter((cat) => cat) as string[]
    )
  );

  // Columns cho bảng
  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: NewsArticle) => (
        <Space>
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <FileTextOutlined />
          </div>
          <div>
            <div className="font-medium">{title}</div>
            <div className="text-xs text-gray-400">{record.slug}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: (category?: string) =>
        category ? <Tag color="blue">{category}</Tag> : '-',
    },
    {
      title: 'Tác giả',
      dataIndex: 'author',
      key: 'author',
      render: (author?: string) => author || '-',
    },
    {
      title: 'Lượt xem',
      dataIndex: 'views',
      key: 'views',
      width: 100,
      render: (views: number) => (
        <Space>
          <EyeOutlined className="text-gray-400" />
          <span>{views}</span>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_published',
      key: 'is_published',
      width: 120,
      render: (is_published: boolean) =>
        is_published ? (
          <Tag color="green">Đã xuất bản</Tag>
        ) : (
          <Tag color="orange">Bản nháp</Tag>
        ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_: any, record: NewsArticle) => (
        <Space>
          <Button
            type="text"
            className="text-blue-500 hover:bg-blue-50"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingNews(record);
              const formValues = { ...record };
              if (formValues.slug === 'temp-slug' && formValues.title) {
                formValues.slug = generateSlug(formValues.title);
              }
              form.setFieldsValue(formValues);
              setModalOpen(true);
            }}
          />
          <Popconfirm
            title="Xóa bài viết?"
            description="Hành động này không thể hoàn tác!"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Card>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Quản lý Tin tức</h1>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingNews(null);
                form.resetFields();
                setModalOpen(true);
              }}
            >
              Thêm bài viết
            </Button>
          </div>

          {/* Filters */}
          <Space className="mb-4" wrap>
            <Input
              placeholder="Tìm kiếm theo tiêu đề, nội dung..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
            <Select
              placeholder="Danh mục"
              value={filterCategory}
              onChange={setFilterCategory}
              style={{ width: 150 }}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              {categories.map((cat) => (
                <Select.Option key={cat} value={cat}>
                  {cat}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder="Trạng thái"
              value={filterPublished}
              onChange={setFilterPublished}
              style={{ width: 150 }}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              <Select.Option value="published">Đã xuất bản</Select.Option>
              <Select.Option value="draft">Bản nháp</Select.Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={newsData?.data || []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            total: newsData?.total || 0,
            pageSize: newsData?.limit || 10,
            current: newsData?.page || 1,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bài viết`,
          }}
        />
      </Card>

      {/* Modal Form */}
      <Modal
        title={editingNews ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingNews(null);
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            is_published: false,
          }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder="Nhập tiêu đề bài viết" />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Slug (URL)"
            tooltip="Để trống để tự động tạo từ tiêu đề"
          >
            <Input placeholder="url-thân-thiện" />
          </Form.Item>

          <Form.Item name="excerpt" label="Tóm tắt">
            <TextArea
              rows={3}
              placeholder="Mô tả ngắn về bài viết"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item name="content" label="Nội dung">
            <TextArea
              rows={10}
              placeholder="Nhập nội dung HTML hoặc văn bản"
              showCount
            />
          </Form.Item>

          <Form.Item name="author" label="Tác giả">
            <Input placeholder="VD: BS. Nguyễn Văn A" />
          </Form.Item>

          <Form.Item name="category" label="Danh mục">
            <Input placeholder="VD: Sức khỏe tổng quát" />
          </Form.Item>

          <Form.Item name="image" label="Ảnh bìa (URL)">
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>

          {form.getFieldValue('image') && (
            <div className="mb-4">
              <Image
                src={form.getFieldValue('image')}
                alt="Preview"
                width={200}
                className="rounded"
              />
            </div>
          )}

          <Form.Item
            name="is_published"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch checkedChildren="Đã xuất bản" unCheckedChildren="Bản nháp" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingNews ? 'Cập nhật' : 'Tạo mới'}
              </Button>
              <Button
                onClick={() => {
                  setModalOpen(false);
                  form.resetFields();
                  setEditingNews(null);
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
