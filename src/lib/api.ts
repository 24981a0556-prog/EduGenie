import { supabase } from '@/integrations/supabase/client';
import { Subject, Unit, Lesson, Resource, UserProfile, PredictedQuestion } from './types';

// ---- Auth helpers ----
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ---- Profile ----
export async function getProfile(): Promise<UserProfile | null> {
  const session = await getSession();
  if (!session) return null;
  const { data } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
  if (!data) return null;
  return { name: data.name, college: data.college, branch: data.branch, year: data.year, semester: data.semester };
}

export async function saveProfile(profile: UserProfile) {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');
  const { error } = await supabase.from('profiles').update({
    name: profile.name, college: profile.college, branch: profile.branch,
    year: profile.year, semester: profile.semester,
  }).eq('user_id', session.user.id);
  if (error) throw error;
}

// ---- Subjects with units & lessons ----
export async function getSubjects(): Promise<Subject[]> {
  const session = await getSession();
  if (!session) return [];
  
  const { data: subjects } = await supabase.from('subjects').select('*').eq('user_id', session.user.id).order('created_at');
  if (!subjects) return [];

  const subjectIds = subjects.map(s => s.id);
  if (subjectIds.length === 0) return [];

  const { data: units } = await supabase.from('units').select('*').in('subject_id', subjectIds).order('sort_order');
  const unitIds = (units || []).map(u => u.id);
  
  const { data: lessons } = unitIds.length > 0
    ? await supabase.from('lessons').select('*').in('unit_id', unitIds).order('sort_order')
    : { data: [] };

  return subjects.map(s => ({
    id: s.id,
    name: s.name,
    daysLeft: s.days_left,
    youtubeLinks: s.youtube_links || [],
    createdAt: s.created_at,
    units: (units || []).filter(u => u.subject_id === s.id).map(u => ({
      id: u.id,
      name: u.name,
      sort_order: u.sort_order,
      subject_id: u.subject_id,
      lessons: (lessons || []).filter(l => l.unit_id === u.id).map(l => ({
        id: l.id,
        name: l.name,
        priority: l.priority,
        summary: l.summary || '',
        key_points: l.key_points || [],
        concepts: l.concepts || [],
        formulas: l.formulas || [],
        sort_order: l.sort_order,
        unit_id: l.unit_id,
      })),
    })),
  }));
}

export async function addSubject(name: string, daysLeft: number, ytLinks: string[], extractedUnits: { name: string; lessons: Omit<Lesson, 'id'>[] }[]) {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');

  const { data: subject, error } = await supabase.from('subjects').insert({
    user_id: session.user.id, name, days_left: daysLeft, youtube_links: ytLinks,
  }).select().single();
  if (error || !subject) throw error || new Error('Failed to create subject');

  for (let i = 0; i < extractedUnits.length; i++) {
    const eu = extractedUnits[i];
    const { data: unit, error: uErr } = await supabase.from('units').insert({
      subject_id: subject.id, name: eu.name, sort_order: i,
    }).select().single();
    if (uErr || !unit) continue;

    for (let j = 0; j < eu.lessons.length; j++) {
      const el = eu.lessons[j];
      await supabase.from('lessons').insert({
        unit_id: unit.id, name: el.name, priority: el.priority || 'low',
        summary: el.summary || '', key_points: el.key_points || [],
        concepts: el.concepts || [], formulas: el.formulas || [],
        sort_order: j,
      });
    }
  }

  return subject.id;
}

export async function deleteSubject(id: string) {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) throw error;
}

// ---- Resources ----
export async function getResources(subjectId: string): Promise<Resource[]> {
  const { data } = await supabase.from('resources').select('*').eq('subject_id', subjectId).order('created_at');
  return (data || []).map(r => ({
    id: r.id, subject_id: r.subject_id, file_name: r.file_name, file_url: r.file_url, created_at: r.created_at,
  }));
}

export async function uploadResource(subjectId: string, file: File): Promise<Resource> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');
  
  const path = `${session.user.id}/${subjectId}/${Date.now()}_${file.name}`;
  const { error: uploadErr } = await supabase.storage.from('study-resources').upload(path, file);
  if (uploadErr) throw uploadErr;

  const { data: urlData } = supabase.storage.from('study-resources').getPublicUrl(path);
  
  const { data, error } = await supabase.from('resources').insert({
    subject_id: subjectId, file_name: file.name, file_url: urlData.publicUrl,
  }).select().single();
  if (error || !data) throw error || new Error('Failed to save resource');
  
  return { id: data.id, subject_id: data.subject_id, file_name: data.file_name, file_url: data.file_url, created_at: data.created_at };
}

