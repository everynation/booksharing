import { useParams, Navigate } from 'react-router-dom';

export const BookRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/books/${id}`} replace />;
};