import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBack,
  actionIcon,
  onAction,
}) => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-10 glass-effect border-b border-border shadow-md"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="mr-3 p-2 rounded-full hover:bg-secondary/80 dark:hover:bg-gray-800 transition-colors shadow-sm"
              aria-label="Go back"
            >
              <ArrowLeft size={20} className="text-foreground" />
            </motion.button>
          )}
          <motion.h1
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-xl sm:text-2xl font-bold text-foreground tracking-tight"
          >
            {title}
          </motion.h1>
        </div>
        
        {onAction && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAction}
            className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-md button-effect"
            aria-label="Add"
          >
            {actionIcon || <Plus size={20} />}
          </motion.button>
        )}
      </div>
    </motion.header>
  );
};

export default Header;