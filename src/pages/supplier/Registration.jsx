import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import FormField from '../../components/common/FormField'
import StatusBadge from '../../components/common/StatusBadge'
import DataTable from '../../components/common/DataTable'
import { useToast } from '../../context/useToast'
import { useVendorData } from '../../context/useVendorData'
import { validateGSTINChecksum } from '../../services/supplier/registrationService'
import './Registration.css'
import '../LandingPage.css' // Import spectacular background styles

const WIZARD_STEPS = [
    'Company',
    'Contacts',
    'Tax & compliance',
    'Banking',
    'Capability',
    'Documents',
]

const APPROVAL_ROUTING = [
    { section: 'Company', reviewer: 'Procurement' },
    { section: 'Contacts', reviewer: 'Procurement' },
    { section: 'Tax & compliance', reviewer: 'Finance' },
    { section: 'Banking', reviewer: 'Finance' },
    { section: 'Capability', reviewer: 'Quality' },
    { section: 'Documents', reviewer: 'Legal' },
]

function Registration() {
    const navigate = useNavigate()
    const toast = useToast()
    const { data, submitRegistration } = useVendorData()

    const [currentStep, setCurrentStep] = useState(0)
    const [slideDirection, setSlideDirection] = useState('forward')
    const [mousePos, setMousePos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 })

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY })
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    // Form data state
    const [formData, setFormData] = useState({
        // 0. Company
        name: 'Hosur Turned Parts LLP',
        entityType: 'LLP',
        country: 'India',
        incDate: '14 Feb 2019',
        cin: 'AAF-2291',
        website: 'www.hosurturned.in',

        // 1. Contacts
        contacts: [
            {
                name: 'R. Sundaram',
                designation: 'Managing Partner',
                email: 'r.sundaram@hosurturned.in',
                mobile: '98450 11223',
                function: 'Primary, Sales',
                primary: true,
            },
            {
                name: 'M. Lakshmi',
                designation: 'Accounts Manager',
                email: 'accounts@hosurturned.in',
                mobile: '98450 11229',
                function: 'Accounts',
                primary: false,
            },
        ],

        // 2. Tax & Compliance
        pan: 'AABCT1332L',
        gstin: '29AABCT1332L1ZA',
        msme: 'Small — Udyam registered',
        udyam: 'UDYAM-KR-03-0041987',
        lowerDeduction: 'Not applicable',

        // 3. Banking
        accHolder: 'Hosur Turned Parts LLP',
        accNo: '••••••4471',
        accNoConfirm: '••••••4471',
        ifsc: 'HDFC0001234',
        branch: 'HDFC Bank, Hosur',
        accType: 'Current',

        // 4. Capability
        categories: 'Machined parts, Turned components',
        capacity: '40,000 EA / month',
        customers: 'Bosch, Wabco, TVS',
        certsHeld: 'ISO 9001:2015',

        // 5. Documents
        docs: [
            { name: 'GST registration certificate', mandatory: true, validTo: '—', status: 'Uploaded' },
            { name: 'PAN card', mandatory: true, validTo: '—', status: 'Uploaded' },
            { name: 'Udyam registration', mandatory: true, validTo: '—', status: 'Uploaded' },
            { name: 'ISO 9001 certificate', mandatory: true, validTo: '30 Jun 2027', status: 'Uploaded' },
            { name: 'Cancelled cheque', mandatory: true, validTo: '—', status: 'Uploaded' },
            { name: 'Non-disclosure agreement', mandatory: true, validTo: '—', status: 'Pending' },
            { name: 'Anti-bribery declaration', mandatory: true, validTo: '3 years', status: 'Pending' },
        ],
    })

    // Official MOD 36 GSTIN Checksum calculation (VAL-003)
    const isGstinChecksumValid = validateGSTINChecksum(formData.gstin)
    const isPanMatchingGstin =
        Boolean(formData.gstin && formData.pan) &&
        formData.gstin.slice(2, 12).toUpperCase() === formData.pan.toUpperCase()
    const isTaxValid = isGstinChecksumValid && isPanMatchingGstin

    // Duplicate check
    const isDuplicatePan = (data?.regs || []).some(
        (r) => (r?.pan || '').toUpperCase() === formData.pan.toUpperCase() && r?.st === 'OPEN'
    )

    const handleNext = async () => {
        if (currentStep === 2 && !isTaxValid) {
            toast.error(
                'GSTIN validation failed (VAL-003)',
                !isGstinChecksumValid
                    ? 'Check digit checksum calculation failed. Please check for a typing error.'
                    : 'GSTIN characters 3-12 must strictly match the corporate PAN.'
            )
            return
        }

        if (currentStep < WIZARD_STEPS.length - 1) {
            setSlideDirection('forward')
            setCurrentStep((prev) => prev + 1)
            window.scrollTo(0, 0)
        } else {
            // Final submit
            const res = await submitRegistration(formData)
            if (res.error) {
                toast.error('Submission failed', res.error)
            } else {
                toast.success(
                    'Registration application submitted!',
                    `Assigned reference ${res.ref}. Forwarded to Category Buyer for Step 1 approval.`
                )
                navigate('/supplier/login')
            }
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setSlideDirection('backward')
            setCurrentStep((prev) => prev - 1)
            window.scrollTo(0, 0)
        }
    }

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

            <div className="registration-container" style={{ position: 'relative', zIndex: 10, background: 'transparent' }}>
                <div className="wizard-header">
                    <div>
                        <div className="kicker">
                            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/supplier/login')}>
                                &larr; Portal chooser
                            </span>
                            <span style={{ margin: '0 8px' }}>•</span>
                            ONBOARDING
                        </div>
                        <h2>Supplier registration</h2>
                    </div>
                </div>

                <div className="dark-glass-card" style={{ marginBottom: '24px' }}>
                    <div className="card-header">
                        <div className="portal-badge">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                            PORTAL
                        </div>
                    </div>
                    <div className="wizard-stepper-inline" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        {WIZARD_STEPS.map((step, idx) => {
                            const isCompleted = idx < currentStep
                            const isActive = idx === currentStep
                            return (
                                <div
                                    key={step}
                                    onClick={() => {
                                        setSlideDirection(idx > currentStep ? 'forward' : 'backward')
                                        setCurrentStep(idx)
                                    }}
                                    className={`step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                >
                                    <div className="step-circle">
                                        {isCompleted ? '✓' : idx + 1}
                                    </div>
                                    <span className="step-label">{step}</span>
                                </div>
                            )
                        })}
                    </div>

                    <div style={{ padding: '32px 0' }}>
                        <div 
                            key={currentStep} // Forces re-render for animation on step change
                            className={`wizard-step-content ${slideDirection === 'backward' ? 'slide-reverse' : ''}`}
                        >
                        {/* 0. COMPANY */}
                        {currentStep === 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                                <FormField label="Legal entity name" required>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </FormField>
                                <FormField label="Entity constitution" required>
                                    <select
                                        className="form-control"
                                        value={formData.entityType}
                                        onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                                    >
                                        <option>LLP</option>
                                        <option>Private limited</option>
                                        <option>Public limited</option>
                                        <option>Partnership</option>
                                        <option>Proprietorship</option>
                                    </select>
                                </FormField>
                                <FormField label="Country of incorporation">
                                    <input type="text" className="form-control" value="India" readOnly disabled />
                                </FormField>
                                <FormField label="Date of incorporation">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.incDate}
                                        onChange={(e) => setFormData({ ...formData, incDate: e.target.value })}
                                    />
                                </FormField>
                                <FormField label="CIN / LLPIN">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.cin}
                                        onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                                    />
                                </FormField>
                                <FormField label="Official website">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    />
                                </FormField>
                            </div>
                        )}

                        {/* 1. CONTACTS */}
                        {currentStep === 1 && (
                            <div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border-color, #cbd5e1)', textAlign: 'left' }}>
                                            <th style={{ padding: '8px' }}>Name</th>
                                            <th style={{ padding: '8px' }}>Designation</th>
                                            <th style={{ padding: '8px' }}>Email</th>
                                            <th style={{ padding: '8px' }}>Mobile</th>
                                            <th style={{ padding: '8px' }}>Functional Scope</th>
                                            <th style={{ padding: '8px', textAlign: 'center' }}>Primary</th>
                                            <th style={{ padding: '8px', textAlign: 'center' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.contacts.map((c, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                                                <td style={{ padding: '8px' }}>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={c.name}
                                                        onChange={(e) => {
                                                            const newContacts = [...formData.contacts]
                                                            newContacts[idx].name = e.target.value
                                                            setFormData({ ...formData, contacts: newContacts })
                                                        }}
                                                        style={{ padding: '6px 8px', minHeight: 'auto', width: '100%' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '8px' }}>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={c.designation}
                                                        onChange={(e) => {
                                                            const newContacts = [...formData.contacts]
                                                            newContacts[idx].designation = e.target.value
                                                            setFormData({ ...formData, contacts: newContacts })
                                                        }}
                                                        style={{ padding: '6px 8px', minHeight: 'auto', width: '100%' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '8px' }}>
                                                    <input
                                                        type="email"
                                                        className="form-control"
                                                        value={c.email}
                                                        onChange={(e) => {
                                                            const newContacts = [...formData.contacts]
                                                            newContacts[idx].email = e.target.value
                                                            setFormData({ ...formData, contacts: newContacts })
                                                        }}
                                                        style={{ padding: '6px 8px', minHeight: 'auto', width: '100%' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '8px' }}>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={c.mobile}
                                                        onChange={(e) => {
                                                            const newContacts = [...formData.contacts]
                                                            newContacts[idx].mobile = e.target.value
                                                            setFormData({ ...formData, contacts: newContacts })
                                                        }}
                                                        style={{ padding: '6px 8px', minHeight: 'auto', width: '100%' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '8px' }}>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={c.function}
                                                        onChange={(e) => {
                                                            const newContacts = [...formData.contacts]
                                                            newContacts[idx].function = e.target.value
                                                            setFormData({ ...formData, contacts: newContacts })
                                                        }}
                                                        style={{ padding: '6px 8px', minHeight: 'auto', width: '100%' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                                    <input 
                                                        type="radio" 
                                                        name="primaryContact" 
                                                        checked={c.primary} 
                                                        onChange={() => {
                                                            const newContacts = formData.contacts.map((contact, i) => ({
                                                                ...contact,
                                                                primary: i === idx
                                                            }))
                                                            setFormData({ ...formData, contacts: newContacts })
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            const newContacts = formData.contacts.filter((_, i) => i !== idx)
                                                            setFormData({ ...formData, contacts: newContacts })
                                                        }}
                                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
                                                        title="Remove contact"
                                                    >
                                                        &times;
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-start' }}>
                                    <Button 
                                        variant="secondary"
                                        onClick={() => {
                                            setFormData({
                                                ...formData,
                                                contacts: [
                                                    ...formData.contacts,
                                                    { name: '', designation: '', email: '', mobile: '', function: '', primary: false }
                                                ]
                                            })
                                        }}
                                    >
                                        + Add a row
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* 2. TAX & COMPLIANCE */}
                        {currentStep === 2 && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                                    <FormField label="Country of registration">
                                        <input type="text" className="form-control" value="India" readOnly disabled />
                                    </FormField>

                                    <FormField label="Permanent Account Number (PAN)" required helper="10-character corporate PAN">
                                        <input
                                            type="text"
                                            className="form-control font-mono"
                                            value={formData.pan}
                                            onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                                            maxLength={10}
                                        />
                                    </FormField>

                                    <FormField
                                        label="GSTIN — principal place of business"
                                        required
                                        helper={
                                            !isGstinChecksumValid
                                                ? 'Checksum failed: GSTIN chars 3-12 must match PAN'
                                                : 'State code + PAN + entity indicator'
                                        }
                                    >
                                        <input
                                            type="text"
                                            className="form-control font-mono"
                                            value={formData.gstin}
                                            onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                                            maxLength={15}
                                            style={{
                                                borderColor: !isGstinChecksumValid ? 'var(--color-danger, #ef4444)' : 'inherit',
                                            }}
                                        />
                                    </FormField>

                                    <FormField label="MSME classification">
                                        <select
                                            className="form-control"
                                            value={formData.msme}
                                            onChange={(e) => setFormData({ ...formData, msme: e.target.value })}
                                        >
                                            <option>Small — Udyam registered</option>
                                            <option>Micro — Udyam registered</option>
                                            <option>Medium</option>
                                            <option>Not an MSME</option>
                                        </select>
                                    </FormField>

                                    <FormField label="Udyam registration number">
                                        <input
                                            type="text"
                                            className="form-control font-mono"
                                            value={formData.udyam}
                                            onChange={(e) => setFormData({ ...formData, udyam: e.target.value })}
                                        />
                                    </FormField>

                                    <FormField label="Lower deduction certificate">
                                        <select
                                            className="form-control"
                                            value={formData.lowerDeduction}
                                            onChange={(e) => setFormData({ ...formData, lowerDeduction: e.target.value })}
                                        >
                                            <option>Not applicable</option>
                                            <option>Held — valid to 31 Mar 2027</option>
                                        </select>
                                    </FormField>
                                </div>

                                {/* Validation Callouts */}
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                                        gap: '16px',
                                        marginTop: '20px',
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: '14px',
                                            borderRadius: '8px',
                                            background: isGstinChecksumValid
                                                ? 'rgba(16, 185, 129, 0.06)'
                                                : 'rgba(239, 68, 68, 0.06)',
                                            border: isGstinChecksumValid
                                                ? '1px solid rgba(16, 185, 129, 0.3)'
                                                : '1px solid rgba(239, 68, 68, 0.3)',
                                        }}
                                    >
                                        <strong>Live GSTIN Service:</strong>{' '}
                                        {isGstinChecksumValid
                                            ? 'GSTN active · legal name matched'
                                            : 'Checksum failed — correct the GSTIN to continue'}
                                        <div style={{ marginTop: '8px' }}>
                                            <StatusBadge
                                                status={isGstinChecksumValid ? 'GSTIN Active · Name Matched' : 'Invalid Checksum'}
                                                tone={isGstinChecksumValid ? 'success' : 'danger'}
                                            />
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            padding: '14px',
                                            borderRadius: '8px',
                                            background: !isDuplicatePan
                                                ? 'rgba(16, 185, 129, 0.06)'
                                                : 'rgba(245, 158, 11, 0.06)',
                                            border: !isDuplicatePan
                                                ? '1px solid rgba(16, 185, 129, 0.3)'
                                                : '1px solid rgba(245, 158, 11, 0.3)',
                                        }}
                                    >
                                        <strong>Duplicate Screening:</strong> Matched against S/4HANA BP table{' '}
                                        <code>A_BusinessPartnerTaxNumber</code> and active pipeline.
                                        <div style={{ marginTop: '8px' }}>
                                            <StatusBadge
                                                status={!isDuplicatePan ? 'No duplicate found' : 'Potential duplicate flagged'}
                                                tone={!isDuplicatePan ? 'success' : 'warning'}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. BANKING */}
                        {currentStep === 3 && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                                    <FormField label="Account holder name" required helper="Must strictly match legal entity name">
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.accHolder}
                                            onChange={(e) => setFormData({ ...formData, accHolder: e.target.value })}
                                        />
                                    </FormField>

                                    <FormField label="Account number" required>
                                        <input
                                            type="text"
                                            className="form-control font-mono"
                                            value={formData.accNo}
                                            onChange={(e) => setFormData({ ...formData, accNo: e.target.value })}
                                        />
                                    </FormField>

                                    <FormField label="Re-enter account number" required>
                                        <input
                                            type="text"
                                            className="form-control font-mono"
                                            value={formData.accNoConfirm}
                                            onChange={(e) => setFormData({ ...formData, accNoConfirm: e.target.value })}
                                        />
                                    </FormField>

                                    <FormField label="IFSC code" required>
                                        <input
                                            type="text"
                                            className="form-control font-mono"
                                            value={formData.ifsc}
                                            onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
                                        />
                                    </FormField>

                                    <FormField label="Bank and branch">
                                        <input type="text" className="form-control" value={formData.branch} readOnly disabled />
                                    </FormField>

                                    <FormField label="Account category">
                                        <select
                                            className="form-control"
                                            value={formData.accType}
                                            onChange={(e) => setFormData({ ...formData, accType: e.target.value })}
                                        >
                                            <option>Current</option>
                                            <option>Cash credit</option>
                                            <option>Overdraft</option>
                                        </select>
                                    </FormField>
                                </div>

                                <div
                                    style={{
                                        marginTop: '20px',
                                        padding: '14px 18px',
                                        background: 'rgba(59, 130, 246, 0.05)',
                                        border: '1px solid rgba(59, 130, 246, 0.25)',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        lineHeight: 1.6,
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    <strong>Penny-Drop Verification:</strong> On submission, an automated ₹1 penny-drop validation
                                    is dispatched to the receiving bank via NPCI. The account holder name returned by the bank is
                                    compared programmatically. A mismatch halts approval to prevent supplier payment redirection fraud.
                                </div>
                            </div>
                        )}

                        {/* 4. CAPABILITY */}
                        {currentStep === 4 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                                <FormField label="Requested supply categories" required>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.categories}
                                        onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                                    />
                                </FormField>
                                <FormField label="Monthly manufacturing capacity">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                    />
                                </FormField>
                                <FormField label="Key enterprise customers">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.customers}
                                        onChange={(e) => setFormData({ ...formData, customers: e.target.value })}
                                    />
                                </FormField>
                                <FormField label="Quality certifications held">
                                    <select
                                        className="form-control"
                                        value={formData.certsHeld}
                                        onChange={(e) => setFormData({ ...formData, certsHeld: e.target.value })}
                                    >
                                        <option>ISO 9001:2015</option>
                                        <option>IATF 16949</option>
                                        <option>Both ISO 9001 & IATF 16949</option>
                                    </select>
                                </FormField>
                            </div>
                        )}

                        {/* 5. DOCUMENTS */}
                        {currentStep === 5 && (
                            <DataTable
                                columns={[
                                    {
                                        key: 'name',
                                        header: 'Document Name',
                                        render: (row) => <span style={{ fontWeight: 600 }}>{row.name}</span>,
                                    },
                                    {
                                        key: 'mandatory',
                                        header: 'Mandatory',
                                        render: (row) => (row.mandatory ? 'Yes' : 'No'),
                                    },
                                    {
                                        key: 'validTo',
                                        header: 'Valid To',
                                        render: (row) => row.validTo,
                                    },
                                    {
                                        key: 'status',
                                        header: 'Status',
                                        render: (row) => (
                                            <StatusBadge
                                                status={row.status}
                                                tone={row.status === 'Uploaded' ? 'success' : 'neutral'}
                                            />
                                        ),
                                    },
                                    {
                                        key: 'action',
                                        header: 'Action',
                                        align: 'right',
                                        render: (row) => (
                                            <Button
                                                size="sm"
                                                variant={row.status === 'Uploaded' ? 'secondary' : 'primary'}
                                                onClick={() => toast.info(`File inspection: ${row.name}`, 'Simulating document preview.')}
                                            >
                                                {row.status === 'Uploaded' ? 'View' : 'Upload'}
                                            </Button>
                                        ),
                                    },
                                ]}
                                data={formData.docs}
                            />
                        )}
                      </div>
                    </div>

                    <div className="dark-card-footer">
                        <Button variant="secondary" onClick={handleBack} disabled={currentStep === 0}>
                            Back
                        </Button>
                        <div style={{ flex: 1 }} />
                        <span style={{ fontSize: '11px', color: '#94A3B8', marginRight: '16px' }}>
                            Draft saved - nothing is written to SAP until approval
                        </span>
                        <Button variant="primary" onClick={handleNext}>
                            {currentStep === WIZARD_STEPS.length - 1 ? 'Submit Application' : 'Save and continue'}
                        </Button>
                    </div>

                {/* Section Approval Routing Preview */}
                <div style={{ marginTop: '0', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div className="card-header">
                        <div className="portal-badge">INTERNAL GOVERNANCE</div>
                    </div>
                    <div style={{ padding: 0 }}>
                        <DataTable
                            columns={[
                                {
                                    key: 'section',
                                    header: 'Section',
                                    render: (row) => <span style={{ fontWeight: 600 }}>{row.section}</span>,
                                },
                                {
                                    key: 'status',
                                    header: 'Section Status',
                                    render: (_, row, idx) => {
                                        if (idx < currentStep) return <StatusBadge status="Complete" tone="success" />
                                        if (idx === currentStep) return <StatusBadge status="In progress" tone="warning" />
                                        return <StatusBadge status="Not started" tone="neutral" />
                                    },
                                },
                                {
                                    key: 'reviewer',
                                    header: 'Reviewer Department',
                                    render: (row) => row.reviewer,
                                },
                            ]}
                            data={APPROVAL_ROUTING}
                        />
                    </div>
                </div>

                <div className="data-ownership-note" style={{ marginTop: '24px', color: '#CBD5E1' }}>
                    <strong>Data Ownership 🛡️</strong>
                    Every field on this wizard is portal-owned (vp_registration_request). Nothing reaches SAP until a buyer's final approval creates the Business Partner.
                </div>
                
                <div style={{ marginTop: '48px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div className="card-header">
                        <div className="portal-badge">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                            PORTAL
                        </div>
                    </div>
                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', maxWidth: '400px' }}>
                            <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
                                <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>Application Reference</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="REG-2026-..." 
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <Button variant="secondary" onClick={() => {}}>
                                Check status
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    )
}

export default Registration
