import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import FormField from '../../components/common/FormField'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../context/useToast'

const ASN_STEPS = ['Select order lines', 'Pack & label', 'Transport documents', 'Review & send']

function formatMoney(amount) {
    if (!amount) return '₹0'
    return `₹${Number(amount).toLocaleString('en-IN')}`
}

function ShipmentNotice() {
    const navigate = useNavigate()
    const { data, submitASN } = useVendorData()
    const toast = useToast()

    const [currentStep, setCurrentStep] = useState(0)

    // Available open PO lines that can be shipped
    const availableLines = useMemo(() => {
        return (data?.orders || []).filter((o) => o?.ack && (o?.recv || 0) < (o?.qty || 0))
    }, [data?.orders])

    // Wizard Form State
    const [selectedLines, setSelectedLines] = useState({
        [`${availableLines[0]?.po}-${availableLines[0]?.item}`]: availableLines[0]?.qty - availableLines[0]?.recv || 2000,
    })

    const [transportInfo, setTransportInfo] = useState({
        hu: 'HU-26-004412',
        packaging: 'PLT-EUR — Euro pallet',
        gross: '412.500',
        net: '388.200',
        dn: 'DN/26-27/1188',
        inv: 'INV/26-27/0894',
        irn: '1120260894217744',
        eway: '291002884471',
        veh: 'KA51AB4471',
        lr: 'TCI-8827104',
        disp: 'Today',
        eta: 'Tomorrow 10:00 AM',
    })

    const chosenLines = useMemo(() => {
        return availableLines.filter((o) => {
            const key = `${o.po}-${o.item}`
            return (selectedLines[key] || 0) > 0
        })
    }, [availableLines, selectedLines])

    const distinctPOs = useMemo(() => {
        return [...new Set(chosenLines.map((o) => o.po))]
    }, [chosenLines])

    const totalShippingPieces = useMemo(() => {
        return chosenLines.reduce((sum, o) => {
            const key = `${o.po}-${o.item}`
            return sum + (Number(selectedLines[key]) || 0)
        }, 0)
    }, [chosenLines, selectedLines])

    const totalBoxes = useMemo(() => {
        return chosenLines.reduce((sum, o) => {
            const key = `${o.po}-${o.item}`
            const qty = Number(selectedLines[key]) || 0
            return sum + Math.ceil(qty / 500)
        }, 0)
    }, [chosenLines, selectedLines])

    const totalDeclaredValue = useMemo(() => {
        return chosenLines.reduce((sum, o) => {
            const key = `${o.po}-${o.item}`
            const qty = Number(selectedLines[key]) || 0
            return sum + qty * o.price
        }, 0)
    }, [chosenLines, selectedLines])

    const handleToggleLine = (po, item, maxQty) => {
        const key = `${po}-${item}`
        setSelectedLines((prev) => ({
            ...prev,
            [key]: prev[key] ? 0 : maxQty,
        }))
    }

    const handleQtyChange = (po, item, val) => {
        const key = `${po}-${item}`
        setSelectedLines((prev) => ({
            ...prev,
            [key]: Math.max(0, Number(val) || 0),
        }))
    }

    const handlePostASN = async () => {
        const itemsWithQty = chosenLines.map((o) => {
            const key = `${o.po}-${o.item}`
            const qtyToShip = Number(selectedLines[key]) || (o.qty - (o.recv || 0))
            return {
                ...o,
                shippingQty: qtyToShip,
            }
        })
        const res = await submitASN(transportInfo, itemsWithQty)
        if (res?.error) {
            toast.error('Submission Failed', res.error)
            return
        }
        toast.success(
            `Shipment notice posted · ${res.count || distinctPOs.length} Inbound Deliveries created in S/4HANA`,
            `Idempotency key generated. Barcoded shipping labels are now ready for dock scan.`
        )
        navigate('/supplier/receipts')
    }

    return (
        <AppLayout activePage="Shipment notice" portal="Supplier">
            <PageContainer
                kicker="OUTBOUND LOGISTICS & INBOUND DELIVERY GENERATOR"
                title="Create a shipment notice (ASN)"
                subtitle="Advanced Shipping Notice dispatch generating S/4HANA Inbound Deliveries with automated multi-PO batch grouping."
            >
                {/* Stepper Wizard Bar */}
                <div
                    style={{
                        background: '#fff',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color, #e2e8f0)',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '20px',
                        overflowX: 'auto',
                    }}
                >
                    {ASN_STEPS.map((stepTitle, idx) => {
                        const isDone = idx < currentStep
                        const isCurrent = idx === currentStep
                        return (
                            <div
                                key={stepTitle}
                                onClick={() => (chosenLines.length > 0 ? setCurrentStep(idx) : null)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    background: isCurrent ? 'rgba(30, 58, 138, 0.08)' : 'transparent',
                                }}
                            >
                                <span
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        background: isDone
                                            ? 'var(--color-success, #16a34a)'
                                            : isCurrent
                                            ? 'var(--color-primary, #1e3a8a)'
                                            : 'var(--border-color, #cbd5e1)',
                                        color: isDone || isCurrent ? '#fff' : 'var(--text-muted)',
                                    }}
                                >
                                    {isDone ? '✓' : idx + 1}
                                </span>
                                <span
                                    style={{
                                        fontSize: '13px',
                                        fontWeight: isCurrent ? 700 : 500,
                                        color: isCurrent ? 'var(--color-primary, #1e3a8a)' : 'var(--text-secondary)',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {stepTitle}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Main Wizard Form Card */}
                <Card>
                    <Card.Header
                        kicker={`STEP ${currentStep + 1} OF 4`}
                        title={ASN_STEPS[currentStep]}
                        action={
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                {chosenLines.length} line(s) selected across {distinctPOs.length} order(s)
                            </span>
                        }
                    />
                    <Card.Body>
                        {/* STEP 0: SELECT ORDER LINES */}
                        {currentStep === 0 && (
                            <div>
                                <DataTable
                                    columns={[
                                        {
                                            key: 'select',
                                            header: '',
                                            width: '40px',
                                            render: (row) => {
                                                const key = `${row.po}-${row.item}`
                                                const isChecked = (selectedLines[key] || 0) > 0
                                                return (
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() =>
                                                            handleToggleLine(row.po, row.item, row.qty - row.recv)
                                                        }
                                                    />
                                                )
                                            },
                                        },
                                        {
                                            key: 'po',
                                            header: 'Order / Item',
                                            render: (row) => (
                                                <span className="font-mono font-bold">
                                                    {row.po} / {row.item}
                                                </span>
                                            ),
                                        },
                                        {
                                            key: 'mat',
                                            header: 'Material Specification',
                                            render: (row) => `${row.mat} · ${row.desc}`,
                                        },
                                        {
                                            key: 'open',
                                            header: 'Open Balance',
                                            align: 'right',
                                            render: (_, row) => `${((row?.qty || 0) - (row?.recv || 0)).toLocaleString('en-IN')} ${row?.uom || 'EA'}`,
                                        },
                                        {
                                            key: 'ship',
                                            header: 'Shipping Now',
                                            render: (row) => {
                                                const key = `${row.po}-${row.item}`
                                                return (
                                                    <input
                                                        type="number"
                                                        className="form-control font-mono"
                                                        value={selectedLines[key] || 0}
                                                        onChange={(e) =>
                                                            handleQtyChange(row.po, row.item, e.target.value)
                                                        }
                                                        style={{ width: '110px', textAlign: 'right' }}
                                                    />
                                                )
                                            },
                                        },
                                        {
                                            key: 'batch',
                                            header: 'Production Batch',
                                            render: (row, _, idx) => (
                                                <span className="font-mono text-xs">B26-0{880 + idx}</span>
                                            ),
                                        },
                                    ]}
                                    data={availableLines}
                                    emptyMessage="No acknowledged orders are open for shipment."
                                />

                                {distinctPOs.length > 1 && (
                                    <div
                                        style={{
                                            marginTop: '16px',
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            background: 'rgba(245, 158, 11, 0.08)',
                                            border: '1px solid rgba(245, 158, 11, 0.3)',
                                            fontSize: '13px',
                                            lineHeight: 1.6,
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        <strong>Multi-PO Grouping Architecture:</strong> You have selected items across{' '}
                                        <strong>{distinctPOs.length} separate purchase orders</strong>. SAP standard Inbound
                                        Delivery API rejects multiple POs within a single delivery document. The portal will
                                        seamlessly orchestrate <strong>{distinctPOs.length} distinct S/4HANA inbound deliveries</strong>{' '}
                                        under unified reference numbers.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP 1: PACK & LABEL */}
                        {currentStep === 1 && (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                                    gap: '24px',
                                }}
                            >
                                <div>
                                    <h4 style={{ margin: '0 0 14px', fontSize: '14px' }}>Packaging Parameters</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        <FormField label="Handling Unit / Pallet Barcode ID" required>
                                            <input
                                                type="text"
                                                className="form-control font-mono"
                                                value={transportInfo.hu}
                                                onChange={(e) =>
                                                    setTransportInfo({ ...transportInfo, hu: e.target.value })
                                                }
                                            />
                                        </FormField>
                                        <FormField label="Standard Packaging Material" required>
                                            <select
                                                className="form-control"
                                                value={transportInfo.packaging}
                                                onChange={(e) =>
                                                    setTransportInfo({ ...transportInfo, packaging: e.target.value })
                                                }
                                            >
                                                <option>PLT-EUR — Euro pallet</option>
                                                <option>BOX-STD — Standard corrugated carton</option>
                                            </select>
                                        </FormField>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <FormField label="Gross weight (kg)" required>
                                                <input
                                                    type="text"
                                                    className="form-control font-mono"
                                                    value={transportInfo.gross}
                                                    onChange={(e) =>
                                                        setTransportInfo({ ...transportInfo, gross: e.target.value })
                                                    }
                                                />
                                            </FormField>
                                            <FormField label="Net weight (kg)" required>
                                                <input
                                                    type="text"
                                                    className="form-control font-mono"
                                                    value={transportInfo.net}
                                                    onChange={(e) =>
                                                        setTransportInfo({ ...transportInfo, net: e.target.value })
                                                    }
                                                />
                                            </FormField>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ margin: '0 0 14px', fontSize: '14px' }}>Consolidated Packing Summary</h4>
                                    <div
                                        style={{
                                            padding: '16px',
                                            borderRadius: '8px',
                                            background: 'var(--bg-card-subtle, #f8fafc)',
                                            border: '1px solid var(--border-color, #e2e8f0)',
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '14px',
                                        }}
                                    >
                                        <div>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Handling Units</span>
                                            <div className="font-mono font-bold">{distinctPOs.length} HU</div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Boxes</span>
                                            <div className="font-mono font-bold">{totalBoxes} cartons</div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Pieces</span>
                                            <div className="font-mono font-bold">
                                                {totalShippingPieces.toLocaleString('en-IN')} pcs
                                            </div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Declared Value</span>
                                            <div className="font-mono font-bold" style={{ color: 'var(--color-primary, #1e3a8a)' }}>
                                                {formatMoney(totalDeclaredValue)}
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            marginTop: '16px',
                                            padding: '12px',
                                            borderRadius: '6px',
                                            background: 'rgba(59, 130, 246, 0.05)',
                                            fontSize: '12px',
                                            color: 'var(--text-secondary)',
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        🏷️ Barcode labels adhere to automotive standard PKG-04 and will be rendered with official
                                        SAP delivery numbers for dock receipt scanning.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: TRANSPORT DOCUMENTS */}
                        {currentStep === 2 && (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                    gap: '16px',
                                }}
                            >
                                <FormField label="Supplier Delivery Note (Challan)" required>
                                    <input
                                        type="text"
                                        className="form-control font-mono"
                                        value={transportInfo.dn}
                                        onChange={(e) => setTransportInfo({ ...transportInfo, dn: e.target.value })}
                                    />
                                </FormField>
                                <FormField label="Tax Invoice Number" required>
                                    <input
                                        type="text"
                                        className="form-control font-mono"
                                        value={transportInfo.inv}
                                        onChange={(e) => setTransportInfo({ ...transportInfo, inv: e.target.value })}
                                    />
                                </FormField>
                                <FormField label="IRN / E-Invoice Hash" required>
                                    <input
                                        type="text"
                                        className="form-control font-mono"
                                        value={transportInfo.irn}
                                        onChange={(e) => setTransportInfo({ ...transportInfo, irn: e.target.value })}
                                    />
                                </FormField>
                                <FormField label="E-Way Bill Number" required>
                                    <input
                                        type="text"
                                        className="form-control font-mono"
                                        value={transportInfo.eway}
                                        onChange={(e) => setTransportInfo({ ...transportInfo, eway: e.target.value })}
                                    />
                                </FormField>
                                <FormField label="Transport Vehicle Number" required>
                                    <input
                                        type="text"
                                        className="form-control font-mono"
                                        value={transportInfo.veh}
                                        onChange={(e) => setTransportInfo({ ...transportInfo, veh: e.target.value })}
                                    />
                                </FormField>
                                <FormField label="Consignment Note / LR No." required>
                                    <input
                                        type="text"
                                        className="form-control font-mono"
                                        value={transportInfo.lr}
                                        onChange={(e) => setTransportInfo({ ...transportInfo, lr: e.target.value })}
                                    />
                                </FormField>
                                <FormField label="Dispatch Date" required>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={transportInfo.disp}
                                        onChange={(e) => setTransportInfo({ ...transportInfo, disp: e.target.value })}
                                    />
                                </FormField>
                                <FormField label="Estimated Time of Arrival (ETA)" required>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={transportInfo.eta}
                                        onChange={(e) => setTransportInfo({ ...transportInfo, eta: e.target.value })}
                                    />
                                </FormField>
                            </div>
                        )}

                        {/* STEP 3: REVIEW & SEND */}
                        {currentStep === 3 && (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                                    gap: '24px',
                                }}
                            >
                                <div>
                                    <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>Deliveries to Post in S/4HANA</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {distinctPOs.map((po) => {
                                            const poLines = chosenLines.filter((o) => o.po === po)
                                            const totalPieces = poLines.reduce(
                                                (sum, o) => sum + (Number(selectedLines[`${o.po}-${o.item}`]) || 0),
                                                0
                                            )
                                            return (
                                                <div
                                                    key={po}
                                                    style={{
                                                        padding: '14px',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--border-color, #e2e8f0)',
                                                        background: 'var(--bg-card-subtle, #f8fafc)',
                                                    }}
                                                >
                                                    <div style={{ fontWeight: 600 }}>
                                                        Inbound delivery for Order <span className="font-mono">{po}</span>
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                        {poLines.length} item line(s) · {totalPieces.toLocaleString('en-IN')}{' '}
                                                        units · Idempotency Key{' '}
                                                        <span className="font-mono">ASN:{po}:488102</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>Statutory Document Attachments</h4>
                                    <div
                                        style={{
                                            padding: '16px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color, #e2e8f0)',
                                            background: '#fff',
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '12px',
                                        }}
                                    >
                                        <div>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Delivery Challan</span>
                                            <div className="font-mono font-bold">{transportInfo.dn}</div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tax Invoice</span>
                                            <div className="font-mono font-bold">{transportInfo.inv}</div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>E-Way Bill</span>
                                            <div className="font-mono font-bold">{transportInfo.eway}</div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Vehicle</span>
                                            <div className="font-mono font-bold">{transportInfo.veh}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card.Body>

                    <Card.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                            disabled={currentStep === 0}
                        >
                            Back
                        </Button>
                        <div style={{ flex: 1 }} />
                        {currentStep < 3 ? (
                            <Button
                                variant="primary"
                                onClick={() => setCurrentStep(currentStep + 1)}
                                disabled={chosenLines.length === 0}
                            >
                                Continue
                            </Button>
                        ) : (
                            <Button variant="primary" onClick={handlePostASN}>
                                Send notice to SAP
                            </Button>
                        )}
                    </Card.Footer>
                </Card>

                {/* Recent Shipment Notices Table */}
                <Card style={{ marginTop: '24px' }}>
                    <Card.Header kicker="INBOUND LOGISTICS TRACKING" title="Recent shipment notices" />
                    <Card.Body style={{ padding: 0 }}>
                        <DataTable
                            columns={[
                                {
                                    key: 'ref',
                                    header: 'Notice Ref',
                                    render: (row) => <span className="font-mono font-bold">{row.ref}</span>,
                                },
                                {
                                    key: 'del',
                                    header: 'SAP Inbound Delivery',
                                    render: (row) => (
                                        <span className="font-mono">{row.del || '—'}</span>
                                    ),
                                },
                                { key: 'sent', header: 'Sent Date', render: (row) => row.sent },
                                {
                                    key: 'status',
                                    header: 'Status',
                                    render: (row) => (
                                        <StatusBadge
                                            status={row.status === 'POSTED' ? 'Posted to SAP' : row.status}
                                            tone={row.status === 'POSTED' ? 'success' : 'neutral'}
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
                                            variant="secondary"
                                            onClick={() =>
                                                toast.info(`Labels ready`, `Barcoded PKG-04 shipping label PDF generated for delivery ${row.del}.`)
                                            }
                                        >
                                            Print labels
                                        </Button>
                                    ),
                                },
                            ]}
                            data={data?.asns || []}
                            emptyMessage="No recent shipment notices recorded."
                        />
                    </Card.Body>
                </Card>
            </PageContainer>
        </AppLayout>
    )
}

export default ShipmentNotice
