import { useEffect, useState, useRef } from 'react';
import { Layout, List, Avatar, Input, Button, Typography, Badge, Empty, Spin, Tooltip, Upload, message } from 'antd';
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

    // State cho chức năng File/Ảnh
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- 1. XỬ LÝ CHỌN FILE (PREVIEW) ---
    const handleBeforeUpload = (file: File) => {
        if (!selectedConvId) {
            message.warning('Vui lòng chọn hội thoại trước khi tải file!');
            return Upload.LIST_IGNORE;
        }

        // Kiểm tra kích thước file < 5MB
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('File phải nhỏ hơn 5MB!');
            return Upload.LIST_IGNORE;
        }

        // Lưu vào state để hiển thị preview
        setSelectedFile(file);
        return false; // Ngăn không cho Antd tự động upload ngay
    };

    // --- 2. GỬI TIN NHẮN (OPTIMISTIC UPDATE) ---
    const handleSend = async () => {
        if ((!inputText.trim() && !selectedFile) || !selectedConvId) return;

        setIsSending(true);
        try {
            let contentToSend = inputText;
            let typeToSend: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT';

            // TRƯỜNG HỢP A: CÓ FILE
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);

                // 1. Upload file lên server
                const res = await axiosInstance.post('/chat/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                contentToSend = `chat/${res.data.filename}`;
                // Xác định loại file (IMAGE hay FILE thường)
                typeToSend = selectedFile.type.startsWith('image/') ? 'IMAGE' : 'FILE';
            }

            // --- BƯỚC QUAN TRỌNG: CẬP NHẬT UI NGAY LẬP TỨC (KHÔNG CHỜ SOCKET) ---
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

            // 1. Thêm vào danh sách tin nhắn hiện tại
            setMessages(prev => [...prev, optimisticMsg]);
            scrollToBottom();

            // 2. Cập nhật danh sách hội thoại bên trái (đưa lên đầu)
            setConversations(prev => {
                const newConversations = [...prev];
                const index = newConversations.findIndex(c => c.id === selectedConvId);

                if (index !== -1) {
                    const conv = newConversations[index];
                    // Xóa vị trí cũ
                    newConversations.splice(index, 1);
                    // Thêm vào đầu danh sách với nội dung mới
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

            // 3. Gửi Socket đi (Server sẽ xử lý lưu DB và gửi cho người nhận)
            socket?.emit('sendMessage', {
                conversationId: selectedConvId,
                content: contentToSend,
                type: typeToSend
            });

            // 4. Reset form
            setInputText('');
            setSelectedFile(null);

        } catch (error) {
            console.error('Lỗi gửi tin nhắn:', error);
            message.error('Gửi tin nhắn thất bại. Vui lòng thử lại.');
        } finally {
            setIsSending(false);
        }
    };

    // --- 3. COMPONENT HIỂN THỊ PREVIEW FILE ---
    const renderPreview = () => {
        if (!selectedFile) return null;

        const isImage = selectedFile.type.startsWith('image/');
        const previewUrl = URL.createObjectURL(selectedFile);

        return (
            <div className="absolute bottom-[80px] left-6 right-6 bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-lg animate-fade-in z-20">
                <div className="relative w-14 h-14 flex-shrink-0">
                    {isImage ? (
                        <img
                            src={previewUrl}
                            alt="preview"
                            className="w-full h-full object-cover rounded-lg border border-gray-100"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                            <FileOutlined className="text-2xl text-indigo-500" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate mb-0.5">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Nhấn gửi để upload
                    </p>
                </div>
                <Button
                    type="text"
                    icon={<CloseCircleFilled className="text-gray-400 hover:text-red-500 text-xl" />}
                    onClick={() => setSelectedFile(null)}
                />
            </div>
        );
    };

    // --- 4. HÀM RENDER NỘI DUNG TIN NHẮN (TEXT/IMAGE/FILE) ---
    const renderMessageContent = (msg: Message) => {
        const url = uploadService.getFileUrl(msg.content);

        if (msg.type === 'IMAGE') {
            return (
                <div className="max-w-[250px]">
                    <img
                        src={url}
                        alt="sent image"
                        className="rounded-lg w-full h-auto cursor-pointer border border-gray-200 hover:opacity-90 transition-opacity"
                        onClick={() => window.open(url, '_blank')}
                    />
                </div>
            );
        }
        if (msg.type === 'FILE') {
            return (
                <div className="flex items-center gap-2" title={msg.content}>
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                        <FileOutlined />
                    </div>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-sm truncate max-w-[200px]"
                        style={{ color: 'inherit' }}
                    >
                        {msg.content}
                    </a>
                </div>
            );
        }
        // Mặc định là TEXT
        return msg.content;
    };

    // --- USE EFFECTS ---
    useEffect(() => {
        fetchConversations();
    }, []);
    // --- 1. USE EFFECT KHỞI TẠO (QUAN TRỌNG) ---
    useEffect(() => {
        const fetchAndJoin = async () => {
            try {
                const res = await axiosInstance.get('/chat/conversations');
                setConversations(res.data);

                // --- THÊM: Join vào socket của TẤT CẢ hội thoại để nhận noti realtime ---
                if (socket && res.data.length > 0) {
                    res.data.forEach((conv: any) => {
                        socket.emit('joinRoom', conv.id);
                    });
                }
            } catch (error) {
                console.error("Lỗi tải hội thoại:", error);
            }
        };

        if (user) {
            fetchAndJoin();
        }
    }, [socket, user]); // Chạy lại khi socket kết nối thành công

    // Lắng nghe socket
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg: any) => {
            const isMe = msg.sender_id === user?.id;

            // A. XỬ LÝ TRONG CUỘC HỘI THOẠI ĐANG MỞ
            if (msg.conversation_id === selectedConvId) {
                // Nếu là tin nhắn CỦA MÌNH -> Bỏ qua (vì đã add ở handleSend rồi)
                // Nếu là tin nhắn CỦA NGƯỜI KHÁC -> Add vào list
                if (!isMe) {
                    setMessages((prev) => {
                        // Tránh trùng lặp
                        if (prev.some(m => m.id === msg.id)) return prev;
                        return [...prev, msg];
                    });
                    scrollToBottom();

                    // Đánh dấu đã đọc ngay
                    axiosInstance.put(`/chat/read/${selectedConvId}`).then(() => {
                        window.dispatchEvent(new Event('clinic:refresh_badge'));
                    });
                }
            }

            // B. CẬP NHẬT DANH SÁCH HỘI THOẠI (SIDEBAR)
            // Chỉ cập nhật nếu là tin nhắn từ NGƯỜI KHÁC (tin của mình đã cập nhật ở handleSend)
            if (!isMe) {
                setConversations(prev => {
                    const newConversations = [...prev];
                    const index = newConversations.findIndex(c => c.id === msg.conversation_id);

                    if (index !== -1) {
                        const conv = newConversations[index];
                        // Tính số tin chưa đọc mới
                        const newUnread = (msg.conversation_id !== selectedConvId)
                            ? (conv.unread_count || 0) + 1
                            : conv.unread_count;

                        // Xóa vị trí cũ
                        newConversations.splice(index, 1);
                        // Thêm vào đầu danh sách
                        newConversations.unshift({
                            ...conv,
                            messages: [{
                                content: msg.content,
                                created_at: msg.created_at,
                                type: msg.type
                            }],
                            unread_count: newUnread
                        });
                    } else {
                        // Nếu là hội thoại mới hoàn toàn -> Load lại danh sách cho chắc
                        fetchConversations();
                    }
                    return newConversations;
                });
            }
        };

        socket.on('newMessage', handleNewMessage);

        // Cleanup socket listener để tránh duplicate
        return () => {
            socket.off('newMessage', handleNewMessage);
        };
    }, [socket, selectedConvId, user]);

    // --- API CALLS ---
    const fetchConversations = async () => {
        try {
            const res = await axiosInstance.get('/chat/conversations');
            setConversations(res.data);
        } catch (error) {
            console.error("Lỗi tải hội thoại:", error);
        }
    };

    const handleSelectConversation = async (convId: string) => {
        setSelectedConvId(convId);
        setLoading(true);
        setSelectedFile(null); // Reset file đang chọn dở

        // Reset unread count trên UI ngay lập tức
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c));

        try {
            socket?.emit('joinRoom', convId);
            const res = await axiosInstance.get('/chat/messages', { params: { conversationId: convId } });
            setMessages(res.data);

            // Gọi API mark read
            await axiosInstance.put(`/chat/read/${convId}`);

            // Dispatch event để ChatWidget cập nhật lại số badge tổng
            window.dispatchEvent(new Event('clinic:refresh_badge'));

            scrollToBottom();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    // Helper lấy thông tin người chat cùng
    const getPartner = (conv: Conversation) => {
        if (!conv.participants || conv.participants.length === 0) return { full_name: 'Unknown', avatar: null };
        const partner = conv.participants.find(p => p.user.id !== user?.id);
        return partner?.user || conv.participants[0].user;
    };

    // --- RENDER GIAO DIỆN ---
    return (
        <DashboardLayout>
            <Layout className="bg-white h-[calc(100vh-120px)] rounded-xl overflow-hidden shadow-sm border border-gray-200 mt-2">
                {/* SIDEBAR: DANH SÁCH HỘI THOẠI */}
                <Sider width={340} theme="light" className="border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-white">
                        <Title level={4} className="mb-4 text-indigo-700 font-bold">Tin nhắn</Title>
                        <Input
                            prefix={<SearchOutlined className="text-gray-400" />}
                            placeholder="Tìm kiếm..."
                            className="rounded-full bg-gray-50 border-none hover:bg-gray-100"
                            size="large"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <List
                            itemLayout="horizontal"
                            dataSource={conversations}
                            renderItem={(item) => {
                                const partner = getPartner(item);
                                const lastMsg = item.messages[0];
                                const isSelected = item.id === selectedConvId;
                                const hasUnread = item.unread_count > 0;

                                // Text hiển thị cho tin nhắn cuối
                                let previewText = "Chưa có tin nhắn";
                                if (lastMsg) {
                                    if (lastMsg.type === 'IMAGE') previewText = '[Hình ảnh]';
                                    else if (lastMsg.type === 'FILE') previewText = '[Tài liệu]';
                                    else previewText = lastMsg.content;
                                }

                                return (
                                    <List.Item
                                        className={`cursor-pointer transition-all px-5 py-4 hover:bg-gray-50 border-b border-gray-50 
                                            ${isSelected ? 'bg-indigo-50 border-r-4 border-r-indigo-600' : ''}`}
                                        onClick={() => handleSelectConversation(item.id)}
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <Badge count={item.unread_count} offset={[-5, 5]} color="red">
                                                    <Avatar
                                                        size={50}
                                                        src={partner.avatar ? uploadService.getFileUrl(partner.avatar) : undefined}
                                                        icon={<UserOutlined />}
                                                        className="border border-gray-200"
                                                    />
                                                </Badge>
                                            }
                                            title={
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <Text strong className={`truncate max-w-[160px] text-[15px] ${hasUnread ? 'text-gray-900 font-extrabold' : 'text-gray-700'}`}>
                                                        {partner.full_name}
                                                    </Text>
                                                    <Text type="secondary" className="text-[11px] font-normal">
                                                        {lastMsg ? dayjs(lastMsg.created_at).format('HH:mm') : ''}
                                                    </Text>
                                                </div>
                                            }
                                            description={
                                                <div className="flex justify-between items-center">
                                                    <Text className={`truncate max-w-[180px] text-sm ${hasUnread ? 'text-indigo-600 font-semibold' : 'text-gray-500'}`}>
                                                        {previewText}
                                                    </Text>
                                                    {hasUnread && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-sm"></div>}
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                );
                            }}
                        />
                    </div>
                </Sider>

                {/* KHUNG CHAT CHÍNH */}
                <Content className="flex flex-col bg-[#F3F4F6] relative">
                    {selectedConvId ? (
                        <>
                            {/* HEADER */}
                            <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm z-10 flex-shrink-0">
                                <div className="flex items-center gap-4">
                                    <Avatar
                                        size={48}
                                        src={getPartner(conversations.find(c => c.id === selectedConvId)!).avatar ? uploadService.getFileUrl(getPartner(conversations.find(c => c.id === selectedConvId)!).avatar!) : undefined}
                                        icon={<UserOutlined />}
                                    />
                                    <div>
                                        <Title level={5} style={{ margin: 0 }} className="text-gray-800 font-bold">
                                            {getPartner(conversations.find(c => c.id === selectedConvId)!).full_name}
                                        </Title>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge status="processing" color="green" />
                                            <Text type="secondary" className="text-xs">Đang hoạt động</Text>
                                        </div>
                                    </div>
                                </div>
                                <Button type="text" shape="circle" icon={<MoreOutlined className="text-xl" />} />
                            </div>

                            {/* DANH SÁCH TIN NHẮN */}
                            <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar flex flex-col gap-y-2 pb-24">
                                {loading ? (
                                    <div className="flex h-full items-center justify-center"><Spin size="large" /></div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMe = msg.sender_id === user?.id;
                                        const isLastInGroup = idx === messages.length - 1 || messages[idx + 1].sender_id !== msg.sender_id;

                                        // Logic hiển thị separator thời gian
                                        let showTimeSeparator = false;
                                        if (idx === 0) {
                                            showTimeSeparator = true;
                                        } else {
                                            const prevMsg = messages[idx - 1];
                                            const diffMinutes = dayjs(msg.created_at).diff(dayjs(prevMsg.created_at), 'minute');
                                            if (diffMinutes > 15) {
                                                showTimeSeparator = true;
                                            }
                                        }

                                        return (
                                            <div key={msg.id} className="flex flex-col w-full">
                                                {showTimeSeparator && (
                                                    <div className="flex justify-center my-4">
                                                        <span className="text-[11px] text-gray-500 bg-gray-200/80 px-3 py-1 rounded-full font-medium shadow-sm">
                                                            {dayjs(msg.created_at).format('HH:mm - DD/MM')}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className={`flex ${isMe ? 'justify-end' : 'justify-start items-end'}`}>
                                                    {!isMe && (
                                                        <div className="w-10 mr-3 flex-shrink-0 mb-[2px]">
                                                            {isLastInGroup && (
                                                                <Avatar
                                                                    size={40}
                                                                    src={msg.sender.avatar ? uploadService.getFileUrl(msg.sender.avatar) : undefined}
                                                                    icon={<UserOutlined />}
                                                                />
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className={`flex flex-col max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                        <Tooltip
                                                            title={dayjs(msg.created_at).format('HH:mm')}
                                                            placement={isMe ? 'left' : 'right'}
                                                            zIndex={1000}
                                                        >
                                                            <div className={`!px-4 !py-2 text-[15px] shadow-sm leading-relaxed break-words cursor-default transition-all hover:brightness-95 ${isMe
                                                                ? 'bg-indigo-600 text-white rounded-3xl rounded-tr-sm'
                                                                : 'bg-white text-gray-800 rounded-3xl rounded-tl-sm border border-gray-200'
                                                                }`}>
                                                                {/* SỬ DỤNG HÀM RENDER CONTENT ĐỂ HIỂN THỊ TEXT/ẢNH/FILE */}
                                                                {renderMessageContent(msg)}
                                                            </div>
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* --- PREVIEW SECTION (HIỂN THỊ KHI CHỌN FILE) --- */}
                            {renderPreview()}

                            {/* INPUT AREA */}
                            <div className="p-5 bg-white border-t border-gray-200 flex-shrink-0 relative z-30">
                                <div className="flex gap-3 bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:border-indigo-300 transition-all focus-within:bg-white focus-within:shadow-md">
                                    <Upload
                                        showUploadList={false}
                                        beforeUpload={handleBeforeUpload}
                                        accept="image/*,.pdf,.doc,.docx"
                                        disabled={!!selectedFile}
                                    >
                                        <Button
                                            type="text"
                                            shape="circle"
                                            icon={<PaperClipOutlined className={`text-gray-500 ${selectedFile ? 'text-indigo-600' : 'hover:text-indigo-600'}`} />}
                                        />
                                    </Upload>

                                    <Input
                                        placeholder={selectedFile ? "Nhập mô tả cho file..." : "Nhập tin nhắn..."}
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onPressEnter={handleSend}
                                        bordered={false}
                                        className="bg-transparent text-base ml-2"
                                        disabled={isSending}
                                    />
                                    <Button
                                        type="primary"
                                        shape="circle"
                                        size="large"
                                        icon={isSending ? <LoadingOutlined /> : <SendOutlined />}
                                        onClick={handleSend}
                                        className="bg-indigo-600 shadow-md"
                                        disabled={(!inputText.trim() && !selectedFile) || isSending}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-300">
                            <div className="bg-gray-100 p-8 rounded-full mb-6">
                                <UserOutlined style={{ fontSize: 64, color: '#d1d5db' }} />
                            </div>
                            <Text className="text-gray-400 text-lg font-medium">Chọn một cuộc hội thoại để bắt đầu</Text>
                        </div>
                    )}
                </Content>
            </Layout>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            `}</style>
        </DashboardLayout>
    );
}