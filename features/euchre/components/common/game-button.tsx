import clsx from 'clsx';

interface Props extends React.HtmlHTMLAttributes<HTMLButtonElement> {
  type: 'primary' | 'success' | 'danger' | 'warn';
  children?: React.ReactNode;
  disabled?: boolean;
}

const GameButton = ({ type, children, className, disabled, ...rest }: Props) => {
  let btnColor = '';

  switch (type) {
    case 'primary':
      btnColor = 'dark:bg-stone-800 dark:text-white';
      break;
    case 'success':
      btnColor = 'bg-green-950';
      break;
    case 'danger':
      btnColor = 'bg-red-950';
      break;
    case 'warn':
      btnColor = 'bg-orange-900';
      break;
  }
  return (
    <button
      disabled={disabled}
      className={clsx(
        'md:text-base text-sm h-8 text-white border border-white p-1 min-w-24 dark:hover:bg-amber-100 dark:hover:text-black disabled:hover:bg-inherit disabled:cursor-not-allowed dark:disabled:text-gray-500 duration-300 transition-all',
        btnColor,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

export default GameButton;
