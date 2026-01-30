import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import 'dayjs/locale/vi';

// --- LAYOUTS ---
import PatientLayout from '@/components/layouts/PatientLayout';

// --- AUTH & STORES ---
import { useAuthStore } from './stores/authStore';

// --- PUBLIC PAGES ---
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// --- ADMIN PAGES ---
import AdminDashboard from './pages/admin/Dashboard';
import PatientList from './pages/admin/PatientList';
import PatientDetail from './pages/admin/PatientDetail';
import DoctorList from './pages/admin/DoctorList';
import DoctorDetail from './pages/admin/DoctorDetail';
import SpecializationAndRoom from './pages/admin/SpecializationAndRoom';
import AppointmentList from './pages/admin/AppointmentList';
import AppointmentCalendar from './pages/admin/AppointmentCalendar';
import BookAppointmentAdmin from './pages/admin/BookAppointment';
import PrescriptionList from './pages/admin/PrescriptionList';
import PrescriptionDetail from './pages/admin/PrescriptionDetail';
import InvoiceList from './pages/admin/InvoiceList';
import InvoiceDetail from './pages/admin/InvoiceDetail';
import AdminProfile from './pages/admin/AdminProfile';
import StaffList from './pages/admin/StaffList';
import BranchManagement from './pages/admin/BranchManagement';
import ShiftManagement from './pages/admin/ShiftManagement';
import MedicationManagement from './pages/admin/MedicationManagement';
import AttendanceTracking from './pages/admin/AttendanceTracking';
import NewsManagement from './pages/admin/NewsManagement';

// --- DOCTOR PAGES ---
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorSchedule from './pages/doctor/DoctorSchedule';
import DoctorProfile from './pages/doctor/DoctorProfile';
import MedicalExamination from './pages/doctor/MedicalExamination';
import CreatePrescription from './pages/doctor/CreatePrescription';

// --- MANAGER & RECEPTIONIST PAGES ---
import ManagerDashboard from './pages/manager/Dashboard';
import ManagerStaffList from './pages/manager/StaffList';
import ManagerProfile from './pages/manager/ManagerProfile';
import ManagerBookAppointment from './pages/manager/BookAppointment'; // Dùng chung cho Receptionist
import ReceptionistDashboard from './pages/receptionist/Dashboard';
import ReceptionistProfile from './pages/receptionist/ReceptionistProfile';

// --- PATIENT PAGES ---
import PatientDashboard from './pages/patient/Dashboard';
import PatientProfile from './pages/patient/PatientProfile';
import BookAppointmentPatient from './pages/patient/BookAppointment';
import PatientAppointmentList from './pages/patient/AppointmentList';
import AppointmentDetail from './pages/patient/AppointmentDetail';
import MedicalRecordList from './pages/patient/MedicalRecordList';
import PatientPrescriptionList from './pages/patient/PatientPrescriptionList';
import PatientPrescriptionDetail from './pages/patient/PatientPrescriptionDetail';
import PatientInvoiceList from './pages/patient/PatientInvoiceList';
import PatientInvoiceDetail from './pages/patient/PatientInvoiceDetail';
import SpecialtyDetailPage from './pages/landing/SpecialtyDetailPage';

// --- COMMON PAGES ---
import MedicalRecordDetail from './pages/common/MedicalRecordDetail';
import ChatManagement from '@/pages/common/ChatManagement';

import AboutPage from './pages/landing/AboutPage'; // <--- IMPORT MỚI
import FacilitiesPage from './pages/landing/FacilitiesPage'; // <--- IMPORT MỚI
import DoctorsPage from './pages/landing/DoctorsPage'; // <--- IMPORT MỚI
import NewsPage from './pages/landing/NewsPage';
import ContactPage from './pages/landing/ContactPage';
import ChatWidget from './components/chat/ChatWidget';
import AuthModal from './components/auth/AuthModal';
import BookingModal from './components/booking/BookingModal';
import VerifyEmail from './pages/auth/VerifyEmail';
import PendingVerification from './pages/auth/PendingVerification';




const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// --- COMPONENT BẢO VỆ ROUTE & TỰ ĐỘNG CHỌN LAYOUT ---
// ... imports giữ nguyên

