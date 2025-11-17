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
import PatientList from './pages/admin/PatientList';
import PatientDetail from './pages/admin/PatientDetail';
import DoctorList from './pages/admin/DoctorList';
import DoctorDetail from './pages/admin/DoctorDetail';
import SpecializationAndRoom from './pages/admin/SpecializationAndRoom';
import AppointmentList from './pages/admin/AppointmentList';
import AppointmentCalendar from './pages/admin/AppointmentCalendar';
import BookAppointment from './pages/admin/BookAppointment';
import PrescriptionList from './pages/admin/PrescriptionList';
import PrescriptionDetail from './pages/admin/PrescriptionDetail';
import InvoiceList from './pages/admin/InvoiceList';
import InvoiceDetail from './pages/admin/InvoiceDetail';
import DoctorSchedule from './pages/doctor/DoctorSchedule';
import AdminProfile from './pages/admin/AdminProfile';
import DoctorProfile from './pages/doctor/DoctorProfile';
import PatientProfile from './pages/patient/PatientProfile';
import { useAuthStore } from './stores/authStore';
import 'dayjs/locale/vi';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, token } = useAuthStore();
  const isAuthenticated = !!token && !!user;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
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
                <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}>
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
                  <BookAppointment />
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
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <DoctorDashboard />
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

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
