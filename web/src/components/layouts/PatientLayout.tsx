import { ReactNode, useEffect } from 'react';
import Navbar from '@/components/landing/Navbar';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';

interface PatientLayoutProps {
    children: ReactNode;
}

export default function PatientLayout({ children }: PatientLayoutProps) {
    const { token } = useAuthStore();
    const { connect, disconnect } = useSocketStore();

    useEffect(() => {
        if (token) connect(token);
        return () => { disconnect(); };
    }, [token, connect, disconnect]);

    return (
        <div className="min-h-screen bg-[#f8fbff] flex flex-col w-full overflow-x-hidden">
            {/* 1. Navbar: Đảm bảo Navbar có z-index cao nhất */}
            <div className="fixed top-0 left-0 right-0 z-[9999]">
                <Navbar />
            </div>

            {/* 2. Khoảng trống bù (Spacer): 
               Thay vì dùng padding, ta dùng một div trống có chiều cao bằng đúng Navbar 
               để đẩy toàn bộ main content xuống. 
            */}
            <div className="w-full h-[120px] md:h-[130px]" />

            {/* 3. Vùng chứa nội dung chính */}
            <main className="flex-grow w-full flex flex-col items-center pb-12">

                {/* 4. Khối giới hạn chiều rộng và CĂN GIỮA */}
                <div className="w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">

                    {/* 5. Card trắng chứa nội dung */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 w-full min-h-[600px] p-5 md:p-10">
                        {/* LƯU Ý QUAN TRỌNG: 
                           Nếu tiêu đề bên trong (như "Hồ sơ cá nhân") vẫn bị che, 
                           đó là do trang con đang dùng class 'fixed' hoặc 'absolute'.
                           Hãy đảm bảo nội dung bên trong children là 'relative' hoặc 'static'.
                        */}
                        {children}
                    </div>

                </div>
            </main>
        </div>
    );
}