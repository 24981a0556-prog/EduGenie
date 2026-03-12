import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { store } from '@/lib/store';
import { toast } from 'sonner';

const branches = ['CSE', 'CSM', 'ECE', 'EEE', 'Civil', 'Mechanical', 'IT', 'Other'];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !college || !branch || !year || !semester) {
      toast.error('Please fill in all fields');
      return;
    }
    store.setProfile({ name, college, branch, year, semester });
    toast.success('Profile saved!');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold mb-2">Set Up Your Profile</h1>
          <p className="text-muted-foreground">Tell us about yourself</p>
        </div>
        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="college">College</Label>
            <Input id="college" value={college} onChange={e => setCollege(e.target.value)} placeholder="Your college" className="mt-1.5" />
          </div>
          <div>
            <Label>Branch</Label>
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>
                {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  {['1', '2', '3', '4'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="semester">Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Sem" /></SelectTrigger>
                <SelectContent>
                  {['1', '2', '3', '4', '5', '6', '7', '8'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full">Save & Continue</Button>
        </form>
      </div>
    </div>
  );
}
