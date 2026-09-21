function PageContainer({
    kicker,
    title,
    subtitle,
    description,
    actions,
    children,
    className = '',
}) {
    const desc = subtitle || description

    return (
        <div className={`page-container ${className}`.trim()}>
            {(title || actions) && (
                <div className="page-header">
                    <div className="page-header-title-area">
                        {kicker && <span className="page-kicker">{kicker}</span>}
                        {title && <h2>{title}</h2>}
                        {desc && <p>{desc}</p>}
                    </div>

                    {actions && (
                        <div className="page-header-actions">{actions}</div>
                    )}
                </div>
            )}

            {children}
        </div>
    )
}

export default PageContainer
