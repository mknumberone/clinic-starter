import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Layout, List, Avatar, Input, Button, Typography, Badge, Spin, Tooltip, Upload, message } from 'antd';
import {
    SendOutlined,
    UserOutlined,
    SearchOutlined,
    MoreOutlined,
    PaperClipOutlined,
    FileOutlined,
    CloseCircleFilled,
    LoadingOutlined
} from '@ant-design/icons';
import { useSocketStore } from '@/stores/socketStore';
import { useAuthStore } from '@/stores/authStore';
import { uploadService } from '@/services/upload.service';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import axiosInstance from '@/lib/axios';
import dayjs from 'dayjs';

const { Sider, Content } = Layout;
const { Text, Title } = Typography;

// --- INTERFACES ---
interface Conversation {
    id: string;
    updated_at: string;
    unread_count: number;
    participants: any[];
    messages: { content: string; created_at: string; type?: string }[];
}

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    type: 'TEXT' | 'IMAGE' | 'FILE';
    created_at: string;
    sender: { id: string; full_name: string; avatar?: string };
}

export default function ChatManagement() {
    // --- HOOKS ---
    const { socket } = useSocketStore();
    const { user } = useAuthStore();

    // --- STATES ---
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- 1. HÀM HELPER: ĐÁNH DẤU ĐÃ ĐỌC & CẬP NHẬT BADGE ---
    // Tách riêng hàm này để gọi ở nhiều nơi (khi click hội thoại, khi có tin nhắn mới)
    const markConversationAsRead = async (convId: string) => {
        try {
            // 1. Gọi API báo server đã đọc
            await axiosInstance.put(`/chat/read/${convId}`);

            // 2. Bắn sự kiện Global để DashboardLayout bắt được và cập nhật lại số trên chuông/menu
            window.dispatchEvent(new Event('clinic:refresh_badge'));

            // 3. Cập nhật state local để mất số đỏ ở list bên trái ngay lập tức
            setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c));
        } catch (error) {
            console.error("Lỗi đánh dấu đã đọc:", error);
        }
    };

    // --- 2. XỬ LÝ FILE & PREVIEW ---
    const handleBeforeUpload = (file: File) => {
        if (!selectedConvId) {
            message.warning('Vui lòng chọn hội thoại trước khi tải file!');
            return Upload.LIST_IGNORE;
        }
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('File phải nhỏ hơn 5MB!');
            return Upload.LIST_IGNORE;
        }
        setSelectedFile(file);
        return false;
    };

    useEffect(() => {
        if (!selectedFile) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [selectedFile]);

    // --- 3. GỬI TIN NHẮN ---
    const handleSend = async () => {
        if ((!inputText.trim() && !selectedFile) || !selectedConvId) return;

        setIsSending(true);
        try {
            let contentToSend = inputText;
            let typeToSend: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT';

            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const res = await axiosInstance.post('/chat/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                contentToSend = `chat/${res.data.filename}`;
                typeToSend = selectedFile.type.startsWith('image/') ? 'IMAGE' : 'FILE';
            }

            const optimisticMsg: Message = {
                id: `temp-${Date.now()}`,
                conversation_id: selectedConvId,
                sender_id: user?.id || '',
                content: contentToSend,
                type: typeToSend,
                created_at: new Date().toISOString(),
                sender: {
                    id: user?.id || '',
                    full_name: user?.full_name || 'Tôi',
                    avatar: user?.avatar
                }
            };

            setMessages(prev => [...prev, optimisticMsg]);
            scrollToBottom('smooth');

            setConversations(prev => {
                const newConversations = [...prev];
                const index = newConversations.findIndex(c => c.id === selectedConvId);
                if (index !== -1) {
                    const conv = newConversations[index];
                    newConversations.splice(index, 1);
                    newConversations.unshift({
                        ...conv,
                        messages: [{
                            content: contentToSend,
                            created_at: optimisticMsg.created_at,
                            type: typeToSend
                        }]
                    });
                }
                return newConversations;
            });

            socket?.emit('sendMessage', {
                conversationId: selectedConvId,
                content: contentToSend,
                type: typeToSend
            });

            setInputText('');
            setSelectedFile(null);
        } catch (error) {
            console.error('Lỗi gửi tin nhắn:', error);
            message.error('Gửi tin nhắn thất bại.');
        } finally {
            setIsSending(false);
        }
    };

    // --- 4. RENDER HELPERS ---
    const renderPreview = () => {
        if (!selectedFile) return null;
        const isImage = selectedFile.type.startsWith('image/');
        return (
            <div className="absolute bottom-[80px] left-6 right-6 bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-lg animate-fade-in z-20">
                <div className="relative w-14 h-14 flex-shrink-0">
                    {isImage ? (
                        <img src={previewUrl || ''} alt="preview" className="w-full h-full object-cover rounded-lg border border-gray-100" />
                    ) : (
                        <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                            <FileOutlined className="text-2xl text-indigo-500" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate mb-0.5">{selectedFile.name}</p>
                    <Button type="text" icon={<CloseCircleFilled className="text-gray-400 hover:text-red-500" />} onClick={() => setSelectedFile(null)} />
                </div>
            </div>
        );
    };

    const renderMessageContent = (msg: Message) => {
        const url = uploadService.getFileUrl(msg.content);
        if (msg.type === 'IMAGE') {
            return (
                <div className="max-w-[250px]">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt="sent" className="rounded-lg w-full h-auto border border-gray-200 hover:opacity-90" />
                    </a>
                </div>
            );
        }
        if (msg.type === 'FILE') {
            return (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><FileOutlined /></div>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-sm truncate max-w-[200px] text-inherit">{msg.content}</a>
                </div>
            );
        }
        return msg.content;
    };

    // --- 5. DATA FETCHING & SOCKET ---
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await axiosInstance.get('/chat/conversations');
                setConversations(res.data);
                if (socket && res.data.length > 0) {
                    res.data.forEach((conv: any) => socket.emit('joinRoom', conv.id));
                }
            } catch (error) { console.error(error); }
        };
        if (user) fetchConversations();
    }, [socket, user]);

    useEffect(() => {
        if (!socket) return;
        const handleNewMessage = (msg: any) => {
            const isMe = msg.sender_id === user?.id;

            // Nếu đang mở đúng hội thoại đó -> Đánh dấu đọc ngay & Cập nhật badge
            if (msg.conversation_id === selectedConvId && !isMe) {
                setMessages((prev) => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                scrollToBottom('smooth');

                // [QUAN TRỌNG] Gọi hàm mark read để xóa badge ngay khi nhận tin
                markConversationAsRead(selectedConvId!);
            }

            if (!isMe) {
                setConversations(prev => {
                    const newConversations = [...prev];
                    const index = newConversations.findIndex(c => c.id === msg.conversation_id);
                    if (index !== -1) {
                        const conv = newConversations[index];
                        newConversations.splice(index, 1);
                        newConversations.unshift({
                            ...conv,
                            messages: [{ content: msg.content, created_at: msg.created_at, type: msg.type }],
                            unread_count: (msg.conversation_id !== selectedConvId) ? (conv.unread_count || 0) + 1 : conv.unread_count
                        });
                    }
                    return newConversations;
                });

                // Nếu tin nhắn đến từ hội thoại KHÁC hội thoại đang mở -> Cần refresh badge tổng
                if (msg.conversation_id !== selectedConvId) {
                    window.dispatchEvent(new Event('clinic:refresh_badge'));
                }
            }
        };
        socket.on('newMessage', handleNewMessage);
        return () => { socket.off('newMessage', handleNewMessage); };
    }, [socket, selectedConvId, user]);

    // --- 6. LOGIC CHUYỂN HỘI THOẠI & CUỘN ---
    const handleSelectConversation = async (convId: string) => {
        if (selectedConvId === convId) return;

        setSelectedConvId(convId);
        setLoading(true);
        setSelectedFile(null);

        // [FIX] Gọi hàm mark read ngay lập tức (Song song với việc tải tin nhắn)
        // Không dùng await ở đây để giao diện phản hồi nhanh hơn
        markConversationAsRead(convId);

        try {
            socket?.emit('joinRoom', convId);
            const res = await axiosInstance.get('/chat/messages', { params: { conversationId: convId } });
            setMessages(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useLayoutEffect(() => {
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }
    }, [messages, selectedConvId]);

    const scrollToBottom = (behavior: ScrollBehavior = 'auto') =>
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior }), 50);

    const getPartner = (conv: Conversation) => {
        if (!conv.participants?.length) return { full_name: 'Unknown', avatar: null };
        const partner = conv.participants.find(p => p.user.id !== user?.id);
        return partner?.user || conv.participants[0].user;
    };

    const filteredConversations = conversations.filter((item) => {
        const partner = getPartner(item);
        const lastMsg = item.messages[0];
        let previewText = lastMsg?.content || "";
        if (lastMsg?.type === 'IMAGE') previewText = '[Hình ảnh]';
        if (lastMsg?.type === 'FILE') previewText = '[Tài liệu]';

        return `${partner.full_name} ${previewText}`.toLowerCase().includes(searchTerm.trim().toLowerCase());
    });

    const currentPartner = selectedConvId ? getPartner(conversations.find(c => c.id === selectedConvId) || { participants: [] } as any) : null;

    return (
        <DashboardLayout>
            <Layout className="bg-white h-[calc(100vh-120px)] rounded-xl overflow-hidden shadow-sm border border-gray-200 mt-2">
                {/* SIDEBAR */}
                <Sider width={340} theme="light" className="border-r border-gray-200 flex flex-col h-full">
                    <div className="p-4 border-b border-gray-100 flex-shrink-0">
                        <Title level={4} className="mb-4 text-indigo-700 font-bold">Tin nhắn</Title>
                        <Input
                            prefix={<SearchOutlined className="text-gray-400" />}
                            placeholder="Tìm kiếm..."
                            className="rounded-full bg-gray-50 border-none hover:bg-gray-100"
                            size="large"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar relative">
                        <List
                            itemLayout="horizontal"
                            dataSource={filteredConversations}
                            renderItem={(item) => {
                                const partner = getPartner(item);
                                const isSelected = item.id === selectedConvId;
                                const lastMsg = item.messages[0];
                                let previewText = "Chưa có tin nhắn";
                                if (lastMsg) {
                                    if (lastMsg.type === 'IMAGE') previewText = '[Hình ảnh]';
                                    else if (lastMsg.type === 'FILE') previewText = '[Tài liệu]';
                                    else previewText = lastMsg.content;
                                }

                                return (
                                    <List.Item
                                        className={`cursor-pointer px-5 py-4 hover:bg-gray-50 border-b border-gray-50 transition-colors
                                            ${isSelected ? 'bg-indigo-50 border-r-4 border-r-indigo-600' : ''}`}
                                        onClick={() => handleSelectConversation(item.id)}
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <Badge count={item.unread_count} offset={[-5, 5]} color="red">
                                                    <Avatar size={50} src={partner.avatar ? uploadService.getFileUrl(partner.avatar) : undefined} icon={<UserOutlined />} />
                                                </Badge>
                                            }
                                            title={
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <Text strong className="truncate max-w-[160px] text-[15px] text-gray-800">{partner.full_name}</Text>
                                                    <Text type="secondary" className="text-[11px]">{lastMsg ? dayjs(lastMsg.created_at).format('HH:mm') : ''}</Text>
                                                </div>
                                            }
                                            description={
                                                <Text className={`truncate block max-w-[200px] text-sm ${item.unread_count > 0 ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                                                    {previewText}
                                                </Text>
                                            }
                                        />
                                    </List.Item>
                                );
                            }}
                        />
                    </div>
                </Sider>

                {/* MAIN CHAT */}
                <Content className="flex flex-col bg-[#F3F4F6] relative h-full">
                    {selectedConvId && currentPartner ? (
                        <>
                            {/* Header */}
                            <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm z-10 flex-shrink-0 h-[73px]">
                                <div className="flex items-center gap-4">
                                    <Avatar size={48} src={currentPartner.avatar ? uploadService.getFileUrl(currentPartner.avatar) : undefined} icon={<UserOutlined />} />
                                    <div>
                                        <Title level={5} style={{ margin: 0 }}>{currentPartner.full_name}</Title>
                                        <div className="flex items-center gap-2"><Badge status="processing" color="green" /><Text type="secondary" className="text-xs">Đang hoạt động</Text></div>
                                    </div>
                                </div>
                                <Button type="text" shape="circle" icon={<MoreOutlined className="text-xl" />} />
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-y-2 min-h-0 relative">
                                {loading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
                                        <Spin indicator={<LoadingOutlined style={{ fontSize: 30 }} spin />} />
                                    </div>
                                ) : null}

                                {messages.map((msg, idx) => {
                                    const isMe = msg.sender_id === user?.id;
                                    const showTime = idx === 0 || dayjs(msg.created_at).diff(dayjs(messages[idx - 1].created_at), 'minute') > 15;

                                    return (
                                        <div key={msg.id} className="w-full">
                                            {showTime && (
                                                <div className="flex justify-center my-4">
                                                    <span className="text-[11px] text-gray-500 bg-gray-200/80 px-3 py-1 rounded-full">{dayjs(msg.created_at).format('HH:mm - DD/MM')}</span>
                                                </div>
                                            )}
                                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                                                {!isMe && (
                                                    <Avatar size={32} className="mr-2 mt-1" src={msg.sender.avatar ? uploadService.getFileUrl(msg.sender.avatar) : undefined} icon={<UserOutlined />} />
                                                )}
                                                <Tooltip title={dayjs(msg.created_at).format('HH:mm')} placement={isMe ? 'left' : 'right'}>
                                                    <div className={`!px-4 !py-3 max-w-[70%] rounded-2xl text-[15px] shadow-sm leading-relaxed break-words ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 rounded-tl-sm border border-gray-200'}`}>
                                                        {renderMessageContent(msg)}
                                                    </div>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
                                {renderPreview()}
                                <div className="flex gap-3 bg-gray-100 rounded-full px-4 py-2 border focus-within:border-indigo-300 transition-all focus-within:bg-white focus-within:shadow-md">
                                    <Upload showUploadList={false} beforeUpload={handleBeforeUpload} accept="image/*,.pdf,.doc,.docx" disabled={!!selectedFile}>
                                        <Button type="text" shape="circle" icon={<PaperClipOutlined className={selectedFile ? 'text-indigo-600' : 'text-gray-500'} />} />
                                    </Upload>
                                    <Input
                                        placeholder={selectedFile ? "Nhập mô tả..." : "Nhập tin nhắn..."}
                                        value={inputText}
                                        onChange={e => setInputText(e.target.value)}
                                        onPressEnter={handleSend}
                                        bordered={false}
                                        className="bg-transparent"
                                        disabled={isSending}
                                    />
                                    <Button type="primary" shape="circle" icon={isSending ? <LoadingOutlined /> : <SendOutlined />} onClick={handleSend} className="bg-indigo-600" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-300">
                            <div className="bg-gray-100 p-8 rounded-full mb-6"><UserOutlined style={{ fontSize: 64, color: '#d1d5db' }} /></div>
                            <Text className="text-gray-400 text-lg font-medium">Chọn một cuộc hội thoại để bắt đầu</Text>
                        </div>
                    )}
                </Content>
            </Layout>
            <style>{`
                .custom-scrollbar { scrollbar-gutter: stable; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar:hover::-webkit-scrollbar-track { background: #f1f5f9; }
                .ant-layout-sider-children { display: flex; flex-direction: column; height: 100%; }
            `}</style>
        </DashboardLayout>
    );
}