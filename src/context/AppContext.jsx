import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

// Generate mock analysis data
function generateMockFrames(count = 5, mediaType = 'image') {
  const genders = ['male', 'female', 'male', 'female', 'male'];
  const roles = ['leadership', 'support', 'technical', 'management', 'creative'];
  const activities = ['presentation', 'discussion', 'analysis', 'collaboration', 'decision-making'];
  const emotions = ['confident', 'focused', 'engaged', 'neutral', 'enthusiastic'];

  return Array.from({ length: count }, (_, i) => ({
    screen_id: i + 1,
    timestamp: mediaType === 'video' ? `${String(Math.floor(i * 10 / 60)).padStart(2, '0')}:${String((i * 10) % 60).padStart(2, '0')}` : null,
    gender: genders[i % genders.length],
    role: roles[i % roles.length],
    activity: activities[i % activities.length],
    emotion: emotions[i % emotions.length],
    confidence: +(0.7 + Math.random() * 0.27).toFixed(2),
    face_count: Math.floor(1 + Math.random() * 3),
    age_group: ['18-25', '26-35', '36-45', '46+'][Math.floor(Math.random() * 4)],
  }));
}

function calculateBiasMetrics(frames) {
  const genderCounts = frames.reduce((acc, f) => {
    acc[f.gender] = (acc[f.gender] || 0) + 1;
    return acc;
  }, {});

  const total = frames.length;
  const malePct = (genderCounts.male || 0) / total;
  const femalePct = (genderCounts.female || 0) / total;
  const imbalance = Math.abs(malePct - femalePct);
  const biasScore = +imbalance.toFixed(2);

  const leadershipFrames = frames.filter(f => f.role === 'leadership');
  const maleLeadership = leadershipFrames.filter(f => f.gender === 'male').length;
  const totalLeadership = leadershipFrames.length || 1;
  const representationIndex = +(1 - Math.abs(maleLeadership / totalLeadership - 0.5) * 2).toFixed(2);

  return {
    bias_score: biasScore,
    representation_index: representationIndex,
    gender_distribution: {
      male: genderCounts.male || 0,
      female: genderCounts.female || 0,
    },
    role_distribution: frames.reduce((acc, f) => {
      acc[f.role] = (acc[f.role] || 0) + 1;
      return acc;
    }, {}),
    emotion_distribution: frames.reduce((acc, f) => {
      acc[f.emotion] = (acc[f.emotion] || 0) + 1;
      return acc;
    }, {}),
    avg_confidence: +(frames.reduce((sum, f) => sum + f.confidence, 0) / frames.length).toFixed(2),
  };
}

export function AppProvider({ children }) {
  const [currentReport, setCurrentReport] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('bias_history');
    if (stored) {
      try { setHistory(JSON.parse(stored)); } catch {}
    }
  }, []);

  const saveToHistory = (report) => {
    setHistory(prev => {
      const updated = [report, ...prev].slice(0, 20);
      localStorage.setItem('bias_history', JSON.stringify(updated));
      return updated;
    });
  };

  const analyze = async (mediaInfo) => {
    setAnalyzing(true);
    setUploadProgress(0);
    setCurrentReport(null);

    const steps = [
      { msg: 'Uploading media...', progress: 20 },
      { msg: 'Extracting frames...', progress: 40 },
      { msg: 'Running multimodal inference...', progress: 60 },
      { msg: 'Calculating bias metrics...', progress: 80 },
      { msg: 'Generating report...', progress: 95 },
    ];

    for (const step of steps) {
      setAnalysisStep(step.msg);
      setUploadProgress(step.progress);
      await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
    }

    const frameCount = mediaInfo.type === 'video' ? 8 : 1;
    const frames = generateMockFrames(frameCount, mediaInfo.type);
    const metrics = calculateBiasMetrics(frames);

    const report = {
      id: 'report_' + Date.now(),
      created_at: new Date().toISOString(),
      media_name: mediaInfo.name || 'URL Input',
      media_type: mediaInfo.type,
      media_url: mediaInfo.previewUrl || null,
      frames,
      ...metrics,
    };

    setUploadProgress(100);
    await new Promise(r => setTimeout(r, 300));
    setCurrentReport(report);
    saveToHistory(report);
    setAnalyzing(false);
    setAnalysisStep('');
    return report;
  };

  const deleteReport = (id) => {
    setHistory(prev => {
      const updated = prev.filter(r => r.id !== id);
      localStorage.setItem('bias_history', JSON.stringify(updated));
      return updated;
    });
    if (currentReport?.id === id) setCurrentReport(null);
  };

  const clearCurrentReport = () => setCurrentReport(null);

  return (
    <AppContext.Provider value={{
      currentReport,
      analyzing,
      uploadProgress,
      analysisStep,
      history,
      analyze,
      deleteReport,
      clearCurrentReport,
      setCurrentReport,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
