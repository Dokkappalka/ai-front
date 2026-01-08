import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>404</h1>
      <p>Страница не найдена</p>
      <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>
        Вернуться на главную
      </Link>
    </div>
  );
};

export default NotFoundPage;

