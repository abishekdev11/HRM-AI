import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, roles = [] }) {

    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (roles && roles.length > 0) {
        const userJson = localStorage.getItem("user");
        let user = null;
        try {
            user = userJson ? JSON.parse(userJson) : null;
        } catch (e) {
            user = null;
        }

        if (!user || !roles.includes(user.role)) {
            return <Navigate to="/ai-assistant" replace />;
        }
    }

    return children;

}

export default ProtectedRoute;