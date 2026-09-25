import { useState } from 'react'
import Modal from '../common/Modal'
import FormField from '../common/FormField'
import Button from '../common/Button'
import { useToast } from '../common/useToast'
import { useVendorData } from '../../context/useVendorData'

const CATEGORIES = [
    'Automotive Components',
    'Precision CNC Machining',
    'Heavy Castings & Forgings',
    'Sheet Metal Fabrication',
    'Plastic & Composite Assemblies',
    'High-Tensile Fasteners',
    'Surface Finishing & Coatings',
    'Electrical & Wire Harness',
]

const INDIAN_STATES = [
    'Tamil Nadu',
    'Maharashtra',
    'Gujarat',
    'Karnataka',
    'Haryana',
    'Rajasthan',
    'Uttar Pradesh',
    'Telangana',
    'Andhra Pradesh',
    'Punjab',
]

function NewSupplierModal({ isOpen, onClose }) {
    const toast = useToast()
    const { addSupplier } = useVendorData()

    const initialFormData = {
        name: '',
        tradeName: '',
        category: CATEGORIES[0],
        gstin: '',
        pan: '',
        city: '',
        state: INDIAN_STATES[0],
        contactPerson: '',
        email: '',
        phone: '',
        bankName: '',
        accountNumber: '',
        confirmAccount: '',
        ifsc: '',
        status: 'Active',
    }

    const [formData, setFormData] = useState(initialFormData)
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleChange = (field, value) => {
        setFormData((prev) => {
            const next = { ...prev, [field]: value }

            // Auto-extract PAN from GSTIN if 15 chars
            if (field === 'gstin' && value.length >= 12) {
                const autoPan = value.substring(2, 12).toUpperCase()
                if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(autoPan)) {
                    next.pan = autoPan
                }
            }

            return next
        })

        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }))
        }
    }

    const validate = () => {
        const errs = {}
        if (!formData.name.trim()) errs.name = 'Supplier legal name is required.'
        if (!formData.city.trim()) errs.city = 'City is required.'

        // GSTIN validation (15 chars)
        const gstinUpper = formData.gstin.trim().toUpperCase()
        if (!gstinUpper) {
            errs.gstin = 'GSTIN is required for SAP Business Partner creation.'
        } else if (gstinUpper.length !== 15) {
            errs.gstin = 'GSTIN must be exactly 15 characters.'
        }

        // PAN validation (10 chars)
        const panUpper = formData.pan.trim().toUpperCase()
        if (!panUpper) {
            errs.pan = 'PAN is required.'
        } else if (panUpper.length !== 10) {
            errs.pan = 'PAN must be exactly 10 alphanumeric characters.'
        }

        // Contact Email
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errs.email = 'Please enter a valid email address.'
        }

        // Bank Account check
        if (formData.accountNumber && formData.accountNumber !== formData.confirmAccount) {
            errs.confirmAccount = 'Bank account numbers do not match.'
        }

        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!validate()) return

        setIsSubmitting(true)

        setTimeout(() => {
            const created = addSupplier({
                ...formData,
                name: formData.name.trim(),
                tradeName: formData.tradeName.trim() || formData.name.trim(),
                gstin: formData.gstin.trim().toUpperCase(),
                pan: formData.pan.trim().toUpperCase(),
            })

            setIsSubmitting(false)
            toast.success(`Supplier "${created.name}" created with BP Code ${created.id}`)
            setFormData(initialFormData)
            setErrors({})
            onClose?.()
        }, 400)
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Onboard New Supplier (SAP Business Partner)"
            size="lg"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                    >
                        Create Business Partner
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit}>
                {/* Section 1: Company Identity */}
                <span className="card-kicker">1. Legal Entity & Classification</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginTop: '8px' }}>
                    <FormField label="Legal Entity Name" required error={errors.name}>
                        <input
                            type="text"
                            className={`form-input ${errors.name ? 'has-error' : ''}`}
                            placeholder="e.g. Kalyani Forgings Private Limited"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                        />
                    </FormField>

                    <FormField label="Trade / Brand Name" hint="Optional short trade name">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Kalyani Forgings"
                            value={formData.tradeName}
                            onChange={(e) => handleChange('tradeName', e.target.value)}
                        />
                    </FormField>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                    <FormField label="Commodity / Category" required>
                        <select
                            className="form-select"
                            value={formData.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Initial Status">
                        <select
                            className="form-select"
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                        >
                            <option value="Active">Active Partner</option>
                            <option value="Onboarding">Onboarding / Stage 1</option>
                            <option value="Review required">Review Required</option>
                        </select>
                    </FormField>
                </div>

                {/* Section 2: Tax & Identifiers */}
                <div style={{ marginTop: '12px' }}>
                    <span className="card-kicker">2. Tax Identification (GSTIN & PAN)</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '8px' }}>
                        <FormField
                            label="GSTIN (15 Digits)"
                            required
                            error={errors.gstin}
                            hint="State code + PAN + entity digit + check digit"
                        >
                            <input
                                type="text"
                                maxLength={15}
                                className={`form-input ${errors.gstin ? 'has-error' : ''}`}
                                placeholder="e.g. 29AABCK1234F1Z5"
                                style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                                value={formData.gstin}
                                onChange={(e) => handleChange('gstin', e.target.value)}
                            />
                        </FormField>

                        <FormField
                            label="Permanent Account Number (PAN)"
                            required
                            error={errors.pan}
                            hint="10-character corporate PAN"
                        >
                            <input
                                type="text"
                                maxLength={10}
                                className={`form-input ${errors.pan ? 'has-error' : ''}`}
                                placeholder="e.g. AABCK1234F"
                                style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                                value={formData.pan}
                                onChange={(e) => handleChange('pan', e.target.value)}
                            />
                        </FormField>
                    </div>
                </div>

                {/* Section 3: Location & Contact */}
                <div style={{ marginTop: '12px' }}>
                    <span className="card-kicker">3. Location & Communication</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '8px' }}>
                        <FormField label="City / Industrial Hub" required error={errors.city}>
                            <input
                                type="text"
                                className={`form-input ${errors.city ? 'has-error' : ''}`}
                                placeholder="e.g. Pune, Hosur, Vadodara"
                                value={formData.city}
                                onChange={(e) => handleChange('city', e.target.value)}
                            />
                        </FormField>

                        <FormField label="State" required>
                            <select
                                className="form-select"
                                value={formData.state}
                                onChange={(e) => handleChange('state', e.target.value)}
                            >
                                {INDIAN_STATES.map((st) => (
                                    <option key={st} value={st}>
                                        {st}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                        <FormField label="Contact Person">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. Rajesh Sharma"
                                value={formData.contactPerson}
                                onChange={(e) => handleChange('contactPerson', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Email" error={errors.email}>
                            <input
                                type="email"
                                className={`form-input ${errors.email ? 'has-error' : ''}`}
                                placeholder="contact@supplier.com"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Phone">
                            <input
                                type="tel"
                                className="form-input"
                                placeholder="+91 98000 00000"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                        </FormField>
                    </div>
                </div>

                {/* Section 4: Banking Details */}
                <div style={{ marginTop: '12px' }}>
                    <span className="card-kicker">4. Banking & Remittance (Penny-Drop Setup)</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '8px' }}>
                        <FormField label="Bank Name">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. HDFC Bank, SBI, ICICI"
                                value={formData.bankName}
                                onChange={(e) => handleChange('bankName', e.target.value)}
                            />
                        </FormField>

                        <FormField label="IFSC Code">
                            <input
                                type="text"
                                maxLength={11}
                                className="form-input"
                                placeholder="e.g. ICIC0000021"
                                style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                                value={formData.ifsc}
                                onChange={(e) => handleChange('ifsc', e.target.value)}
                            />
                        </FormField>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <FormField label="Account Number">
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Enter account number"
                                value={formData.accountNumber}
                                onChange={(e) => handleChange('accountNumber', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Confirm Account Number" error={errors.confirmAccount}>
                            <input
                                type="text"
                                className={`form-input ${errors.confirmAccount ? 'has-error' : ''}`}
                                placeholder="Re-enter account number"
                                value={formData.confirmAccount}
                                onChange={(e) => handleChange('confirmAccount', e.target.value)}
                            />
                        </FormField>
                    </div>
                </div>
            </form>
        </Modal>
    )
}

export default NewSupplierModal
