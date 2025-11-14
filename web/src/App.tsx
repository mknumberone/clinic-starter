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
              path="/patient/dashboard"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <PatientDashboard />
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
