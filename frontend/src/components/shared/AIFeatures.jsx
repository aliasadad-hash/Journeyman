import { useState } from 'react';
import { api } from '../../utils/api';
import * as Icons from './Icons';

export const AIBioGenerator = ({ onBioGenerated, currentBio }) => {
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState('confident');
  const [generatedBio, setGeneratedBio] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const styles = [
    { value: 'confident', label: 'Confident', icon: '💪' },
    { value: 'playful', label: 'Playful', icon: '😏' },
    { value: 'mysterious', label: 'Mysterious', icon: '🌙' },
    { value: 'romantic', label: 'Romantic', icon: '💝' }
  ];

  const generateBio = async () => {
    setLoading(true);
    try {
      const response = await api.post('/ai/generate-bio', { style });
      setGeneratedBio(response.bio);
    } catch (err) {
      console.error('Failed to generate bio:', err);
      alert('Failed to generate bio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const useBio = () => {
    if (generatedBio) {
      onBioGenerated(generatedBio);
      setGeneratedBio('');
      setShowOptions(false);
    }
  };

  return (
    <div className="ai-bio-generator" data-testid="ai-bio-generator">
      {!showOptions ? (
        <button
          type="button"
          onClick={() => setShowOptions(true)}
          className="btn-secondary w-full flex items-center justify-center gap-2 py-2"
          data-testid="ai-generate-btn"
        >
          <Icons.Sparkles size={18} className="text-[var(--brand-gold)]" />
          <span>Generate Bio with AI</span>
        </button>
      ) : (
        <div className="space-y-4 p-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--brand-gold)]/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold flex items-center gap-2">
              <Icons.Sparkles size={16} className="text-[var(--brand-gold)]" />
              AI Bio Generator
            </span>
            <button 
              type="button"
              onClick={() => setShowOptions(false)}
              className="text-[var(--text-secondary)] hover:text-white"
            >
              <Icons.X size={18} />
            </button>
          </div>

          {/* Style selector */}
          <div className="grid grid-cols-2 gap-2">
            {styles.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStyle(s.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  style === s.value 
                    ? 'bg-[var(--brand-gold)] text-[var(--background)]' 
                    : 'bg-[var(--secondary)] hover:bg-[var(--secondary)]/80'
                }`}
                data-testid={`style-${s.value}`}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={generateBio}
            disabled={loading}
            className="btn-primary w-full py-2 flex items-center justify-center gap-2"
            data-testid="generate-bio-btn"
          >
            {loading ? (
              <>
                <div className="spinner-small" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Icons.Sparkles size={18} />
                <span>Generate {style.charAt(0).toUpperCase() + style.slice(1)} Bio</span>
              </>
            )}
          </button>

          {/* Generated bio preview */}
          {generatedBio && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-3 rounded-lg bg-[var(--background)] border border-[var(--brand-gold)]/30">
                <p className="text-sm italic text-[var(--text-secondary)]">Preview:</p>
                <p className="mt-1">{generatedBio}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={generateBio}
                  className="btn-secondary flex-1 py-2 text-sm"
                  disabled={loading}
                >
                  <Icons.RefreshCw size={14} className="inline mr-1" /> Regenerate
                </button>
                <button
                  type="button"
                  onClick={useBio}
                  className="btn-primary flex-1 py-2 text-sm"
                  data-testid="use-bio-btn"
                >
                  <Icons.Check size={14} className="inline mr-1" /> Use This
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const AIIceBreakers = ({ matchUserId, matchName }) => {
  const [loading, setLoading] = useState(false);
  const [iceBreakers, setIceBreakers] = useState([]);
  const [show, setShow] = useState(false);

  const generateIceBreakers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/ai/ice-breakers/${matchUserId}`);
      setIceBreakers(response.ice_breakers || []);
      setShow(true);
    } catch (err) {
      console.error('Failed to generate ice breakers:', err);
      alert('Failed to generate conversation starters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  if (!show) {
    return (
      <button
        onClick={generateIceBreakers}
        disabled={loading}
        className="btn-secondary text-sm px-3 py-1 flex items-center gap-2"
        data-testid="ice-breaker-btn"
      >
        {loading ? (
          <div className="spinner-small" />
        ) : (
          <Icons.MessageCircle size={14} />
        )}
        <span>Need a conversation starter?</span>
      </button>
    );
  }

  return (
    <div className="ice-breakers-panel p-3 rounded-xl bg-[var(--secondary)]/50 space-y-2" data-testid="ice-breakers-panel">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--brand-gold)]">
          <Icons.Sparkles size={12} className="inline mr-1" />
          AI Conversation Starters for {matchName}
        </span>
        <button onClick={() => setShow(false)} className="text-[var(--text-secondary)] hover:text-white">
          <Icons.X size={14} />
        </button>
      </div>
      {iceBreakers.map((breaker, index) => (
        <button
          key={index}
          onClick={() => copyToClipboard(breaker)}
          className="w-full text-left p-2 rounded-lg bg-[var(--background)] hover:bg-[var(--secondary)] transition-colors text-sm"
        >
          <span className="text-[var(--brand-gold)] mr-2">💬</span>
          {breaker}
          <Icons.Copy size={12} className="inline ml-2 opacity-50" />
        </button>
      ))}
    </div>
  );
};

export const AICompatibilityScore = ({ userId, userName }) => {
  const [loading, setLoading] = useState(false);
  const [compatibility, setCompatibility] = useState(null);
  const [show, setShow] = useState(false);

  const calculateCompatibility = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/ai/compatibility/${userId}`);
      setCompatibility(response);
      setShow(true);
    } catch (err) {
      console.error('Failed to calculate compatibility:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-[var(--brand-gold)]';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  if (!show) {
    return (
      <button
        onClick={calculateCompatibility}
        disabled={loading}
        className="text-xs text-[var(--brand-gold)] hover:underline flex items-center gap-1"
        data-testid="compatibility-btn"
      >
        {loading ? (
          <div className="spinner-small" />
        ) : (
          <Icons.Sparkles size={12} />
        )}
        <span>AI Match Score</span>
      </button>
    );
  }

  return (
    <div className="compatibility-panel p-3 rounded-xl bg-gradient-to-br from-[var(--brand-gold)]/10 to-transparent border border-[var(--brand-gold)]/20 space-y-2 animate-scale-in" data-testid="compatibility-panel">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">AI Compatibility with {userName}</span>
        <button onClick={() => setShow(false)} className="text-[var(--text-secondary)]">
          <Icons.X size={14} />
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        <div className={`text-3xl font-bold ${getScoreColor(compatibility?.score)}`}>
          {compatibility?.score}%
        </div>
        <div className="flex-1 h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--brand-gold)] rounded-full transition-all duration-500"
            style={{ width: `${compatibility?.score}%` }}
          />
        </div>
      </div>

      {compatibility?.reasons?.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-[var(--text-secondary)]">Why you match:</p>
          {compatibility.reasons.slice(0, 2).map((reason, i) => (
            <p key={i} className="text-xs flex items-start gap-1">
              <span className="text-green-400">✓</span> {reason}
            </p>
          ))}
        </div>
      )}

      {compatibility?.conversation_topics?.length > 0 && (
        <div className="pt-2 border-t border-[var(--secondary)]">
          <p className="text-xs text-[var(--text-secondary)] mb-1">Talk about:</p>
          <div className="flex flex-wrap gap-1">
            {compatibility.conversation_topics.slice(0, 3).map((topic, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[var(--brand-gold)]/20 text-[var(--brand-gold)]">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
