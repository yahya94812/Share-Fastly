import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Root from './pages/Root';
import Explore from './pages/Explore';
import Dashboard from './pages/Dashboard';
import Channel from './pages/Channel';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/channel/:channelName" element={<Channel />} />
          <Route path="*" element={<Navigate to="/explore" replace />} />
        </Routes>
      </main>
    </div>
  );
}
