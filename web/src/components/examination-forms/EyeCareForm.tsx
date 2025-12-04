import { Form, Input, Row, Col, Card } from 'antd';

export default function EyeCareForm() {
    return (
        <Card title="Chỉ số khúc xạ" size="small" className="mb-4">
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name={['clinical_data', 'left_eye']} label="Mắt trái (L)">
                        <Input suffix="độ" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name={['clinical_data', 'right_eye']} label="Mắt phải (R)">
                        <Input suffix="độ" />
                    </Form.Item>
                </Col>
            </Row>
        </Card>
    );
}