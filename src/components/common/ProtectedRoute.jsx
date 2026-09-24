import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * ProtectedRoute — Route-level access control wrapper
 * 
 * Usage:
 *   <ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}>
 *       <BuyerPage />
 *   </ProtectedRoute>
 * 
 * Props:
 *   - allowedRoles: Array of role strings that are permitted to access this route
 *   - children: The page component to render if authorized
 */
function ProtectedRoute({ allowedRoles = [], children }) {
    const { isAuthenticated, user, loading } = useAuth()

    // While auth state is being rehydrated, show nothing (prevents flash)
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'var(--bg-app, #f8fafc)',
                color: 'var(--text-muted, #64748b)',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
            }}>
                Verifying access…
            </div>
        )
    }

    // Not logged in → redirect to login page
    if (!isAuthenticated) {
        if (allowedRoles.includes('VENDOR')) {
            return <Navigate to="/supplier/login" replace />
        }
        return <Navigate to="/buyer/login" replace />
    }

    // If allowedRoles is empty, any authenticated user can access
    if (allowedRoles.length === 0) {
        return children
    }

    // Check if user's role is in the allowed list
    const userRole = (user?.role || '').toUpperCase()
    const permitted = allowedRoles.map(r => r.toUpperCase()).includes(userRole)

    if (!permitted) {
        // Redirect vendor users to their portal, buyer/admin users to theirs
        if (userRole === 'VENDOR') {
            return <Navigate to="/supplier" replace />
        }
        return <Navigate to="/buyer" replace />
    }

    return children
}

export default ProtectedRoute
