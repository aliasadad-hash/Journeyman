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

export const AIFirstMessage = ({ matchUserId, matchName, onSendMessage }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [tone, setTone] = useState('friendly');
  const [show, setShow] = useState(false);

  const tones = [
    { value: 'friendly', label: 'Friendly', emoji: '😊' },
    { value: 'flirty', label: 'Flirty', emoji: '😏' },
    { value: 'witty', label: 'Witty', emoji: '😎' },
    { value: 'sincere', label: 'Sincere', emoji: '💝' }
  ];

  const generateMessage = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/ai/first-message/${matchUserId}`, { tone });
      setResult(response);
    } catch (err) {
      console.error('Failed to generate first message:', err);
      alert('Failed to generate message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (result?.message && onSendMessage) {
      onSendMessage(result.message);
      setShow(false);
      setResult(null);
    }
  };

  const copyMessage = () => {
    if (result?.message) {
      navigator.clipboard.writeText(result.message);
    }
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold"
        data-testid="ai-first-message-btn"
      >
        <Icons.Sparkles size={18} className="text-[var(--background)]" />
        <span>✨ Generate Perfect First Message</span>
      </button>
    );
  }

  return (
    <div className="ai-first-message p-4 rounded-xl bg-gradient-to-br from-[var(--brand-gold)]/10 via-[var(--secondary)]/50 to-transparent border border-[var(--brand-gold)]/30 space-y-4 animate-scale-in" data-testid="ai-first-message-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.Sparkles size={18} className="text-[var(--brand-gold)]" />
          <span className="font-semibold">AI First Message</span>
        </div>
        <button onClick={() => { setShow(false); setResult(null); }} className="text-[var(--text-secondary)] hover:text-white">
          <Icons.X size={18} />
        </button>
      </div>

      {!result ? (
        <>
          {/* Tone selector */}
          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-2">Select your vibe:</p>
            <div className="grid grid-cols-4 gap-2">
              {tones.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                    tone === t.value 
                      ? 'bg-[var(--brand-gold)] text-[var(--background)]' 
                      : 'bg-[var(--secondary)] hover:bg-[var(--secondary)]/80'
                  }`}
                  data-testid={`tone-${t.value}`}
                >
                  <span className="text-lg">{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generateMessage}
            disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            data-testid="generate-first-message-btn"
          >
            {loading ? (
              <>
                <div className="spinner-small" />
                <span>Crafting the perfect opener...</span>
              </>
            ) : (
              <>
                <Icons.Sparkles size={18} />
                <span>Generate {tone.charAt(0).toUpperCase() + tone.slice(1)} Message for {matchName}</span>
              </>
            )}
          </button>
        </>
      ) : (
        <>
          {/* Generated message */}
          <div className="space-y-3">
            {/* Confidence indicator */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">Response likelihood:</span>
              <div className="flex items-center gap-1">
                {[...Array(10)].map((_, i) => (
                  <div 
                    key={i}
                    className={`w-2 h-2 rounded-full ${i < result.confidence_score ? 'bg-[var(--brand-gold)]' : 'bg-[var(--secondary)]'}`}
                  />
                ))}
                <span className="text-xs ml-1 text-[var(--brand-gold)] font-bold">{result.confidence_score}/10</span>
              </div>
            </div>

            {/* The message */}
            <div className="p-4 rounded-xl bg-[var(--brand-gold)]/10 border border-[var(--brand-gold)]/30">
              <p className="text-lg font-medium leading-relaxed">"{result.message}"</p>
            </div>

            {/* Why it works */}
            {result.why_it_works && (
              <p className="text-xs text-[var(--text-secondary)] italic">
                💡 {result.why_it_works}
              </p>
            )}

            {/* Shared interests */}
            {result.shared_interests?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[var(--text-secondary)]">You both like:</span>
                {result.shared_interests.map((interest, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                    {interest}
                  </span>
                ))}
              </div>
            )}

            {/* Talking points */}
            {result.talking_points?.length > 0 && (
              <div className="pt-2 border-t border-[var(--secondary)]">
                <p className="text-xs text-[var(--text-secondary)] mb-2">If they respond, talk about:</p>
                <div className="space-y-1">
                  {result.talking_points.map((point, i) => (
                    <p key={i} className="text-xs flex items-start gap-2">
                      <span className="text-[var(--brand-gold)]">→</span>
                      {point}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={generateMessage}
                disabled={loading}
                className="btn-secondary flex-1 py-2 text-sm flex items-center justify-center gap-1"
              >
                <Icons.RefreshCw size={14} />
                Regenerate
              </button>
              <button
                onClick={copyMessage}
                className="btn-secondary px-4 py-2 text-sm"
                title="Copy to clipboard"
              >
                <Icons.Copy size={14} />
              </button>
              <button
                onClick={sendMessage}
                className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-1"
                data-testid="send-ai-message-btn"
              >
                <Icons.Send size={14} />
                Send Now
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const AIConversationRevival = ({ matchUserId, matchName, lastMessageTime, onSendMessage }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [show, setShow] = useState(false);

  // Calculate hours since last message
  const getHoursSinceLastMessage = () => {
    if (!lastMessageTime) return 48;
    const now = new Date();
    const lastMsg = new Date(lastMessageTime);
    return Math.floor((now - lastMsg) / (1000 * 60 * 60));
  };

  const hoursSince = getHoursSinceLastMessage();

  // Only show if conversation has been quiet for 24+ hours
  const shouldShowRevival = hoursSince >= 24;

  const generateRevival = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/ai/revive-conversation/${matchUserId}`, { 
        hours_since_last: hoursSince 
      });
      setResult(response);
      setShow(true);
    } catch (err) {
      console.error('Failed to generate revival messages:', err);
      alert('Failed to generate messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (message) => {
    if (message && onSendMessage) {
      onSendMessage(message);
      setShow(false);
      setResult(null);
    }
  };

  const copyMessage = (message) => {
    navigator.clipboard.writeText(message);
  };

  const getUrgencyColor = (urgency) => {
    if (urgency >= 8) return 'text-red-400';
    if (urgency >= 5) return 'text-orange-400';
    return 'text-green-400';
  };

  const getUrgencyText = (urgency) => {
    if (urgency >= 8) return 'Reach out soon!';
    if (urgency >= 5) return 'Time to reconnect';
    return 'No rush';
  };

  if (!shouldShowRevival) return null;

  if (!show) {
    return (
      <button
        onClick={generateRevival}
        disabled={loading}
        className="w-full p-3 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center gap-2 hover:from-orange-500/30 hover:to-red-500/30 transition-all"
        data-testid="ai-revival-btn"
      >
        {loading ? (
          <>
            <div className="spinner-small" />
            <span className="text-sm">Analyzing conversation...</span>
          </>
        ) : (
          <>
            <span className="text-xl">💬</span>
            <div className="text-left">
              <p className="text-sm font-semibold text-orange-400">Conversation went quiet?</p>
              <p className="text-xs text-[var(--text-secondary)]">Get AI help to re-spark the connection</p>
            </div>
            <Icons.Sparkles size={16} className="text-orange-400 ml-auto" />
          </>
        )}
      </button>
    );
  }

  return (
    <div className="ai-revival p-4 rounded-xl bg-gradient-to-br from-orange-500/10 via-[var(--secondary)]/50 to-transparent border border-orange-500/30 space-y-4 animate-scale-in" data-testid="ai-revival-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">💬</span>
          <span className="font-semibold">Revive Conversation with {matchName}</span>
        </div>
        <button onClick={() => { setShow(false); setResult(null); }} className="text-[var(--text-secondary)] hover:text-white">
          <Icons.X size={18} />
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Urgency indicator */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--background)]/50">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-secondary)]">Time since last message:</span>
              <span className="text-sm font-semibold">
                {hoursSince < 48 ? `${hoursSince}h` : `${Math.floor(hoursSince / 24)}d`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${getUrgencyColor(result.urgency)}`}>
                {getUrgencyText(result.urgency)}
              </span>
              <div className="flex gap-0.5">
                {[...Array(10)].map((_, i) => (
                  <div 
                    key={i}
                    className={`w-1.5 h-3 rounded-sm ${i < result.urgency ? (result.urgency >= 8 ? 'bg-red-400' : result.urgency >= 5 ? 'bg-orange-400' : 'bg-green-400') : 'bg-[var(--secondary)]'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Stall reason */}
          {result.stall_reason && (
            <div className="p-3 rounded-lg bg-[var(--background)]/50 border-l-2 border-orange-500">
              <p className="text-xs text-[var(--text-secondary)] mb-1">Why it might have stalled:</p>
              <p className="text-sm">{result.stall_reason}</p>
            </div>
          )}

          {/* Revival messages */}
          <div className="space-y-2">
            <p className="text-xs text-[var(--text-secondary)] font-semibold">Pick a message to re-spark the chat:</p>
            {result.revival_messages.map((message, i) => (
              <div 
                key={i}
                className="p-3 rounded-xl bg-[var(--brand-gold)]/10 border border-[var(--brand-gold)]/30 hover:bg-[var(--brand-gold)]/20 transition-all group"
              >
                <p className="text-sm font-medium mb-2">"{message}"</p>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyMessage(message)}
                    className="text-xs px-2 py-1 rounded bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 flex items-center gap-1"
                  >
                    <Icons.Copy size={12} />
                    Copy
                  </button>
                  <button
                    onClick={() => sendMessage(message)}
                    className="text-xs px-2 py-1 rounded bg-[var(--brand-gold)] text-[var(--background)] hover:bg-[var(--brand-gold)]/80 flex items-center gap-1"
                    data-testid={`send-revival-${i}`}
                  >
                    <Icons.Send size={12} />
                    Send
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          {result.tips?.length > 0 && (
            <div className="pt-3 border-t border-[var(--secondary)]">
              <p className="text-xs text-[var(--text-secondary)] mb-2">💡 Tips to keep the conversation going:</p>
              <div className="space-y-1">
                {result.tips.map((tip, i) => (
                  <p key={i} className="text-xs flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    {tip}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Regenerate button */}
          <button
            onClick={generateRevival}
            disabled={loading}
            className="btn-secondary w-full py-2 text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="spinner-small" />
            ) : (
              <Icons.RefreshCw size={14} />
            )}
            Generate New Messages
          </button>
        </div>
      )}
    </div>
  );
};