// --- SỬA LẠI COMPONENT NÀY ---
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, token } = useAuthStore();

  // 1. Lấy user từ localStorage (Logic Fallback)
  const storedToken = localStorage.getItem('access_token');
  const storedUserStr = localStorage.getItem('user');
  const effectiveToken = token || storedToken;
  let effectiveUser = user;

  if (!effectiveUser && storedUserStr) {
    try {
      effectiveUser = JSON.parse(storedUserStr);
    } catch (e) {
      console.error('Lỗi parse user', e);
    }
  }

  // 2. Kiểm tra đăng nhập
  if (!effectiveToken || !effectiveUser) {
    return <Navigate to="/" replace />;
  }

  // --- DEBUG: BẠN HÃY MỞ F12 (CONSOLE) ĐỂ XEM DÒNG NÀY IN RA GÌ ---
  console.log("Current User Role:", effectiveUser.role);

  // 3. Chuẩn hóa Role (Tránh lỗi chữ hoa/thường)
  const userRole = effectiveUser.role?.toUpperCase() || '';

  // 4. Kiểm tra quyền
  if (allowedRoles) {
    // Chuyển tất cả allowedRoles sang chữ hoa để so sánh
    const upperAllowedRoles = allowedRoles.map(r => r.toUpperCase());
    if (!upperAllowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // 5. CHỌN LAYOUT
  // Chỉ bọc layout cho PATIENT, các role khác (ADMIN, DOCTOR, etc.) tự quản lý layout
  if (userRole === 'PATIENT') {
    return <PatientLayout>{children}</PatientLayout>;
  }

  // Các role khác không bọc layout ở đây vì các trang đã tự bọc DashboardLayout
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* --- PUBLIC ROUTES (Không có Layout hoặc Layout riêng) --- */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />  {/* <--- THÊM ROUTE NÀY */}
            <Route path="/facilities" element={<FacilitiesPage />} /> {/* <--- THÊM DÒNG NÀY */}
            <Route path="/doctors" element={<DoctorsPage />} /> {/* <--- THÊM ROUTE NÀY */}
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:slug" element={<NewsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/pending-verification" element={<PendingVerification />} />
            <Route path="/specialties/:id" element={<SpecialtyDetailPage />} />

            {/* Route dùng chung, Layout tự động đổi theo người xem */}
            <Route
              path="/medical-records/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'PATIENT', 'BRANCH_MANAGER', 'RECEPTIONIST']}>
                  <MedicalRecordDetail />
                </ProtectedRoute>
              }
            />

            {/* ================= ADMIN ROUTES ================= */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/patients"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'BRANCH_MANAGER']}>
                  <PatientList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/patients/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}>
                  <PatientDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/doctors"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <DoctorList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/doctors/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <DoctorDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/specializations"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <SpecializationAndRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/appointments"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}>
                  <AppointmentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/appointments/calendar"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}>
                  <AppointmentCalendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/appointments/new"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <BookAppointmentAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/prescriptions"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}>
                  <PrescriptionList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/prescriptions/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}>
                  <PrescriptionDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/invoices"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <InvoiceList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/invoices/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <InvoiceDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/messages"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ChatManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/staff"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <StaffList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/branches"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <BranchManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/shifts"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ShiftManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/medications"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'BRANCH_MANAGER']}>
                  <MedicationManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/attendance"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'BRANCH_MANAGER']}>
                  <AttendanceTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/news"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <NewsManagement />
                </ProtectedRoute>
              }
            />


            {/* ================= DOCTOR ROUTES ================= */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/prescription/create"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <CreatePrescription />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patients"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <PatientList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patients/:id"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <PatientDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/appointments"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <AppointmentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/appointments/calendar"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <AppointmentCalendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/appointments/:id"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <PatientDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/prescriptions"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <PrescriptionList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/prescriptions/:id"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <PrescriptionDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/schedule"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <DoctorSchedule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/profile"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <DoctorProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/examination/:appointmentId"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <MedicalExamination />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/appointments/new"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <ManagerBookAppointment />
                </ProtectedRoute>
              }
            />

            {/* ================= BRANCH MANAGER ROUTES ================= */}
            <Route
              path="/branch_manager/dashboard"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_MANAGER']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/messages"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_MANAGER']}>
                  <ChatManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/staff"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_MANAGER']}>
                  <ManagerStaffList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/inventory"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_MANAGER']}>
                  <MedicationManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/branch_manager/profile"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_MANAGER']}>
                  <ManagerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/shifts"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_MANAGER']}>
                  <ShiftManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/appointments/new"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_MANAGER']}>
                  <ManagerBookAppointment />
                </ProtectedRoute>
              }
            />

            {/* ================= RECEPTIONIST ROUTES ================= */}
            <Route
              path="/receptionist/dashboard"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
                  <ReceptionistDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receptionist/appointments"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
                  <AppointmentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receptionist/book-appointment"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
                  <ManagerBookAppointment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receptionist/profile"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
                  <ReceptionistProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receptionist/messages"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
                  <ChatManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receptionist/invoices"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
                  <InvoiceList />
                </ProtectedRoute>
              }
            />

            {/* ================= PATIENT ROUTES (Dùng PatientLayout) ================= */}
            <Route
              path="/patient/dashboard"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/profile"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <PatientProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/book-appointment"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <BookAppointmentPatient />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/appointments"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <PatientAppointmentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/appointments/:id"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <AppointmentDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/medical-records"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <MedicalRecordList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/prescriptions"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <PatientPrescriptionList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/prescriptions/:id"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <PatientPrescriptionDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/invoices"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <PatientInvoiceList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/invoices/:id"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <PatientInvoiceDetail />
                </ProtectedRoute>
              }
            />

          </Routes>

          {/* 2. KHU VỰC GLOBAL (LUÔN HIỂN THỊ DÙ Ở TRANG NÀO) */}
          {/* Đặt ở đây sẽ hiển thị đè lên mọi trang */}
          <ChatWidget />   {/* Nút LiveChat */}
          <AuthModal />    {/* Popup Đăng nhập/Đăng ký */}
          <BookingModal /> {/* Popup Đặt lịch */}
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;