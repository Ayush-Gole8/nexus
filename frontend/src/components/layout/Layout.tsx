import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar />
      <main style={{ overflowY: 'auto', background: 'var(--bg-base)' }}>
        <div style={{ padding: '24px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
