import { useState } from 'react'
import Modal from '../common/Modal'
import FormField from '../common/FormField'
import Button from '../common/Button'
import { useToast } from '../common/useToast'
import { useVendorData } from '../../context/useVendorData'

function SubmitInvoiceModal({ isOpen, onClose }) {
    const toast = useToast()
    const { purchaseOrders, addInvoice } = useVendorData()

    const [selectedPoId, setSelectedPoId] = useState(
        purchaseOrders[0]?.id || ''
    )
    const [invoiceNumber, setInvoiceNumber] = useState('')
    const [invoiceDate, setInvoiceDate] = useState(
        new Date().toISOString().split('T')[0]
    )
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const selectedPO = purchaseOrders.find((p) => p.id === selectedPoId)
    const baseAmount = selectedPO ? selectedPO.numericValue : 0
    const gstTax = Math.round(baseAmount * 0.18)
    const totalAmount = baseAmount + gstTax

    const handleSubmit = (e) => {
        e.preventDefault()

        const trimmed = invoiceNumber.trim().toUpperCase()
        if (!trimmed) {
            setError('Invoice number is required.')
            return
        }

        if (trimmed.length > 16) {
            setError('Invoice number cannot exceed 16 characters (SAP rule).')
            return
        }

        setIsSubmitting(true)
        setTimeout(() => {
            addInvoice({
                invoiceNumber: trimmed,
                poId: selectedPoId,
                amount: '₹' + totalAmount.toLocaleString('en-IN'),
                date: invoiceDate,
            })

            setIsSubmitting(false)
            toast.success(`Invoice ${trimmed} submitted against ${selectedPoId} for ₹${totalAmount.toLocaleString('en-IN')}`)
            setInvoiceNumber('')
            setError('')
            onClose?.()
        }, 400)
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Submit GR-Based Invoice (Supplier Portal)"
            size="md"
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
                        Submit to Accounts Payable
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit}>
                <FormField label="Purchase Order" required hint="Select goods-received PO">
                    <select
                        className="form-select"
                        value={selectedPoId}
                        onChange={(e) => setSelectedPoId(e.target.value)}
                    >
                        {purchaseOrders.map((po) => (
                            <option key={po.id} value={po.id}>
                                {po.id} · {po.itemDescription} ({po.value})
                            </option>
                        ))}
                    </select>
                </FormField>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                    <FormField
                        label="Supplier Invoice Number"
                        required
                        error={error}
                        hint="Max 16 alphanumeric characters (SAP limit)"
                    >
                        <input
                            type="text"
                            maxLength={16}
                            className={`form-input ${error ? 'has-error' : ''}`}
                            placeholder="e.g. INV-2026-9041"
                            style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                            value={invoiceNumber}
                            onChange={(e) => {
                                setInvoiceNumber(e.target.value)
                                if (error) setError('')
                            }}
                        />
                    </FormField>

                    <FormField label="Invoice Date" required>
                        <input
                            type="date"
                            className="form-input"
                            value={invoiceDate}
                            onChange={(e) => setInvoiceDate(e.target.value)}
                        />
                    </FormField>
                </div>

                {/* SAP PO Financial Breakdown (Read-Only as per spec) */}
                <div
                    style={{
                        padding: '14px 16px',
                        background: 'var(--surface-soft)',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        marginTop: '10px',
                    }}
                >
                    <span className="card-kicker">SAP Authoritative Amount</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>PO Base Value ({selectedPO?.quantity} {selectedPO?.unit}):</span>
                        <strong>₹{baseAmount.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Applicable GST (18%):</span>
                        <strong>₹{gstTax.toLocaleString('en-IN')}</strong>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '13.5px',
                            fontWeight: 750,
                            marginTop: '8px',
                            paddingTop: '8px',
                            borderTop: '1px solid var(--border)',
                            color: 'var(--text)',
                        }}
                    >
                        <span>Total Payable:</span>
                        <span style={{ color: 'var(--blue)' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </form>
        </Modal>
    )
}

export default SubmitInvoiceModal
