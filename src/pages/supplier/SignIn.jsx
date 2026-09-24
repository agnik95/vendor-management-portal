import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import FormField from '../../components/common/FormField'
import { useToast } from '../../context/useToast'
import { useVendorData } from '../../context/useVendorData'
import { useAuth } from '../../context/AuthContext'

function SignIn() {
    const navigate = useNavigate()
    const location = useLocation()
    const toast = useToast()
    const { data } = useVendorData()
    const { login, logout } = useAuth()

    const isBuyerLogin = location.pathname.includes('/buyer')

    const [email, setEmail] = useState(isBuyerLogin ? 'user1@gmail.com' : 'a.deshpande@precisioncomp.in')
    const [password, setPassword] = useState('••••••••')
    const [checkRef, setCheckRef] = useState('REG-2026-187')

    const handleSignIn = async (e) => {
        e?.preventDefault()
        try {
            const userData = await login(email, password)
            
            if (isBuyerLogin && userData.role === 'VENDOR') {
                logout()
                toast.error('Access Denied', 'You cannot access the Buyer Portal with a Supplier account.')
                return
            }

            if (!isBuyerLogin && (userData.role === 'BUYER' || userData.role === 'ADMIN')) {
                logout()
                toast.error('Access Denied', 'You cannot access the Supplier Portal with a Buyer account.')
                return
            }

            toast.success(
                'Signed in successfully',
                `Authenticated as ${userData.email} · Role: ${userData.role} · BP ${userData.sap_bp_id || 'Pending'}`
            )

            // Route based on user role from backend
            if (userData.role === 'BUYER' || userData.role === 'ADMIN') {
                navigate('/buyer')
            } else {
                navigate('/supplier')
            }
        } catch (error) {
            toast.error('Authentication Failed', error.message)
        }
    }

    const handleForgotPassword = () => {
        toast.info(
            'Reset link dispatched',
            'If that email is registered in SAP Cloud Identity Services, a cryptographic reset link has been sent.'
        )
    }

    const handleCheckStatus = () => {
        const found = (data?.regs || []).find((r) => (r?.ref || '').toLowerCase() === checkRef.trim().toLowerCase())
        if (found) {
            const stepNames = ['Category Buyer', 'Supplier Quality (SQE)', 'Finance & Banking', 'Procurement Head']
            toast.info(
                `Status for ${found?.ref}: ${found?.st || 'Pending'}`,
                `Currently at Step ${(found?.step || 0) + 1} of 4: ${stepNames[found?.step || 0] || 'Review'}`
            )
        } else {
            toast.warning(
                'Application not found',
                `No active registration matches reference "${checkRef}". Please check your submission confirmation email.`
            )
        }
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-app, #f8fafc)',
                padding: '32px 16px',
            }}
        >
            {/* Top Brand Bar */}
            <div
                style={{
                    maxWidth: '960px',
                    width: '100%',
                    margin: '0 auto 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                        style={{
                            width: '36px',
                            height: '36px',
                            background: 'var(--color-primary, #1e3a8a)',
                            color: '#fff',
                            fontWeight: 800,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                        }}
                    >
                        V
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em' }}>
                            VENDOR MANAGEMENT PORTAL
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                            SAP S/4HANA CLOUD INTEGRATED
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Auth Split Cards */}
            <div
                style={{
                    maxWidth: '960px',
                    width: '100%',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                    gap: '24px',
                }}
            >
                {/* Left Card: Sign In */}
                <Card>
                    <Card.Header
                        kicker={isBuyerLogin ? "ENTERPRISE ACCESS" : "SECURE PORTAL ACCESS"}
                        title={isBuyerLogin ? "Sign in to Buyer Portal" : "Sign in to your account"}
                    />
                    <Card.Body>
                        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <FormField label="Registered corporate email" required>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="username"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-color, #cbd5e1)',
                                    }}
                                />
                            </FormField>

                            <FormField label="Password" required>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-color, #cbd5e1)',
                                    }}
                                />
                            </FormField>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                <Button variant="primary" type="submit">
                                    Sign in
                                </Button>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--color-primary, #1e3a8a)',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Forgot password?
                                </button>
                            </div>
                        </form>

                        <div
                            style={{
                                borderTop: '1px solid var(--border-color, #e2e8f0)',
                                margin: '24px 0 16px',
                            }}
                        />

                        <Button
                            variant="secondary"
                            style={{ width: '100%' }}
                            onClick={() => {
                                toast.info('SSO Handshake', 'Authenticating through SAP Cloud Identity Services...')
                                setTimeout(() => navigate('/supplier'), 600)
                            }}
                        >
                            Sign in with your company ID (SSO)
                        </Button>

                        <div
                            style={{
                                fontSize: '11.5px',
                                color: 'var(--text-muted)',
                                marginTop: '14px',
                                lineHeight: 1.5,
                            }}
                        >
                            Identity federation is provisioned via <strong>SAP Cloud Identity Services</strong>. The portal stores
                            user records and tenant role permissions only.
                        </div>
                    </Card.Body>
                </Card>

                {/* Right Card: New Supplier Registration */}
                <Card>
                    <Card.Header
                        kicker="ONBOARDING"
                        title="New supplier?"
                    />
                    <Card.Body>
                        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                            Register your company to be considered as a supplier. Nothing is created in the buyer's ERP until your application is approved.
                        </p>
                        
                        <Button variant="secondary" onClick={() => navigate('/register')}>
                            Start registration
                        </Button>
                        
                        <div
                            style={{
                                borderTop: '1px solid var(--border-color, #e2e8f0)',
                                margin: '24px 0 16px',
                            }}
                        />

                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                            Already applied?
                        </div>
                        <FormField label="">
                            <input
                                type="text"
                                className="form-control font-mono"
                                placeholder="Application reference"
                                value={checkRef}
                                onChange={(e) => setCheckRef(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color, #cbd5e1)',
                                }}
                            />
                        </FormField>
                        <Button variant="outline" size="sm" onClick={handleCheckStatus} style={{ marginTop: '12px' }}>
                            Check status
                        </Button>
                    </Card.Body>
                </Card>
            </div>

            {/* Architecture Explanatory Footer Card */}
            <div
                style={{
                    maxWidth: '960px',
                    width: '100%',
                    margin: '24px auto 0',
                    padding: '14px 18px',
                    background: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                }}
            >
                <strong>ERP Demarcation Principle:</strong> Vendor registration data lives strictly within the portal database
                until four-tier approval completes. Upon final sign-off, the portal invokes SAP standard{' '}
                <code>API_BUSINESS_PARTNER</code> to generate the official Business Partner master, storing only the returned BP number
                as the join key.
            </div>
        </div>
    )
}

export default SignIn
