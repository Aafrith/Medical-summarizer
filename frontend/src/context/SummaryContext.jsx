import { createContext, useContext, useMemo, useState } from "react";
import { summarizeDocument } from "../services/summarizerApi";
import { validateFile } from "../utils/fileUtils";
import { useAuth } from "./AuthContext";

const SummaryContext = createContext();

export function useSummary() {
  return useContext(SummaryContext);
}

function createJob(file) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    file,
    phase: "queued",
    progress: 0,
    startedAt: null,
    completedAt: null,
    result: null,
    error: null,
  };
}

export function SummaryProvider({ children }) {
  const { authToken } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [notice, setNotice] = useState("");

  const pendingJobs = jobs.filter((job) => job.phase === "queued" || job.phase === "error");
  const completedJobs = jobs.filter((job) => job.phase === "completed" && job.result);
  const failedJobs = jobs.filter((job) => job.phase === "error");

  const overallProgress = useMemo(() => {
    if (jobs.length === 0) return 0;
    const total = jobs.reduce((sum, job) => sum + job.progress, 0);
    return Math.round(total / jobs.length);
  }, [jobs]);

  const updateJob = (jobId, patch) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) => {
        if (job.id !== jobId) return job;
        if (typeof patch === "function") return patch(job);
        return { ...job, ...patch };
      })
    );
  };

  const addFiles = (incomingFiles) => {
    if (isRunning) return;
    const incoming = Array.isArray(incomingFiles) ? incomingFiles : Array.from(incomingFiles || []);
    if (incoming.length === 0) return;

    const errors = [];
    setJobs((prevJobs) => {
      const nextJobs = [...prevJobs];
      const existingSignatures = new Set(
        prevJobs.map((job) => `${job.file.name.toLowerCase()}__${job.file.size}`)
      );

      for (const file of incoming) {
        const signature = `${file.name.toLowerCase()}__${file.size}`;
        const validationError = validateFile(file);

        if (validationError) {
          errors.push(`${file.name}: ${validationError}`);
          continue;
        }

        if (existingSignatures.has(signature)) {
          errors.push(`${file.name}: duplicate file skipped.`);
          continue;
        }

        existingSignatures.add(signature);
        nextJobs.push(createJob(file));
      }
      return nextJobs;
    });

    if (errors.length > 0) {
      setNotice(errors.slice(0, 4).join(" "));
      return;
    }
    setNotice(`${incoming.length} document(s) added for processing.`);
  };

  const runOne = async (job, config) => {
    updateJob(job.id, {
      phase: "processing",
      progress: 10,
      startedAt: Date.now(),
      completedAt: null,
      error: null,
      result: null,
    });

    try {
      const result = await summarizeDocument(job.file, {
        ...config,
        onPhaseChange: (phase, progress) => {
          updateJob(job.id, { phase, progress });
        },
      });

      updateJob(job.id, {
        phase: "completed",
        progress: 100,
        completedAt: Date.now(),
        result,
        error: null,
      });
      return { ok: true };
    } catch (error) {
      updateJob(job.id, {
        phase: "error",
        progress: 100,
        completedAt: Date.now(),
        result: null,
        error: error instanceof Error ? error.message : "Failed to summarize this document.",
      });
      return { ok: false };
    }
  };

  const startProcessing = async (jobIds) => {
    if (isRunning) return;

    const selectedIds = jobIds ? new Set(jobIds) : null;
    const targetJobs = jobs.filter((job) => {
      const phaseEligible = job.phase === "queued" || job.phase === "error";
      if (!phaseEligible) return false;
      return selectedIds ? selectedIds.has(job.id) : true;
    });

    if (targetJobs.length === 0) {
      setNotice("No documents are currently waiting for processing.");
      return;
    }

    if (!authToken) {
      setNotice("Your session has expired. Please sign in again.");
      return;
    }

    setIsRunning(true);
    setNotice(`Preparing summaries for ${targetJobs.length} document(s)...`);

    const config = { token: authToken };
    const outcomes = await Promise.all(targetJobs.map((job) => runOne(job, config)));

    setIsRunning(false);
    const hasErrors = outcomes.some((item) => !item.ok);
    if (hasErrors) {
      setNotice("Processing completed with a few issues. Please retry affected documents.");
      return;
    }
    setNotice("Processing completed successfully. English and Sinhala summaries are ready.");
  };

  const retryOne = (jobId) => {
    startProcessing([jobId]);
  };

  const removeJob = (jobId) => {
    if (isRunning) return;
    setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
  };

  const clearAll = () => {
    if (isRunning) return;
    setJobs([]);
    setNotice("All documents have been removed.");
  };

  const clearCompleted = () => {
    if (isRunning) return;
    setJobs((prevJobs) => prevJobs.filter((job) => job.phase !== "completed"));
    setNotice("Ready documents have been removed from the list.");
  };

  const value = {
    jobs,
    isRunning,
    notice,
    pendingJobs,
    completedJobs,
    failedJobs,
    overallProgress,
    addFiles,
    startProcessing,
    retryOne,
    removeJob,
    clearAll,
    clearCompleted,
    setNotice,
  };

  return <SummaryContext.Provider value={value}>{children}</SummaryContext.Provider>;
}
