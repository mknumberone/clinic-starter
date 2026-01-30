import axiosInstance from '../lib/axios';
import { Platform } from 'react-native';

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    type: 'TEXT' | 'IMAGE' | 'FILE';
    created_at: string;
    sender: { id: string; full_name: string; avatar?: string };
}

export const chatService = {
    // 1. Lấy hội thoại
    getMyConversation: async () => {
        const res = await axiosInstance.get('/chat/conversations');
        return res.data[0] || null;
    },

    // 2. Lấy tin nhắn
    getMessages: (conversationId: string) => {
        return axiosInstance.get('/chat/messages', { params: { conversationId } }).then(res => res.data);
    },

    // 3. Upload ảnh (ĐÃ SỬA CHO CHUẨN REACT NATIVE)
    uploadImage: async (imageUri: string) => {
        const formData = new FormData();

        // Tạo tên file ngẫu nhiên hoặc lấy từ đường dẫn
        const filename = imageUri.split('/').pop() || `upload_${Date.now()}.jpg`;

        // Chuẩn hóa đường dẫn URI cho Android
        // Trên Android, uri thường đã có 'file://', nhưng đôi khi cần giữ nguyên
        const uri = Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri;

        // BẮT BUỘC phải có object dạng này để React Native hiểu là file upload
        const fileData = {
            uri: uri,
            name: filename,
            type: 'image/jpeg', // Định dạng ảnh (quan trọng)
        } as any;

        formData.append('file', fileData);

        // Gửi request multipart/form-data
        const res = await axiosInstance.post('/chat/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                // Nếu axiosInstance đã có interceptor thêm token thì ko cần thêm ở đây
            },
            transformRequest: (data, headers) => {
                // Hack nhỏ để tránh axios tự động stringify FormData trên RN cũ
                return formData;
            },
        });

        return res.data; // Server trả về { filename: '...' }
    }
};