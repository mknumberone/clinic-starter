import { useEffect, useState, useRef } from 'react';
import { Button, Input, Avatar, Badge, Card, Spin, Tooltip, Upload, message } from 'antd';
import {
    MessageOutlined,
    SendOutlined,
    CloseOutlined,
    UserOutlined,
    CustomerServiceOutlined,
    PaperClipOutlined,
    FileOutlined,
    CloseCircleFilled,
    LoadingOutlined
} from '@ant-design/icons';
import { useSocketStore } from '@/stores/socketStore';
import { useAuthStore } from '@/stores/authStore';
import { uploadService } from '@/services/upload.service';
import axiosInstance from '@/lib/axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    type: 'TEXT' | 'IMAGE' | 'FILE';
    created_at: string;
    sender: { id: string; full_name: string; avatar?: string };
}

export default function ChatWidget() {
    const { socket, isConnected } = useSocketStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const originalTitle = useRef(document.title);
    const isStaff = ['ADMIN', 'BRANCH_MANAGER', 'RECEPTIONIST'].includes(user?.role || '');

    // --- 1. XỬ LÝ CHỌN FILE ---
    const handleBeforeUpload = (file: File) => {
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('File phải nhỏ hơn 5MB!');
            return Upload.LIST_IGNORE;
        }
        setSelectedFile(file);
        return false;
    };

    const handleRemoveFile = () => setSelectedFile(null);

    // --- 2. GỬI TIN NHẮN (OPTIMISTIC UPDATE) ---
    const handleSend = async () => {
        if ((!inputValue.trim() && !selectedFile) || !socket || !conversationId) return;

        setIsSending(true);
        try {
            // Chuẩn bị dữ liệu gửi
            let contentToSend = inputValue;
            let typeToSend: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT';

            // Xử lý upload nếu có file
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const res = await axiosInstance.post('/chat/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                contentToSend = `chat/${res.data.filename}`;
                typeToSend = selectedFile.type.startsWith('image/') ? 'IMAGE' : 'FILE';
            }

            // --- QUAN TRỌNG: HIỂN THỊ NGAY LẬP TỨC (Không chờ Server) ---
            const optimisticMsg: Message = {
                id: `temp-${Date.now()}`, // ID tạm
                conversation_id: conversationId,
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
            scrollToBottom();

            // Sau đó mới gửi Socket
            socket.emit('sendMessage', {
                conversationId,
                content: contentToSend,
                type: typeToSend
            });

            // Reset Input
            setInputValue('');
            setSelectedFile(null);

        } catch (error) {
            console.error('Lỗi gửi tin:', error);
            message.error('Gửi tin thất bại');
        } finally {
            setIsSending(false);
        }
    };

    // --- CÁC LOGIC KHÁC ---
    const updateTabTitle = (count: number) => {
        if (count > 0) document.title = `(${count}) 🔴 Tin nhắn mới - Clinic`;
        else document.title = originalTitle.current;
    };

    const refreshUnreadCount = async () => {
        if (!isStaff) return;
        try {
            const res = await axiosInstance.get('/chat/conversations');
            const total = res.data.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
            setUnreadCount(total);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { updateTabTitle(unreadCount); return () => { document.title = originalTitle.current; }; }, [unreadCount]);

    useEffect(() => {
        const handleRefreshBadge = () => refreshUnreadCount();
        window.addEventListener('clinic:refresh_badge', handleRefreshBadge);
        return () => window.removeEventListener('clinic:refresh_badge', handleRefreshBadge);
    }, [isStaff]);

    useEffect(() => {
        // Debug: Log trạng thái hiện tại
        console.log('ChatWidget: useEffect triggered', { 
            hasUser: !!user, 
            hasSocket: !!socket, 
            isConnected, 
            userRole: user?.role 
        });

        if (!user) {
            console.log('ChatWidget: No user yet');
            return;
        }

        if (!socket) {
            console.log('ChatWidget: No socket yet - waiting for connection...');
            return;
        }
        
        if (!isConnected) {
            console.log('ChatWidget: Socket exists but not connected yet. Socket state:', socket.connected);
            return;
        }

        originalTitle.current = document.title;
        refreshUnreadCount();

        const initChat = async () => {
            try {
                if (isStaff) {
                    const res = await axiosInstance.get('/chat/conversations');
                    res.data.forEach((c: any) => socket.emit('joinRoom', c.id));
                } else {
                    console.log('ChatWidget: Initializing patient chat...');
                    const res = await axiosInstance.post('/chat/start-support');
                    console.log('ChatWidget: Conversation created:', res.data.id);
                    setConversationId(res.data.id);
                    socket.emit('joinRoom', res.data.id);
                }
            } catch (e) { 
                console.error('ChatWidget: Error initializing chat:', e);
                message.error('Không thể khởi tạo chat. Vui lòng thử lại.');
            }
        };
        initChat();
    }, [user, isStaff, socket, isConnected]);

    // --- LẮNG NGHE SOCKET ---
    useEffect(() => {
        if (!socket) return;
        const handleNewMessage = (msg: Message) => {
            const isIncoming = msg.sender_id !== user?.id;

            // NẾU LÀ TIN NHẮN ĐẾN (Của người khác) -> HIỂN THỊ
            // NẾU LÀ TIN NHẮN CỦA MÌNH -> BỎ QUA (Vì đã hiển thị ở handleSend rồi)
            if (isOpen && !isStaff && isIncoming) {
                setMessages((prev) => [...prev, msg]);
                scrollToBottom();
                axiosInstance.put(`/chat/read/${conversationId}`);
            }

            if (isIncoming && (!isOpen || isStaff)) setUnreadCount(prev => prev + 1);
        };
        socket.on('newMessage', handleNewMessage);
        return () => { socket.off('newMessage', handleNewMessage); };
    }, [socket, conversationId, isOpen, user, isStaff]);

    const handleToggleOpen = () => {
        setUnreadCount(0);
        updateTabTitle(0);
        if (isStaff) {
            if (user?.role === 'ADMIN') navigate('/admin/messages');
            else if (user?.role === 'BRANCH_MANAGER') navigate('/manager/messages');
            else navigate('/receptionist/messages');
            return;
        }
        if (!isOpen) {
            setIsOpen(true);
            if (conversationId) {
                setLoading(true);
                axiosInstance.get('/chat/messages', { params: { conversationId } })
                    .then(res => { setMessages(res.data); scrollToBottom(); })
                    .finally(() => setLoading(false));
                axiosInstance.put(`/chat/read/${conversationId}`);
            }
        } else setIsOpen(false);
    };

    const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    const renderPreview = () => {
        if (!selectedFile) return null;
        const isImage = selectedFile.type.startsWith('image/');
        const previewUrl = URL.createObjectURL(selectedFile);
        return (
            <div className="absolute bottom-[60px] left-4 right-4 bg-gray-100 rounded-xl p-2 flex items-center gap-3 shadow-md z-10 border border-gray-200">
                <div className="relative w-12 h-12 flex-shrink-0">
                    {isImage ? (
                        <img src={previewUrl} className="w-full h-full object-cover rounded-lg border border-gray-300" />
                    ) : <div className="w-full h-full bg-white rounded-lg flex items-center justify-center border border-gray-300"><FileOutlined /></div>}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button type="text" icon={<CloseCircleFilled className="text-gray-500 hover:text-red-500" />} onClick={handleRemoveFile} />
            </div>
        );
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
            {isOpen && !isStaff && (
                <Card
                    className="w-[360px] h-[520px] shadow-2xl flex flex-col mb-4 border-0 rounded-3xl overflow-hidden animate-fade-in-up relative"
                    headStyle={{ flexShrink: 0, borderBottom: '1px solid #f0f0f0' }}
                    bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}
                    title={
                        <div className="flex items-center gap-3 py-2">
                            <div className="relative">
                                <Avatar size="large" style={{ backgroundColor: '#4F46E5' }} icon={<CustomerServiceOutlined />} />
                                <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            </div>
                            <div>
                                <span className="text-base font-bold text-gray-800">Hỗ trợ trực tuyến</span>
                                <div className="text-[11px] text-gray-500">{isConnected ? 'Thường trả lời ngay' : 'Đang kết nối...'}</div>
                            </div>
                        </div>
                    }
                    extra={<Button type="text" shape="circle" icon={<CloseOutlined className="text-gray-400" />} onClick={() => setIsOpen(false)} />}
                >
                    <div className="flex-1 overflow-y-auto p-4 bg-[#F3F4F6] scroll-smooth custom-scrollbar flex flex-col gap-y-2 pb-20">
                        {loading ? <Spin className="m-auto" /> : messages.map((msg) => {
                            const isMe = msg.sender_id === user?.id;
                            const url = uploadService.getFileUrl(msg.content);
                            return (
                                <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] !px-4 !py-2 text-[15px] shadow-sm rounded-3xl ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 rounded-tl-sm'}`}>
                                        {msg.type === 'IMAGE' ? (
                                            <img src={url} className="rounded-lg max-w-[200px] cursor-pointer" onClick={() => window.open(url)} />
                                        ) : msg.type === 'FILE' ? (
                                            <a href={url} target="_blank" className="underline flex gap-1 items-center" style={{ color: 'inherit' }}><FileOutlined /> {msg.content}</a>
                                        ) : msg.content}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {renderPreview()}

                    <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0 relative z-20">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1 border border-transparent focus-within:border-indigo-300">
                            <Upload showUploadList={false} beforeUpload={handleBeforeUpload} accept="image/*,.pdf,.doc,.docx" disabled={!!selectedFile}>
                                <Button type="text" shape="circle" icon={<PaperClipOutlined className={selectedFile ? 'text-indigo-500' : 'text-gray-500'} />} />
                            </Upload>
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onPressEnter={handleSend}
                                placeholder={selectedFile ? "Nhập tin nhắn..." : "Nhập tin nhắn..."}
                                bordered={false}
                                className="bg-transparent text-sm"
                                disabled={isSending}
                            />
                            <Button type="text" shape="circle" icon={isSending ? <LoadingOutlined /> : <SendOutlined className="text-indigo-600" />} onClick={handleSend} disabled={(!inputValue.trim() && !selectedFile) || isSending} />
                        </div>
                    </div>
                </Card>
            )}

            {(!isOpen || isStaff) && (
                <Tooltip title={isStaff ? "Quản lý tin nhắn" : "Chat với hỗ trợ"} placement="left">
                    <Badge count={unreadCount} overflowCount={99} offset={[-5, 5]}>
                        <Button type="primary" shape="circle" size="large" className="w-16 h-16 shadow-lg bg-indigo-600 flex items-center justify-center" icon={<MessageOutlined style={{ fontSize: '28px' }} />} onClick={handleToggleOpen} />
                    </Badge>
                </Tooltip>
            )}
        </div>
    );
}