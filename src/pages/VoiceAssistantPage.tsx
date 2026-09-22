import { Mic, MessageSquare, Waves, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { VoiceAssistant } from '@/components/voice/VoiceAssistant';

export function VoiceAssistantPage() {
  return (
    <div>
      <PageHeader
        title="Voice Assistant"
        subtitle="Ask the system about its status — a prototype for the future voice interface."
        phase="INTERACT"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <VoiceAssistant />
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warn-500/12">
                <Mic className="h-[18px] w-[18px] text-warn-400" />
              </div>
              <h2 className="text-base font-semibold text-white">About this feature</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              This is a front-end prototype of the planned voice interface. It
              responds using the current (simulated) system state so you can see
              how a spoken interaction would feel. Real speech recognition will
              be wired to the Raspberry Pi in a later phase.
            </p>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-white">
              What you can ask
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li className="flex items-center gap-2.5">
                <Waves className="h-4 w-4 text-accent-400" /> Water level & status
              </li>
              <li className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-normal-400" /> Leak detection
              </li>
              <li className="flex items-center gap-2.5">
                <MessageSquare className="h-4 w-4 text-cyanx-400" /> Sensor data & AI analysis
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
