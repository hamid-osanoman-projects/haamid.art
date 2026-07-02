'use client';

import { motion } from 'framer-motion';

export default function JellyButton({ 
  children, 
  onClick, 
  className = '',
  href
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  className?: string;
  href?: string;
}) {
  const isLink = !!href;
  const Wrapper = isLink ? motion.a : motion.button;

  return (
    <Wrapper
      href={href}
      onClick={onClick}
      className={`inline-flex outline-none ${className}`}
      whileHover={{ scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 10 } }}
      whileTap={{ scale: 0.9, transition: { type: 'spring', stiffness: 400, damping: 10 } }}
    >
      {children}
    </Wrapper>
  );
}
