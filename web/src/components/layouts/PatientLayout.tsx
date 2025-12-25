import { ReactNode, useEffect } from 'react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import AuthModal from '@/components/auth/AuthModal';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';

interface PatientLayoutProps {
    children: ReactNode;
}

export default function PatientLayout({ children }: PatientLayoutProps) {
    const { token } = useAuthStore();
    const { connect, disconnect } = useSocketStore();

    // Khởi tạo socket connection cho patient (quan trọng cho live chat)
    useEffect(() => {
        if (token) {
            connect(token);
        }
        return () => {
            disconnect();
        };
    }, [token, connect, disconnect]);

    return (
        <div className="min-h-screen font-sans bg-[#f8fbff] flex flex-col">
            {/* Header chung */}
            <Navbar />

            {/* Main Content: Thêm padding-top để tránh bị Header che */}
            {/* min-h-screen giúp footer luôn ở dưới đáy */}
            <main className="flex-grow pt-[110px] pb-10">
                <div className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-20">
                    {/* Container bo góc, đổ bóng nhẹ để nổi bật nội dung trên nền */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[600px] p-6 md:p-8 animate-fade-in-up">
                        {children}
                    </div>
                </div>
            </main>

            {/* Footer chung */}
            <Footer />

            {/* Các thành phần Global */}
            <AuthModal />
            {/* ChatWidget đã được render ở App.tsx (global) nên không cần render lại ở đây */}
        </div>
    );
}