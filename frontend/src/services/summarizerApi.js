const PHASE_SEQUENCE = [
  { phase: "uploading", progress: 20, delayMs: 350 },
  { phase: "summarizing", progress: 68, delayMs: 900 },
  { phase: "translating", progress: 92, delayMs: 700 },
];

const TOPIC_DICTIONARY = [
  { topic: "Oncology", keywords: ["cancer", "tumor", "oncology", "carcinoma", "metastasis"] },
  { topic: "Cardiology", keywords: ["heart", "cardio", "myocardial", "stroke", "hypertension"] },
  { topic: "Diabetology", keywords: ["diabetes", "insulin", "glycemic", "glucose", "metformin"] },
  { topic: "Neurology", keywords: ["neuro", "brain", "parkinson", "alzheimer", "seizure"] },
  { topic: "Pulmonology", keywords: ["lung", "asthma", "copd", "respiratory", "pulmonary"] },
  { topic: "Infectious Disease", keywords: ["infection", "viral", "bacterial", "covid", "sepsis"] },
  { topic: "General Medicine", keywords: [] },
];

const ENGLISH_TEMPLATES = {
  Oncology: {
    core: "The paper evaluates current oncology interventions with emphasis on response variation across patient cohorts.",
    evidence:
      "Results indicate that multimodal treatment pathways improve progression-related outcomes in high-risk groups.",
    impact:
      "The findings support precision oncology and recommend stratified follow-up planning for recurrence reduction.",
  },
  Cardiology: {
    core: "The study reviews cardiovascular risk pathways and intervention effects in acute and chronic settings.",
    evidence:
      "Evidence highlights stronger outcomes when pharmacologic control is combined with structured lifestyle management.",
    impact: "The paper recommends early risk scoring and longitudinal monitoring to reduce recurrent events.",
  },
  Diabetology: {
    core: "The manuscript summarizes diabetes care models with focus on metabolic control and complication prevention.",
    evidence:
      "Findings show improved glycemic stability when continuous monitoring is paired with personalized medication adjustments.",
    impact:
      "The study suggests integrated endocrine care to lower long-term renal and cardiovascular burden.",
  },
  Neurology: {
    core: "The article discusses neurologic disease progression markers and treatment timing windows.",
    evidence: "Data suggest earlier intervention correlates with better function retention in progressive disorders.",
    impact: "The paper advocates protocolized screening and rehabilitation support for quality-of-life improvement.",
  },
  Pulmonology: {
    core: "The document analyzes respiratory disease management with attention to exacerbation control pathways.",
    evidence:
      "Clinical outcomes improve when inhaled therapy optimization is combined with trigger-avoidance education.",
    impact: "The findings support proactive outpatient monitoring and rapid escalation for acute deterioration.",
  },
  "Infectious Disease": {
    core: "The study examines transmission dynamics, severity predictors, and treatment sequencing.",
    evidence: "Results show that early diagnostics and targeted therapy reduce severe complications.",
    impact: "The paper emphasizes surveillance-informed protocols and coordinated response planning.",
  },
  "General Medicine": {
    core: "The paper reports broad clinical observations relevant to multidisciplinary medical practice.",
    evidence: "Outcomes suggest a consistent benefit from guideline adherence and regular reassessment.",
    impact: "The findings reinforce coordinated care pathways and patient-specific decision support.",
  },
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeText(value) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function detectTopicFromFile(file) {
  const normalizedName = normalizeText(file.name);

  for (const item of TOPIC_DICTIONARY) {
    if (item.keywords.some((keyword) => normalizedName.includes(keyword))) {
      return item.topic;
    }
  }

  return "General Medicine";
}

function getPublicationYear(file) {
  const matches = file.name.match(/(19|20)\d{2}/g);

  if (!matches || matches.length === 0) {
    return undefined;
  }

  const numericYears = matches
    .map((value) => Number(value))
    .filter((year) => year >= 1900 && year <= new Date().getFullYear());

  return numericYears.length > 0 ? numericYears[numericYears.length - 1] : undefined;
}

function buildMockEnglishSummary(file, topic, publicationYear) {
  const sizeInKb = Math.max(1, Math.round(file.size / 1024));
  const template = ENGLISH_TEMPLATES[topic] || ENGLISH_TEMPLATES["General Medicine"];

  return [
    `Document: ${file.name} (${sizeInKb} KB).`,
    publicationYear
      ? `Publication signal detected: ${publicationYear}.`
      : "Publication year was not detected from the file name.",
    template.core,
    template.evidence,
    template.impact,
  ].join(" ");
}

function buildMockSinhalaSummary(topic, publicationYear) {
  const yearText = publicationYear
    ? `${publicationYear} දත්ත සලකා බැලූ විට`
    : "ප්‍රකාශන වර්ෂය නිශ්චිතව හඳුනාගත නොහැකි වුවද";

  return `${topic} විෂයය සඳහා ඉංග්‍රීසි සාරාංශයට අනුකූල සිංහල සාරාංශය සකස් කර ඇත. ${yearText}, රෝග කළමනාකරණය, ප්‍රතිකාර ප්‍රතිඵල සහ භාවිතා කළ හැකි වෛද්‍ය නිර්දේශ පිළිබඳ ප්‍රධාන කරුණු ඉස්මතු කරයි.`;
}

function buildKeyFindings(topic) {
  const entries = {
    Oncology: [
      "Risk-stratified treatment improves progression outcomes.",
      "Response variation between cohorts requires personalized care planning.",
      "Adaptive follow-up is critical for recurrence prevention.",
    ],
    Cardiology: [
      "Combined lifestyle and pharmacologic control gives better outcomes.",
      "Early risk scoring improves triage quality.",
      "Long-term follow-up reduces recurrent cardiovascular events.",
    ],
    Diabetology: [
      "Continuous monitoring improves glycemic stability.",
      "Personalized medication plans reduce severe glucose fluctuations.",
      "Integrated care can lower renal and cardiovascular risk.",
    ],
    Neurology: [
      "Earlier intervention supports better function retention.",
      "Standardized screening improves early detection pathways.",
      "Rehabilitation support increases long-term quality of life.",
    ],
    Pulmonology: [
      "Exacerbation prevention lowers emergency admissions.",
      "Inhaler optimization remains a high-impact intervention.",
      "Rapid escalation plans improve acute respiratory outcomes.",
    ],
    "Infectious Disease": [
      "Early diagnostics reduce severe complication risk.",
      "Targeted treatment sequencing improves response reliability.",
      "Surveillance-informed protocols strengthen outbreak control.",
    ],
    "General Medicine": [
      "Guideline adherence improves consistency of care.",
      "Periodic reassessment supports better clinical decisions.",
      "Multidisciplinary collaboration increases treatment quality.",
    ],
  };

  return entries[topic] || entries["General Medicine"];
}

async function runMockPipeline(file, options) {
  for (const step of PHASE_SEQUENCE) {
    options.onPhaseChange(step.phase, step.progress);
    await sleep(step.delayMs + Math.round(Math.random() * 300));
  }

  const topic = detectTopicFromFile(file);
  const publicationYear = getPublicationYear(file);

  return {
    topic,
    publicationYear,
    confidence: 0.9,
    keyFindings: buildKeyFindings(topic),
    englishSummary: buildMockEnglishSummary(file, topic, publicationYear),
    sinhalaSummary: buildMockSinhalaSummary(topic, publicationYear),
  };
}

async function runApiPipeline(file, options) {
  const endpoint = options.apiBaseUrl.trim();

  if (!endpoint) {
    throw new Error("API base URL is required when demo mode is disabled.");
  }

  options.onPhaseChange("uploading", 18);

  const payload = new FormData();
  payload.append("file", file);

  const response = await fetch(`${endpoint.replace(/\/$/, "")}/summarize`, {
    method: "POST",
    body: payload,
  });

  options.onPhaseChange("summarizing", 74);

  if (!response.ok) {
    throw new Error(`Summarization API returned ${response.status}.`);
  }

  const data = await response.json();

  if (!data.englishSummary || !data.sinhalaSummary) {
    throw new Error("API response is missing englishSummary or sinhalaSummary.");
  }

  options.onPhaseChange("translating", 94);

  return {
    topic: data.topic || detectTopicFromFile(file),
    publicationYear: data.publicationYear || getPublicationYear(file),
    confidence: data.confidence || 0.85,
    keyFindings: data.keyFindings || buildKeyFindings(data.topic || "General Medicine"),
    englishSummary: data.englishSummary,
    sinhalaSummary: data.sinhalaSummary,
  };
}

export async function summarizeDocument(file, options) {
  if (options.useMock) {
    return runMockPipeline(file, options);
  }

  return runApiPipeline(file, options);
}
