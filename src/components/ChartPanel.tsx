import type { ReactNode } from "react";
import { motion } from "motion/react";
export function ChartPanel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`panel ${className}`}
    >
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </motion.section>
  );
}
