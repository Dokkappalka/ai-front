import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './App.scss';
import './index.scss';
import { useInitAuth } from './hooks/useInitAuth';
import { useMainStore } from './store/mainStore';

function App() {
  const isLoading = useMainStore(state => state.isLoading)
  useInitAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }
  
  return <RouterProvider router={router} />;
}

export default App;
