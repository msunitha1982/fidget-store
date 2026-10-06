import { Link } from 'react-router-dom';
import { EmptyState } from '../components/States';

export function NotFoundPage() {
  return (
    <div className="container section">
      <EmptyState
        title="This page doesn't exist"
        icon="info"
        action={
          <Link to="/" className="btn">
            Go to the shop
          </Link>
        }
      >
        The link may be old or mistyped.
      </EmptyState>
    </div>
  );
}
