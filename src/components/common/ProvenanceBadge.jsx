/**
 * ProvenanceBadge
 * 
 * Displays the data origin clearly according to the SAP S/4HANA vs Portal architecture:
 * - 'sap': Read live from S/4HANA Cloud (not stored in portal)
 * - 'portal': Governed and stored in the Vendor Portal database
 */

function ProvenanceBadge({ source = 'sap', label, tooltip, size = 'sm' }) {
    const isSap = source === 'sap'
    const defaultLabel = isSap ? 'From SAP' : 'Portal Data'
    const defaultTooltip = isSap
        ? 'Read live from S/4HANA Cloud — never stored locally'
        : 'Governed and stored in the Vendor Portal database'

    return (
        <span
            title={tooltip || defaultTooltip}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: size === 'sm' ? '2px 7px' : '4px 10px',
                borderRadius: '4px',
                fontSize: size === 'sm' ? '10px' : '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontFamily: 'system-ui, sans-serif',
                backgroundColor: isSap ? '#E4EEF9' : '#EFE9F7',
                color: isSap ? '#1B6EC2' : '#6D4AA8',
                border: `1px solid ${isSap ? 'rgba(27, 110, 194, 0.2)' : 'rgba(109, 74, 168, 0.2)'}`,
                cursor: 'help',
                whiteSpace: 'nowrap',
            }}
        >
            <span
                style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: isSap ? '0' : '50%',
                    backgroundColor: isSap ? '#1B6EC2' : 'transparent',
                    border: isSap ? 'none' : '1.5px solid #6D4AA8',
                    display: 'inline-block',
                }}
            />
            <span>{label || defaultLabel}</span>
        </span>
    )
}

export default ProvenanceBadge
