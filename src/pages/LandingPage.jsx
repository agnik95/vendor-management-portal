import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './LandingPage.css'

function LandingPage() {
    const navigate = useNavigate()
    const [mousePos, setMousePos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 })

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY })
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    return (
        <div className="landing-root">
            {/* Spectacular Interactive Mouse Glow */}
            <div 
                className="cursor-glow" 
                style={{ transform: `translate(${mousePos.x - 400}px, ${mousePos.y - 400}px)` }} 
            />

            <div className="landing-bg-grid" />
            
            {/* Ambient Glowing Orbs */}
            <div className="ambient-orb orb-blue" />
            <div className="ambient-orb orb-purple" />

            <header className="landing-header fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="brand">
                    <div className="brand-logo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            <polyline points="9 12 11 14 15 10"></polyline>
                        </svg>
                    </div>
                    <div className="brand-text">
                        <h1>VENDOR PORTAL</h1>
                        <span>Vendor Management · SAP S/4HANA Cloud</span>
                    </div>
                </div>

                <div className="status-badge fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <span className="dot"></span>
                    S/4HANA Cloud - Integration Suite connected
                </div>
            </header>

            <main className="landing-main fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="kicker">ONE PORTAL AROUND THE ERP</div>
                
                <h2 className="headline">
                    The buyer asks, <span className="highlight-blue">"what needs my decision?"</span><br/>
                    The supplier asks, <span className="highlight-purple">"what do I need to do?"</span>
                </h2>

                <p className="description">
                    Purchase orders, quotations, goods receipts and payments stay in S/4HANA. The portal owns<br/>
                    everything around them — onboarding, certificates, the 8D loop, responsiveness scoring and the<br/>
                    conversations that used to live in inboxes.
                </p>

                <div className="cards-container">
                    {/* Buyer Portal Card */}
                    <button 
                        className="portal-card blue-card fade-in-up" 
                        style={{ animationDelay: '0.4s' }}
                        onClick={() => navigate('/buyer')}
                    >
                        <div className="card-top">
                            <div className="card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 9h6M9 13h6M9 17h6"></path>
                                </svg>
                            </div>
                            <div className="card-arrow">↗</div>
                        </div>
                        <div className="card-pill">DECISION & CONTROL</div>
                        <h3>Buyer Portal</h3>
                        <p>Approvals, master data, certificates, 8D review, scorecards and queries — what needs your decision, ranked.</p>
                    </button>

                    {/* Supplier Portal Card */}
                    <button 
                        className="portal-card purple-card fade-in-up" 
                        style={{ animationDelay: '0.5s' }}
                        onClick={() => navigate('/supplier')}
                    >
                        <div className="card-top">
                            <div className="card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                </svg>
                            </div>
                            <div className="card-arrow">↗</div>
                        </div>
                        <div className="card-pill">SELF-SERVICE</div>
                        <h3>Supplier Portal</h3>
                        <p>Orders, shipment notices, invoices, payments and quality responses — what you need to do, in one place.</p>
                    </button>

                    {/* Registration Card */}
                    <button 
                        className="portal-card green-card fade-in-up" 
                        style={{ animationDelay: '0.6s' }}
                        onClick={() => navigate('/register')}
                    >
                        <div className="card-top">
                            <div className="card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="8.5" cy="7" r="4"></circle>
                                    <line x1="20" y1="8" x2="20" y2="14"></line>
                                    <line x1="23" y1="11" x2="17" y2="11"></line>
                                </svg>
                            </div>
                            <div className="card-arrow">↗</div>
                        </div>
                        <div className="card-pill">ONBOARDING</div>
                        <h3>New Supplier Registration</h3>
                        <p>Six sections, live GSTIN validation and duplicate screening. Nothing reaches the ERP until approval.</p>
                    </button>
                </div>
            </main>

            <footer className="landing-footer fade-in-up" style={{ animationDelay: '0.7s' }}>
                <div className="footer-left">
                    Business Partner, RFQ, PO, inbound delivery, invoice and payment flows integrate through SAP Integration Suite.
                </div>
                <div className="footer-right">
                    TAMS/VMP/BUY-SUP/2026/R1
                </div>
            </footer>
        </div>
    )
}

export default LandingPage
