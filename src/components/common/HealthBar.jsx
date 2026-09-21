function HealthBar({ label, value, width }) {
    return (
        <div className="health-row">
            <div className="health-label">
                <span>{label}</span>
                <strong>{value}</strong>
            </div>

            <div className="health-track">
                <span style={{ width }} />
            </div>
        </div>
    )
}

export default HealthBar