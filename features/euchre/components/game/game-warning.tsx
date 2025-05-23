import clsx from 'clsx';
import { motion } from 'framer-motion';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GameWarning = ({ children, className }: DivProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        opacity: { duration: 1.5 }
      }}
      className={clsx('bg-red-100 text-black text-center', className)}
    >
      {children}
    </motion.div>
  );
};

export default GameWarning;
