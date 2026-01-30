import { useState, useEffect } from 'react';
import { Modal, Table, Descriptions, Button, Radio, InputNumber, Typography, message, Divider, Tag, Alert } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService, Invoice } from '@/services/invoice.service';
import { CheckCircleOutlined, PrinterOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Props {
    invoice: Invoice | null;
    open: boolean;
    onCancel: () => void;
}

export default function PaymentModal({ invoice, open, onCancel }: Props) {
    const queryClient = useQueryClient();
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [receivedAmount, setReceivedAmount] = useState<number>(0); // Tiền khách đưa

    // Reset state khi mở modal mới
    useEffect(() => {
        if (invoice) {
            setReceivedAmount(Number(invoice.total_amount));
        }
    }, [invoice]);

    const paymentMutation = useMutation({
        mutationFn: (data: any) => invoiceService.createPayment(data),
        onSuccess: () => {
            message.success('Thanh toán thành công! Kho thuốc đã được cập nhật.');
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            onCancel();
            // Có thể thêm logic in hóa đơn tại đây
        },
        onError: (err: any) => {
            message.error(err.response?.data?.message || 'Lỗi thanh toán');
        }
    });

    const handlePayment = () => {
        if (!invoice) return;

        if (receivedAmount < Number(invoice.total_amount)) {
            message.warning('Số tiền khách đưa chưa đủ!');
            return;
        }

        paymentMutation.mutate({
            invoice_id: invoice.id,
            amount: Number(invoice.total_amount), // Thanh toán full
            payment_method: paymentMethod
        });
    };

    if (!invoice) return null;

    const columns = [
        { title: 'Tên thuốc / Dịch vụ', dataIndex: 'description' },
        { title: 'SL', dataIndex: 'quantity', align: 'center' as const },
        {
            title: 'Thành tiền',
            dataIndex: 'amount',
            align: 'right' as const,
            render: (val: any) => Number(val).toLocaleString() + ' đ'
        }
    ];

    const changeAmount = receivedAmount - Number(invoice.total_amount);

    return (
        <Modal
            title={<Title level={4}>Thanh toán Hóa đơn</Title>}
            open={open}
            onCancel={onCancel}
            footer={null}
            width={700}
        >
            {/* Thông tin bệnh nhân */}
            <Descriptions column={2} bordered size="small" className="mb-4">
                <Descriptions.Item label="Bệnh nhân"><b>{invoice.patient?.user?.full_name}</b></Descriptions.Item>
                <Descriptions.Item label="SĐT">{invoice.patient?.user?.phone}</Descriptions.Item>
                <Descriptions.Item label="Mã HĐ"><Tag color="blue">#{invoice.id.slice(0, 8)}</Tag></Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                    <Tag color={invoice.status === 'PAID' ? 'green' : 'red'}>{invoice.status}</Tag>
                </Descriptions.Item>
            </Descriptions>

            {/* Chi tiết đơn hàng */}
            <Table
                dataSource={invoice.items}
                columns={columns}
                pagination={false}
                size="small"
                summary={() => (
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={2}><Text strong>TỔNG CỘNG:</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                            <Text strong type="danger" className="text-lg">
                                {Number(invoice.total_amount).toLocaleString()} đ
                            </Text>
                        </Table.Summary.Cell>
                    </Table.Summary.Row>
                )}
            />

            <Divider />

            {/* Form Thanh toán (Chỉ hiện nếu chưa thanh toán) */}
            {invoice.status === 'UNPAID' ? (
                <div className="bg-gray-50 p-4 rounded">
                    <div className="mb-4">
                        <Text strong className="block mb-2">Phương thức thanh toán:</Text>
                        <Radio.Group value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} buttonStyle="solid">
                            <Radio.Button value="CASH">Tiền mặt</Radio.Button>
                            <Radio.Button value="TRANSFER">Chuyển khoản</Radio.Button>
                            <Radio.Button value="CARD">Thẻ</Radio.Button>
                        </Radio.Group>
                    </div>

                    {paymentMethod === 'CASH' && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <Text className="block mb-1">Khách đưa:</Text>
                                <InputNumber
                                    style={{ width: '100%' }}
                                    value={receivedAmount}
                                    onChange={(val) => setReceivedAmount(val || 0)}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    addonAfter="đ"
                                    size="large"
                                />
                            </div>
                            <div>
                                <Text className="block mb-1">Tiền thừa:</Text>
                                <InputNumber
                                    style={{ width: '100%' }}
                                    value={changeAmount}
                                    disabled
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    addonAfter="đ"
                                    size="large"
                                    className={changeAmount < 0 ? 'text-red-500' : 'text-green-600'}
                                />
                            </div>
                        </div>
                    )}

                    <Button
                        type="primary"
                        block
                        size="large"
                        icon={<CheckCircleOutlined />}
                        onClick={handlePayment}
                        loading={paymentMutation.isPending}
                        className="bg-green-600 hover:bg-green-500 mt-2"
                    >
                        XÁC NHẬN THANH TOÁN
                    </Button>
                </div>
            ) : (
                <div className="text-center">
                    <Alert message="Hóa đơn này đã được thanh toán hoàn tất." type="success" showIcon />
                    <Button icon={<PrinterOutlined />} className="mt-4">In Hóa Đơn</Button>
                </div>
            )}
        </Modal>
    );
}