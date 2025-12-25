import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { TextInput, IconButton, Text, ActivityIndicator, useTheme, Avatar } from 'react-native-paper';
import { useSocketStore } from '../stores/socketStore';
import { useAuthStore } from '../stores/authStore';
import { chatService, Message } from '../services/chat.service';
import * as ImagePicker from 'expo-image-picker';
import dayjs from 'dayjs';

// Thay IP máy của bạn vào đây (Bỏ /api)
const BASE_URL = 'http://192.168.100.248:3000';

export default function ChatScreen({ navigation }: any) {
    const theme = useTheme();
    const { socket } = useSocketStore();
    const { user } = useAuthStore();

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    const flatListRef = useRef<FlatList>(null);

    // 1. Khởi tạo: Lấy ID hội thoại & Tin nhắn cũ
    useEffect(() => {
        const initChat = async () => {
            try {
                const conv = await chatService.getMyConversation();
                if (conv) {
                    setConversationId(conv.id);
                    socket?.emit('joinRoom', conv.id);
                    const msgs = await chatService.getMessages(conv.id);
                    setMessages(msgs);
                }
            } catch (error) {
                console.error("Lỗi init chat:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (socket && user) {
            initChat();
        }
    }, [socket, user]);

    // 2. Lắng nghe tin nhắn mới từ Socket
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg: Message) => {
            // QUAN TRỌNG: Nếu tin nhắn là của chính mình gửi -> Bỏ qua
            // (Vì mình đã add vào list lúc bấm nút Gửi rồi)
            if (msg.sender_id === user?.id) return;

            setMessages(prev => [...prev, msg]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        };

        socket.on('newMessage', handleNewMessage);
        return () => { socket.off('newMessage', handleNewMessage); };
    }, [socket, user]);

    // 3. Chọn ảnh (ĐÃ SỬA LỖI CRASH)
    const pickImage = async () => {
        // Xin quyền truy cập thư viện
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh để gửi ảnh.');
            return;
        }

        try {
            // --- SỬA LẠI: KHÔNG TRUYỀN mediaTypes ĐỂ TRÁNH LỖI PHIÊN BẢN ---
            const result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: false,
                quality: 0.7, // Giảm dung lượng ảnh để gửi nhanh hơn
                // Bỏ dòng mediaTypes để dùng mặc định (tránh lỗi crash trên Expo Go cũ)
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];

                // Kiểm tra nếu người dùng chọn Video (vì mặc định lấy cả 2)
                if (asset.type === 'video') {
                    Alert.alert("Thông báo", "Hiện tại hệ thống chỉ hỗ trợ gửi hình ảnh.");
                    return;
                }

                // Gọi hàm gửi ảnh
                handleSend(asset.uri, 'IMAGE');
            }
        } catch (error) {
            console.error("Lỗi chọn ảnh:", error);
            Alert.alert("Lỗi", "Không thể mở thư viện ảnh: " + (error as any).message);
        }
    };

    // 4. Gửi tin nhắn
    const handleSend = async (content: string = inputText, type: 'TEXT' | 'IMAGE' = 'TEXT') => {
        if (!content.trim() && type === 'TEXT') return;

        // Nếu chưa có conversationId, thử lấy lại lần nữa (phòng trường hợp mạng lag lúc đầu)
        if (!conversationId) {
            try {
                const conv = await chatService.getMyConversation();
                if (conv) setConversationId(conv.id);
                else {
                    Alert.alert("Lỗi", "Đang kết nối đến tư vấn viên, vui lòng thử lại sau giây lát.");
                    return;
                }
            } catch (e) {
                Alert.alert("Lỗi", "Mất kết nối mạng.");
                return;
            }
        }

        setIsSending(true);
        try {
            let finalContent = content;

            // Xử lý Upload Ảnh trước khi gửi socket
            if (type === 'IMAGE') {
                const uploadRes = await chatService.uploadImage(content);
                if (!uploadRes || !uploadRes.filename) throw new Error("Upload failed");
                finalContent = `chat/${uploadRes.filename}`;
            }

            // Gửi Socket
            socket?.emit('sendMessage', {
                conversationId: conversationId || (await chatService.getMyConversation())?.id,
                content: finalContent,
                type: type
            });

            // Optimistic Update (Hiển thị ngay lập tức để cảm giác mượt mà)
            const tempMsg: Message = {
                id: Math.random().toString(), // ID tạm
                conversation_id: conversationId!,
                sender_id: user?.id || '',
                content: finalContent,
                type: type,
                created_at: new Date().toISOString(),
                sender: { id: user?.id || '', full_name: user?.full_name || 'Tôi' }
            };

            setMessages(prev => [...prev, tempMsg]);

            if (type === 'TEXT') setInputText('');

            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        } catch (error) {
            console.error("Gửi tin thất bại:", error);
            Alert.alert("Lỗi", "Không thể gửi tin nhắn. Vui lòng kiểm tra mạng.");
        } finally {
            setIsSending(false);
        }
    };

    // Render từng tin nhắn
    const renderItem = ({ item }: { item: Message }) => {
        const isMe = item.sender_id === user?.id;

        // Xử lý URL ảnh: Nếu là ảnh upload thì thêm domain, nếu là url ngoài (hiếm) thì giữ nguyên
        const imageUrl = item.content.startsWith('http')
            ? item.content
            : `${BASE_URL}/uploads/${item.content}`;

        return (
            <View style={[styles.msgRow, isMe ? styles.myMsgRow : styles.otherMsgRow]}>
                {!isMe && (
                    <Avatar.Icon size={32} icon="account" style={{ backgroundColor: '#ccc', marginRight: 8 }} />
                )}
                <View style={[
                    styles.bubble,
                    isMe ? { backgroundColor: theme.colors.primary } : { backgroundColor: '#e0e0e0' }
                ]}>
                    {item.type === 'IMAGE' ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={{ width: 200, height: 150, borderRadius: 8 }}
                            resizeMode="cover"
                        />
                    ) : (
                        <Text style={{ color: isMe ? 'white' : 'black', fontSize: 16 }}>{item.content}</Text>
                    )}
                    <Text style={[styles.timeText, { color: isMe ? 'rgba(255,255,255,0.7)' : '#888' }]}>
                        {dayjs(item.created_at).format('HH:mm')}
                    </Text>
                </View>
            </View>
        );
    };

    if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, backgroundColor: '#f5f5f5' }}
            keyboardVerticalOffset={90}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />

            <View style={styles.inputContainer}>
                <IconButton
                    icon="image"
                    size={28}
                    iconColor="#666"
                    onPress={pickImage}
                    disabled={isSending}
                />
                <TextInput
                    mode="outlined"
                    placeholder="Nhập tin nhắn..."
                    value={inputText}
                    onChangeText={setInputText}
                    style={styles.input}
                    dense
                    theme={{ roundness: 20 }}
                    outlineColor="transparent"
                    activeOutlineColor="transparent"
                />
                <IconButton
                    icon="send"
                    mode="contained"
                    containerColor={theme.colors.primary}
                    iconColor="white"
                    size={24}
                    onPress={() => handleSend(inputText, 'TEXT')}
                    disabled={isSending || !inputText.trim()}
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
    myMsgRow: { justifyContent: 'flex-end' },
    otherMsgRow: { justifyContent: 'flex-start' },
    bubble: { padding: 10, borderRadius: 16, maxWidth: '75%' },
    timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', padding: 8,
        backgroundColor: 'white', borderTopWidth: 1, borderColor: '#eee'
    },
    input: { flex: 1, backgroundColor: '#f0f0f0', marginHorizontal: 8, borderRadius: 20, height: 40 }
});