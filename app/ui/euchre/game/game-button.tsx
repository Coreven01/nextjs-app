import clsx from 'clsx';

interface Props extends React.HtmlHTMLAttributes<HTMLButtonElement> {
  type: 'primary' | 'success' | 'danger' | 'warn';
  children?: React.ReactNode;
}

const GameButton = ({ type, children, className, ...rest }: Props) => {
  let btnColor = '';

  switch (type) {
    case 'primary':
      btnColor = 'bg-stone-800';
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
      className={clsx('h-8 text-white border border-white p-1 mx-auto min-w-32', btnColor, className)}
      {...rest}
    >
      {children}
    </button>
  );
};

export default GameButton;
