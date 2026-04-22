import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip
} from '@/components/ui/chart';
import type { TrendChartProps } from './chart-types';
import { EmptyState } from './EmptyState';

export function TrendChart({
  title,
  description,
  emptyMessage,
  emptySubtext,
  hasData,
  data,
  config,
  dataKeys,
  yFormatter,
  tooltipFormatter
}: TrendChartProps) {
  return (
    <div className='rounded-2xl border border-white/5 bg-white/[0.02] p-5 shadow-2xl backdrop-blur-3xl lg:p-6'>
      <div className='mb-6'>
        <h3 className='text-lg font-semibold tracking-tight text-white/90'>{title}</h3>
        <p className='text-sm text-slate-400'>{description}</p>
      </div>

      {hasData ? (
        <div className='h-[300px] w-full'>
          <ChartContainer config={config} className='h-full w-full'>
            <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke='#ffffff' strokeOpacity={0.05} />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                tickFormatter={yFormatter}
                tick={{ fill: '#64748b', fontSize: 11 }}
                width={45}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator='line'
                    formatter={(value, name) => (
                      <div className='flex w-full items-center justify-between gap-3'>
                        <span className='text-muted-foreground'>{config[name as string]?.label ?? name}</span>
                        <span className='font-mono font-medium text-foreground'>{tooltipFormatter(value)}</span>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              {dataKeys.map((key) => (
                <Line
                  key={key}
                  type='monotone'
                  dataKey={key}
                  stroke={`var(--color-${key})`}
                  strokeWidth={2.5}
                  dot={false}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </div>
      ) : (
        <EmptyState message={emptyMessage} subtext={emptySubtext} />
      )}
    </div>
  );
}
