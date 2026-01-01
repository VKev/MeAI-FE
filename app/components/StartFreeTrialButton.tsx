import { Button } from '@/components/ui/button';

interface StartFreeTrialButtonProps {
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'secondary' | 'outline';
  className?: string;
  onClick?: () => void;
}

export function StartFreeTrialButton({
  size = 'default',
  variant = 'default',
  className = '',
  onClick
}: StartFreeTrialButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      console.log('Start Free Trial clicked');
    }
  };

  return (
    <Button size={size} variant={variant} className={`bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl text-white ${className}`} onClick={handleClick}>
      Start Free Trial
    </Button>
  );
}

