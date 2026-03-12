import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Brain, Target, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: BookOpen, title: 'Syllabus Intelligence', desc: 'AI extracts units, topics & subtopics from your syllabus PDF.' },
  { icon: Target, title: 'Focus Study Sessions', desc: 'Timed study sessions with AI doubt solver and lesson summaries.' },
  { icon: Brain, title: 'AI Doubt Solver', desc: 'Ask study questions and get instant, focused answers.' },
  { icon: Zap, title: 'AI Exam Predictor', desc: 'Predict likely exam questions with exam-ready answers.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <span className="font-display text-xl font-bold gradient-text">EduGenie</span>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')}>Log in</Button>
            <Button onClick={() => navigate('/signup')}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container py-24 md:py-32 text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-8">
            <Zap className="h-3.5 w-3.5" /> AI-Powered Exam Prep
          </div>
        </motion.div>
        <motion.h1
          className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.1]"
          variants={fadeUp} custom={1} initial="hidden" animate="visible"
        >
          Your AI Exam Preparation{' '}
          <span className="gradient-text">Assistant</span>
        </motion.h1>
        <motion.p
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          variants={fadeUp} custom={2} initial="hidden" animate="visible"
        >
          Upload your syllabus → Discover priority topics → Focus on what matters → Predict exam questions.
        </motion.p>
        <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible" className="mt-10">
          <Button size="lg" className="text-base px-8 h-12" onClick={() => navigate('/signup')}>
            Start Preparing <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </section>

      {/* Problem / Solution */}
      <section className="container py-20">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div
            className="glass-card rounded-xl p-8"
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          >
            <h3 className="font-display text-xl font-semibold text-destructive mb-3">The Problem</h3>
            <p className="text-muted-foreground">Students waste hours searching scattered resources before exams, with no clear sense of what to prioritize.</p>
          </motion.div>
          <motion.div
            className="glass-card rounded-xl p-8 glow-border"
            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          >
            <h3 className="font-display text-xl font-semibold text-primary mb-3">The Solution</h3>
            <p className="text-muted-foreground">EduGenie organizes syllabus topics, highlights priority areas, and predicts likely exam questions – all powered by AI.</p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-14">
          Everything you need to <span className="gradient-text">ace your exams</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="glass-card rounded-xl p-6 hover:glow-border transition-shadow"
              variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h4 className="font-display font-semibold mb-2">{f.title}</h4>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="container py-20 text-center">
        <div className="glass-card glow-border rounded-2xl p-12 max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold mb-4">Ready to study smarter?</h2>
          <p className="text-muted-foreground mb-8">Join EduGenie and start preparing for your exams with AI-powered intelligence.</p>
          <Button size="lg" className="px-8 h-12" onClick={() => navigate('/signup')}>
            Start Preparing <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © 2026 EduGenie. Built for students, by students.
      </footer>
    </div>
  );
}
