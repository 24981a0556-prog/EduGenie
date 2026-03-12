import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Timer, BookOpen, AlertCircle, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage, Lesson } from '@/lib/types';
import { store } from '@/lib/store';
import { toast } from 'sonner';

const BLOCKED_TOPICS = ['weather', 'news', 'politics', 'movie', 'game', 'sport', 'gossip', 'celebrity'];

function getLesson(subjectName: string, lessonName: string): Lesson | null {
  const subjects = store.getSubjects();
  const subject = subjects.find(s => s.name === subjectName);
  if (!subject) return null;
  for (const unit of subject.units) {
    const lesson = unit.lessons.find(l => l.name === lessonName);
    if (lesson) return lesson;
  }
  return null;
}

function generateResponse(question: string, lessonName: string): string {
  const q = question.toLowerCase();
  if (BLOCKED_TOPICS.some(t => q.includes(t))) {
    return 'I am designed to assist only with study related questions. Please ask me about your lesson topics.';
  }
  return `Great question about **${lessonName}**!\n\nRegarding "${question}":\n\nThis is a core concept in this topic. Here are the key points to remember:\n\n1. **Definition**: This concept refers to the fundamental principle governing this area of study.\n2. **Application**: It's commonly applied in exam scenarios involving analysis and problem-solving.\n3. **Key insight**: Understanding the underlying mechanism is crucial for answering related questions.\n\n💡 *Tip: Focus on the relationship between this concept and related topics for a deeper understanding.*`;
}

export default function FocusSession() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const subjectName = searchParams.get('subject') || '';
  const lessonName = decodeURIComponent(searchParams.get('lesson') || '');

  const [duration, setDuration] = useState(25);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tabAway, setTabAway] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const lesson = getLesson(subjectName, lessonName);

  // Tab visibility detection
  useEffect(() => {
    if (!started) return;
    const handleVisibility = () => {
      if (document.hidden) {
        setTabAway(true);
        setPaused(true);
      } else {
        setTabAway(false);
        setPaused(false);
      }
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
          navigate(`/exam-predictor?subject=${subjectName}&lesson=${encodeURIComponent(lessonName)}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, paused, navigate, subjectName, lessonName]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = () => {
    setTimeLeft(duration * 60);
    setStarted(true);
    setMessages([{
      id: '1', role: 'assistant',
      content: `Welcome to your focus session on **${lessonName}**! 🎯\n\nI'm your AI study assistant. Ask me any doubts about this topic and I'll help you understand.`
    }]);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: generateResponse(input, lessonName) };
    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-xl p-8 max-w-md w-full text-center">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Timer className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Start Focus Session</h1>
          <p className="text-muted-foreground text-sm mb-6">{lessonName} · {subjectName}</p>
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

  // Tab away overlay
  if (tabAway) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-xl p-12 text-center max-w-md">
          <Pause className="h-16 w-16 text-primary mx-auto mb-6 animate-pulse-glow" />
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
          <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse-glow" />
          <span className="font-display font-semibold text-sm">Focus Mode</span>
          <span className="text-sm text-muted-foreground">· {lessonName}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-bold tabular-nums">{formatTime(timeLeft)}</span>
          <Button variant="outline" size="sm" onClick={() => {
            if (timerRef.current) clearInterval(timerRef.current);
            navigate(`/exam-predictor?subject=${subjectName}&lesson=${encodeURIComponent(lessonName)}`);
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
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}</div>
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
            />
            <Button size="icon" onClick={sendMessage}><Send className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Right - Summary */}
        <div className="w-[400px] overflow-y-auto p-6 hidden md:block">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold">Lesson Summary</h3>
          </div>
          {lesson ? (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Topic</h4>
                <p className="font-medium">{lesson.name}</p>
              </div>
              {lesson.summary && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Explanation</h4>
                  <p className="text-sm text-muted-foreground">{lesson.summary}</p>
                </div>
              )}
              {lesson.keyPoints && lesson.keyPoints.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Key Points</h4>
                  <ul className="space-y-1.5">
                    {lesson.keyPoints.map((kp, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        {kp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {lesson.concepts && lesson.concepts.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Important Concepts</h4>
                  <div className="flex flex-wrap gap-2">
                    {lesson.concepts.map((c, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {lesson.formulas && lesson.formulas.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Formulas</h4>
                  <div className="space-y-2">
                    {lesson.formulas.map((f, i) => (
                      <div key={i} className="text-sm font-mono bg-muted rounded-lg px-3 py-2">{f}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No lesson data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
