import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { store } from '@/lib/store';
import { Subject, Unit, Lesson } from '@/lib/types';
import { toast } from 'sonner';
import AppShell from '@/components/AppShell';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// Simulate AI syllabus extraction
function extractSyllabus(subjectName: string): Unit[] {
  const syllabusTemplates: Record<string, Unit[]> = {
    default: [
      {
        id: generateId(), name: 'Unit 1 – Introduction',
        lessons: [
          { id: generateId(), name: 'Basic Concepts', priority: 'high', summary: 'Fundamental concepts and terminology.', keyPoints: ['Core definitions', 'Historical context', 'Applications'], concepts: ['Foundation principles'], formulas: [] },
          { id: generateId(), name: 'Overview & Scope', priority: 'medium', summary: 'Scope and boundaries of the subject.', keyPoints: ['Subject boundaries', 'Interdisciplinary connections'], concepts: ['Scope definition'], formulas: [] },
        ]
      },
      {
        id: generateId(), name: 'Unit 2 – Core Concepts',
        lessons: [
          { id: generateId(), name: 'Fundamental Theories', priority: 'high', summary: 'Key theories that form the foundation.', keyPoints: ['Primary theory', 'Secondary theory', 'Applications'], concepts: ['Theoretical framework'], formulas: [] },
          { id: generateId(), name: 'Practical Applications', priority: 'medium', summary: 'Real-world applications of core concepts.', keyPoints: ['Industry use cases', 'Problem solving'], concepts: ['Applied knowledge'], formulas: [] },
          { id: generateId(), name: 'Case Studies', priority: 'low', summary: 'Analysis of real-world examples.', keyPoints: ['Case analysis methodology'], concepts: ['Critical analysis'], formulas: [] },
        ]
      },
      {
        id: generateId(), name: 'Unit 3 – Advanced Topics',
        lessons: [
          { id: generateId(), name: 'Advanced Techniques', priority: 'high', summary: 'Advanced methods and techniques.', keyPoints: ['Optimization', 'Efficiency', 'Best practices'], concepts: ['Advanced methodology'], formulas: [] },
          { id: generateId(), name: 'Research Frontiers', priority: 'low', summary: 'Current research directions.', keyPoints: ['Emerging trends', 'Open problems'], concepts: ['Research methodology'], formulas: [] },
        ]
      },
      {
        id: generateId(), name: 'Unit 4 – Applications & Review',
        lessons: [
          { id: generateId(), name: 'Comprehensive Review', priority: 'high', summary: 'Complete review of all units.', keyPoints: ['Summary of key topics', 'Inter-unit connections'], concepts: ['Synthesis'], formulas: [] },
          { id: generateId(), name: 'Problem Solving', priority: 'medium', summary: 'Practice problems and solutions.', keyPoints: ['Problem types', 'Solution strategies'], concepts: ['Problem-solving frameworks'], formulas: [] },
        ]
      },
    ],
  };

  const osUnits: Unit[] = [
    {
      id: generateId(), name: 'Unit 1 – Process Management',
      lessons: [
        { id: generateId(), name: 'Process Concepts', priority: 'high', summary: 'Processes, PCB, process states and transitions.', keyPoints: ['Process states', 'PCB structure', 'Context switching'], concepts: ['Process lifecycle'], formulas: [] },
        { id: generateId(), name: 'CPU Scheduling', priority: 'high', summary: 'Scheduling algorithms: FCFS, SJF, RR, Priority.', keyPoints: ['FCFS', 'SJF', 'Round Robin', 'Priority scheduling'], concepts: ['Scheduling criteria', 'Gantt charts'], formulas: ['Turnaround Time = Completion - Arrival', 'Waiting Time = Turnaround - Burst'] },
        { id: generateId(), name: 'Process Synchronization', priority: 'medium', summary: 'Critical section, semaphores, monitors.', keyPoints: ['Critical section problem', 'Mutex', 'Semaphores'], concepts: ['Race conditions', 'Mutual exclusion'], formulas: [] },
      ]
    },
    {
      id: generateId(), name: 'Unit 2 – Deadlocks',
      lessons: [
        { id: generateId(), name: 'Deadlock Conditions', priority: 'high', summary: 'Four necessary conditions for deadlock.', keyPoints: ['Mutual exclusion', 'Hold and wait', 'No preemption', 'Circular wait'], concepts: ['Deadlock characterization'], formulas: [] },
        { id: generateId(), name: "Banker's Algorithm", priority: 'high', summary: 'Deadlock avoidance using resource allocation.', keyPoints: ['Safety algorithm', 'Resource request algorithm', 'Available matrix'], concepts: ['Safe state', 'Unsafe state'], formulas: ['Need = Max - Allocation'] },
        { id: generateId(), name: 'Resource Allocation Graph', priority: 'medium', summary: 'Graph-based deadlock detection.', keyPoints: ['Request edges', 'Assignment edges', 'Cycle detection'], concepts: ['RAG'], formulas: [] },
        { id: generateId(), name: 'Deadlock Prevention', priority: 'medium', summary: 'Methods to prevent deadlock occurrence.', keyPoints: ['Breaking mutual exclusion', 'Breaking hold & wait', 'Breaking circular wait'], concepts: ['Prevention strategies'], formulas: [] },
      ]
    },
    {
      id: generateId(), name: 'Unit 3 – Memory Management',
      lessons: [
        { id: generateId(), name: 'Paging', priority: 'high', summary: 'Fixed-size memory allocation using pages and frames.', keyPoints: ['Page table', 'TLB', 'Page size'], concepts: ['Logical vs Physical address'], formulas: ['Physical Address = Frame × Page Size + Offset'] },
        { id: generateId(), name: 'Virtual Memory', priority: 'high', summary: 'Demand paging and page replacement.', keyPoints: ['Demand paging', 'Page fault', 'Thrashing'], concepts: ['Virtual address space'], formulas: ['Page Fault Rate'] },
        { id: generateId(), name: 'Segmentation', priority: 'medium', summary: 'Variable-size memory allocation.', keyPoints: ['Segment table', 'Segment number + offset'], concepts: ['Logical segments'], formulas: [] },
      ]
    },
    {
      id: generateId(), name: 'Unit 4 – File Systems',
      lessons: [
        { id: generateId(), name: 'File Organization', priority: 'medium', summary: 'File attributes, operations, and directory structure.', keyPoints: ['File types', 'Access methods', 'Directory structure'], concepts: ['File abstraction'], formulas: [] },
        { id: generateId(), name: 'Disk Scheduling', priority: 'high', summary: 'Algorithms for disk I/O optimization.', keyPoints: ['FCFS', 'SSTF', 'SCAN', 'C-SCAN'], concepts: ['Seek time optimization'], formulas: ['Total Seek Distance'] },
      ]
    },
  ];

  const lower = subjectName.toLowerCase();
  if (lower.includes('operating') || lower.includes('os')) return osUnits;
  return syllabusTemplates.default;
}

