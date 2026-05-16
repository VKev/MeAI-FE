import { Link } from 'react-router';

export interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  href: string;
}

export default function NavItemComponent({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      to={item.href}
      className={`ring-offset-background focus-visible:ring-ring group mx-auto flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-[0.77rem] font-medium tracking-tight whitespace-nowrap text-white/84 transition duration-150 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none ${
        isActive
          ? 'bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_8px_24px_rgba(0,0,0,0.26)]'
          : 'hover:bg-white/[0.08] hover:text-white'
      }`}
      title={item.label}
    >
      <span className='text-white/86 transition-colors group-hover:text-white'>{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}
