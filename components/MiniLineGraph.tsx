import React from 'react';
import Svg, { Circle, Polyline } from 'react-native-svg';

type MiniLineGraphProps = {
  data: number[];
  isPositive: boolean;
};

export function MiniLineGraph({ data, isPositive }: MiniLineGraphProps) {
  const width = 120;
  const height = 40;
  const padding = 4;
  const color = isPositive ? '#10B981' : '#EF4444';

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
      {data.map((value, index) => {
        const x = padding + (index / (data.length - 1)) * (width - padding * 2);
        const y = height - padding - ((value - min) / range) * (height - padding * 2);
        return <Circle key={index} cx={x} cy={y} r={2} fill={color} opacity={0.7} />;
      })}
    </Svg>
  );
}
