import React, { useState } from 'react';

/**
 * Helper to convert polar coordinates to cartesian (x, y)
 */
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

/**
 * Creates SVG path definition for a donut or pie slice
 */
function describeArc(x, y, radius, innerRadius, startAngle, endAngle) {
  // If slice spans essentially 360 degrees
  const angleDiff = endAngle - startAngle;
  if (angleDiff >= 359.99) {
    if (innerRadius > 0) {
      return [
        `M ${x} ${y - radius}`,
        `A ${radius} ${radius} 0 1 0 ${x} ${y + radius}`,
        `A ${radius} ${radius} 0 1 0 ${x} ${y - radius}`,
        `M ${x} ${y - innerRadius}`,
        `A ${innerRadius} ${innerRadius} 0 1 1 ${x} ${y + innerRadius}`,
        `A ${innerRadius} ${innerRadius} 0 1 1 ${x} ${y - innerRadius}`,
        'Z'
      ].join(' ');
    } else {
      return [
        `M ${x} ${y - radius}`,
        `A ${radius} ${radius} 0 1 0 ${x} ${y + radius}`,
        `A ${radius} ${radius} 0 1 0 ${x} ${y - radius}`,
        'Z'
      ].join(' ');
    }
  }

  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = angleDiff <= 180 ? '0' : '1';

  if (innerRadius > 0) {
    const innerStart = polarToCartesian(x, y, innerRadius, startAngle);
    const innerEnd = polarToCartesian(x, y, innerRadius, endAngle);

    return [
      `M ${end.x} ${end.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${start.x} ${start.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerEnd.x} ${innerEnd.y}`,
      'Z'
    ].join(' ');
  }

  // Solid Pie
  return [
    `M ${x} ${y}`,
    `L ${end.x} ${end.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${start.x} ${start.y}`,
    'Z'
  ].join(' ');
}

