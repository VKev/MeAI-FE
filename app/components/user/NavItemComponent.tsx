import { Link } from 'react-router';

export interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string;
}

export default function NavItemComponent({
  item,
  isActive,
  children
}: {
  item: NavItem;
  isActive: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Link
      to={item.href}
      className={`group relative flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg transition-all duration-200 w-full ${
        isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400 hover:text-white'
      }`}
      title={item.label}
    >
      <div className={`${isActive ? 'text-white' : ''}`}>{item.icon}</div>
      <span className={`text-[10px] font-medium whitespace-nowrap ${isActive ? 'text-white' : 'text-gray-400'}`}>
        {item.label}
      </span>
      {children}
    </Link>
  );
}
