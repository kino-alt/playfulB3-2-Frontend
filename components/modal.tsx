
import React from 'react';
import { GameButton } from './game-button';

{/* Props Interface */}
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string | React.ReactNode;
}

export function Modal({ isOpen, onClose, title, content }: ModalProps) {
  if (!isOpen) {
    return null; 
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 transition-opacity duration-300"
      onClick={onClose} //close modal when clicking outside
    >
        
      <div 
        className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl transform scale-100 transition-transform duration-300"
        onClick={(e) => e.stopPropagation()} //prevent closing when clicking inside
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
        <div className="text-gray-600 mb-6">
          {content}
        </div>
        
        {/* Close Button */}
        <GameButton variant="secondary" onClick={onClose} height="py-2">
          Close
        </GameButton>
      </div>
    </div>
  );
}