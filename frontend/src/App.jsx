import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Placeholder from './pages/Placeholder';
import AddVehicle from './pages/AddVehicle';
import DailyLogsheet from './pages/DailyLogsheet';
import MonthlyReport from './pages/MonthlyReport';
import { PageLoader } from './components/Loader';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Home />} />
        <Route path="/kmpl/depot" element={<Placeholder title="Add Depot KMPL" />} />
        <Route path="/kmpl/vehicle" element={<AddVehicle />} />
        {/* <Route path="/reports/daily-logsheet" element={<Placeholder title="Daily Logsheet Report" />} />
        <Route path="/reports/monthly" element={<Placeholder title="Monthly KMPL Report" />} /> */}
        <Route path="/reports/from-to" element={<Placeholder title="From-To date KMPL Report" />} />
        <Route path="/reports/from-to-typewise" element={<Placeholder title="From-To date KMPL Report Typewise" />} />
        <Route path="/reports/defect" element={<Placeholder title="KMPL Defect Report" />} />
        <Route path="/reports/daily-logsheet" element={<DailyLogsheet />} />
        <Route path="/reports/monthly" element={<MonthlyReport />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
