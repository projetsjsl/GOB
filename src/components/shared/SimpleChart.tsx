import React, { useRef, useEffect } from 'react';

declare const Chart: any;

interface SimpleChartProps {
    data: any;
    type?: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polarArea';
    width?: number;
    height?: number;
}

export const SimpleChart: React.FC<SimpleChartProps> = ({
    data,
    type = 'line',
    width = 300,
    height = 200
}) => {
    const chartRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (chartRef.current && typeof Chart !== 'undefined') {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                new Chart(ctx, {
                    type: type,
                    data: data,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }
        }
    }, [data, type]);

    return (
        <div className="w-full h-full">
            <canvas ref={chartRef} width={width} height={height}></canvas>
        </div>
    );
};

export default SimpleChart;