export default function SubjectManager() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>(store.getSubjects());
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [daysLeft, setDaysLeft] = useState('');
  const [ytLinks, setYtLinks] = useState('');

  const handleAdd = () => {
    if (!name || !daysLeft) {
      toast.error('Subject name and days left are required');
      return;
    }
    const units = extractSyllabus(name);
    const subject: Subject = {
      id: generateId(),
      name,
      daysLeft: parseInt(daysLeft),
      units,
      youtubeLinks: ytLinks.split('\n').filter(Boolean),
      createdAt: new Date().toISOString(),
    };
    store.addSubject(subject);
    setSubjects(store.getSubjects());
    setName('');
    setDaysLeft('');
    setYtLinks('');
    setOpen(false);
    toast.success(`${subject.name} added with ${units.length} units extracted!`);
  };

  const handleDelete = (id: string) => {
    store.deleteSubject(id);
    setSubjects(store.getSubjects());
    toast.success('Subject removed');
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold">Your Subjects</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your exam subjects</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Subject</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Subject</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Subject Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Operating Systems" className="mt-1.5" />
                </div>
                <div>
                  <Label>Days Left For Exam</Label>
                  <Input type="number" value={daysLeft} onChange={e => setDaysLeft(e.target.value)} placeholder="e.g. 14" className="mt-1.5" />
                </div>
                <div>
                  <Label>YouTube Links (one per line, optional)</Label>
                  <textarea
                    value={ytLinks} onChange={e => setYtLinks(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <p className="text-xs text-muted-foreground">AI will extract units and topics from the subject name. PDF upload coming soon.</p>
                <Button onClick={handleAdd} className="w-full">Add Subject</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {subjects.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">No subjects yet</h3>
            <p className="text-muted-foreground text-sm mb-6">Add your first subject to get started with AI-powered exam preparation.</p>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Subject</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {subjects.map(s => (
              <div key={s.id} className="glass-card rounded-xl p-5 flex items-center justify-between group hover:glow-border transition-shadow">
                <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => navigate(`/dashboard?subject=${s.id}`)}>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">{s.name}</h3>
                    <p className="text-xs text-muted-foreground">{s.units.length} units · {s.daysLeft} days left</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard?subject=${s.id}`)}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
