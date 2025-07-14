import React, { useState, useRef } from 'react';

interface MobileTableItem {
  id: string;
  [key: string]: unknown;
}

interface MobileTableProps {
  data: MobileTableItem[];
  columns: Array<{
    key: string;
    label: string;
    render?: (value: unknown, item: MobileTableItem) => React.ReactNode;
    className?: string;
  }>;
  onRowAction?: (action: string, item: MobileTableItem) => void;
  selectedItems?: string[];
  onSelectItem?: (id: string) => void;
  onSelectAll?: () => void;
  className?: string;
}

const MobileTable: React.FC<MobileTableProps> = ({
  data,
  columns,
  onRowAction,
  selectedItems = [],
  onSelectItem,
  onSelectAll,
  className = ''
}) => {
  const [swipeStates, setSwipeStates] = useState<{ [key: string]: boolean }>({});
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (itemId: string) => {
    const difference = touchStartX.current - touchEndX.current;
    const isLeftSwipe = difference > 50;
    const isRightSwipe = difference < -50;

    if (isLeftSwipe) {
      // Show actions on left swipe
      setSwipeStates(prev => ({ ...prev, [itemId]: true }));
    } else if (isRightSwipe) {
      // Hide actions on right swipe
      setSwipeStates(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleActionClick = (action: string, item: MobileTableItem) => {
    if (onRowAction) {
      onRowAction(action, item);
    }
    // Hide actions after click
    setSwipeStates(prev => ({ ...prev, [item.id]: false }));
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Mobile Header with Select All */}
      {onSelectAll && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedItems.length === data.length && data.length > 0}
              onChange={onSelectAll}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              Select All ({selectedItems.length}/{data.length})
            </span>
          </div>
          <div className="text-xs text-gray-500">
            ← Swipe left for actions
          </div>
        </div>
      )}

      {/* Mobile Cards */}
      {data.map((item) => {
        const isSelected = selectedItems.includes(item.id);
        const isSwipeOpen = swipeStates[item.id];

        return (
          <div
            key={item.id}
            className={`relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${
              isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
          >
            {/* Main Card Content */}
            <div
              className={`transition-transform duration-200 ${
                isSwipeOpen ? '-translate-x-32' : 'translate-x-0'
              }`}
                             onTouchStart={(e) => handleTouchStart(e)}
               onTouchMove={(e) => handleTouchMove(e)}
              onTouchEnd={() => handleTouchEnd(item.id)}
            >
              <div className="p-4">
                {/* Selection Checkbox */}
                {onSelectItem && (
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectItem(item.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                    />
                    <span className="text-sm text-gray-500">
                      {isSelected ? 'Selected' : 'Tap to select'}
                    </span>
                  </div>
                )}

                {/* Card Content */}
                <div className="space-y-3">
                  {columns.map((column) => {
                    const value = item[column.key];
                                         const displayValue = column.render ? column.render(value, item) : String(value);

                    return (
                      <div key={column.key} className="flex flex-col">
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {column.label}
                        </dt>
                        <dd className={`mt-1 text-sm ${column.className || 'text-gray-900'}`}>
                          {displayValue}
                        </dd>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Swipe Actions */}
            <div className="absolute inset-y-0 right-0 w-32 bg-gray-100 flex items-center justify-center">
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => handleActionClick('view', item)}
                  className="p-2 bg-blue-600 text-white rounded-lg text-xs font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleActionClick('export', item)}
                  className="p-2 bg-green-600 text-white rounded-lg text-xs font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleActionClick('delete', item)}
                  className="p-2 bg-red-600 text-white rounded-lg text-xs font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileTable; 