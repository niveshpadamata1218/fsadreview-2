import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOtp from './pages/auth/VerifyOtp';
import CreateClass from './pages/teacher/CreateClass';
import StudentHistory from './pages/teacher/StudentHistory';
import TeacherClassDetail from './pages/teacher/TeacherClassDetail';
import TeacherClasses from './pages/teacher/TeacherClasses';
import TeacherOverview from './pages/teacher/TeacherOverview';
import AssignmentDetail from './pages/student/AssignmentDetail';
import JoinClass from './pages/student/JoinClass';
import PeerReviews from './pages/student/PeerReviews';
import PeerSubmissionReview from './pages/student/PeerSubmissionReview';
import StudentClassDetail from './pages/student/StudentClassDetail';
import StudentClasses from './pages/student/StudentClasses';
import StudentOverview from './pages/student/StudentOverview';

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'TEACHER' ? '/teacher' : '/student'} replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'TEACHER' ? '/teacher' : '/student'} replace />;
  }
  return children;
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoute({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === 'TEACHER' ? '/teacher' : '/student'} replace />;
  }
  return children;
}

function DashboardLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <div className="main-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-otp"
        element={
          <PublicRoute>
            <VerifyOtp />
          </PublicRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/teacher"
          element={
            <RoleRoute role="TEACHER">
              <TeacherOverview />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/classes"
          element={
            <RoleRoute role="TEACHER">
              <TeacherClasses />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/classes/new"
          element={
            <RoleRoute role="TEACHER">
              <CreateClass />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/classes/:classCode"
          element={
            <RoleRoute role="TEACHER">
              <TeacherClassDetail />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/classes/:classCode/students/:studentId"
          element={
            <RoleRoute role="TEACHER">
              <StudentHistory />
            </RoleRoute>
          }
        />

        <Route
          path="/student"
          element={
            <RoleRoute role="STUDENT">
              <StudentOverview />
            </RoleRoute>
          }
        />
        <Route
          path="/student/classes"
          element={
            <RoleRoute role="STUDENT">
              <StudentClasses />
            </RoleRoute>
          }
        />
        <Route
          path="/student/classes/join"
          element={
            <RoleRoute role="STUDENT">
              <JoinClass />
            </RoleRoute>
          }
        />
        <Route
          path="/student/classes/:classCode"
          element={
            <RoleRoute role="STUDENT">
              <StudentClassDetail />
            </RoleRoute>
          }
        />
        <Route
          path="/student/classes/:classCode/assignments/:id"
          element={
            <RoleRoute role="STUDENT">
              <AssignmentDetail />
            </RoleRoute>
          }
        />
        <Route
          path="/student/peer-reviews"
          element={
            <RoleRoute role="STUDENT">
              <PeerReviews />
            </RoleRoute>
          }
        />
        <Route
          path="/student/peer-reviews/:assignmentId/:submissionId"
          element={
            <RoleRoute role="STUDENT">
              <PeerSubmissionReview />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
