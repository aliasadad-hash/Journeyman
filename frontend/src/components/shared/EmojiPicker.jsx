import { useState, useRef } from 'react';
import * as Icons from './Icons';

const EMOJI_CATEGORIES = {
  recent: ['❤️', '😂', '🔥', '😍', '😘', '💯', '👍', '🎉'],
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥'],
  love: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '😻', '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '💏'],
  gestures: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏', '💪'],
  activities: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🏓', '🏸', '🥅', '⛳', '🏋️', '🚴', '🏊', '🧘', '🎮', '🎯', '🎲', '🎭', '🎬', '🎤', '🎧', '🎸', '🎹', '🎺', '🎻', '🥁'],
  flags: ['🏳️‍🌈', '🏳️‍⚧️', '🇺🇸', '🇬🇧', '🇨🇦', '🇲🇽', '🇧🇷', '🇦🇺', '🇯🇵', '🇰🇷', '🇨🇳', '🇮🇳', '🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸', '🇷🇺']
};

const CATEGORY_ICONS = {
  recent: '🕐',
  smileys: '😀',
  love: '❤️',
  gestures: '👋',
  activities: '⚽',
  flags: '🏳️‍🌈'
};

export const EmojiPicker = ({ onSelect, onClose }) => {
  const [category, setCategory] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  const filteredEmojis = searchQuery
    ? Object.values(EMOJI_CATEGORIES).flat().filter(e => e.includes(searchQuery))
    : EMOJI_CATEGORIES[category];

  return (
    <div className="emoji-picker" ref={containerRef} data-testid="emoji-picker">
      <div className="emoji-picker-header">
        <input
          type="text"
          placeholder="Search emojis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="emoji-search-input"
        />
        <button onClick={onClose} className="emoji-close-btn">
          <Icons.X size={18} />
        </button>
      </div>
      
      <div className="emoji-categories">
        {Object.keys(EMOJI_CATEGORIES).map((cat) => (
          <button
            key={cat}
            className={`emoji-category-btn ${category === cat ? 'active' : ''}`}
            onClick={() => { setCategory(cat); setSearchQuery(''); }}
            title={cat}
          >
            {CATEGORY_ICONS[cat]}
          </button>
        ))}
      </div>
      
      <div className="emoji-grid">
        {filteredEmojis.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            className="emoji-item"
            onClick={() => onSelect(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

// Quick reaction bar for messages
export const ReactionBar = ({ onReact }) => {
  const reactions = ['❤️', '😂', '😮', '😢', '👍', '🔥'];
  
  return (
    <div className="reaction-bar">
      {reactions.map((emoji) => (
        <button
          key={emoji}
          className="reaction-btn"
          onClick={() => onReact(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
