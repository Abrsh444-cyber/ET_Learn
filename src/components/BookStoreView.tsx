import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Search, Download, Sparkles, AlertCircle, Play, FileText, Bot, Compass, CheckCircle, ChevronDown, Award, RefreshCw 
} from 'lucide-react';
import { StudentProfile } from '../types';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { submitClaudeChat } from '../utils/ai';

interface BookStoreViewProps {
  profile: StudentProfile;
  apiKey: string;
  language: 'en' | 'am';
  onNavigate: (page: string) => void;
  onStudyAction: () => void;
}

interface ModuleResource {
  id: string;
  title: string;
  subject: string;
  grade: string;
  chapters: string[];
  pages: number;
  description: string;
  languageSupport: 'English Only' | 'Bilingual';
  proRequired: boolean;
}

const PREBUILT_MODULES: ModuleResource[] = [
  // --- GRADE 12 ---
  {
    id: 'g12_math',
    title: 'Grade 12 Mathematics Ultimate Curriculum Module',
    subject: 'Mathematics',
    grade: 'Grade 12',
    chapters: ['Chapter 1: Sequences and Series', 'Chapter 2: Limits and Continuity', 'Chapter 3: Introduction to Calculus', 'Chapter 4: Vectors and Analytical Geometry'],
    pages: 142,
    description: 'Comprehensive Ministry Exam prep module covering differential calculus, limits, sequence notation, and solid geometry calculations with Amharic translations.',
    languageSupport: 'Bilingual',
    proRequired: true,
  },
  {
    id: 'g12_english',
    title: 'Grade 12 Communicative English Matric Workbook',
    subject: 'English',
    grade: 'Grade 12',
    chapters: ['Chapter 1: Tense & Aspect Pairing', 'Chapter 2: Relative Clauses & Passive Voice', 'Chapter 3: Direct vs Indirect Speech', 'Chapter 4: Vocabulary Context Clues'],
    pages: 105,
    description: 'Specially structured to help high school students excel in national standardized English layouts, active-passive voice transitions, and comprehension skills.',
    languageSupport: 'Bilingual',
    proRequired: false,
  },
  {
    id: 'g12_physics',
    title: 'Grade 12 Physics Electromagnetism & Quantum Guide',
    subject: 'Physics',
    grade: 'Grade 12',
    chapters: ['Chapter 1: Particle Dynamics', 'Chapter 2: Magnetic Fields & Inductance', 'Chapter 3: AC Circuits', 'Chapter 4: Atomic & Quantum Physics Theory'],
    pages: 120,
    description: 'Advanced matric revision guide summarizing magnetic flux equations, transformers, line spectra, photoelectric effect, and radioactive half-lives.',
    languageSupport: 'Bilingual',
    proRequired: true,
  },
  {
    id: 'g12_chemistry',
    title: 'Grade 12 Chemistry Organic & Electrochemistry Companion',
    subject: 'Chemistry',
    grade: 'Grade 12',
    chapters: ['Chapter 1: Solutions and Colloids', 'Chapter 2: Acid-Base Equilibria', 'Chapter 3: Thermodynamics & Electrochemistry', 'Chapter 4: Nomenclature of Organic Reactants'],
    pages: 135,
    description: 'Detailed study on buffer actions, pH indicators, Lewis theories, galvanic cells, and standard IUPAC nomenclature schemes.',
    languageSupport: 'Bilingual',
    proRequired: true,
  },
  {
    id: 'g12_biology',
    title: 'Grade 12 Biology Genetics, Evolution & Ecology Module',
    subject: 'Biology',
    grade: 'Grade 12',
    chapters: ['Chapter 1: Cell Biology and Macromolecules', 'Chapter 2: Mendelian Inheritance & DNA', 'Chapter 3: Theories of Evolution', 'Chapter 4: Ecological Succession & Conservation'],
    pages: 115,
    description: 'Targeted revision for national entrance exam genetics calculations, population genetics rules, and environmental issues facing Ethiopia.',
    languageSupport: 'Bilingual',
    proRequired: false,
  },
  {
    id: 'g12_aptitude',
    title: 'Grade 12 Analytical and Quantitative Aptitude Handbook',
    subject: 'Aptitude',
    grade: 'Grade 12',
    chapters: ['Chapter 1: Verbal Analogies & Sentence Logic', 'Chapter 2: Numerical Series & Word Problems', 'Chapter 3: Spatial and Non-Verbal Reasoning', 'Chapter 4: Logic Gates & Syllogism Analysis'],
    pages: 160,
    description: 'Specially curated reasoning builder focusing on typical math aptitude patterns, visual sequences, and critical thinking matrices for entrance exams.',
    languageSupport: 'Bilingual',
    proRequired: true,
  },

  // --- UNIVERSITY ---
  {
    id: 'uni_math',
    title: 'Freshman Mathematics for Social & Natural Sciences (Math 1011)',
    subject: 'Mathematics',
    grade: 'University',
    chapters: ['Chapter 1: Propositional Logic and Set Theory', 'Chapter 2: The Real & Complex Number Systems', 'Chapter 3: Analytical Geometry & Conic Sections', 'Chapter 4: Exponential and Hyperbolic Functions'],
    pages: 195,
    description: 'Standard textbook helper matching Ethiopian public universities curriculum. Includes truth tables, complex algebra, and functions conversion guidelines with AI step solver.',
    languageSupport: 'English Only',
    proRequired: true,
  },
  {
    id: 'uni_applied_math',
    title: 'Applied Calculus I & II Engineering Courseware (Math 1012)',
    subject: 'Applied Math',
    grade: 'University',
    chapters: ['Chapter 1: Techniques of Advanced Integration', 'Chapter 2: Sequences & Infinite Series Tests', 'Chapter 3: Vectors and Partial Derivatives', 'Chapter 4: First Order Linear Differential Equations'],
    pages: 240,
    description: 'Advanced applied engineering mathematical formulas. Features trigonometric substitutions, Taylor series, and volume calculations via double integrals.',
    languageSupport: 'English Only',
    proRequired: true,
  },
  {
    id: 'uni_english',
    title: 'Communicative English Skills I (FLEn 1011)',
    subject: 'English',
    grade: 'University',
    chapters: ['Chapter 1: Active Reading and Note-Taking', 'Chapter 2: Advanced Cohesive Paragraph Building', 'Chapter 3: Academic Voice, Modals and Concord', 'Chapter 4: Public Representation Speaking Clues'],
    pages: 98,
    description: 'Core freshman curriculum guidebook to excel in university-level comprehension, syntactic styles, and academic arguments.',
    languageSupport: 'English Only',
    proRequired: false,
  },
  {
    id: 'uni_english_2',
    title: 'Writing Skills II Advanced Freshman English (FLEn 1012)',
    subject: 'English Skill 2',
    grade: 'University',
    chapters: ['Chapter 1: Essay Genres and Rhetorical Modes', 'Chapter 2: Mechanics of Academic Citations & APA', 'Chapter 3: Professional Correspondence & Letters', 'Chapter 4: Formulating Business & Research Proposals'],
    pages: 110,
    description: 'Focuses on peer essays editing, bibliography formatting, and writing logical, structured reports as a university scholar.',
    languageSupport: 'English Only',
    proRequired: true,
  },
  {
    id: 'uni_physics',
    title: 'General Physics Mechanics, Waves & Optics (Phys 1011)',
    subject: 'Physics',
    grade: 'University',
    chapters: ['Chapter 1: Kinematics & Work-Energy Theorems', 'Chapter 2: Oscillations and Wave Harmonics', 'Chapter 3: Laws of Thermodynamics & Heat', 'Chapter 4: Geometric Optics and Lenses Theory'],
    pages: 215,
    description: 'Rigorous freshman guide centered on physical concepts: work-kinetic calculations, harmonic pendulum frequencies, and ray tracing.',
    languageSupport: 'English Only',
    proRequired: true,
  },
  {
    id: 'uni_chemistry',
    title: 'General Chemistry Atomic Structure & Equilibria (Chem 1011)',
    subject: 'Chemistry',
    grade: 'University',
    chapters: ['Chapter 1: Quantum Chemistry & Atomic Periodicity', 'Chapter 2: Chemical Bonding & VSEPR Models', 'Chapter 3: Properties of States & Solutions', 'Chapter 4: Chemical Kinetics and Rate Laws'],
    pages: 220,
    description: 'University level molecular orbital theory, orbital hybridization, boiling point elevations, and activation energy calculations with AI solver tutorials.',
    languageSupport: 'English Only',
    proRequired: true,
  },
  {
    id: 'uni_biology',
    title: 'Freshman General Biology and Microbiology (Biol 1011)',
    subject: 'Biology',
    grade: 'University',
    chapters: ['Chapter 1: Structure and Chemistry of Life', 'Chapter 2: Cellular Metabolism & Photosynthesis', 'Chapter 3: Anatomy and Systems of Animal Life', 'Chapter 4: Microorganisms, Fungi and Viral Pathogens'],
    pages: 185,
    description: 'Study of cellular respiration pathways, ATP models, enzyme activity limits, prokaryote structures, and plant physiology.',
    languageSupport: 'English Only',
    proRequired: false,
  },
  {
    id: 'uni_anthropology',
    title: 'Social Anthropology Freshman Curriculum (Anth 1012)',
    subject: 'Anthropology',
    grade: 'University',
    chapters: ['Chapter 1: Concepts and Scope of Anthropology', 'Chapter 2: Culture, Ethnicity, and Social Identity', 'Chapter 3: Kinship, Marriage & Family Systems', 'Chapter 4: Indigenous Knowledge and Adaptation in Ethiopia'],
    pages: 130,
    description: 'Explore human diversity, tribal custom definitions, ethnographic field research methods, and pluralistic contexts in the Horn of Africa.',
    languageSupport: 'English Only',
    proRequired: false,
  },
  {
    id: 'uni_logic',
    title: 'Introduction to Logic and Critical Thinking (Phil 1011)',
    subject: 'Logic',
    grade: 'University',
    chapters: ['Chapter 1: Logic, Arguments, and Premises', 'Chapter 2: Informal Fallacies (Ad Hominem, Strawman)', 'Chapter 3: Categorical Propositions and Venn Diagrams', 'Chapter 4: Symbolic Logic and Natural Deduction'],
    pages: 145,
    description: 'Unlock argumentative rigor. Learn to outline deductive logic structures, identify cognitive traps, and construct formal proofs with AI reasoning explanations.',
    languageSupport: 'English Only',
    proRequired: true,
  },
  {
    id: 'uni_psychology',
    title: 'Freshman General Psychology and Life Skills (Pscy 1011)',
    subject: 'Psychology',
    grade: 'University',
    chapters: ['Chapter 1: Essence & Biological Bases of Behavior', 'Chapter 2: Sensation, Perception, and Human Learning', 'Chapter 3: Cognitive, Memory Systems and Amnesia', 'Chapter 4: Motivation, Emotion, Personality & Life Skills'],
    pages: 152,
    description: 'Deep dive into neuropsychology, Pavlovian conditioning mechanisms, proactive interference, developmental stages, and stress tolerance.',
    languageSupport: 'English Only',
    proRequired: false,
  },
  {
    id: 'uni_inclusiveness',
    title: 'Inclusiveness, Disabilities & Special Education Module (Incl 1012)',
    subject: 'Inclusiveness',
    grade: 'University',
    chapters: ['Chapter 1: Understanding Disabilities and Vulnerabilities', 'Chapter 2: Overcoming Social & Institutional Barriers', 'Chapter 3: Collaborative Assistive Technologies', 'Chapter 4: National Inclusiveness Policies and Rights'],
    pages: 112,
    description: 'Framework of special needs learning support, behavioral adjustments, visual or hearing aids integrations, and human dignity principles.',
    languageSupport: 'English Only',
    proRequired: false,
  },
  {
    id: 'uni_entrepreneurship',
    title: 'Freshman Entrepreneurship (Mgmt 1012)',
    subject: 'Entrepreneurship',
    grade: 'University',
    chapters: ['Chapter 1: The Entrepreneurial Mindset & Ideation', 'Chapter 2: Market Audits, Feasibility and Customer Pain', 'Chapter 3: Structuring a Valid Lean Business Model Canvas', 'Chapter 4: Capital Sources and Ethiopian Microfinance Laws'],
    pages: 138,
    description: 'Essential entrepreneurial toolbox. Covers competitive audits, value propositions, resource constraints, startup funding hacks, and local taxation.',
    languageSupport: 'English Only',
    proRequired: false,
  },
  {
    id: 'uni_cpp',
    title: 'Introduction to Computer Programming & C++ (CoSc 1011)',
    subject: 'C++',
    grade: 'University',
    chapters: ['Chapter 1: Algorithms, Flowcharts and Compilers', 'Chapter 2: C++ Variables, Types, and Conditional Statements', 'Chapter 3: Loops and Iteration Controls (For, While)', 'Chapter 4: Custom Functions, Arrays, and Memory Pointers'],
    pages: 175,
    description: 'Hands-on programming guide. Master logical arrays, sequential flows, parameter passing, and syntax structures with custom AI code-review solver tools.',
    languageSupport: 'English Only',
    proRequired: true,
  }
];

