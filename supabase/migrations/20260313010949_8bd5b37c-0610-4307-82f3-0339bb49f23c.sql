
-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  college TEXT NOT NULL DEFAULT '',
  branch TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  semester TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  days_left INTEGER NOT NULL DEFAULT 0,
  youtube_links TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subjects" ON public.subjects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subjects" ON public.subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subjects" ON public.subjects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subjects" ON public.subjects FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Units table
CREATE TABLE public.units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own units" ON public.units FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.subjects WHERE subjects.id = units.subject_id AND subjects.user_id = auth.uid()));
CREATE POLICY "Users can insert own units" ON public.units FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.subjects WHERE subjects.id = units.subject_id AND subjects.user_id = auth.uid()));
CREATE POLICY "Users can update own units" ON public.units FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.subjects WHERE subjects.id = units.subject_id AND subjects.user_id = auth.uid()));
CREATE POLICY "Users can delete own units" ON public.units FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.subjects WHERE subjects.id = units.subject_id AND subjects.user_id = auth.uid()));

-- Lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'low',
  summary TEXT DEFAULT '',
  key_points TEXT[] DEFAULT '{}',
  concepts TEXT[] DEFAULT '{}',
  formulas TEXT[] DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lessons" ON public.lessons FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.units u JOIN public.subjects s ON s.id = u.subject_id
    WHERE u.id = lessons.unit_id AND s.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own lessons" ON public.lessons FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.units u JOIN public.subjects s ON s.id = u.subject_id
    WHERE u.id = lessons.unit_id AND s.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own lessons" ON public.lessons FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.units u JOIN public.subjects s ON s.id = u.subject_id
    WHERE u.id = lessons.unit_id AND s.user_id = auth.uid()
  ));

-- Resources table
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resources" ON public.resources FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.subjects WHERE subjects.id = resources.subject_id AND subjects.user_id = auth.uid()));
CREATE POLICY "Users can insert own resources" ON public.resources FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.subjects WHERE subjects.id = resources.subject_id AND subjects.user_id = auth.uid()));
CREATE POLICY "Users can delete own resources" ON public.resources FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.subjects WHERE subjects.id = resources.subject_id AND subjects.user_id = auth.uid()));

-- Storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('study-resources', 'study-resources', true);

CREATE POLICY "Authenticated users can upload resources" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'study-resources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view resources" ON storage.objects
FOR SELECT USING (bucket_id = 'study-resources');

CREATE POLICY "Users can delete own resources" ON storage.objects
FOR DELETE USING (bucket_id = 'study-resources' AND auth.uid()::text = (storage.foldername(name))[1]);
