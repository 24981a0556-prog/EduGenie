import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Trash2, ArrowRight, FileText, Upload, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Subject, Resource } from '@/lib/types';
import { getSubjects, addSubject, deleteSubject, extractSyllabus, getResources, uploadResource, deleteResource } from '@/lib/api';
import { toast } from 'sonner';
import AppShell from '@/components/AppShell';

export default function SubjectManager() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [daysLeft, setDaysLeft] = useState('');
  const [ytLinks, setYtLinks] = useState('');
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [resourceFiles, setResourceFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [uploading, setUploading] = useState(false);
  const resourceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    const s = await getSubjects();
    setSubjects(s);
  };

  const loadResources = async (subjectId: string) => {
    const r = await getResources(subjectId);
    setResources(r);
  };

  const handleAdd = async () => {
    if (!name || !daysLeft) {
      toast.error('Subject name and days left are required');
      return;
    }
    setLoading(true);
    try {
      const units = extractSyllabus(name);
      const subjectId = await addSubject(name, parseInt(daysLeft), ytLinks.split('\n').filter(Boolean), units);
      
      // Upload syllabus PDF if provided
      if (syllabusFile) {
        await uploadResource(subjectId, syllabusFile);
      }
      // Upload resource files
      for (const file of resourceFiles) {
        await uploadResource(subjectId, file);
      }

      await loadSubjects();
      setName(''); setDaysLeft(''); setYtLinks('');
      setSyllabusFile(null); setResourceFiles([]);
      setOpen(false);
      toast.success(`${name} added with ${units.length} units!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add subject');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSubject(id);
      await loadSubjects();
      if (selectedSubject === id) { setSelectedSubject(null); setResources([]); }
      toast.success('Subject removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleUploadMore = async (subjectId: string) => {
    if (!resourceInputRef.current?.files?.length) return;
    setUploading(true);
    try {
      const files = Array.from(resourceInputRef.current.files);
      for (const file of files) {
        await uploadResource(subjectId, file);
      }
      await loadResources(subjectId);
      toast.success('Resources uploaded!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (resourceInputRef.current) resourceInputRef.current.value = '';
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      await deleteResource(resourceId);
      setResources(prev => prev.filter(r => r.id !== resourceId));
      toast.success('Resource deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete resource');
    }
  };

  const toggleResources = (subjectId: string) => {
    if (selectedSubject === subjectId) {
      setSelectedSubject(null);
      setResources([]);
    } else {
      setSelectedSubject(subjectId);
      loadResources(subjectId);
    }
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
            <DialogContent className="max-h-[85vh] overflow-y-auto">
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
                  <Label>Syllabus PDF (required)</Label>
                  <div className="mt-1.5 border border-input rounded-md p-3">
                    <input
                      type="file" accept=".pdf"
                      onChange={e => setSyllabusFile(e.target.files?.[0] || null)}
                      className="text-sm w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:font-medium file:cursor-pointer"
                    />
                    {syllabusFile && <p className="text-xs text-muted-foreground mt-1">{syllabusFile.name}</p>}
                  </div>
                </div>
                <div>
                  <Label>Resource PDFs (notes, previous papers, etc.)</Label>
                  <div className="mt-1.5 border border-input rounded-md p-3">
                    <input
                      type="file" accept=".pdf" multiple
                      onChange={e => setResourceFiles(Array.from(e.target.files || []))}
                      className="text-sm w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:font-medium file:cursor-pointer"
                    />
                    {resourceFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {resourceFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3" /> {f.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label>YouTube Links (one per line, optional)</Label>
                  <textarea
                    value={ytLinks} onChange={e => setYtLinks(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <p className="text-xs text-muted-foreground">AI will extract units and topics from the subject name.</p>
                <Button onClick={handleAdd} className="w-full" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Subject'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {subjects.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">No subjects yet</h3>
            <p className="text-muted-foreground text-sm mb-6">Add your first subject to get started.</p>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Subject</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {subjects.map(s => (
              <div key={s.id} className="glass-card rounded-xl overflow-hidden">
                <div className="p-5 flex items-center justify-between group">
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
                    <Button variant="ghost" size="sm" onClick={() => toggleResources(s.id)}>
                      <FileText className="h-4 w-4 mr-1" /> Resources
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard?subject=${s.id}`)}>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {selectedSubject === s.id && (
                  <div className="border-t border-border px-5 pb-4 pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium">Uploaded Resources</h4>
                      <div className="flex items-center gap-2">
                        <input ref={resourceInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={() => handleUploadMore(s.id)} />
                        <Button variant="outline" size="sm" onClick={() => resourceInputRef.current?.click()} disabled={uploading}>
                          <Upload className="h-3.5 w-3.5 mr-1" /> {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                      </div>
                    </div>
                    {resources.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No resources uploaded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {resources.map(r => (
                          <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="text-sm">{r.file_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" asChild>
                                <a href={r.file_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open
                                </a>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteResource(r.id)}>
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
