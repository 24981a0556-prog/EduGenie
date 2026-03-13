import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Flame, AlertTriangle, Clock, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Subject } from '@/lib/types';
import { getSubjects } from '@/lib/api';
import AppShell from '@/components/AppShell';
import { motion, AnimatePresence } from 'framer-motion';

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === 'high') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
      <Flame className="h-3 w-3" /> High Probability
    </span>
  );
  if (priority === 'medium') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
      <AlertTriangle className="h-3 w-3" /> Medium Probability
    </span>
  );
  return null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState('');
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const s = await getSubjects();
      setSubjects(s);
      if (s.length === 0) { navigate('/subjects'); return; }
      const paramId = searchParams.get('subject');
      setActiveSubjectId(paramId && s.find(x => x.id === paramId) ? paramId : s[0].id);
      setLoading(false);
    })();
  }, []);

  const activeSubject = subjects.find(s => s.id === activeSubjectId);

  if (loading || !activeSubject) return null;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Subject Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {subjects.map(s => (
            <Button
              key={s.id}
              variant={s.id === activeSubjectId ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setActiveSubjectId(s.id); setExpandedUnit(null); }}
            >
              {s.name}
            </Button>
          ))}
        </div>

        {/* Subject Info */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">{activeSubject.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <Clock className="h-3.5 w-3.5" /> {activeSubject.daysLeft} days until exam · {activeSubject.units.length} units
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/exam-predictor?subject=${activeSubjectId}`)}>
            <Sparkles className="h-4 w-4 mr-1.5" /> Exam Predictor
          </Button>
        </div>

        {/* Units */}
        <div className="space-y-3">
          {activeSubject.units.map((unit) => (
            <div key={unit.id} className="glass-card rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedUnit(expandedUnit === unit.id ? null : unit.id)}
              >
                <h3 className="font-display font-semibold">{unit.name}</h3>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedUnit === unit.id ? 'rotate-90' : ''}`} />
              </button>
              <AnimatePresence>
                {expandedUnit === unit.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border px-5 pb-4 pt-2">
                      <div className="space-y-2 mb-3">
                        {unit.lessons.map(lesson => (
                          <div key={lesson.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-primary/40" />
                              <span className="text-sm font-medium">{lesson.name}</span>
                              <PriorityBadge priority={lesson.priority} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/focus?subject=${activeSubjectId}&unit=${unit.id}`)}
                      >
                        <Play className="h-3.5 w-3.5 mr-1" /> Start Focus Session
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
