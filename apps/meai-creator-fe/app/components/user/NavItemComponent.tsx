import { Link } from 'react-router';

export interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
}

export default function NavItemComponent({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const className = `ring-offset-background focus-visible:ring-ring group mx-auto flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-[0.77rem] font-medium tracking-tight whitespace-nowrap text-white/84 transition duration-150 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-55 ${
    isActive
      ? 'bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_8px_24px_rgba(0,0,0,0.26)]'
      : 'hover:bg-white/[0.08] hover:text-white'
  }`;
  const content = (
    <>
      <span className='text-white/86 transition-colors group-hover:text-white'>{item.icon}</span>
      <span>{item.label}</span>
    </>
  );

  if (item.onClick || !item.href) {
    return (
      <button
        type='button'
        onClick={item.onClick}
        disabled={item.disabled}
        className={className}
        title={item.title ?? item.label}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={item.href}
      className={className}
      title={item.title ?? item.label}
    >
      {content}
    </Link>
  );
}
