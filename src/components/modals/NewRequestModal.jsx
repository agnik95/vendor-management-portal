import { useState } from 'react'
import Modal from '../common/Modal'
import FormField from '../common/FormField'
import Button from '../common/Button'
import { useToast } from '../common/useToast'
import { useVendorData } from '../../context/useVendorData'

const REQUEST_CATEGORIES = [
    'Supplier Approval',
    'Quality 8D Audit',
    'Bank Master Change',
    'Certificate Renewal',
    'Price Renegotiation',
    'Emergency Sourcing',
]

function NewRequestModal({ isOpen, onClose }) {
    const toast = useToast()
    const { suppliers, addPriorityItem } = useVendorData()

    const [title, setTitle] = useState('')
    const [category, setCategory] = useState(REQUEST_CATEGORIES[0])
    const [supplierId, setSupplierId] = useState('')
    const [priority, setPriority] = useState('High')
    const [notes, setNotes] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!title.trim()) {
            setError('Request title is required.')
            return
        }

        const selectedSupplier = suppliers.find((s) => s.id === supplierId)
        const supplierName = selectedSupplier ? selectedSupplier.name : 'Cross-Category General'

        setIsSubmitting(true)
        setTimeout(() => {
            addPriorityItem({
                title: title.trim(),
                category,
                supplier: supplierName,
                priority,
                notes: notes.trim(),
            })

            setIsSubmitting(false)
            toast.success(`Procurement request "${title}" added to Priority Queue`)
            setTitle('')
            setNotes('')
            setError('')
            onClose?.()
        }, 350)
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Procurement Action Request"
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
                        Submit Request
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit}>
                <FormField label="Request Title" required error={error}>
                    <input
                        type="text"
                        className={`form-input ${error ? 'has-error' : ''}`}
                        placeholder="e.g. Expedite 8D Root Cause Analysis"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value)
                            if (error) setError('')
                        }}
                    />
                </FormField>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <FormField label="Action Category" required>
                        <select
                            className="form-select"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            {REQUEST_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Priority Level" required>
                        <select
                            className="form-select"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                        >
                            <option value="Normal">Normal</option>
                            <option value="High">High (48 hrs)</option>
                            <option value="Critical">Critical (Immediate)</option>
                        </select>
                    </FormField>
                </div>

                <FormField label="Associated Supplier" hint="Choose a registered SAP Business Partner">
                    <select
                        className="form-select"
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                    >
                        <option value="">-- General / Non-Supplier Specific --</option>
                        {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name} ({s.id})
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField label="Notes & Context" hint="Specify approvers or action requirement">
                    <textarea
                        className="form-textarea"
                        rows={3}
                        placeholder="Provide details for the procurement queue..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </FormField>
            </form>
        </Modal>
    )
}

export default NewRequestModal
