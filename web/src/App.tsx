import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import AdminDashboard from './pages/admin/Dashboard';
import DoctorDashboard from './pages/doctor/Dashboard';
import PatientDashboard from './pages/patient/Dashboard';
import ManagerDashboard from './pages/manager/Dashboard';
import ReceptionistDashboard from './pages/receptionist/Dashboard';
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
import DoctorSchedule from './pages/doctor/DoctorSchedule';
import AdminProfile from './pages/admin/AdminProfile';
import DoctorProfile from './pages/doctor/DoctorProfile';
import PatientProfile from './pages/patient/PatientProfile';
import { useAuthStore } from './stores/authStore';
import StaffList from './pages/admin/StaffList';
import BranchManagement from './pages/admin/BranchManagement';
import ManagerStaffList from './pages/manager/StaffList';
import ShiftManagement from './pages/admin/ShiftManagement'; // <-- 1. IMPORT FILE NÀY
import BookAppointmentPatient from './pages/patient/BookAppointment';
import PatientAppointmentList from './pages/patient/AppointmentList'; // <--- IMPORT FILE VỪA TẠO
import ManagerBookAppointment from './pages/manager/BookAppointment';
import ReceptionistBookAppointment from './pages/manager/BookAppointment'; // Reuse của Manager
import AppointmentDetail from './pages/patient/AppointmentDetail';
import MedicalExamination from './pages/doctor/MedicalExamination';
import MedicalRecordDetail from './pages/common/MedicalRecordDetail';
import MedicationManagement from './pages/admin/MedicationManagement'; // Trang quản lý thuốc mới
import CreatePrescription from './pages/doctor/CreatePrescription';
import MedicalRecordList from './pages/patient/MedicalRecordList';
import PatientPrescriptionDetail from './pages/patient/PatientPrescriptionDetail';
import PatientInvoiceDetail from './pages/patient/PatientInvoiceDetail';
import PatientPrescriptionList from './pages/patient/PatientPrescriptionList';
import PatientInvoiceList from './pages/patient/PatientInvoiceList';
import ManagerProfile from './pages/manager/ManagerProfile'; // <--- IMPORT NÀY
import ReceptionistProfile from './pages/receptionist/ReceptionistProfile'; // <--- IMPORT NÀY


