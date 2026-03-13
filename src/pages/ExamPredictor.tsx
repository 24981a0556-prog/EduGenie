import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, ChevronDown, ChevronRight, Loader2, FileText, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PredictedQuestion, Subject, Unit } from '@/lib/types';
import { getSubjects, predictQuestions, generateCheatsheet } from '@/lib/api';
import { motion } from 'framer-motion';
import AppShell from '@/components/AppShell';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function ExamPredictor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictedQuestion[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');
  const [cheatsheet, setCheatsheet] = useState('');
  const [cheatsheetLoading, setCheatsheetLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSubjects();
      setSubjects(s);
      if (s.length === 0) { navigate('/subjects'); return; }
      const paramSubject = searchParams.get('subject');
      const paramUnit = searchParams.get('unit');
      const subjectId = paramSubject && s.find(x => x.id === paramSubject) ? paramSubject : s[0].id;
      setActiveSubjectId(subjectId);
      if (paramUnit) {
        const sub = s.find(x => x.id === subjectId);
        if (sub?.units.find(u => u.id === paramUnit)) {
          setSelectedUnitId(paramUnit);
        }
      }
      setLoadingSubjects(false);
    })();
  }, []);

  // Auto-load predictions when unit is selected
  useEffect(() => {
    if (!selectedUnitId || !activeSubjectId) return;
    const sub = subjects.find(s => s.id === activeSubjectId);
    const unit = sub?.units.find(u => u.id === selectedUnitId);
    if (!sub || !unit) return;

    setLoading(true);
    setPredictions([]);
    setExpandedIdx(null);
    setCheatsheet('');
    
    predictQuestions(
      sub.name,
      unit.name,
      unit.lessons.map(l => l.name)
    ).then(q => {
      setPredictions(q);
    }).catch(err => {
      toast.error(err.message || 'Failed to generate predictions');
    }).finally(() => {
      setLoading(false);
    });
  }, [selectedUnitId, activeSubjectId]);

  // Load cheatsheet when tab switches to cheatsheet
  useEffect(() => {
    if (activeTab !== 'cheatsheet' || !selectedUnitId || !activeSubjectId || cheatsheet) return;
    const sub = subjects.find(s => s.id === activeSubjectId);
    const unit = sub?.units.find(u => u.id === selectedUnitId);
    if (!sub || !unit) return;

    setCheatsheetLoading(true);
    generateCheatsheet(
      sub.name,
      unit.name,
      unit.lessons.map(l => l.name)
    ).then(content => {
      setCheatsheet(content);
    }).catch(err => {
      toast.error(err.message || 'Failed to generate cheat sheet');
    }).finally(() => {
      setCheatsheetLoading(false);
    });
  }, [activeTab, selectedUnitId, activeSubjectId]);

  if (loadingSubjects) return null;

  const activeSubject = subjects.find(s => s.id === activeSubjectId);
  if (!activeSubject) return null;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">AI Exam Predictor</h1>
            <p className="text-sm text-muted-foreground">Unit-wise predicted exam questions & cheat sheets</p>
          </div>
        </div>

        {/* Subject Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {subjects.map(s => (
            <Button
              key={s.id}
              variant={s.id === activeSubjectId ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setActiveSubjectId(s.id); setSelectedUnitId(null); setPredictions([]); setCheatsheet(''); }}
            >
              {s.name}
            </Button>
          ))}
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-6">
          {/* Unit List */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Units</h3>
            {activeSubject.units.map(unit => (
              <button
                key={unit.id}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                  selectedUnitId === unit.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted'
                }`}
                onClick={() => { setSelectedUnitId(unit.id); setCheatsheet(''); setActiveTab('questions'); }}
              >
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                {unit.name}
              </button>
            ))}
          </div>

          {/* Content */}
          <div>
            {!selectedUnitId && (
              <div className="glass-card rounded-xl p-12 text-center">
                <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a unit to generate predicted exam questions</p>
              </div>
            )}

            {selectedUnitId && (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="questions" className="gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Predicted Questions
                  </TabsTrigger>
                  <TabsTrigger value="cheatsheet" className="gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    Cheat Sheet
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="questions">
                  {loading && (
                    <div className="glass-card rounded-xl p-12 text-center">
                      <Loader2 className="h-10 w-10 text-primary mx-auto mb-4 animate-spin" />
                      <p className="font-display font-semibold">Analyzing syllabus & generating predictions...</p>
                      <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
                    </div>
                  )}

                  {!loading && predictions.length > 0 && (
                    <div className="space-y-3">
                      {predictions.map((p, i) => (
                        <motion.div
                          key={i}
                          className="glass-card rounded-xl overflow-hidden"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                        >
                          <button
                            className="w-full flex items-start justify-between p-5 text-left hover:bg-muted/50 transition-colors"
                            onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                          >
                            <div className="flex items-start gap-3">
                              <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary mt-0.5">
                                Q{i + 1}
                              </span>
                              <span className="font-medium text-sm">{p.question}</span>
                            </div>
                            <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 ml-3 transition-transform ${expandedIdx === i ? 'rotate-180' : ''}`} />
                          </button>
                          {expandedIdx === i && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="border-t border-border px-5 pb-5 pt-4"
                            >
                              <h4 className="text-xs font-medium text-primary uppercase tracking-wider mb-2">Exam-Ready Answer</h4>
                              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{p.answer}</div>
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {!loading && predictions.length === 0 && (
                    <div className="glass-card rounded-xl p-12 text-center">
                      <p className="text-muted-foreground">No predictions generated. Please try again.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="cheatsheet">
                  {cheatsheetLoading && (
                    <div className="glass-card rounded-xl p-12 text-center">
                      <Loader2 className="h-10 w-10 text-primary mx-auto mb-4 animate-spin" />
                      <p className="font-display font-semibold">Generating cheat sheet...</p>
                      <p className="text-sm text-muted-foreground mt-2">Creating mind map, key points & revision notes</p>
                    </div>
                  )}

                  {!cheatsheetLoading && cheatsheet && (
                    <motion.div
                      className="glass-card rounded-xl p-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{cheatsheet}</ReactMarkdown>
                      </div>
                    </motion.div>
                  )}

                  {!cheatsheetLoading && !cheatsheet && (
                    <div className="glass-card rounded-xl p-12 text-center">
                      <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Cheat sheet will load automatically</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
