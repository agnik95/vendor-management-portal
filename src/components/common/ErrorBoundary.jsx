import React from 'react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('Portal Error Boundary caught an error:', error, errorInfo)
        this.setState({ errorInfo })
    }

    handleReset = () => {
        try {
            localStorage.removeItem('tams_vendor_portal_state')
            localStorage.removeItem('tams_vendor_portal_state_v2')
            localStorage.removeItem('tams_vendor_portal_state_v3')
            localStorage.clear()
        } catch {
            // ignore
        }
        window.location.href = '/'
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#EFF2F4',
                        fontFamily: '"IBM Plex Sans", -apple-system, sans-serif',
                        padding: '24px',
                    }}
                >
                    <div
                        style={{
                            maxWidth: '560px',
                            width: '100%',
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid #DEE3E8',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                            padding: '32px',
                            textAlign: 'left',
                        }}
                    >
                        <div
                            style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                backgroundColor: '#FBE7E6',
                                color: '#A3231F',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                marginBottom: '16px',
                            }}
                        >
                            Rendering Interruption
                        </div>

                        <h2
                            style={{
                                fontFamily: 'Archivo, sans-serif',
                                fontSize: '22px',
                                margin: '0 0 10px 0',
                                color: '#14202B',
                            }}
                        >
                            Vendor Portal Render Recovery
                        </h2>

                        <p
                            style={{
                                color: '#5A6B7B',
                                fontSize: '13.5px',
                                lineHeight: '1.6',
                                margin: '0 0 20px 0',
                            }}
                        >
                            The portal encountered an unexpected state condition while rendering.
                            You can clear the cached local state and restore full initial seed data.
                        </p>

                        {this.state.error && (
                            <div
                                style={{
                                    backgroundColor: '#FAFBFC',
                                    border: '1px solid #DEE3E8',
                                    borderRadius: '6px',
                                    padding: '12px 14px',
                                    fontSize: '12px',
                                    fontFamily: 'monospace',
                                    color: '#A3231F',
                                    marginBottom: '24px',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {this.state.error.toString()}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={this.handleReset}
                                style={{
                                    backgroundColor: '#1B6EC2',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    padding: '10px 18px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                }}
                            >
                                Reset Application State & Reload
                            </button>

                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                style={{
                                    backgroundColor: '#ffffff',
                                    color: '#14202B',
                                    border: '1px solid #DEE3E8',
                                    borderRadius: '5px',
                                    padding: '10px 18px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                }}
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
