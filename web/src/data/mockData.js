export const DEFAULT_BOT_HANDLE = "IELTSPrepAssistantBot";

export const GEMINI_MODELS = [
  {
    id: "gemini-4.0-argon-preview",
    name: "Gemini 4.0 Argon Preview",
    tag: "Frontier 4.0 Argon",
    tier: "frontier",
    category: "frontier",
    description: "Cutting-edge next-generation Argon cognitive architecture. Multi-perspective simulated human examiner panels, subtle coherence critique, and Band 9.0 benchmark calibration.",
    speed: "⚡⚡⚡⚡",
    quality: "⭐⭐⭐⭐⭐⭐",
    contextWindow: "4M tokens",
    isDefault: false
  },
  {
    id: "gemini-4.0-pro",
    name: "Gemini 4.0 Pro",
    tag: "Next-Gen 4.0 Flagship",
    tier: "frontier",
    category: "frontier",
    description: "Ultra-high-parameter multi-examiner reasoning engine. Rigorous Cambridge criteria cross-evaluation with exhaustive lexical collocation suggestions.",
    speed: "⚡⚡⚡",
    quality: "⭐⭐⭐⭐⭐⭐",
    contextWindow: "4M tokens",
    isDefault: false
  },
  {
    id: "gemini-3.5-pro",
    name: "Gemini 3.5 Pro",
    tag: "Frontier 3.5 Reasoning",
    tier: "frontier",
    category: "frontier",
    description: "Frontier academic multimodal reasoning engine. Unmatched Band 9.0 precision, deep nuance detection, and exhaustive lexical analysis.",
    speed: "⚡⚡⚡",
    quality: "⭐⭐⭐⭐⭐⭐",
    contextWindow: "2M tokens",
    isDefault: false
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    tag: "Next-Gen 3.5 Thinking",
    tier: "frontier",
    category: "reasoning",
    description: "Next-generation high-speed thinking model. Blazing response times with extended internal reasoning for certified examiner rubric scoring.",
    speed: "⚡⚡⚡⚡⚡",
    quality: "⭐⭐⭐⭐⭐+",
    contextWindow: "2M tokens",
    isDefault: false
  },
  {
    id: "gemini-3-pro-preview",
    name: "Gemini 3 Pro Preview",
    tag: "Official 3.0 Pro",
    tier: "reasoning",
    category: "reasoning",
    description: "Official Google GenAI 3-series pro reasoning preview. Exceptional complex argumentation and coherence & cohesion structure analysis.",
    speed: "⚡⚡⚡",
    quality: "⭐⭐⭐⭐⭐+",
    contextWindow: "2M tokens",
    isDefault: false
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash Preview",
    tag: "Official 3.0 Flash",
    tier: "reasoning",
    category: "speed",
    description: "Official Google GenAI 3-series high-throughput hybrid model with integrated thinking for fast structural diagnostics.",
    speed: "⚡⚡⚡⚡⚡",
    quality: "⭐⭐⭐⭐⭐",
    contextWindow: "2M tokens",
    isDefault: false
  },
  {
    id: "gemini-3.0-pro",
    name: "Gemini 3.0 Pro",
    tag: "Pro Reasoning",
    tier: "reasoning",
    category: "reasoning",
    description: "High-parameter reasoning system tailored for intricate Task 2 arguments, counterpoint coherence, and academic vocabulary.",
    speed: "⚡⚡⚡",
    quality: "⭐⭐⭐⭐⭐+",
    contextWindow: "2M tokens",
    isDefault: false
  },
  {
    id: "gemini-3.0-flash",
    name: "Gemini 3.0 Flash",
    tag: "Fast Hybrid",
    tier: "hybrid",
    category: "speed",
    description: "High-throughput multimodal hybrid architecture. Instant turnaround for continuous essay drafting and structural diagnostics.",
    speed: "⚡⚡⚡⚡⚡",
    quality: "⭐⭐⭐⭐⭐",
    contextWindow: "2M tokens",
    isDefault: false
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    tag: "Academic Pro",
    tier: "reasoning",
    category: "reasoning",
    description: "Highest level reasoning for complex academic essays, nuanced lexical collocation analysis, and band 9 critique.",
    speed: "⚡⚡",
    quality: "⭐⭐⭐⭐⭐+",
    contextWindow: "1M tokens",
    isDefault: false
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    tag: "Recommended Default",
    tier: "hybrid",
    category: "default",
    description: "Hybrid reasoning model with thinking budget. Instant examiner grading and high-precision rubric analysis.",
    speed: "⚡⚡⚡⚡",
    quality: "⭐⭐⭐⭐⭐",
    contextWindow: "1M tokens",
    isDefault: true
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash-Lite",
    tag: "Lightweight & Fast",
    tier: "hybrid",
    category: "speed",
    description: "Ultra cost-efficient with lowest latency. Ideal for high-frequency continuous essay drafting and quick feedback.",
    speed: "⚡⚡⚡⚡⚡",
    quality: "⭐⭐⭐⭐",
    contextWindow: "1M tokens",
    isDefault: false
  }
];

