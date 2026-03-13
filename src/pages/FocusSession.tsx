import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Timer, BookOpen, AlertCircle, Pause, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage, Unit, Subject } from '@/lib/types';
import { getSubjects, streamChat, streamUnitSummary } from '@/lib/api';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function FocusSession() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const subjectId = searchParams.get('subject') || '';
  const unitId = searchParams.get('unit') || '';

  const [subject, setSubject] = useState<Subject | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [duration, setDuration] = useState(25);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tabAway, setTabAway] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [unitSummary, setUnitSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    (async () => {
      const subjects = await getSubjects();
      const s = subjects.find(x => x.id === subjectId);
      if (!s) return;
      setSubject(s);
      const u = s.units.find(x => x.id === unitId);
      if (u) setUnit(u);
    })();
  }, [subjectId, unitId]);

  // Tab visibility detection
  useEffect(() => {
    if (!started) return;
    const handleVisibility = () => {
      if (document.hidden) { setTabAway(true); setPaused(true); }
      else { setTabAway(false); setPaused(false); }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [started]);

  // Timer
  useEffect(() => {
    if (!started || paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          toast.success('Focus session complete!');
          navigate(`/exam-predictor?subject=${subjectId}&unit=${unitId}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, paused, navigate, subjectId, unitId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = async () => {
    setTimeLeft(duration * 60);
    setStarted(true);
    setMessages([{
      id: '1', role: 'assistant',
      content: `Welcome to your focus session on **${unit?.name || 'this unit'}**! 🎯\n\nI'm your AI study assistant. Ask me any doubts about this topic and I'll help you understand.`
    }]);

    // Generate AI unit summary
    if (subject && unit) {
      setSummaryLoading(true);
      let summaryContent = '';
      try {
        await streamUnitSummary({
          subject: subject.name,
          unit: unit.name,
          topics: unit.lessons.map(l => ({
            name: l.name,
            summary: l.summary,
            key_points: l.key_points,
            concepts: l.concepts,
            formulas: l.formulas,
          })),
          onDelta: (chunk) => {
            summaryContent += chunk;
            setUnitSummary(summaryContent);
          },
          onDone: () => {
            setSummaryLoading(false);
          },
        });
      } catch (err: any) {
        toast.error(err.message || 'Failed to generate unit summary');
        setSummaryLoading(false);
        // Fallback to static summary
        setUnitSummary(buildFallbackSummary(unit));
      }
    }
  };

  const buildFallbackSummary = (u: Unit): string => {
    let md = `# ${u.name}\n\n## Topics Covered\n`;
    u.lessons.forEach(l => { md += `- ${l.name}\n`; });
    md += '\n## Key Points\n';
    u.lessons.forEach(l => {
      if (l.key_points?.length) {
        md += `### ${l.name}\n`;
        l.key_points.forEach(kp => { md += `- ${kp}\n`; });
        md += '\n';
      }
    });
    return md;
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    let assistantContent = '';
    const chatHistory = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      await streamChat({
        messages: chatHistory,
        context: {
          subject: subject?.name || '',
          unit: unit?.name || '',
          topics: unit?.lessons.map(l => l.name) || [],
        },
        onDelta: (chunk) => {
          assistantContent += chunk;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant' && last.id === 'streaming') {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
            }
            return [...prev, { id: 'streaming', role: 'assistant', content: assistantContent }];
          });
        },
        onDone: () => {
          setMessages(prev => prev.map(m => m.id === 'streaming' ? { ...m, id: Date.now().toString() } : m));
          setIsStreaming(false);
        },
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to get response');
      setIsStreaming(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (!subject || !unit) return null;

  if (!started) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-xl p-8 max-w-md w-full text-center">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Timer className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Start Focus Session</h1>
          <p className="text-muted-foreground text-sm mb-6">{unit.name} · {subject.name}</p>
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Focus Time (minutes)</label>
            <Input
              type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 25)}
              min={5} max={120} className="text-center text-lg font-display"
            />
          </div>
          <Button className="w-full" size="lg" onClick={startSession}>Start Focus Session</Button>
          <Button variant="ghost" className="w-full mt-2" onClick={() => navigate(-1)}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (tabAway) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-xl p-12 text-center max-w-md">
          <Pause className="h-16 w-16 text-primary mx-auto mb-6 animate-pulse" />
          <h1 className="font-display text-2xl font-bold mb-3">Focus Mode Paused</h1>
          <p className="text-muted-foreground">Return to continue your study session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
          <span className="font-display font-semibold text-sm">Focus Mode</span>
          <span className="text-sm text-muted-foreground">· {unit.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-bold tabular-nums">{formatTime(timeLeft)}</span>
          <Button variant="outline" size="sm" onClick={() => {
            if (timerRef.current) clearInterval(timerRef.current);
            navigate(`/exam-predictor?subject=${subjectId}&unit=${unitId}`);
          }}>End Session</Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Chat */}
        <div className="flex-1 flex flex-col border-r border-border">
          <div className="p-3 border-b border-border bg-muted/30">
            <h3 className="font-display font-semibold text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" /> AI Doubt Solver
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              value={input} onChange={e => setInput(e.target.value)}
              placeholder="Ask a study question..."
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={isStreaming}
            />
            <Button size="icon" onClick={sendMessage} disabled={isStreaming}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right - AI Generated Unit Summary */}
        <div className="w-[420px] overflow-y-auto p-6 hidden md:block">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold">Unit Summary</h3>
            {summaryLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
          {unitSummary ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{unitSummary}</ReactMarkdown>
            </div>
          ) : summaryLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm">Generating unit summary...</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
