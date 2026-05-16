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
  tooltipFormatter,
  height = 300
}: TrendChartProps & { height?: number }) {
  return (
    <div className='rounded-3xl border border-white/5 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_55%),linear-gradient(180deg,rgba(11,13,24,0.92)_0%,rgba(7,9,16,0.98)_100%)] p-6 shadow-2xl backdrop-blur-3xl'>
      <div className='mb-6'>
        <h4 className='text-base font-semibold text-white/90'>{title}</h4>
        <p className='text-xs text-slate-500 mt-1'>{description}</p>
      </div>

      {hasData ? (
        <div style={{ height }} className='w-full'>
          <ChartContainer config={config} className='h-full w-full'>
            <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke='#ffffff' strokeOpacity={0.05} />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                tickFormatter={yFormatter}
                tick={{ fill: '#475569', fontSize: 11 }}
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
              <ChartLegend content={<ChartLegendContent className='pt-4' />} />
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
