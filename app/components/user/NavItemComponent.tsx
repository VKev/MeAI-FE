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
      className={`text-white ring-offset-background focus-visible:ring-ring mx-auto flex h-auto w-full flex-col items-center gap-0.5 rounded-xl py-1.5 text-[0.625rem] whitespace-nowrap transition duration-120 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none hover:bg-white/10 
        ${isActive ? 'bg-white/10' : ''}
  `}
      title={item.label}
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  );
}
