import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

/**
 * Route guard — redirects unauthenticated users to /login.
 * If a `role` prop is provided, also enforces role-based access.
 */
export default function ProtectedRoute({ children, role }) {
    const user = useAuthStore((s) => s.user)

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (role && user.role !== role) {
        // Customer trying to access admin, or vice versa
        const fallback = user.role === 'ADMIN' ? '/admin' : '/customer/portal'
        return <Navigate to={fallback} replace />
    }

    return children
}
