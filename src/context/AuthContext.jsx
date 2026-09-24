import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const AUTH_TOKEN_KEY = 'vendor_portal_token'
const AUTH_USER_KEY = 'vendor_portal_user'

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem(AUTH_USER_KEY)
            return saved ? JSON.parse(saved) : null
        } catch {
            return null
        }
    })
    const [loading, setLoading] = useState(true)

    const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api/v1'

    // Persist user to localStorage whenever it changes
    useEffect(() => {
        if (user) {
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
        } else {
            localStorage.removeItem(AUTH_USER_KEY)
        }
    }, [user])

    // On mount, rehydrate session by verifying token with /profile
    useEffect(() => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY)
        if (!token) {
            setLoading(false)
            return
        }

        fetch(`${API_BASE_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        })
            .then(res => {
                if (!res.ok) throw new Error('Token invalid')
                return res.json()
            })
            .then(profile => {
                setUser(prev => ({
                    ...prev,
                    ...profile,
                    role: (profile.role || prev?.role || 'VENDOR').toUpperCase(),
                }))
            })
            .catch(() => {
                // Token expired or invalid — keep stored user data for now
                // The apiClient 401 handler will clear everything on next real API call
            })
            .finally(() => setLoading(false))
    }, [API_BASE_URL])

    /**
     * Login: POST to /api/v1/login with form-urlencoded credentials
     * Returns the full token response with role, vendor_id, etc.
     */
    const login = useCallback(async (email, password) => {
        const params = new URLSearchParams()
        params.append('username', email)
        params.append('password', password)

        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            throw new Error(err.detail || 'Login failed')
        }

        const data = await response.json()

        // Store token
        localStorage.setItem(AUTH_TOKEN_KEY, data.access_token)

        // Store vendor_id for backward compatibility
        if (data.vendor_id) {
            localStorage.setItem('vendor_id', data.vendor_id)
        }

        // Build user object from login response
        const userData = {
            email: data.email,
            role: (data.role || 'VENDOR').toUpperCase(),
            vendor_id: data.vendor_id || null,
            registration_number: data.registration_number || null,
            approval_status: data.approval_status || null,
            sap_bp_id: data.sap_bp_id || null,
        }

        setUser(userData)
        return userData
    }, [API_BASE_URL])

    /**
     * Logout: Clear all auth state and redirect to login
     */
    const logout = useCallback(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
        localStorage.removeItem('vendor_id')
        setUser(null)
        window.location.href = '/login'
    }, [])

    /**
     * Check if user has one of the allowed roles
     */
    const hasRole = useCallback((...roles) => {
        if (!user?.role) return false
        return roles.map(r => r.toUpperCase()).includes(user.role.toUpperCase())
    }, [user])

    const isAuthenticated = !!user && !!localStorage.getItem(AUTH_TOKEN_KEY)

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        hasRole,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext
