import React from 'react';

interface DialpadProps {
  onKeyPress: (digit: string) => void;
  disabled?: boolean;
}

const Dialpad: React.FC<DialpadProps> = ({ onKeyPress, disabled }) => {
  const buttons = [
    { digit: '1', letters: '' },
    { digit: '2', letters: 'ABC' },
    { digit: '3', letters: 'DEF' },
    { digit: '4', letters: 'GHI' },
    { digit: '5', letters: 'JKL' },
    { digit: '6', letters: 'MNO' },
    { digit: '7', letters: 'PQRS' },
    { digit: '8', letters: 'TUV' },
    { digit: '9', letters: 'WXYZ' },
    { digit: '*', letters: '' },
    { digit: '0', letters: '+' },
    { digit: '#', letters: '' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {buttons.map((button) => (
        <button
          key={button.digit}
          onClick={() => onKeyPress(button.digit)}
          disabled={disabled}
          className="relative p-4 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
        >
          <span className="text-2xl font-semibold text-gray-800">{button.digit}</span>
          {button.letters && (
            <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
              {button.letters}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default Dialpad;