export default function PieDonutChart({
  data = [],
  title = '',
  subtitle = '',
  centerValue = '',
  centerLabel = '',
  centerSub = '',
  currency = '',
  isDonut = true,
  height = 320,
  donutThickness = 38,
  onSliceClick = null
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Compute total value
  const totalValue = data.reduce((acc, item) => acc + (Number(item.value || item.count) || 0), 0);

  // Layout parameters for SVG
  const size = 260;
  const center = size / 2;
  const outerRadius = 110;
  const innerRadius = isDonut ? outerRadius - donutThickness : 0;

  // Compute slice angles and offsets
  let cumulativeAngle = 0;
  const slices = data.map((item, index) => {
    const rawVal = Number(item.value || item.count) || 0;
    const percentage = totalValue > 0 ? (rawVal / totalValue) * 100 : 0;
    const sliceAngle = totalValue > 0 ? (rawVal / totalValue) * 360 : 0;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    const midAngle = startAngle + sliceAngle / 2;
    cumulativeAngle += sliceAngle;

    return {
      ...item,
      index,
      rawVal,
      percentage,
      startAngle,
      endAngle,
      midAngle
    };
  });

  const activeItem = hoveredIdx !== null ? slices[hoveredIdx] : null;

  const formatVal = (val, isCurrency = false) => {
    if (typeof val !== 'number') val = Number(val) || 0;
    if (isCurrency || currency) {
      const sym = currency || '$';
      if (val >= 1_000_000) return `${sym}${(val / 1_000_000).toFixed(2)}M`;
      if (val >= 1_000) return `${sym}${(val / 1_000).toFixed(1)}k`;
      return `${sym}${val.toLocaleString()}`;
    }
    return val.toLocaleString();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Chart Header */}
      <div className="flex items-start justify-between pb-3 mb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{title}</span>
          </h3>
          {subtitle && (
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{subtitle}</p>
          )}
        </div>
        {totalValue > 0 && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#1E40AF] border border-blue-100">
            {formatVal(totalValue, Boolean(currency))}
          </span>
        )}
      </div>

      {/* Main Visual: SVG Pie/Donut + Interactive Legend */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 py-2">
        {/* SVG Container */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg 
            width={size} 
            height={size} 
            viewBox={`0 0 ${size} ${size}`}
            className="overflow-visible select-none drop-shadow-sm"
          >
            <defs>
              <filter id="sliceShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.18" />
              </filter>
            </defs>

            {totalValue === 0 ? (
              <circle
                cx={center}
                cy={center}
                r={outerRadius}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth={isDonut ? donutThickness : outerRadius}
              />
            ) : (
              slices.map((slice) => {
                const isHovered = hoveredIdx === slice.index;
                const pathD = describeArc(
                  center,
                  center,
                  outerRadius,
                  innerRadius,
                  slice.startAngle,
                  slice.endAngle
                );

                // Small outward translation for hovered slice
                let transform = '';
                if (isHovered && slices.length > 1) {
                  const rad = ((slice.midAngle - 90) * Math.PI) / 180.0;
                  const dx = 6 * Math.cos(rad);
                  const dy = 6 * Math.sin(rad);
                  transform = `translate(${dx}, ${dy})`;
                }

                return (
                  <path
                    key={slice.index}
                    d={pathD}
                    fill={slice.color || '#3B82F6'}
                    transform={transform}
                    filter={isHovered ? 'url(#sliceShadow)' : undefined}
                    className="cursor-pointer transition-all duration-200"
                    style={{
                      opacity: hoveredIdx === null || isHovered ? 1 : 0.65,
                      stroke: '#FFFFFF',
                      strokeWidth: isHovered ? 2.5 : 1.5,
                      strokeLinejoin: 'round'
                    }}
                    onMouseEnter={() => setHoveredIdx(slice.index)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => onSliceClick && onSliceClick(slice)}
                  />
                );
              })
            )}

            {/* Inner Center Content in Donut Mode */}
            {isDonut && (
              <g className="pointer-events-none text-center">
                <circle
                  cx={center}
                  cy={center}
                  r={innerRadius - 2}
                  fill="#FFFFFF"
                />
                {activeItem ? (
                  <>
                    <text
                      x={center}
                      y={center - 10}
                      textAnchor="middle"
                      className="text-[12px] font-bold fill-slate-800"
                    >
                      {activeItem.label.length > 18 ? `${activeItem.label.slice(0, 16)}...` : activeItem.label}
                    </text>
                    <text
                      x={center}
                      y={center + 12}
                      textAnchor="middle"
                      className="text-[15px] font-extrabold fill-[#1E40AF]"
                    >
                      {formatVal(activeItem.rawVal, Boolean(currency))}
                    </text>
                    <text
                      x={center}
                      y={center + 27}
                      textAnchor="middle"
                      className="text-[11px] font-semibold fill-amber-600"
                    >
                      {activeItem.percentage.toFixed(1)}% Share
                    </text>
                  </>
                ) : (
                  <>
                    <text
                      x={center}
                      y={center - 12}
                      textAnchor="middle"
                      className="text-[10px] font-bold tracking-wider uppercase fill-slate-400"
                    >
                      {centerLabel || 'TOTAL'}
                    </text>
                    <text
                      x={center}
                      y={center + 10}
                      textAnchor="middle"
                      className="text-[17px] font-extrabold fill-slate-900 tracking-tight"
                    >
                      {centerValue || formatVal(totalValue, Boolean(currency))}
                    </text>
                    {centerSub && (
                      <text
                        x={center}
                        y={center + 26}
                        textAnchor="middle"
                        className="text-[10px] font-medium fill-slate-500"
                      >
                        {centerSub}
                      </text>
                    )}
                  </>
                )}
              </g>
            )}
          </svg>
        </div>

        {/* Legend & Breakdown List */}
        <div className="w-full md:w-56 space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
          {slices.map((slice) => {
            const isHovered = hoveredIdx === slice.index;
            return (
              <div
                key={slice.index}
                onMouseEnter={() => setHoveredIdx(slice.index)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSliceClick && onSliceClick(slice)}
                className={`flex items-center justify-between p-1.5 rounded-lg transition-all cursor-pointer border ${
                  isHovered 
                    ? 'bg-blue-50/80 border-blue-200 shadow-xs' 
                    : 'hover:bg-slate-50 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0 pr-1">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0 transition-transform"
                    style={{ 
                      backgroundColor: slice.color,
                      transform: isHovered ? 'scale(1.25)' : 'scale(1)'
                    }}
                  />
                  <span 
                    className={`truncate font-medium ${
                      isHovered ? 'text-blue-900 font-semibold' : 'text-slate-700'
                    }`}
                    title={slice.label}
                  >
                    {slice.label}
                  </span>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="font-bold text-slate-800 text-[11px]">
                    {formatVal(slice.rawVal, Boolean(currency))}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                    isHovered ? 'bg-[#1E40AF] text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {slice.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Insight / Callout */}
      {slices.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="truncate">
            <strong className="text-slate-700">Top Component:</strong>{' '}
            {slices[0]?.label} ({slices[0]?.percentage.toFixed(1)}%)
          </span>
          <span className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer shrink-0 ml-2">
            Details →
          </span>
        </div>
      )}
    </div>
  );
}
