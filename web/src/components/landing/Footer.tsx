import { EnvironmentFilled, PhoneFilled, MailFilled, FacebookFilled, YoutubeFilled, LinkedinFilled } from '@ant-design/icons';
import { Button } from 'antd';

export default function Footer() {
    return (
        <footer className="bg-[#001e2e] text-gray-300 pt-20 pb-10 border-t border-white/5">
            {/* CONTAINER ĐỒNG BỘ */}
            <div className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Cột 1 */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 bg-[#009CAA] rounded-lg flex items-center justify-center text-white font-extrabold text-xl">C</div>
                            <span className="text-2xl font-bold text-white tracking-wide">CLINIC</span>
                        </div>
                        <p className="text-sm leading-7 text-gray-400 mb-6">
                            Công ty TNHH Medical Center Việt Nam. <br />
                            Giấy chứng nhận ĐKDN số 0316060982.<br />
                            Nơi cấp: Sở Kế hoạch và Đầu tư Thành phố Hồ Chí Minh.
                        </p>
                        <div className="flex gap-3">
                            <Button shape="circle" icon={<FacebookFilled />} className="bg-white/5 border-none text-white hover:bg-[#1877F2]" />
                            <Button shape="circle" icon={<YoutubeFilled />} className="bg-white/5 border-none text-white hover:bg-[#FF0000]" />
                            <Button shape="circle" icon={<LinkedinFilled />} className="bg-white/5 border-none text-white hover:bg-[#0077B5]" />
                        </div>
                    </div>

                    {/* Cột 2 */}
                    <div>
                        <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm border-b-2 border-[#009CAA] inline-block pb-1">Về chúng tôi</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-[#009CAA] transition-colors">Giới thiệu chung</a></li>
                            <li><a href="#" className="hover:text-[#009CAA] transition-colors">Cơ sở vật chất</a></li>
                            <li><a href="#" className="hover:text-[#009CAA] transition-colors">Đội ngũ bác sĩ</a></li>
                            <li><a href="#" className="hover:text-[#009CAA] transition-colors">Tin tức & Sự kiện</a></li>
                        </ul>
                    </div>

                    {/* Cột 3 */}
                    <div>
                        <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm border-b-2 border-[#009CAA] inline-block pb-1">Dịch vụ</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-[#009CAA] transition-colors">Khám sức khỏe tổng quát</a></li>
                            <li><a href="#" className="hover:text-[#009CAA] transition-colors">Tầm soát ung thư</a></li>
                            <li><a href="#" className="hover:text-[#009CAA] transition-colors">Khám Nhi khoa</a></li>
                            <li><a href="#" className="hover:text-[#009CAA] transition-colors">Tiêm chủng Vaccine</a></li>
                        </ul>
                    </div>

                    {/* Cột 4 */}
                    <div>
                        <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm border-b-2 border-[#009CAA] inline-block pb-1">Liên hệ</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <EnvironmentFilled className="text-[#009CAA] mt-1" />
                                <span>Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <PhoneFilled className="text-[#009CAA]" />
                                <span className="font-bold text-white text-lg">1900 29 29 29</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <MailFilled className="text-[#009CAA]" />
                                <span>info@clinic-center.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
                    <p>© 2025 Clinic Medical Center Vietnam. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-white">Chính sách bảo mật</a>
                        <a href="#" className="hover:text-white">Điều khoản sử dụng</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}