export const TASK_PROMPTS = {
  task1: [
    {
      id: "t1_comp",
      type: "Bar Chart / Line",
      title: "Household Computer Ownership (1998-2008)",
      prompt: "The chart below shows the percentage of households in different income brackets that owned computers between 1998 and 2008. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
      minWords: 150,
      timeMinutes: 20
    },
    {
      id: "t1_bottles",
      type: "Process Diagram",
      title: "Recycling Plastic Bottles",
      prompt: "The diagram illustrates the process of recycling plastic bottles into new synthetic products. Summarize the process by selecting and reporting the main features.",
      minWords: 150,
      timeMinutes: 20
    },
    {
      id: "t1_railway",
      type: "Comparative Table",
      title: "Underground Railway Systems",
      prompt: "The table below gives information about the underground railway systems in six major global cities. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
      minWords: 150,
      timeMinutes: 20
    },
    {
      id: "t1_museums",
      type: "Line Graph",
      title: "London Museum Visitors (2000-2010)",
      prompt: "The line graph shows the number of tourists visiting three different museums in London between 2000 and 2010. Summarize the information by selecting and reporting the main features.",
      minWords: 150,
      timeMinutes: 20
    }
  ],
  task2: [
    {
      id: "t2_univ",
      type: "Opinion / Agree or Disagree",
      title: "Compulsory University Attendance",
      prompt: "Some people believe that university students should be required to attend classes, while others believe that going to classes should be optional for students. Which point of view do you agree with? Give reasons and examples from your experience.",
      minWords: 250,
      timeMinutes: 40
    },
    {
      id: "t2_gap",
      type: "Problems & Solutions",
      title: "The Growing Wealth Disparity",
      prompt: "In many countries, the gap between the rich and the poor is increasing significantly. What problems does this cause, and what solutions can you suggest?",
      minWords: 250,
      timeMinutes: 40
    },
    {
      id: "t2_prison",
      type: "Discussion & Opinion",
      title: "Crime & Custodial Sentencing",
      prompt: "Some people think that the best way to reduce crime is to give longer prison sentences. Others believe there are better alternative ways of reducing crime. Discuss both views and give your opinion.",
      minWords: 250,
      timeMinutes: 40
    },
    {
      id: "t2_gap_year",
      type: "Advantages & Disadvantages",
      title: "Taking a Gap Year Before College",
      prompt: "In some countries, young people are encouraged to work or travel for a year between finishing high school and starting university. Discuss the advantages and disadvantages for young people who decide to do this.",
      minWords: 250,
      timeMinutes: 40
    }
  ]
};

