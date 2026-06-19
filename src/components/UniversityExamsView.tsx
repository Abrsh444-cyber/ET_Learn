import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, HelpCircle, Bot, BookOpen, Clock, Activity, Check, CheckCircle, Flame, Filter, FileText, Sparkles 
} from 'lucide-react';
import { StudentProfile } from '../types';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { submitClaudeChat } from '../utils/ai';

interface UniversityExamsProps {
  profile: StudentProfile;
  apiKey: string;
  language: 'en' | 'am';
  onNavigate: (page: string) => void;
  onStudyAction: () => void;
}

interface ExamPaperSheet {
  id: string;
  title: string;
  university: string;
  year: string;
  subject: string;
  questions: {
    id: number;
    qText: string;
    choices: string[];
    correctIndex: number;
    subjectTopic: string;
  }[];
}

const UNIVERSITY_SHEETS: ExamPaperSheet[] = [
  // --- UNIVERSITY SUBJECTS ---
  {
    id: 'uni_math_sheet',
    title: 'Freshman Mathematics I (Math 1011) Midterm Exam',
    university: 'Addis Ababa University (AAU)',
    year: '2016 E.C.',
    subject: 'Mathematics',
    questions: [
      {
        id: 1,
        qText: 'Which of the following is equivalent to the logical proposition: ¬(p ∨ q)?',
        choices: [
          'A) ¬p ∧ ¬q',
          'B) ¬p ∨ ¬q',
          'C) p ∧ q',
          'D) ¬p → q'
        ],
        correctIndex: 0,
        subjectTopic: 'Propositional Logic & De Morgan\'s Law'
      },
      {
        id: 2,
        qText: 'Find the domain of the function f(x) = ln(x^2 - 4).',
        choices: [
          'A) (-∞, -2) ∪ (2, ∞)',
          'B) [-2, 2]',
          'C) (2, ∞)',
          'D) All real numbers except -2 and 2'
        ],
        correctIndex: 0,
        subjectTopic: 'Function Domain'
      }
    ]
  },
  {
    id: 'uni_english_sheet',
    title: 'Communicative English Skills I (FLEn 1011) Competency Test',
    university: 'Hawassa University (HU)',
    year: '2015 E.C.',
    subject: 'English',
    questions: [
      {
        id: 1,
        qText: 'Choose the sentence that demonstrates the correct use of a cohesive transitional phrase:',
        choices: [
          'A) She studied very hard; consequently, she failed the exam with terrible grades.',
          'B) He did not complete his assignment; nevertheless, the professor accepted it warmly.',
          'C) In spite of the rain was heavy, we went on a field measurement.',
          'D) Although he was sleepy, but he kept writing his research paragraph.'
        ],
        correctIndex: 1,
        subjectTopic: 'Cohesive Devices & Sentence Transitions'
      }
    ]
  },
  {
    id: 'uni_physics_sheet',
    title: 'General Physics Mechanics & Waves (Phys 1011) Term Exam',
    university: 'Adama Science & Technology University (ASTU)',
    year: '2016 E.C.',
    subject: 'Physics',
    questions: [
      {
        id: 1,
        qText: 'A fly-wheel has a constant angular acceleration of 2.0 rad/s^2. If it starts from rest, what angular displacement does it sweep in 3.0 seconds?',
        choices: [
          'A) 9.0 radians',
          'B) 6.0 radians',
          'C) 18.0 radians',
          'D) 4.5 radians'
        ],
        correctIndex: 0,
        subjectTopic: 'Rotational Kinematics'
      }
    ]
  },
  {
    id: 'uni_anthro_sheet',
    title: 'Social Anthropology (Anth 1012) Mid-Semester Exam',
    university: 'Jimma University (JU)',
    year: '2015 E.C.',
    subject: 'Anthropology',
    questions: [
      {
        id: 1,
        qText: 'According to social anthropologists, which of the following refers to a descent group formulated through links to the maternal line only?',
        choices: [
          'A) Patrilineal descent',
          'B) Matrilineal descent',
          'C) Ambilineal descent',
          'D) Bilateral descent'
        ],
        correctIndex: 1,
        subjectTopic: 'Kinship & Descent Systems'
      }
    ]
  },
  {
    id: 'uni_chemistry_sheet',
    title: 'General Chemistry I Atomic Theory (Chem 1011) Evaluation',
    university: 'Mekelle University (MU)',
    year: '2015 E.C.',
    subject: 'Chemistry',
    questions: [
      {
        id: 1,
        qText: 'What is the correct electron configuration of Chromium (Cr, Z = 24) in its ground state?',
        choices: [
          'A) [Ar] 4s^2 3d^4',
          'B) [Ar] 4s^1 3d^5',
          'C) [Ar] 4s^0 3d^6',
          'D) [Ar] 4s^2 3d^5'
        ],
        correctIndex: 1,
        subjectTopic: 'Ground State Electron Anomalies'
      }
    ]
  },
  {
    id: 'uni_logic_sheet',
    title: 'Introduction to Logic & Critical Thinking (Phil 1011) Final',
    university: 'Addis Ababa University (AAU)',
    year: '2016 E.C.',
    subject: 'Logic',
    questions: [
      {
        id: 1,
        qText: 'Identify the formal/informal fallacy: "We must re-elect the current Dean. If we do not, the entire department will disintegrate overnight into violent chaos!"',
        choices: [
          'A) Appeal to Fear (Argumentum ad Baculum)',
          'B) Appeal to the People (Argumentum ad Populum)',
          'C) Straw Man Fallacy',
          'D) Post Hoc Ergo Propter Hoc'
        ],
        correctIndex: 0,
        subjectTopic: 'Informal Fallacies'
      }
    ]
  },
  {
    id: 'uni_psych_sheet',
    title: 'General Psychology & Life Skills (Pscy 1011) Assessment',
    university: 'Arba Minch University (AMU)',
    year: '2014 E.C.',
    subject: 'Psychology',
    questions: [
      {
        id: 1,
        qText: 'In classical conditioning, what term describes the sudden reappearance of a extinguished conditioned response after a rest period has elapsed?',
        choices: [
          'A) Extinction',
          'B) Spontaneous Recovery',
          'C) Stimulus Discrimination',
          'D) Generalization Transfer'
        ],
        correctIndex: 1,
        subjectTopic: 'Classical Conditioning Principles'
      }
    ]
  },
  {
    id: 'uni_inclusive_sheet',
    title: 'Inclusiveness & Special Needs Education (Incl 1012) Worksheet',
    university: 'Bahir Dar University (BDU)',
    year: '2015 E.C.',
    subject: 'Inclusiveness',
    questions: [
      {
        id: 1,
        qText: 'Which of the following describes an environmental arrangement where all educational resources, buildings, and sites are made uniformly usable by both disabled and non-disabled scholars?',
        choices: [
          'A) Exclusive Exclusion',
          'B) Universal Design (Design for All)',
          'C) Standard Segregated Learning',
          'D) Ad-hoc Remediation'
        ],
        correctIndex: 1,
        subjectTopic: 'Universal Design for Learning'
      }
    ]
  },
  {
    id: 'uni_entrepreneur_sheet',
    title: 'Freshman Entrepreneurship (Mgmt 1012) Project Exam Paper',
    university: 'Addis Ababa University (AAU)',
    year: '2016 E.C.',
    subject: 'Entrepreneurship',
    questions: [
      {
        id: 1,
        qText: 'In a Lean Business Model Canvas, which block specifically describes the unique value that distinguishes your solution from existing competitors?',
        choices: [
          'A) Key Metrics',
          'B) Cost Structure',
          'C) Unique Value Proposition (UVP)',
          'D) Customer Segments'
        ],
        correctIndex: 2,
        subjectTopic: 'Lean Business Model Canvas'
      }
    ]
  },
  {
    id: 'uni_cpp_sheet',
    title: 'Introduction to Computer Programming with C++ (CoSc 1011)',
    university: 'Wollo University (WU)',
    year: '2015 E.C.',
    subject: 'C++',
    questions: [
      {
        id: 1,
        qText: 'What is the printed output of the following C++ code snippet?\nint x = 5;\ncout << ++x << " " << x++;',
        choices: [
          'A) 6 6',
          'B) 6 5',
          'C) 5 6',
          'D) Compiler Syntax Error'
        ],
        correctIndex: 0,
        subjectTopic: 'Prefix and Postfix Operators'
      }
    ]
  },
  {
    id: 'uni_english2_sheet',
    title: 'Writing Skills II Advanced Freshman English (FLEn 1012)',
    university: 'Bahir Dar University (BDU)',
    year: '2015 E.C.',
    subject: 'English Skill 2',
    questions: [
      {
        id: 1,
        qText: 'In academic writing, which APA citation element represents a correct direct quote formatting?',
        choices: [
          'A) According to Alemayehu (2020), "it was proved" (p. 15).',
          'B) Alemayehu says: "it was proved". 2020',
          'C) According to Alemayehu, it was proved (2020, page 15).',
          'D) Alemayehu, p. 15, 2020.'
        ],
        correctIndex: 0,
        subjectTopic: 'APA Citation Standards'
      }
    ]
  },
  {
    id: 'uni_applied_sheet',
    title: 'Applied Mathematics II (Math 1012) Integration Calculus Paper',
    university: 'Adama Science & Technology University (ASTU)',
    year: '2016 E.C.',
    subject: 'Applied Math',
    questions: [
      {
        id: 1,
        qText: 'Determine the value of the improper integral: ∫ from 1 to ∞ [ 1 / x^2 ] dx.',
        choices: [
          'A) 1',
          'B) 0',
          'C) Divergent to infinity',
          'D) -1'
        ],
        correctIndex: 0,
        subjectTopic: 'Improper Integrals and p-Series Convergence'
      }
    ]
  },
  {
    id: 'uni_bio_sheet',
    title: 'General Biology course (Biol 1011) Freshman Quiz',
    university: 'Ambo University (AU)',
    year: '2015 E.C.',
    subject: 'Biology',
    questions: [
      {
        id: 1,
        qText: 'During cellular respiration, which process occurs in the cytoplasm of the cell in the absolute absence of oxygen?',
        choices: [
          'A) Krebs Cycle',
          'B) Glycolysis',
          'C) Electron Transport Chain',
          'D) Oxidative Phosphorylation'
        ],
        correctIndex: 1,
        subjectTopic: 'Cellular Respiration'
      }
    ]
  },

  // --- GRADE 12 SUBJECTS ---
  {
    id: 'g12_math_sheet',
    title: 'National Grade 12 College Entrance Examination (Maths Section)',
    university: 'MoE Ethiopia Secondary',
    year: '2015 E.C.',
    subject: 'Mathematics',
    questions: [
      {
        id: 1,
        qText: 'Find the 20th term of an arithmetic sequence whose first term is 5 and common difference is 4.',
        choices: [
          'A) 81',
          'B) 85',
          'C) 77',
          'D) 79'
        ],
        correctIndex: 0,
        subjectTopic: 'Arithmetic Sequences'
      },
      {
        id: 2,
        qText: 'Find the derivative of f(x) = (3x - 1) / (2x + 5) with respect to x.',
        choices: [
          'A) 17 / (2x + 5)^2',
          'B) (6x - 2) / (2x + 5)^2',
          'C) 13 / (2x + 5)^2',
          'D) 3/2'
        ],
        correctIndex: 0,
        subjectTopic: 'The Quotient Rule'
      }
    ]
  },
  {
    id: 'g12_english_sheet',
    title: 'Secondary Matric Entrance Workbook in English Grammatics',
    university: 'MoE Ethiopia Secondary',
    year: '2016 E.C.',
    subject: 'English',
    questions: [
      {
        id: 1,
        qText: 'If we had left the school earlier, we ______ the Addis Ababa light rail train on time.',
        choices: [
          'A) would catch',
          'B) would have caught',
          'C) will catch',
          'D) caught'
        ],
        correctIndex: 1,
        subjectTopic: 'Third Conditional Clauses'
      }
    ]
  },
  {
    id: 'g12_physics_sheet',
    title: 'National College Entrance Physics Matric Practice',
    university: 'MoE Ethiopia Secondary',
    year: '2016 E.C.',
    subject: 'Physics',
    questions: [
      {
        id: 1,
        qText: 'What is the magnetic force on a wire of length 0.5m carrying a current of 2A placed perpendicular to a 3T uniform magnetic field?',
        choices: [
          'A) 3.0 N',
          'B) 1.5 N',
          'C) 6.0 N',
          'D) 0 N (No Force)'
        ],
        correctIndex: 0,
        subjectTopic: 'Magnetic Force on Current-Carrying Wires'
      }
    ]
  },
  {
    id: 'g12_chemistry_sheet',
    title: 'Grade 12 Chemistry National Matriculation Exam Papers',
    university: 'MoE Ethiopia Secondary',
    year: '2015 E.C.',
    subject: 'Chemistry',
    questions: [
      {
        id: 1,
        qText: 'Which of the following organic structures is recognized as an isomer of butane (C4H10)?',
        choices: [
          'A) 2-Methylpropane',
          'B) Propene',
          'C) Cyclobutane',
          'D) Pentane'
        ],
        correctIndex: 0,
        subjectTopic: 'Isomerism in Alkanes'
      }
    ]
  },
  {
    id: 'g12_biology_sheet',
    title: 'Grade 12 National Biology Certification Mock Sheet',
    university: 'MoE Ethiopia Secondary',
    year: '2015 E.C.',
    subject: 'Biology',
    questions: [
      {
        id: 1,
        qText: 'If a plant heterozygous for purple flowers (Pp) is crossed with a white-flowered plant (pp), what is the expected Mendelian genotype ratio of Pp to pp in the offspring?',
        choices: [
          'A) 1:1',
          'B) 3:1',
          'C) 1:2:1',
          'D) All purple'
        ],
        correctIndex: 0,
        subjectTopic: 'Mendelian Genetics Punnett Square'
      }
    ]
  },
  {
    id: 'g12_aptitude_sheet',
    title: 'National Grade 12 Scholastic Aptitude Exam Paper',
    university: 'MoE Ethiopia Secondary',
    year: '2016 E.C.',
    subject: 'Aptitude',
    questions: [
      {
        id: 1,
        qText: 'LIBRARIAN : BOOK :: CURE : ? (Select the correct relational analogy)',
        choices: [
          'A) DOCTOR',
          'B) PATIENT',
          'C) MEDICINE',
          'D) DISEASE'
        ],
        correctIndex: 0,
        subjectTopic: 'Verbal Analogy Relationships'
      },
      {
        id: 2,
        qText: 'Complete the pattern sequence: 2, 6, 12, 20, 30, ?',
        choices: [
          'A) 42',
          'B) 40',
          'C) 46',
          'D) 50'
        ],
        correctIndex: 0,
        subjectTopic: 'Numerical Reasoning and Sequences'
      }
    ]
  }
];

