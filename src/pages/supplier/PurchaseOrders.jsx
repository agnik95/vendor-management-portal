import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import PageContainer from '../../components/layout/PageContainer'
import Card from '../../components/common/Card'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import { useVendorData } from '../../context/useVendorData'
import { useToast } from '../../context/useToast'

function PurchaseOrders() {
    const navigate = useNavigate()
    const { data, sendOrderAck } = useVendorData()
    const toast = useToast()

    const [activeTab, setActiveTab] = useState('to_ack')
    const [selectedLines, setSelectedLines] = useState({})

    const orders = useMemo(() => data?.orders || [], [data?.orders])
    const toAckList = useMemo(() => orders.filter((o) => !o?.ack), [orders])
    const openList = useMemo(() => orders.filter((o) => o?.ack && (o?.recv || 0) < (o?.qty || 0)), [orders])
    const partialList = useMemo(() => orders.filter((o) => (o?.recv || 0) > 0 && (o?.recv || 0) < (o?.qty || 0)), [orders])
    const completedList = useMemo(() => orders.filter((o) => (o?.recv || 0) >= (o?.qty || 0)), [orders])
    const changedList = useMemo(() => orders.filter((o) => o?.changed), [orders])

    const displayOrders = useMemo(() => {
        switch (activeTab) {
            case 'to_ack':
                return toAckList
            case 'open':
                return openList
            case 'partial':
                return partialList
            case 'completed':
                return completedList
            case 'changed':
                return changedList
            default:
                return orders
        }
    }, [activeTab, toAckList, openList, partialList, completedList, changedList, orders])

    const tabsList = [
        { id: 'to_ack', label: 'To acknowledge' },
        { id: 'open', label: 'Open' },
        { id: 'partial', label: 'Partially received' },
        { id: 'completed', label: 'Completed' },
        { id: 'changed', label: 'Changed by buyer' },
    ]

    const toggleSelectLine = (key) => {
        setSelectedLines((prev) => ({
            ...prev,
            [key]: !prev[key],
        }))
    }

    const selectedCount = Object.values(selectedLines).filter(Boolean).length

    const handleBulkAck = () => {
        let count = 0
        toAckList.forEach((o) => {
            const key = `${o.po}-${o.item}`
            if (selectedLines[key]) {
                sendOrderAck(o.po, o.item, { mode: 'AS_ORDERED', qty: o.qty, date: o.req })
                count++
            }
        })
        toast.success(
            `Acknowledged ${count} purchase order lines`,
            'Dispatched ConfirmationCategory AB to S/4HANA via OrderConfirmationRequest_In.'
        )
        setSelectedLines({})
    }

    const tableColumns = [
        ...(activeTab === 'to_ack'
            ? [
                  {
                      key: 'select',
                      header: '',
                      width: '40px',
                      render: (row) => {
                          const key = `${row.po}-${row.item}`
                          return (
                              <input
                                  type="checkbox"
                                  checked={Boolean(selectedLines[key])}
                                  onChange={() => toggleSelectLine(key)}
                                  onClick={(e) => e.stopPropagation()}
                              />
                          )
                      },
                  },
              ]
            : []),
        {
            key: 'po',
            header: 'PO Number',
            render: (_, row) => <span className="font-mono font-bold text-blue-600">{row?.po}</span>,
        },
        { key: 'item', header: 'Item', width: '60px', render: (_, row) => row?.item || '' },
        { key: 'plant', header: 'Plant', render: (_, row) => `Plant ${row?.plant || ''}` },
        {
            key: 'mat',
            header: 'Material Specification',
            render: (_, row) => `${row?.mat || ''} · ${row?.desc || ''}`,
        },
        {
            key: 'qty',
            header: 'Quantity',
            align: 'right',
            render: (_, row) => `${(row?.qty || 0).toLocaleString('en-IN')} ${row?.uom || 'EA'}`,
        },
        {
            key: 'price',
            header: 'Unit Price',
            align: 'right',
            render: (_, row) => `₹${Number(row?.price || 0).toFixed(2)}`,
        },
        { key: 'req', header: 'Delivery Date', render: (_, row) => row?.req || '' },
        {
            key: 'status',
            header: activeTab === 'to_ack' ? 'Age' : 'Status',
            render: (_, row) => {
                if (activeTab === 'to_ack') {
                    const hrs = row?.age || 24
                    return (
                        <StatusBadge
                            status={`${hrs} h`}
                            tone={hrs > 48 ? 'danger' : hrs > 24 ? 'warning' : 'neutral'}
                        />
                    )
                }
                if ((row?.recv || 0) >= (row?.qty || 0)) return <StatusBadge status="Completed" tone="neutral" />
                if ((row?.recv || 0) > 0) return <StatusBadge status="Partial" tone="info" />
                if (row?.ack) return <StatusBadge status="Acknowledged" tone="success" />
                return <StatusBadge status="To acknowledge" tone="warning" />
            },
        },
        {
            key: 'actions',
            header: 'Action',
            align: 'right',
            render: (_, row) => (
                <Button
                    size="sm"
                    variant="primary"
                    onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/supplier/orders/${row?.po}?item=${row?.item}`)
                    }}
                >
                    Open
                </Button>
            ),
        },
    ]

    return (
        <AppLayout activePage="Purchase orders" portal="Supplier">
            <PageContainer
                kicker="S/4HANA DIRECT ORDER FEED"
                title="Purchase orders"
                subtitle="Live purchase order queue with confirmation control key 0004. Acknowledge lines within the 48-hour SLA."
                actions={
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {activeTab === 'to_ack' && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleBulkAck}
                                disabled={selectedCount === 0}
                            >
                                Acknowledge selected ({selectedCount})
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                                toast.info('Export prepared', 'Server-generated Excel workbook containing filtered order lines.')
                            }
                        >
                            Download as Excel
                        </Button>
                    </div>
                }
            >
                {/* Orders Table */}
                <Card>
                    <Card.Header
                        title="Purchase Order Registry"
                        action={<Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />}
                    />
                    <Card.Body style={{ padding: 0 }}>
                        <DataTable
                            columns={tableColumns}
                            data={displayOrders}
                            onRowClick={(row) => navigate(`/supplier/orders/${row.po}?item=${row.item}`)}
                            emptyMessage="No purchase orders found matching this tab."
                        />
                    </Card.Body>
                </Card>

                {/* Zero Storage Architecture Note */}
                <div
                    style={{
                        marginTop: '20px',
                        padding: '14px 18px',
                        background: 'rgba(59, 130, 246, 0.05)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        lineHeight: 1.6,
                        color: 'var(--text-secondary)',
                    }}
                >
                    <strong>Zero-Mirrored Storage Integrity:</strong> Nothing on this order screen is stored in portal database
                    tables. Rows are read in real-time from SAP standard <code>API_PURCHASEORDER_2</code> filtered by your
                    Business Partner number. The portal maintains only pending line acknowledgements, purging them once SAP
                    confirms ERP persistence.
                </div>
            </PageContainer>
        </AppLayout>
    )
}

export default PurchaseOrders
