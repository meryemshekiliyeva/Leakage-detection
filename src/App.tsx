import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SystemProvider } from '@/store/SystemContext';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { WaterLevel } from '@/pages/WaterLevel';
import { ControlPanel } from '@/pages/ControlPanel';
import { NotFound } from '@/pages/NotFound';

export default function App() {
  return (
    <SystemProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/water-level" element={<WaterLevel />} />
            <Route path="/control-panel" element={<ControlPanel />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SystemProvider>
  );
}