export default function UniversityExamsView({
  profile,
  apiKey,
  language,
  onNavigate,
  onStudyAction
}: UniversityExamsProps) {
  const [examCategory, setExamCategory] = useState<'all' | 'g12' | 'uni'>('all');
  const [selectedSheet, setSelectedSheet] = useState<ExamPaperSheet | null>(null);
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number>(-1);
  const [userSelectedChoice, setUserSelectedChoice] = useState<number | null>(null);
  
  // AI solver active states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiMode, setAiMode] = useState<'none' | 'solution' | 'clue'>('none');

  // Verify Pro Access
  const isEligible = profile.isPro || profile.proStatus === 'pending';

  const filteredSheets = UNIVERSITY_SHEETS.filter(sheet => {
    if (examCategory === 'g12') return sheet.id.startsWith('g12');
    if (examCategory === 'uni') return sheet.id.startsWith('uni');
    return true;
  });

  const handleSelectSheet = (sheet: ExamPaperSheet) => {
    playClickChime();
    setSelectedSheet(sheet);
    setSelectedQuestionIdx(0);
    setUserSelectedChoice(null);
    setAiResult('');
    setAiMode('none');
  };

  const handleSelectQuestion = (idx: number) => {
    playClickChime();
    setSelectedQuestionIdx(idx);
    setUserSelectedChoice(null);
    setAiResult('');
    setAiMode('none');
  };

  // Process AI solver action
  const handleAISolve = async (solveMode: 'solution' | 'clue') => {
    if (!selectedSheet || selectedQuestionIdx === -1) return;
    
    // Check eligibility
    if (!isEligible) {
      playFailureChime();
      alert(language === 'en'
        ? "University Past Exam Solver requires Pro upgrade! Access past exam papers with step-by-step AI solvers."
        : "የዩኒቨርሲቲ ፈተና መፍቻ የፕሮ አባልነት ይጠይቃል! እባክዎ አባልነቱን አግብተው ሙሉውን ደረጃ በደረጃ ማብራሪያ ያግኙ።");
      onNavigate('upgrade');
      return;
    }

    setAiMode(solveMode);
    setAiLoading(true);
    setAiResult('');
    playClickChime();

    const currentQ = selectedSheet.questions[selectedQuestionIdx];
    const systemPrompt = solveMode === 'solution'
      ? "You are a master scientific professor at Addis Ababa University. You break down complex physical or mathematical equations into steps, stating all formulas and principles clearly."
      : "You are a helpful study tutor that gives conceptual guidelines or core hints. You do NOT give away the exact final numerical answer, but teach them how to get there.";

    const queryPrompt = solveMode === 'solution'
      ? `Provide a step-by-step, elite resolution for this typical Freshman exam question from the ${selectedSheet.university} - ${selectedSheet.title}:
Question: "${currentQ.qText}"
Options:
${currentQ.choices.map((c, i) => `${i + 1}. ${c}`).join('\n')}
Correct Option Index: ${currentQ.correctIndex}

Highlight:
1. Core formula/standard rule used (e.g. L’Hopital’s rule, Quotient rule).
2. Step-by-step mathematical substitution or logical syntax analysis.
3. Why option ${currentQ.correctIndex + 1} is correct and why other options are common matric distractors.
Include brief explanations in Amharic where it makes formulas easier to conceptualize.`
      : `Provide a quick study clue and mathematical hint for this exam question:
Question: "${currentQ.qText}"
Options:
${currentQ.choices.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Guide me on how to approach this. Give me the primary formula but let me do the final numerical arithmetic!`;

    try {
      const messages = [{ role: 'user' as const, content: queryPrompt }];
      await submitClaudeChat(messages, systemPrompt, apiKey || "no-key", {
        onChunk: (chunk) => {
          setAiResult(prev => prev + chunk);
        },
        onComplete: (fullText) => {
          setAiLoading(false);
          setAiResult(fullText);
          playSuccessChime();
          onStudyAction();
        },
        onError: (err) => {
          setAiLoading(false);
          setAiResult(`Failed to communicate with AI solver: ${err.message || err}`);
          playFailureChime();
        }
      });
    } catch (e: any) {
      setAiLoading(false);
      setAiResult(`Error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-650 animate-ping inline-block" />
            <h2 className="text-xl md:text-2xl font-serif font-black flex items-center gap-1.5 text-slate-900 dark:text-white">
              <Award className="w-6 h-6 text-indigo-600" />
              {language === 'en' ? 'Freshman & University Exams Hub' : 'የዩኒቨርሲቲ ፈተናዎች ማዕከል'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans">
            {language === 'en'
              ? 'Access past midterm & final exam worksheets from AAU, ASTU, and BDU. Use the step-by-step AI Solver to simplify complex tasks.'
              : 'የአዲስ አበባ ዩኒቨርሲቲ (AAU)፣ የአዳማ (ASTU) እና ባህር ዳር (BDU) የፈተና ጥያቄዎችን ከአይ ፈጣን መፍቻ ጋር ተለማመዱ።'}
          </p>
        </div>

        {!isEligible && (
          <button
            onClick={() => { playClickChime(); onNavigate('upgrade'); }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-[#C8962E] hover:from-amber-600 hover:to-[#B28224] text-black font-bold text-xs rounded-xl shadow cursor-pointer uppercase tracking-wider flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-950 animate-pulse" />
            <span>Unlock AI Solver</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: list of past university exam papers (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 p-4 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-650" />
              Select Available Papers:
            </h3>

            {/* Category selection tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl mb-4 text-center text-[10.5px] select-none border border-slate-200/50 dark:border-zinc-800">
              <button
                onClick={() => { playClickChime(); setExamCategory('all'); }}
                className={`py-1.5 px-1 rounded-lg font-extrabold transition-all cursor-pointer ${
                  examCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850'
                }`}
              >
                {language === 'en' ? 'All' : 'ሁሉም'}
              </button>
              <button
                onClick={() => { playClickChime(); setExamCategory('g12'); }}
                className={`py-1.5 px-1 rounded-lg font-extrabold transition-all cursor-pointer ${
                  examCategory === 'g12'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850'
                }`}
              >
                {language === 'en' ? 'Grade 12' : '12ኛ ክፍል'}
              </button>
              <button
                onClick={() => { playClickChime(); setExamCategory('uni'); }}
                className={`py-1.5 px-1 rounded-lg font-extrabold transition-all cursor-pointer ${
                  examCategory === 'uni'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850'
                }`}
              >
                {language === 'en' ? 'University' : 'ዩኒቨርሲቲ'}
              </button>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredSheets.length === 0 ? (
                <div className="text-center py-6 text-zinc-400 text-xs">
                  No exam papers found in this filter.
                </div>
              ) : (
                filteredSheets.map(sheet => {
                  const isSheetActive = selectedSheet?.id === sheet.id;
                  
                  return (
                    <div
                      key={sheet.id}
                      onClick={() => handleSelectSheet(sheet)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left relative ${
                        isSheetActive
                          ? 'border-indigo-650 bg-indigo-50/50 dark:bg-indigo-950/20 font-bold'
                          : 'border-slate-100 dark:border-zinc-805 bg-slate-50 dark:bg-zinc-900/40 hover:border-indigo-305'
                      }`}
                    >
                      <div className="flex justify-between items-center gap-1 mb-1.5">
                        <span className="text-[8.5px] font-black uppercase text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded leading-none">
                          {sheet.subject}
                        </span>
                        <span className="text-[9.5px] text-zinc-400 font-mono italic">{sheet.year}</span>
                      </div>

                      <h4 className="text-[11px] font-serif font-black text-slate-800 dark:text-zinc-150 leading-tight">
                        {sheet.title}
                      </h4>

                      <p className="text-[9.5px] text-slate-400 mt-1 uppercase font-mono tracking-wide">
                        🏛️ {sheet.university}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column: active sheet workspace & question display (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedSheet ? (
            <div className="bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-zinc-805 p-6 rounded-2xl shadow-sm space-y-5">
              
              {/* Sheet header */}
              <div className="border-b border-slate-100 dark:border-zinc-800 pb-4">
                <span className="text-[10.5px] uppercase tracking-wider font-extrabold text-[#078930] bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">
                  {selectedSheet.university}
                </span>
                <h3 className="text-base font-serif font-black text-slate-805 dark:text-zinc-100 mt-1.5 leading-tight">
                  {selectedSheet.title}
                </h3>
              </div>

              {/* Step: Questions list selector inside sheet */}
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Questions in this paper:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSheet.questions.map((q, idx) => {
                    const isQActive = selectedQuestionIdx === idx;
                    return (
                      <button
                        key={q.id}
                        onClick={() => handleSelectQuestion(idx)}
                        className={`w-10 h-10 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isQActive
                            ? 'bg-indigo-650 border-indigo-650 text-white shadow-md'
                            : 'bg-slate-50 border-slate-100 hover:border-slate-350 text-slate-650'
                        }`}
                      >
                        Q{idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected question detail layout */}
              {selectedQuestionIdx !== -1 && (
                <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <span className="uppercase font-bold text-indigo-705">Topic: {selectedSheet.questions[selectedQuestionIdx].subjectTopic}</span>
                    <span>Entrance / Freshman Coursework</span>
                  </div>

                  <div className="font-serif font-black text-sm text-slate-800 dark:text-zinc-100 leading-snug p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-105">
                    {selectedSheet.questions[selectedQuestionIdx].qText}
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedSheet.questions[selectedQuestionIdx].choices.map((choice, i) => {
                      const isSelected = userSelectedChoice === i;
                      const isCorrect = i === selectedSheet.questions[selectedQuestionIdx].correctIndex;

                      let cStyle = 'border-slate-100 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-slate-750 hover:bg-slate-50';
                      if (userSelectedChoice !== null) {
                        if (isCorrect) {
                          cStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-805 font-bold';
                        } else if (isSelected) {
                          cStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-805';
                        } else {
                          cStyle = 'opacity-50 border-slate-100 dark:border-zinc-805';
                        }
                      }

                      return (
                        <button
                          key={i}
                          disabled={userSelectedChoice !== null}
                          onClick={() => { playClickChime(); setUserSelectedChoice(i); }}
                          className={`px-4 py-3 rounded-xl border text-left text-xs transition-colors cursor-pointer ${cStyle}`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>

                  {userSelectedChoice !== null && (
                    <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl text-xs flex justify-between items-center select-none border">
                      <span className="text-slate-500 dark:text-zinc-400">
                        {userSelectedChoice === selectedSheet.questions[selectedQuestionIdx].correctIndex 
                          ? '✅ CORRECT ANSWER! Well done.' 
                          : '❌ INCORRECT! Learn the steps first.'}
                      </span>
                      <button 
                        onClick={() => { playClickChime(); setUserSelectedChoice(null); }}
                        className="text-[10px] text-[#078930] font-black uppercase hover:underline"
                      >
                        Reset Choice
                      </button>
                    </div>
                  )}

                  {/* AI Copilot solvers block */}
                  <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">&rarr; Active past paper AI integrations:</p>
                    
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() => handleAISolve('clue')}
                        disabled={aiLoading}
                        className="px-4.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl text-xs font-bold uppercase transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <HelpCircle className="w-4 h-4 shrink-0" />
                        <span>Get Analytical Hint</span>
                      </button>
                      <button
                        onClick={() => handleAISolve('solution')}
                        disabled={aiLoading}
                        className="px-4.5 py-2.5 bg-[#078930] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer transition disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                      >
                        <Bot className="w-4 h-4 shrink-0" />
                        <span>Step-by-Step AI Solver</span>
                      </button>
                    </div>

                    {/* AI explanation readout container */}
                    <AnimatePresence mode="wait">
                      {aiLoading && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-2">
                          <div className="w-8 h-8 rounded-full border-2 border-indigo-650 border-t-transparent animate-spin" />
                          <p className="text-[11px] text-slate-400 font-mono animate-pulse">Computing symbolic integrations, mapping concord rules...</p>
                        </div>
                      )}

                      {!aiLoading && aiResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150 px-3 py-2 rounded-xl text-indigo-705 dark:text-indigo-405 text-xs font-bold font-mono">
                            <span>👨‍💻 {aiMode === 'solution' ? 'Step-by-Step AI Formula Solver' : 'Concept Guide Clues'}</span>
                            <button onClick={() => setAiResult('')} className="hover:underline text-[10px]">Close Readout</button>
                          </div>

                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#07080c] border border-slate-200 dark:border-zinc-850 text-xs leading-relaxed whitespace-pre-wrap font-sans overflow-x-auto max-h-[300px]">
                            {aiResult}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              )}

            </div>
          ) : (
            <div className="bg-white dark:bg-[#0c0d12] border border-slate-205 dark:border-zinc-805 p-8 rounded-2xl shadow-sm text-center space-y-4">
              <Award className="w-12 h-12 text-indigo-600 mx-auto animate-pulse" />
              <h3 className="font-serif font-black text-lg text-slate-805 dark:text-white">Past Entrance & University papers Solver</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-400 max-w-sm mx-auto">
                Ready to crack Calculus midterm derivations, Thermodynamics vectors, and relative grammar clauses. Select any university paper on the left to start.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
