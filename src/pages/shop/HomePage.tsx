import { Link } from 'react-router-dom';
import { site } from '../../config/site';

export function HomePage() {
  return (
    <section className="home container" aria-labelledby="home-title">
      <h1 id="home-title" className="home__title">
        {site.name}
      </h1>
      <Link to="/shop" className="btn btn--lg">
        Shop Now
      </Link>
    </section>
  );
}
