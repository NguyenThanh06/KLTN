import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    // Trong lúc đang kiểm tra localStorage thì không làm gì cả (tránh nháy trang)
    if (loading) return null; 

    if (!isAuthenticated) {
        // Chuyển hướng về login, đồng thời lưu lại trang họ đang định vào (state: { from: location })
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;