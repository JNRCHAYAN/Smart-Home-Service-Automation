export default function Card({ children, className = '', padding = true, ...props }) {
  return (
    <div
      className={`rounded-2xl bg-white shadow-sm border border-ink-200/70 ${
        padding ? 'p-5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
