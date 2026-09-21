function EmptyState({
    icon = '🔍',
    title = 'No items found',
    description = 'Try changing your search terms or filter criteria.',
    action,
    className = '',
}) {
    return (
        <div className={`empty-state ${className}`.trim()}>
            <div className="empty-icon">{icon}</div>
            <h4 className="empty-title">{title}</h4>
            {description && <p className="empty-description">{description}</p>}
            {action && <div className="empty-action">{action}</div>}
        </div>
    )
}

export default EmptyState
