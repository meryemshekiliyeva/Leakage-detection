import { useEffect, useRef, useState } from 'react';
import { Mic, Send, Bot, User, Sparkles, Info } from 'lucide-react';
import { useSystem } from '@/store/SystemContext';
import { waterLevelStatus } from '@/components/cards/WaterLevelCard';

interface Message {
  id: number;
  role: 'user' | 'system';
  text: string;
}

const EXAMPLE_COMMANDS = [
  'Check water level.',
  'Is there a leak?',
  'Show sensor data.',
  'What is the system status?',
];

let msgId = 0;

/**
 * Prototype voice-assistant interface. This is a SIMULATED conversation — there
 * is no real speech-recognition backend connected. Responses are generated from
 * the current (simulated) system state so the interaction feels real for demos.
 */
export function VoiceAssistant() {
  const { currentReading, aiAnalysis, systemStatus } = useSystem();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: msgId++,
      role: 'system',
      text: 'Voice Assistant ready (prototype). Tap a suggested command or type a question about the water system.',
    },
  ]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function respondTo(query: string): string {
    const q = query.toLowerCase();
    const level = Math.round(currentReading.waterLevel);
    const status = waterLevelStatus(currentReading.waterLevel).label.toLowerCase();

    if (q.includes('leak')) {
      return currentReading.leakDetected
        ? 'Warning: a water leak is currently detected. Immediate attention is recommended.'
        : 'The leak sensor is dry. No leak is currently detected.';
    }
    if (q.includes('system') || q.includes('status')) {
      return `System is ${systemStatus.system.toLowerCase()}. Arduino, Raspberry Pi, and Wi-Fi are ${
        systemStatus.arduino === 'CONNECTED' ? 'connected' : 'disconnected'
      }.`;
    }
    if (q.includes('sensor') || q.includes('data')) {
      return `Ultrasonic distance is ${currentReading.distance} centimeters, water level ${level} percent. Leak sensor is ${
        currentReading.leakDetected ? 'wet' : 'dry'
      }. AI status is ${aiAnalysis.status.toLowerCase()}.`;
    }
    if (q.includes('ai') || q.includes('anomaly')) {
      return `AI status is ${aiAnalysis.status.toLowerCase()} with an anomaly score of ${Math.round(
        aiAnalysis.anomalyScore * 100,
      )} percent and ${Math.round(aiAnalysis.confidence * 100)} percent confidence.`;
    }
    if (q.includes('water') || q.includes('level')) {
      return `Water level is ${level} percent. Current status is ${status}.`;
    }
    return "I can report the water level, leak status, sensor data, AI analysis, or system status. Try one of the suggested commands.";
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: msgId++, role: 'user', text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    // Simulated processing delay.
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: msgId++, role: 'system', text: respondTo(trimmed) },
      ]);
    }, 500);
  }

  function toggleListening() {
    if (listening) {
      setListening(false);
      return;
    }
    setListening(true);
    // We do NOT run real speech recognition. Simulate a short listen window,
    // then prompt the presenter to pick a command.
    setTimeout(() => setListening(false), 1800);
  }

  return (
    <div className="card flex h-[560px] flex-col overflow-hidden">
      {/* Prototype banner */}
      <div className="flex items-center gap-2 border-b border-white/5 bg-warn-500/5 px-4 py-2.5">
        <Info className="h-4 w-4 shrink-0 text-warn-400" />
        <span className="text-xs text-warn-300/90">
          Prototype — simulated voice interaction. No live speech-recognition
          backend is connected yet.
        </span>
      </div>

      {/* Conversation */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${
              m.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                m.role === 'user'
                  ? 'bg-accent-500/15 text-accent-400'
                  : 'bg-cyanx-500/15 text-cyanx-400'
              }`}
            >
              {m.role === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            <div
              className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm ${
                m.role === 'user'
                  ? 'rounded-tr-sm bg-accent-500/15 text-accent-50'
                  : 'rounded-tl-sm bg-navy-800/80 text-slate-200'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Listening indicator */}
      {listening && (
        <div className="flex items-center justify-center gap-3 border-t border-white/5 bg-cyanx-500/5 py-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-cyanx-500 opacity-70" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-cyanx-500" />
          </span>
          <span className="text-sm font-semibold text-cyanx-300">
            Listening… (simulated)
          </span>
        </div>
      )}

      {/* Suggested commands */}
      <div className="flex flex-wrap gap-2 border-t border-white/5 px-4 py-3">
        {EXAMPLE_COMMANDS.map((c) => (
          <button
            key={c}
            onClick={() => send(c)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Sparkles className="h-3 w-3 text-accent-400" />
            {c}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2 border-t border-white/5 px-4 py-3">
        <button
          onClick={toggleListening}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
            listening
              ? 'bg-cyanx-500 text-navy-950'
              : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
          aria-label="Toggle voice input (simulated)"
        >
          <Mic className="h-5 w-5" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="Ask about water level, leaks, sensors…"
          className="flex-1 rounded-xl border border-white/10 bg-navy-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-accent-500/50 focus:outline-none"
        />
        <button
          onClick={() => send(input)}
          className="btn-primary h-10 px-3"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