// <-- 1. IMPORT FILE NÀY
import 'dayjs/locale/vi';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// --- ProtectedRoute Mới: Sửa lỗi Hydration Lag ---
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, token } = useAuthStore();

  // 1. Fallback: Lấy trực tiếp từ LocalStorage nếu State chưa kịp load
  const storedToken = localStorage.getItem('access_token');
  const storedUserStr = localStorage.getItem('user');

  // Ưu tiên dùng State, nếu không có (null) thì dùng Storage
  const effectiveToken = token || storedToken;
  let effectiveUser = user;

  // Nếu user trong state chưa có, thử parse từ storage
  if (!effectiveUser && storedUserStr) {
    try {
      effectiveUser = JSON.parse(storedUserStr);
    } catch (e) {
      console.error('Lỗi parse user từ storage', e);
    }
  }

  // 2. Kiểm tra đăng nhập
  const isAuthenticated = !!effectiveToken && !!effectiveUser;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Kiểm tra quyền (Role)
  // Lưu ý: effectiveUser lúc này có thể là object từ localStorage, vẫn có thuộc tính role
  if (allowedRoles && effectiveUser && !allowedRoles.includes(effectiveUser.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/medical-records/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'PATIENT', 'BRANCH_MANAGER', 'RECEPTIONIST']}>
                  <MedicalRecordDetail />
                </ProtectedRoute>
              }
            />

            {/* --- ADMIN ROUTES --- */}
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

            <Route path="/admin">
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="branches" element={<BranchManagement />} />
              {/* ---> 2. THÊM DÒNG NÀY CHO ADMIN <--- */}
              <Route path="shifts" element={<ShiftManagement />} />
              {/* ... */}
            </Route>

            {/* Route cho Admin quản lý thuốc */}
            <Route path="/admin/medications" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'BRANCH_MANAGER']}>
                <MedicationManagement />
              </ProtectedRoute>
            } />


            <Route path="/admin/branches" element={<BranchManagement />} />

            {/* --- DOCTOR ROUTES --- */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Route cho Bác sĩ kê đơn */}
            <Route path="/doctor/prescription/create" element={
              <ProtectedRoute allowedRoles={['DOCTOR']}>
                <CreatePrescription />
              </ProtectedRoute>
            } />

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


            // ... Trong phần routes
            <Route path="/doctor/examination/:appointmentId" element={
              <ProtectedRoute allowedRoles={['DOCTOR']}>
                <MedicalExamination />
              </ProtectedRoute>
            } />

            <Route path="/doctor/appointments/new" element={
              <ProtectedRoute allowedRoles={['DOCTOR']}>
                {/* Bác sĩ đặt lịch tái khám, cũng bị khóa chi nhánh theo nơi họ làm việc */}
                <ManagerBookAppointment />
              </ProtectedRoute>
            } />

            {/* --- BRANCH MANAGER ROUTES --- */}
            <Route
              path="/branch_manager/dashboard"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_MANAGER']}>
                  <ManagerDashboard /> //
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

            <Route // <--- THÊM ROUTE NÀY
              path="/manager/inventory"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_MANAGER']}>
                  {/* TÁI SỬ DỤNG component của Admin */}
                  <MedicationManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/branch_manager/profile" // <--- SỬA DÒNG NÀY
              element={
                <ProtectedRoute allowedRoles={['BRANCH_MANAGER']}>
                  <ManagerProfile />
                </ProtectedRoute>
              }
            />

            {/* Tạm thời trỏ các menu khác về các trang admin cũ nhưng đổi path nếu muốn reuse */}
            <Route
              path="/manager/inventory"
              element={
                <ProtectedRoute allowedRoles={['BRANCH_MANAGER']}>
                  {/* Cần tạo trang InventoryImport.tsx sau */}
                  <div>Trang Nhập Kho (Đang xây dựng)</div>
                </ProtectedRoute>
              }
            />

            <Route path="/manager">
              <Route path="dashboard" element={<ManagerDashboard />} />

              {/* ---> 3. THÊM DÒNG NÀY CHO MANAGER <--- */}
              <Route path="shifts" element={<ShiftManagement />} />
              {/* Lưu ý: Cả Admin và Manager đều dùng chung 1 component ShiftManagement */}
              {/* ... */}
            </Route>

            <Route path="/manager/appointments/new" element={
              <ProtectedRoute allowedRoles={['BRANCH_MANAGER']}>
                <ManagerBookAppointment />
              </ProtectedRoute>
            } />
            <Route path="/receptionist/book-appointment" element={
              <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
                {/* Lễ tân dùng chung giao diện với Manager (khóa chi nhánh) */}
                <ReceptionistBookAppointment />
              </ProtectedRoute>
            } />

            {/* --- RECEPTIONIST ROUTES --- */}
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
                  <AppointmentList /> {/* Reuse component cũ */}
                </ProtectedRoute>
              }
            />

            <Route path="/receptionist/book-appointment" element={
              <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
                {/* Lễ tân dùng chung component với Manager, đã có logic khóa branch */}
                <ManagerBookAppointment />
              </ProtectedRoute>
            } />
            <Route
              path="/receptionist/profile" // <--- SỬA DÒNG NÀY
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
                  <ReceptionistProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receptionist/invoices"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
                  <InvoiceList /> {/* Reuse component cũ */}
                </ProtectedRoute>
              }
            />

            {/* --- PATIENT ROUTES --- */}
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
              path="/patient/appointments/:id" // <--- Route chi tiết có ID
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

            {/* DANH SÁCH HÓA ĐƠN */}
            <Route
              path="/patient/invoices"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <PatientInvoiceList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/patient/prescriptions/:id" // <--- Route xem đơn thuốc
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <PatientPrescriptionDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/patient/invoices/:id" // <--- Route xem hóa đơn & thanh toán
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <PatientInvoiceDetail />
                </ProtectedRoute>
              }
            />

            {/* Fallback Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider >
  );
}

export default App; 