export default function BookStoreView({
  profile,
  apiKey,
  language,
  onNavigate,
  onStudyAction
}: BookStoreViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  
  // Selected resource for detailed preview / AI interactions
  const [activeModule, setActiveModule] = useState<ModuleResource | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  
  // AI activity state
  const [aiMode, setAiMode] = useState<'none' | 'summary' | 'exam' | 'notes'>('none');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  
  // Quiz Engine state if exam generated
  const [customQuizQuestions, setCustomQuizQuestions] = useState<any[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);

  // Filter modules
  const filtered = PREBUILT_MODULES.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = selectedGrade === 'All' || m.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  // Check trial expiration vs pro
  const isEligible = profile.isPro || profile.proStatus === 'pending';

  const handleSelectModule = (mod: ModuleResource) => {
    playClickChime();
    setActiveModule(mod);
    setSelectedChapter(mod.chapters[0]);
    // Reset AI states
    setAiMode('none');
    setAiResponse('');
    setCustomQuizQuestions([]);
    setQuizScore(null);
  };

  // Run AI summaries
  const handleAISummarize = async () => {
    if (!activeModule) return;
    if (!isEligible && activeModule.proRequired) {
      playFailureChime();
      alert(language === 'en' 
        ? "This module requires premium upgrade! Your 3-day trial is up. Please upgrade to Pro for 200 BIRR per semester." 
        : "ይህ ሞጁል የአባልነት ክፍያ ይጠይቃል። እባክዎ በአንድ ሴሚስተር 200 ብር ብቻ ከፍለው መዳረሻ ያግኙ።");
      onNavigate('upgrade');
      return;
    }

    setAiMode('summary');
    setAiLoading(true);
    setAiResponse('');
    playClickChime();

    const chapterText = selectedChapter || activeModule.chapters[0];
    const systemPrompt = "You are a professional educational summarizer with key facts highlights. Output structured bullet notes with beautiful ASCII charts where relevant.";
    const userPrompt = `Under the document titled "${activeModule.title}" and subject "${activeModule.subject}", generate short notes and a revision overview for: "${chapterText}". 
Include:
1. Core Principles (Explained in 3 clear bullet points)
2. Crucial Formulas, Equations, or Core definitions (High value for National exams)
3. One quick mnemonic or shortcut to remember these points under stress.
Format nicely so it is very clean, accessible, and matches an EdTech application layout. Add brief Amharic summaries for technical terms.`;

    try {
      const messages = [{ role: 'user' as const, content: userPrompt }];
      await submitClaudeChat(messages, systemPrompt, apiKey || "no-key", {
        onChunk: (chunk) => {
          setAiResponse(prev => prev + chunk);
        },
        onComplete: (fullText) => {
          setAiLoading(false);
          setAiResponse(fullText);
          playSuccessChime();
          onStudyAction(); // extends streak
        },
        onError: (err) => {
          setAiLoading(false);
          setAiResponse(`Failed to call AI model helper: ${err.message || err}`);
          playFailureChime();
        }
      });
    } catch (e: any) {
      setAiLoading(false);
      setAiResponse(`System Error: ${e.message}`);
    }
  };

  // Run AI Custom Exam Generator
  const handleAIGenerateExam = async () => {
    if (!activeModule) return;
    if (!isEligible && activeModule.proRequired) {
      playFailureChime();
      onNavigate('upgrade');
      return;
    }

    setAiMode('exam');
    setAiLoading(true);
    setAiResponse('');
    setCustomQuizQuestions([]);
    setQuizScore(null);
    setCurrentQuizIndex(0);
    playClickChime();

    const chapterText = selectedChapter || activeModule.chapters[0];
    const systemPrompt = "You are an Ethiopian National Exam compiler specializing in multiple-choice questions. You output ONLY valid JSON arrays. Do not wrap in markdown or markdown code blocks.";
    const userPrompt = `Construct a highly-curated mock exam with exactly 3 multiple choice questions based on ${activeModule.subject} - ${chapterText} from the textbook "${activeModule.title}". 
Respond strictly in a clean JSON format matching this pattern:
[
  {
    "question": "Clear exam level multiple-choice question text?",
    "options": ["A) Correct Option", "B) Option", "C) Option", "D) Option"],
    "correctIndex": 0,
    "explanation": "High-value detailed step-by-step math or physical calculation explaining why this derivative, flux, or clause is the chosen alternative."
  }
]
No other text. No conversational prefix. No markdown \`\`\`json wrappers.`;

    try {
      const messages = [{ role: 'user' as const, content: userPrompt }];
      await submitClaudeChat(messages, systemPrompt, apiKey || "no-key", {
        onChunk: () => {},
        onComplete: (fullText) => {
          setAiLoading(false);
          try {
            let clean = fullText.trim();
            if (clean.startsWith('```json')) clean = clean.slice(7);
            if (clean.startsWith('```')) clean = clean.slice(3);
            if (clean.endsWith('```')) clean = clean.slice(0, -3);
            
            const parsed = JSON.parse(clean.trim());
            if (Array.isArray(parsed)) {
              setCustomQuizQuestions(parsed);
              playSuccessChime();
            } else {
              throw new Error("Parsed data is not an array");
            }
          } catch (e) {
            console.error(e);
            setAiResponse("AI response format was unparsable standard text. Let us display raw draft below:\n\n" + fullText);
          }
        },
        onError: (err) => {
          setAiLoading(false);
          setAiResponse(`Failed to compile exam: ${err.message || err}`);
          playFailureChime();
        }
      });
    } catch (e: any) {
      setAiLoading(false);
      setAiResponse(`Failed: ${e.message}`);
    }
  };

  // Run Pro Notes Draft
  const handleAIGenerateProNotes = async () => {
    if (!activeModule) return;
    if (!isEligible && activeModule.proRequired) {
      playFailureChime();
      onNavigate('upgrade');
      return;
    }

    setAiMode('notes');
    setAiLoading(true);
    setAiResponse('');
    playClickChime();

    const chapterText = selectedChapter || activeModule.chapters[0];
    const systemPrompt = "You are a master scientific scribe that constructs elite-level concise, stylized study sheets with diagnostic details.";
    const userPrompt = `Write a blueprint-level Pro Notebook article for the topic "${chapterText}" in "${activeModule.title}" (Subject: ${activeModule.subject}). 
Ensure the layout utilizes clear headers, a detailed markdown text explanation, visual ASCII flowcharts mapping the principles, exam trap alerts (highly-tested trick questions), and localized applications for Ethiopian context. Include bilingual English/Amharic vocab mappings.`;

    try {
      const messages = [{ role: 'user' as const, content: userPrompt }];
      await submitClaudeChat(messages, systemPrompt, apiKey || "no-key", {
        onChunk: (chunk) => {
          setAiResponse(prev => prev + chunk);
        },
        onComplete: (fullText) => {
          setAiLoading(false);
          setAiResponse(fullText);
          playSuccessChime();
          onStudyAction();
        },
        onError: (err) => {
          setAiLoading(false);
          setAiResponse(`Failed to generate Pro Notes: ${err}`);
        }
      });
    } catch (e: any) {
      setAiLoading(false);
      setAiResponse(`Error: ${e.message}`);
    }
  };

  // Custom Quiz Engine handling
  const handleQuizAnswer = (optionIdx: number) => {
    if (selectedQuizOption !== null) return; // already selected
    setSelectedQuizOption(optionIdx);
    playClickChime();
  };

  const handleNextQuizQuestion = () => {
    if (selectedQuizOption === null) return;
    
    // Check answer correctness
    const currentQ = customQuizQuestions[currentQuizIndex];
    const isCorrect = selectedQuizOption === currentQ.correctIndex;
    if (isCorrect) {
      setQuizScore(prev => (prev || 0) + 1);
      playSuccessChime();
    } else {
      playFailureChime();
    }

    if (currentQuizIndex + 1 < customQuizQuestions.length) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedQuizOption(null);
    } else {
      // Finished
      const finalScoreCount = (quizScore || 0) + (isCorrect ? 1 : 0);
      setQuizScore(finalScoreCount);
      playSuccessChime();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search Header Area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-serif font-black flex items-center gap-2 text-slate-900 dark:text-white">
            <BookOpen className="w-6 h-6 text-[#078930]" />
            {language === 'en' ? 'Ethiopian Curriculum Book Store' : 'የሞጁሎችና መጽሐፍት ማከማቻ'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans">
            {language === 'en' 
              ? 'Study Ministry Entrance references, modules, and freshman PDF textbooks backed by AI summarizers.' 
              : 'የብሔራዊ ፈተና ማዘጋጃ ሞጁሎችን፣ የኮሌጅ መጽሐፎችን እና ጠቃሚ ፒዲኤፎችን እዚህ ያግኙ።'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'en' ? 'Search subject, topics...' : 'መጽሐፍ ወይም ትምህርት ፈልግ..'}
              className="w-full sm:w-48 pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-0.5 rounded-xl text-xs font-bold leading-none select-none">
            {['All', 'Grade 12', 'University'].map(g => (
              <button
                key={g}
                onClick={() => { playClickChime(); setSelectedGrade(g); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] cursor-pointer tracking-tight uppercase ${
                  selectedGrade === g 
                    ? 'bg-[#078930] text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Module selection left list (5 columns) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filtered.map(mod => {
              const isActive = activeModule?.id === mod.id;
              const hasPremiumBadge = mod.proRequired;
              
              return (
                <div
                  key={mod.id}
                  onClick={() => handleSelectModule(mod)}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between hover:translate-y-[-2px] ${
                    isActive
                      ? 'border-[#078930] bg-[#078930]/5 dark:border-emerald-600/65 shadow-md'
                      : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0c0d12] hover:border-emerald-500 hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                        {mod.grade}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        {hasPremiumBadge && (
                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 border rounded ${
                            isEligible 
                              ? 'text-emerald-600 bg-emerald-50 border-emerald-250 dark:text-emerald-400 dark:bg-emerald-950/20' 
                              : 'text-amber-600 bg-amber-50 border-amber-200'
                          }`}>
                            {isEligible ? 'Pro Access' : 'PRO Limit'}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                          {mod.pages} Pages
                        </span>
                      </div>
                    </div>

                    <h3 className="font-serif font-black text-sm text-slate-800 dark:text-zinc-100 leading-tight">
                      {mod.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">
                      {mod.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                    <span>📚 {mod.subject}</span>
                    <span className="text-[#078930] hover:underline font-bold flex items-center gap-1 cursor-pointer">
                      Open Module &rarr;
                    </span>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-10 bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-800 rounded-2xl">
                <p className="text-sm text-slate-400 dark:text-zinc-500">No textbook modules match your active filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Interactive PDF reading and AI panel (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          {activeModule ? (
            <div className="bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* Module Header info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-105 dark:border-zinc-800 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-805 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded uppercase">
                      {activeModule.subject}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                      • {activeModule.languageSupport}
                    </span>
                  </div>
                  <h3 className="text-lg font-serif font-black text-slate-900 dark:text-zinc-100 leading-tight">
                    {activeModule.title}
                  </h3>
                </div>

                {/* Status indicator badge */}
                {!isEligible && activeModule.proRequired && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-bold leading-none shrink-0 cursor-pointer" onClick={() => onNavigate('upgrade')}>
                    <span>🔒 Trial Ended Upgrade</span>
                  </div>
                )}
              </div>

              {/* PDF Chapters drop and selection */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Select Chapter / Segment to Analyze:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeModule.chapters.map(ch => {
                      const isChActive = selectedChapter === ch;
                      return (
                        <button
                          key={ch}
                          onClick={() => { playClickChime(); setSelectedChapter(ch); }}
                          className={`px-3 py-2.5 rounded-xl border-2 text-left text-xs font-semibold leading-tight capitalize transition-colors cursor-pointer ${
                            isChActive
                              ? 'border-[#078930] bg-[#078930]/5 text-emerald-850 dark:text-white dark:border-emerald-500'
                              : 'border-slate-100 dark:border-zinc-805 bg-slate-50 dark:bg-zinc-900 hover:border-slate-350 hover:bg-slate-100'
                          }`}
                        >
                          <span className="line-clamp-1">{ch}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* AI Interactive buttons row */}
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3.5">🎯 AI Modules Copilot Actions:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Summarize button */}
                    <button
                      onClick={handleAISummarize}
                      disabled={aiLoading}
                      className="px-4 py-3 bg-gradient-to-r from-[#078930] to-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow hover:shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Bot className="w-4 h-4 shrink-0" />
                      <span>Summarize Note</span>
                    </button>

                    {/* Generate Custom Exam button */}
                    <button
                      onClick={handleAIGenerateExam}
                      disabled={aiLoading}
                      className="px-4 py-3 bg-gradient-to-r from-indigo-650 to-indigo-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow hover:shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Play className="w-4 h-4 shrink-0" />
                      <span>Custom Exam</span>
                    </button>

                    {/* Pro notes guide */}
                    <button
                      onClick={handleAIGenerateProNotes}
                      disabled={aiLoading}
                      className="px-4 py-3 bg-gradient-to-r from-amber-500 to-[#C8962E] text-black rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow hover:shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Pro Study Card</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Workspace response stage */}
              <div className="border-t border-slate-105 dark:border-zinc-800 pt-5">
                
                {aiLoading && (
                  <div className="flex flex-col items-center justify-center py-10 space-y-3">
                    <div className="w-10 h-10 border-4 border-[#078930] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-500 animate-pulse font-mono">Consolidating syllabus, preparing educational stream...</p>
                  </div>
                )}

                {!aiLoading && aiMode === 'none' && (
                  <div className="py-8 bg-slate-50 dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 p-6 rounded-2xl text-center">
                    <Compass className="w-8 h-8 text-slate-400 mx-auto animate-pulse" />
                    <p className="text-xs text-slate-500 dark:text-zinc-500 font-bold uppercase mt-2">Ready to compile syllabus details</p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-650 mt-1 max-w-sm mx-auto">
                      Choose any chapter from the list above and click an AI action to generate interactive summaries, custom MCQ exams, or blueprint pro study sheets.
                    </p>
                  </div>
                )}

                {/* Markdown text display for summary or notes */}
                {!aiLoading && (aiMode === 'summary' || aiMode === 'notes') && aiResponse && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-xl border border-emerald-150 text-[#078930] dark:text-emerald-405 text-xs font-bold font-mono">
                      <span>📌 {aiMode === 'summary' ? 'Syllabus Summary Notes' : 'Pro Revision Blueprint Card'}</span>
                      <button onClick={() => { playClickChime(); setAiResponse(''); setAiMode('none'); }} className="hover:underline">Clear Notes</button>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#07080c] border border-slate-200 dark:border-zinc-850 overflow-y-auto max-h-[350px] scrollbar-thin text-xs leading-relaxed space-y-3 font-sans">
                      <div className="whitespace-pre-wrap">{aiResponse}</div>
                    </div>
                  </div>
                )}

                {/* Custom Exam Multiple Choice Quiz interface */}
                {!aiLoading && aiMode === 'exam' && customQuizQuestions.length > 0 && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/20 px-3 py-2 rounded-xl border border-indigo-150 text-indigo-705 dark:text-indigo-405 text-xs font-bold font-mono">
                      <span>📝 Custom Mock Exam ({customQuizQuestions.length} Questions)</span>
                      <button onClick={() => { playClickChime(); setCustomQuizQuestions([]); setAiMode('none'); }} className="hover:underline">Cancel Quiz</button>
                    </div>

                    {quizScore !== null && quizScore === customQuizQuestions.length ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-300 p-6 rounded-2xl text-center space-y-3">
                        <span className="text-3xl">🏆</span>
                        <h4 className="text-base font-bold font-serif text-emerald-800 dark:text-emerald-400">Excellent Work, Pro Scholar!</h4>
                        <p className="text-xs text-slate-505 dark:text-zinc-300 leading-normal">
                          You scored <span className="font-extrabold">{quizScore} out of {customQuizQuestions.length}</span>! Keep compiling textbook sessions. Your local index records this learning streak.
                        </p>
                        <button
                          onClick={() => { playClickChime(); setQuizScore(null); setCustomQuizQuestions([]); setAiMode('none'); }}
                          className="px-4 py-2 bg-[#078930] hover:bg-[#067228] text-white rounded-xl text-xs font-bold uppercase transition"
                        >
                          Complete Review
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Process tracker */}
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                          <span>Question {currentQuizIndex + 1} of {customQuizQuestions.length}</span>
                          <span>Subject: {activeModule.subject}</span>
                        </div>

                        {/* Progress line */}
                        <div className="w-full bg-slate-100 dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden select-none">
                          <div 
                            className="bg-indigo-650 h-full transition-all duration-300"
                            style={{ width: `${((currentQuizIndex + 1) / customQuizQuestions.length) * 100}%` }}
                          />
                        </div>

                        <div className="font-serif font-extrabold text-sm text-slate-800 dark:text-zinc-100 leading-snug">
                          {customQuizQuestions[currentQuizIndex].question}
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          {customQuizQuestions[currentQuizIndex].options.map((opt: string, idx: number) => {
                            const isSelected = selectedQuizOption === idx;
                            const isCorrectAnswer = idx === customQuizQuestions[currentQuizIndex].correctIndex;
                            
                            let btnStyle = 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300';
                            if (selectedQuizOption !== null) {
                              if (isCorrectAnswer) {
                                btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 font-bold';
                              } else if (isSelected) {
                                btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400';
                              } else {
                                btnStyle = 'opacity-50 border-slate-200 dark:border-zinc-800';
                              }
                            }

                            return (
                              <button
                                key={idx}
                                disabled={selectedQuizOption !== null}
                                onClick={() => handleQuizAnswer(idx)}
                                className={`w-full px-4 py-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${btnStyle}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {selectedQuizOption !== null && (
                          <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs leading-relaxed space-y-2">
                            <p className="font-bold text-[#078930]">&rarr; Step-by-Step AI Explanation:</p>
                            <p className="text-slate-500 dark:text-zinc-350">{customQuizQuestions[currentQuizIndex].explanation}</p>
                            
                            <div className="pt-2 text-right">
                              <button
                                onClick={handleNextQuizQuestion}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider"
                              >
                                {currentQuizIndex + 1 === customQuizQuestions.length ? 'Show Score' : 'Next Question &rarr;'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 rounded-2xl p-8 shadow-sm text-center select-none space-y-4">
              <Compass className="w-12 h-12 text-[#078930] mx-auto animate-pulse" />
              <div className="space-y-1">
                <h3 className="font-serif font-black text-lg text-slate-800 dark:text-zinc-150">Open a Textbook Module</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-400 max-w-sm mx-auto">
                  Click on any curriculum guide or textbook in the bookstore list on the left to start analyzing with AI.
                </p>
              </div>

              <div className="border-t border-slate-105 dark:border-zinc-800/80 pt-6 max-w-sm mx-auto">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl text-left border">
                    <span className="text-lg">📕</span>
                    <p className="font-extrabold text-[#078930] text-[10px] uppercase mt-1">Grades 8 - 12</p>
                    <p className="text-[9px] text-slate-400 leading-tight">Ministry prep worksheets & exam binders</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl text-left border">
                    <span className="text-lg">🏛️</span>
                    <p className="font-extrabold text-[#078930] text-[10px] uppercase mt-1">Freshman Courses</p>
                    <p className="text-[9px] text-slate-400 leading-tight">University Maths, Physics & Economics guides</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
