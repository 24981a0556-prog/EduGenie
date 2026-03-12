import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, ChevronDown, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PredictedQuestion } from '@/lib/types';
import { store } from '@/lib/store';
import { motion } from 'framer-motion';
import AppShell from '@/components/AppShell';

function generatePredictions(lessonName: string, subjectName: string): PredictedQuestion[] {
  const lower = lessonName.toLowerCase();

  if (lower.includes('deadlock conditions') || lower.includes('deadlock')) {
    return [
      { question: 'Explain the four necessary conditions for deadlock.', answer: '1. Mutual Exclusion – At least one resource must be held in a non-sharable mode.\n2. Hold and Wait – A process holding at least one resource is waiting to acquire additional resources.\n3. No Preemption – Resources cannot be forcibly taken from a process.\n4. Circular Wait – A set of processes {P0, P1, ..., Pn} must exist such that P0 waits for P1, P1 waits for P2, ..., Pn waits for P0.' },
      { question: "Explain Banker's Algorithm with an example.", answer: "Banker's Algorithm is a deadlock avoidance algorithm. It checks whether granting a resource request would leave the system in a safe state.\n\nKey matrices: Available, Max, Allocation, Need (Need = Max - Allocation).\n\nSafety Algorithm: Find a process whose Need ≤ Available, allocate, release its resources, repeat. If all processes can finish, the state is safe." },
      { question: 'Difference between deadlock prevention and deadlock avoidance.', answer: 'Prevention: Ensures at least one of the four necessary conditions cannot hold. More restrictive, may lead to low resource utilization.\n\nAvoidance: Uses algorithms (like Banker\'s) to dynamically check if granting a request leads to a safe state. More flexible but requires advance information about resource needs.' },
      { question: 'What is a Resource Allocation Graph? How is it used to detect deadlock?', answer: 'A Resource Allocation Graph (RAG) represents processes and resources as nodes with request and assignment edges. If the graph contains a cycle, deadlock may exist. For single-instance resources, a cycle implies deadlock. For multi-instance resources, a cycle is necessary but not sufficient.' },
    ];
  }

  // Generic predictions
  return [
    { question: `Explain the key concepts of ${lessonName}.`, answer: `${lessonName} involves understanding the fundamental principles that govern this area. Key aspects include the core definitions, primary mechanisms, and their practical applications in problem-solving scenarios.` },
    { question: `What are the advantages and disadvantages of ${lessonName}?`, answer: `Advantages: Improved efficiency, better resource utilization, systematic approach.\nDisadvantages: Increased complexity, potential overhead, implementation challenges in certain scenarios.` },
    { question: `Compare and contrast the different approaches in ${lessonName}.`, answer: `Different approaches vary in terms of complexity, performance, and applicability. The optimal choice depends on the specific use case, constraints, and performance requirements of the system.` },
    { question: `Solve a numerical problem related to ${lessonName}.`, answer: `Step 1: Identify the given parameters.\nStep 2: Apply the relevant formula or algorithm.\nStep 3: Calculate intermediate results.\nStep 4: Verify the final answer against expected constraints.` },
  ];
}

export default function ExamPredictor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const subjectName = searchParams.get('subject') || '';
  const lessonName = decodeURIComponent(searchParams.get('lesson') || '');
  const [predictions, setPredictions] = useState<PredictedQuestion[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPredictions(generatePredictions(lessonName, subjectName));
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [lessonName, subjectName]);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto py-10 px-4">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Dashboard
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">AI Exam Predictor</h1>
            <p className="text-sm text-muted-foreground">{lessonName} · {subjectName}</p>
          </div>
        </div>

        {loading ? (
          <div className="glass-card rounded-xl p-12 text-center mt-8">
            <Sparkles className="h-10 w-10 text-primary mx-auto mb-4 animate-pulse-glow" />
            <p className="font-display font-semibold">Analyzing syllabus & previous papers...</p>
            <p className="text-sm text-muted-foreground mt-2">Generating predicted exam questions</p>
          </div>
        ) : (
          <div className="space-y-3 mt-8">
            {predictions.map((p, i) => (
              <motion.div
                key={i}
                className="glass-card rounded-xl overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
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
      </div>
    </AppShell>
  );
}
