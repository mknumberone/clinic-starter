import { Form, Input, Row, Col } from 'antd';

export default function GeneralForm() {
    return (
        <Row gutter={16}>
            <Col span={8}>
                <Form.Item name={['clinical_data', 'blood_pressure']} label="Huyết áp (mmHg)">
                    <Input placeholder="120/80" />
                </Form.Item>
            </Col>
            <Col span={8}>
                <Form.Item name={['clinical_data', 'temperature']} label="Nhiệt độ (°C)">
                    <Input type="number" suffix="°C" />
                </Form.Item>
            </Col>
            <Col span={8}>
                <Form.Item name={['clinical_data', 'weight']} label="Cân nặng (kg)">
                    <Input type="number" suffix="kg" />
                </Form.Item>
            </Col>
            <Col span={24}>
                <Form.Item name={['clinical_data', 'note']} label="Ghi chú lâm sàng">
                    <Input.TextArea rows={2} />
                </Form.Item>
            </Col>
        </Row>
    );
}