export default function NavTooltip({ label }: { label: string }) {
  return (
    <div className='absolute left-20 rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none whitespace-nowrap'>
      {label}
    </div>
  );
}
