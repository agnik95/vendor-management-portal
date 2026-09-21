import { useRef, useState } from 'react';

const SpotlightButton = ({ 
    children, 
    onClick, 
    className = '', 
    color = 'indigo' 
}) => {
    const buttonRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e) => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const baseClasses = `spotlight-btn spotlight-${color} ${className}`;

    return (
        <button
            ref={buttonRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={baseClasses}
            style={{
                '--x': `${position.x}px`,
                '--y': `${position.y}px`,
            }}
        >
            <div className="spotlight-content">
                {children}
            </div>
            {isHovered && (
                <div className="spotlight-overlay" />
            )}
        </button>
    );
};

export default SpotlightButton;
