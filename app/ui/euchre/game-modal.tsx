import clsx from 'clsx';
import { motion } from 'framer-motion';
interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  durationMs?: 150 | 300 | 700 | 1000 | 1500 | 3000;
}

export default function GameModal({ children, className, durationMs, ...rest }: DivProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { opacity: { duration: (durationMs ?? 500) / 1000 } } }}
    >
      <div className={clsx(`shadow-md shadow-black`, className)} {...rest}>
        {children}
      </div>
    </motion.div>
  );
}