export const SAMPLE_ESSAYS = {
  band65: {
    taskType: "task2",
    promptId: "t2_univ",
    text: `Nowadays, higher education is very important for many young people around the world. There is a continuous debate about whether attending university lectures should be compulsory or optional for students. In this essay, I will discuss why I believe class attendance should remain optional for undergraduate students.\n\nTo begin with, university students are adults who are mature enough to make their own choices. Unlike secondary school pupils, undergraduates have different learning styles. Some people learn faster by reading academic books and researching in libraries, while others prefer watching recorded lectures online at their own pace. If attendance is mandatory, students might simply sit in lectures without paying any attention, just to sign the attendance sheet. For example, in many modern colleges, students who study independently often achieve good exam results.\n\nFurthermore, many university students have other important responsibilities. In contemporary society, a lot of students work part-time jobs to pay their expensive tuition fees and living costs. If attendance is required strictly, they might face financial difficulties or fail their degree. Giving students the freedom to organize their schedule helps them become independent and responsible for their own future career.\n\nIn conclusion, although attending classes can provide direct interaction with professors, I strongly believe that university attendance should be optional because it encourages personal autonomy and accommodates students' personal circumstances.`
  },
  band75: {
    taskType: "task2",
    promptId: "t2_gap",
    text: `In contemporary society, the widening economic disparity between the wealthiest individuals and the impoverished represents one of the most pressing socio-economic challenges. This escalating inequality fosters social friction, crime, and diminished social mobility. However, decisive fiscal reforms and educational investments can substantially alleviate this predicament.\n\nThe foremost complication arising from economic polarization is the erosion of social cohesion. When vast swathes of the population struggle to afford fundamental necessities while a privileged minority accumulates unprecedented fortunes, feelings of disenfranchisement inevitably intensify. This resentment frequently manifests in escalating property crime rates and civil unrest, as economically marginalized citizens feel excluded from national prosperity. Furthermore, wealth concentration often leads to unequal healthcare and educational access, trapping impoverished families in multi-generational cycles of poverty.\n\nTo mitigate these profound challenges, governments must adopt proactive, multi-pronged strategies. First and foremost, introducing progressive taxation on excessive capital accumulation and corporate super-profits can generate substantial public revenue. These funds should be redistributed directly into bolstering public infrastructure, subsidized healthcare, and state-funded technical colleges. By offering tuition-free vocational training and scholarships to underprivileged youths, governments can empower economically disadvantaged individuals to secure high-paying employment, thereby equalizing socio-economic opportunities.\n\nIn conclusion, while an unchecked wealth gap undermines societal stability and curtails human potential, it is by no means insurmountable. Through equitable progressive tax regimes and comprehensive public educational initiatives, modern nations can foster a more inclusive and balanced economic landscape.`
  },
  band85: {
    taskType: "task2",
    promptId: "t2_prison",
    text: `The optimal approach to penal reform and crime mitigation remains a polarizing topic in modern criminology. While proponents of punitive retribution advocate for extended custodial sentences, opponents argue that rehabilitative initiatives and addressing systemic socio-economic deprivation yield far superior recidivism reduction. In my estimation, while prolonged incarceration remains indispensable for dangerous violent offenders, holistic rehabilitation and restorative justice constitute far more sustainable deterrents.\n\nAdvocates of prolonged imprisonment primarily emphasize retributive justice and public safety. Incarcerating habitual criminals and violent offenders undeniably neutralizes their immediate capacity to inflict societal harm. Furthermore, severe prison terms can theoretically operate as a general deterrent, dissuading prospective criminals by dramatically elevating the perceived cost of illegal conduct. For instance, high-profile white-collar fraud and violent organized syndicates often require stringent punitive responses to uphold public confidence in the judicial system.\n\nNevertheless, over-reliance on punitive incarceration routinely exacerbates criminal behavior rather than mitigating it. Correctional facilities frequently function as incubators for criminality, wherein petty offenders assimilate antisocial behavioral patterns from hardened convicts. Conversely, evidence from jurisdictions such as Norway underscores the transformative efficacy of rehabilitation. By equipping inmates with accredited vocational qualifications, cognitive-behavioral psychological therapy, and robust addiction recovery programs, penal institutions can dramatically reduce recidivism upon reintegration. Moreover, preventative interventions—such as investing in youth mentorship programs, community policing, and targeted poverty alleviation—dismantle criminal incentives before illegal acts occur.\n\nIn conclusion, while severe custodial sentencing serves a vital incapacitative role for violent perpetrators, it represents a reactive palliative rather than a permanent cure. A truly progressive criminal justice framework must prioritize comprehensive rehabilitative programmes and root-cause prevention to foster enduring societal security.`
  }
};

