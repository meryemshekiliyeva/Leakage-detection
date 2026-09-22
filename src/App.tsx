import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SystemProvider } from '@/store/SystemContext';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { WaterLevel } from '@/pages/WaterLevel';
import { Leakage } from '@/pages/Leakage';
import { AIAnalysis } from '@/pages/AIAnalysis';
import { SensorData } from '@/pages/SensorData';
import { Alerts } from '@/pages/Alerts';
import { History } from '@/pages/History';
import { ControlPanel } from '@/pages/ControlPanel';
import { VoiceAssistantPage } from '@/pages/VoiceAssistantPage';
import { Settings } from '@/pages/Settings';
import { Architecture } from '@/pages/Architecture';
import { NotFound } from '@/pages/NotFound';

export default function App() {
  return (
    <SystemProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/water-level" element={<WaterLevel />} />
            <Route path="/leakage" element={<Leakage />} />
            <Route path="/ai-analysis" element={<AIAnalysis />} />
            <Route path="/sensor-data" element={<SensorData />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/history" element={<History />} />
            <Route path="/control-panel" element={<ControlPanel />} />
            <Route path="/voice" element={<VoiceAssistantPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SystemProvider>
  );
}
