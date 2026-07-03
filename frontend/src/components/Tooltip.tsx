import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactElement;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'right',
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const childRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && childRef.current) {
      const rect = childRef.current.getBoundingClientRect();
      
      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - 8;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 8;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 8;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 8;
          break;
      }

      setCoords({ top, left });
    }
  }, [isVisible, position]);

  const getTransform = () => {
    switch (position) {
      case 'top':
        return 'translateX(-50%) translateY(-100%)';
      case 'bottom':
        return 'translateX(-50%)';
      case 'left':
        return 'translateX(-100%) translateY(-50%)';
      case 'right':
        return 'translateY(-50%)';
      default:
        return 'translateY(-50%)';
    }
  };

  const getArrowPosition = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 -translate-x-1/2 border-t-gray-800';
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-l-gray-800';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-r-gray-800';
      default:
        return 'right-full top-1/2 -translate-y-1/2 border-r-gray-800';
    }
  };

  return (
    <>
      <div
        ref={childRef}
        className="inline-flex"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible &&
        createPortal(
          <div
            className="fixed z-[9999] px-3 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg shadow-lg whitespace-nowrap"
            role="tooltip"
            style={{
              top: coords.top,
              left: coords.left,
              transform: getTransform(),
              pointerEvents: 'none',
            }}
          >
            {content}
            <div
              className={`absolute w-0 h-0 border-4 border-transparent ${getArrowPosition()}`}
            />
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;
