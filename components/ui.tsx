import React from 'react';

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, ...props }) => {
  const baseClasses = "px-4 py-2 rounded-md font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const variantClasses = {
    primary: "bg-accent hover:bg-accent-hover focus:ring-accent",
    secondary: "bg-secondary border border-border hover:bg-border focus:ring-accent",
    danger: "bg-danger hover:bg-red-700 focus:ring-danger",
  };
  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      {children}
    </button>
  );
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      className={`w-full bg-primary border border-border rounded-md px-3 py-2 placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${className}`}
      ref={ref}
      {...props}
    />
  );
});

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
    return (
        <textarea
            rows={4}
            className={`w-full bg-primary border border-border rounded-md px-3 py-2 placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${className}`}
            ref={ref}
            {...props}
        />
    );
});


// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    children: React.ReactNode;
}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
    return (
        <select
            className={`w-full bg-primary border border-border rounded-md px-3 py-2 placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${className}`}
            ref={ref}
            {...props}
        >
            {children}
        </select>
    );
});


// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-secondary rounded-lg shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// Card Component
// FIX: Update CardProps to extend React.HTMLAttributes<HTMLDivElement> to allow passing standard div props like onClick.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}
export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div className={`bg-secondary border border-border rounded-lg shadow-md ${className}`} {...props}>
      {children}
    </div>
  );
};


// Loading Spinner Component
export const LoadingSpinner: React.FC = () => (
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
);