export async function deleteResource(id: string) {
  const { error } = await supabase.from('resources').delete().eq('id', id);
  if (error) throw error;
}

// ---- AI Chat (streaming) ----
export async function streamChat({
  messages,
  context,
  onDelta,
  onDone,
}: {
  messages: { role: string; content: string }[];
  context: { subject: string; unit: string; topics: string[] };
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, context }),
  });

  if (!resp.ok || !resp.body) {
    if (resp.status === 429) throw new Error("Rate limit exceeded. Please wait a moment.");
    if (resp.status === 402) throw new Error("AI usage limit reached. Please add credits.");
    throw new Error("Failed to start chat stream");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Flush remaining
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

// ---- Predict questions ----
export async function predictQuestions(subject: string, unit: string, topics: string[]): Promise<PredictedQuestion[]> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/predict-questions`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ subject, unit, topics }),
  });
  if (!resp.ok) {
    if (resp.status === 429) throw new Error("Rate limit exceeded.");
    if (resp.status === 402) throw new Error("AI usage limit reached.");
    throw new Error("Failed to predict questions");
  }
  const data = await resp.json();
  return data.questions || [];
}

// ---- Generate Unit Summary (streaming) ----
export async function streamUnitSummary({
  subject,
  unit,
  topics,
  onDelta,
  onDone,
}: {
  subject: string;
  unit: string;
  topics: { name: string; summary?: string; key_points?: string[]; concepts?: string[]; formulas?: string[] }[];
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-summary`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ subject, unit, topics }),
  });

  if (!resp.ok || !resp.body) {
    if (resp.status === 429) throw new Error("Rate limit exceeded. Please wait a moment.");
    if (resp.status === 402) throw new Error("AI usage limit reached. Please add credits.");
    throw new Error("Failed to generate summary");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/predict-questions`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ subject, unit, topics }),
  });
  if (!resp.ok) {
    if (resp.status === 429) throw new Error("Rate limit exceeded.");
    if (resp.status === 402) throw new Error("AI usage limit reached.");
    throw new Error("Failed to predict questions");
  }
  const data = await resp.json();
  return data.questions || [];

// ---- Syllabus extraction (simulated) ----

export function extractSyllabus(subjectName: string): { name: string; lessons: Omit<Lesson, 'id'>[] }[] {
  const lower = subjectName.toLowerCase();
  if (lower.includes('operating') || lower.includes('os')) {
    return [
      { name: 'Unit 1 – Process Management', lessons: [
        { name: 'Process Concepts', priority: 'high', summary: 'Processes, PCB, process states and transitions.', key_points: ['Process states', 'PCB structure', 'Context switching'], concepts: ['Process lifecycle'], formulas: [] },
        { name: 'CPU Scheduling', priority: 'high', summary: 'Scheduling algorithms: FCFS, SJF, RR, Priority.', key_points: ['FCFS', 'SJF', 'Round Robin', 'Priority scheduling'], concepts: ['Scheduling criteria', 'Gantt charts'], formulas: ['Turnaround Time = Completion - Arrival', 'Waiting Time = Turnaround - Burst'] },
        { name: 'Process Synchronization', priority: 'medium', summary: 'Critical section, semaphores, monitors.', key_points: ['Critical section problem', 'Mutex', 'Semaphores'], concepts: ['Race conditions', 'Mutual exclusion'], formulas: [] },
      ]},
      { name: 'Unit 2 – Deadlocks', lessons: [
        { name: 'Deadlock Conditions', priority: 'high', summary: 'Four necessary conditions for deadlock.', key_points: ['Mutual exclusion', 'Hold and wait', 'No preemption', 'Circular wait'], concepts: ['Deadlock characterization'], formulas: [] },
        { name: "Banker's Algorithm", priority: 'high', summary: 'Deadlock avoidance using resource allocation.', key_points: ['Safety algorithm', 'Resource request algorithm', 'Available matrix'], concepts: ['Safe state', 'Unsafe state'], formulas: ['Need = Max - Allocation'] },
        { name: 'Resource Allocation Graph', priority: 'medium', summary: 'Graph-based deadlock detection.', key_points: ['Request edges', 'Assignment edges', 'Cycle detection'], concepts: ['RAG'], formulas: [] },
        { name: 'Deadlock Prevention', priority: 'medium', summary: 'Methods to prevent deadlock occurrence.', key_points: ['Breaking mutual exclusion', 'Breaking hold & wait', 'Breaking circular wait'], concepts: ['Prevention strategies'], formulas: [] },
      ]},
      { name: 'Unit 3 – Memory Management', lessons: [
        { name: 'Paging', priority: 'high', summary: 'Fixed-size memory allocation using pages and frames.', key_points: ['Page table', 'TLB', 'Page size'], concepts: ['Logical vs Physical address'], formulas: ['Physical Address = Frame × Page Size + Offset'] },
        { name: 'Virtual Memory', priority: 'high', summary: 'Demand paging and page replacement.', key_points: ['Demand paging', 'Page fault', 'Thrashing'], concepts: ['Virtual address space'], formulas: ['Page Fault Rate'] },
        { name: 'Segmentation', priority: 'medium', summary: 'Variable-size memory allocation.', key_points: ['Segment table', 'Segment number + offset'], concepts: ['Logical segments'], formulas: [] },
      ]},
      { name: 'Unit 4 – File Systems', lessons: [
        { name: 'File Organization', priority: 'medium', summary: 'File attributes, operations, and directory structure.', key_points: ['File types', 'Access methods', 'Directory structure'], concepts: ['File abstraction'], formulas: [] },
        { name: 'Disk Scheduling', priority: 'high', summary: 'Algorithms for disk I/O optimization.', key_points: ['FCFS', 'SSTF', 'SCAN', 'C-SCAN'], concepts: ['Seek time optimization'], formulas: ['Total Seek Distance'] },
      ]},
    ];
  }
  return [
    { name: 'Unit 1 – Introduction', lessons: [
      { name: 'Basic Concepts', priority: 'high', summary: 'Fundamental concepts and terminology.', key_points: ['Core definitions', 'Historical context', 'Applications'], concepts: ['Foundation principles'], formulas: [] },
      { name: 'Overview & Scope', priority: 'medium', summary: 'Scope and boundaries of the subject.', key_points: ['Subject boundaries', 'Interdisciplinary connections'], concepts: ['Scope definition'], formulas: [] },
    ]},
    { name: 'Unit 2 – Core Concepts', lessons: [
      { name: 'Fundamental Theories', priority: 'high', summary: 'Key theories that form the foundation.', key_points: ['Primary theory', 'Secondary theory', 'Applications'], concepts: ['Theoretical framework'], formulas: [] },
      { name: 'Practical Applications', priority: 'medium', summary: 'Real-world applications of core concepts.', key_points: ['Industry use cases', 'Problem solving'], concepts: ['Applied knowledge'], formulas: [] },
      { name: 'Case Studies', priority: 'low', summary: 'Analysis of real-world examples.', key_points: ['Case analysis methodology'], concepts: ['Critical analysis'], formulas: [] },
    ]},
    { name: 'Unit 3 – Advanced Topics', lessons: [
      { name: 'Advanced Techniques', priority: 'high', summary: 'Advanced methods and techniques.', key_points: ['Optimization', 'Efficiency', 'Best practices'], concepts: ['Advanced methodology'], formulas: [] },
      { name: 'Research Frontiers', priority: 'low', summary: 'Current research directions.', key_points: ['Emerging trends', 'Open problems'], concepts: ['Research methodology'], formulas: [] },
    ]},
    { name: 'Unit 4 – Applications & Review', lessons: [
      { name: 'Comprehensive Review', priority: 'high', summary: 'Complete review of all units.', key_points: ['Summary of key topics', 'Inter-unit connections'], concepts: ['Synthesis'], formulas: [] },
      { name: 'Problem Solving', priority: 'medium', summary: 'Practice problems and solutions.', key_points: ['Problem types', 'Solution strategies'], concepts: ['Problem-solving frameworks'], formulas: [] },
    ]},
  ];
}
