import { Button } from './ui/Button';

interface StartFreeTrialButtonProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  onClick?: () => void;
}

export function StartFreeTrialButton({
  size = 'md',
  variant = 'primary',
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
    <Button size={size} variant={variant} className={className} onClick={handleClick}>
      Start Free Trial
    </Button>
  );
}

