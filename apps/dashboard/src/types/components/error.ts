export interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export interface ErrorContentProps {
  error: Error & { digest?: string };
  reset: () => void;
  className?: string;
}
