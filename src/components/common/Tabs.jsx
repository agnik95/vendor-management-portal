function Tabs({
    tabs = [],
    activeTab,
    onChange,
    className = '',
}) {
    return (
        <div className={`tabs-nav ${className}`.trim()} role="tablist">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`tab-item ${isActive ? 'active' : ''}`}
                        onClick={() => onChange?.(tab.id)}
                    >
                        <span>{tab.label}</span>
                    </button>
                )
            })}
        </div>
    )
}

export default Tabs
