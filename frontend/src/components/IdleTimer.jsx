import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const IDLE_TIMEOUT = 30 * 60 * 1000;
const WARNING_TIMEOUT = 30 * 1000; // 30 seconds before logout

export default function IdleTimer({ children }) {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const [showWarning, setShowWarning] = useState(false);

  const logout = () => {
    setShowWarning(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    navigate('/login', { state: { message: 'You have been logged out due to inactivity.' } });
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setShowWarning(false);
    
    // Set warning timer (30s before logout)
    warningTimerRef.current = setTimeout(() => setShowWarning(true), IDLE_TIMEOUT - WARNING_TIMEOUT);
    // Set logout timer
    timerRef.current = setTimeout(logout, IDLE_TIMEOUT);
  };

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();
    
    events.forEach(event => window.addEventListener(event, handleActivity));
    resetTimer();
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, []);

  return (
    <>
      {children}
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inactivity Warning</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">You will be logged out in 30 seconds due to inactivity.</p>
            <button
              onClick={resetTimer}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Stay Logged In
            </button>
          </div>
        </div>
      )}
    </>
  );
}