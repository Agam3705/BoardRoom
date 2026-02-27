import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children }) => {
    const { userInfo } = useAuthStore();

    if (!userInfo) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