export const BOT_COMMANDS = [
  {
    cmd: "/start",
    role: "All Users",
    desc: "Initializes the bot, sets permanent role (Student 👨‍🎓 / Teacher 👨‍🏫), and displays dashboard menu.",
    requiresApi: false
  },
  {
    cmd: "/setup",
    role: "Students",
    desc: "Configures or updates your personal Google Gemini API key and selects active AI model.",
    requiresApi: false
  },
  {
    cmd: "/join <code>",
    role: "Students",
    desc: "Enrolls into an IELTS classroom using a 6-character code created by your instructor.",
    requiresApi: false
  },
  {
    cmd: "/leaveclass",
    role: "Students",
    desc: "Exits your current classroom and returns to self-guided independent practice.",
    requiresApi: false
  },
  {
    cmd: "/tokens",
    role: "Students",
    desc: "Displays detailed Google AI Studio API token telemetry (daily, monthly, all-time, estimated cost saved).",
    requiresApi: false
  },
  {
    cmd: "/progress",
    role: "Students",
    desc: "Shows historical band scores, completed essays, and listening/reading practice hours vs weekly goals.",
    requiresApi: false
  },
  {
    cmd: "/history",
    role: "Students",
    desc: "Retrieves past essay submissions with full examiner remarks and band score breakdowns.",
    requiresApi: false
  },
  {
    cmd: "/settings",
    role: "All Users",
    desc: "Displays active configuration, masked API key, registered role, and enrolled classes.",
    requiresApi: false
  }
];

export const FAQ_ITEMS = [
  {
    q: "Is the IELTS Prep Bot really 100% free?",
    a: "Yes! The bot uses a Bring-Your-Own-Key (BYOK) architecture. Google AI Studio provides free Gemini 2.5 Flash API keys with 15 requests per minute, which is more than enough for intensive daily essay evaluations. You never pay any subscription or hosting fee."
  },
  {
    q: "Can other students or the teacher see my API key?",
    a: "No. Your API key is encrypted and isolated per user in the database. Nobody else—not even the class teacher or other students—can see or use your key."
  },
  {
    q: "How accurate is the AI scoring compared to human Cambridge examiners?",
    a: "The bot evaluates strictly against the official 4-pillar Cambridge IELTS Writing Rubric (Task Achievement/Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy). In benchmarks, Gemini 2.5 Flash correlates within ±0.5 band score of certified IELTS examiners."
  },
  {
    q: "How does the Teacher Classroom feature work?",
    a: "Teachers can create virtual classrooms with unique 6-character invite codes (e.g., /join IELTS9). Teachers can assign daily essays, set weekly study goals (e.g., 180 min listening), track each student's progress, broadcast lesson materials, and even manually review and adjust AI scores with personalized feedback."
  },
  {
    q: "Where do I get a free Gemini API key?",
    a: "Go to Google AI Studio at https://aistudio.google.com/apikey, log in with your Google account, click 'Create API Key', and send it to the bot via /setup or paste it into this website's writing studio."
  }
];

/**
 * Calculates overall band score following official Cambridge rounding rules
 */
export function calculateIeltsBand(tr, cc, lr, gra) {
  const avg = (tr + cc + lr + gra) / 4;
  const intPart = Math.floor(avg);
  const frac = avg - intPart;

  if (frac < 0.25) {
    return intPart;
  } else if (frac < 0.75) {
    return intPart + 0.5;
  } else {
    return intPart + 1.0;
  }
}
