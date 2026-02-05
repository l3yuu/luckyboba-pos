import { RouterProvider } from 'react-router-dom';
import { router } from './routes'; 
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary 
      fallback={
        <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-bold text-red-600">POS Interface Error</h1>
          <button 
            onClick={() => window.location.href = '/'} 
            className="mt-6 bg-[#3b2063] text-white px-8 py-3 rounded-full font-bold"
          >
            Back to Dashboard
          </button>
        </div>
      }
    >
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;