export default function Spinner({ className = 'h-5 w-5 border-2' }) {
  return (
    <span className={`inline-block animate-spin rounded-full border-primary/20 border-t-accent ${className}`} />
  );
}
