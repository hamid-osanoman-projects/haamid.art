'use client';

import React, { useEffect, useState } from 'react';

interface TypewriterTextProps {
  words: string[];
}

export default function TypewriterText({ words }: TypewriterTextProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const activeWord = words[currentWordIndex];

    const handleTyping = () => {
      if (isDeleting) {
        // Delete characters
        setCurrentText(activeWord.substring(0, currentText.length - 1));
        setTypingSpeed(45);
      } else {
        // Type characters
        setCurrentText(activeWord.substring(0, currentText.length + 1));
        setTypingSpeed(90);
      }

      // Check transitions
      if (!isDeleting && currentText === activeWord) {
        // Pause at full word
        timer = setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && currentText === '') {
        // Word completely deleted, switch to next word
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        setTypingSpeed(150);
      }
    };

    timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIndex, words, typingSpeed]);

  return (
    <span className="inline-flex items-center text-purple-400 font-bold">
      <span>{currentText}</span>
      <span className="inline-block w-[3px] h-6 ml-1 bg-purple-400 animate-[pulse_0.8s_infinite] font-light" />
    </span>
  );
}
