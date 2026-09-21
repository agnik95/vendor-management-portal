function StatusBadge({
    label,
    status,
    children,
    tone = 'neutral',
    dot = true,
    icon,
    className = '',
}) {
    const text = label || status || children
    
    const classes = [
        'status-badge',
        `status-badge-${tone}`,
        className,
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <span className={classes}>
            {dot && <span className="status-badge-dot" />}
            {icon && <span className="status-badge-icon">{icon}</span>}
            <span>{text}</span>
        </span>
    )
}

export default StatusBadge
