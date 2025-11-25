import React, { useRef, useEffect, useState } from 'react';
import './App.css';

const VOICES = [
  { id: 'en-GB-RyanNeural', label: 'MVoice_1', file: '/audio_all/en-GB-RyanNeural.mp3' },
  { id: 'en-GB-SoniaNeural', label: 'FVoice_1', file: '/audio_all/en-GB-SoniaNeural.mp3' },
  { id: 'en-GB-AlfieNeural', label: 'MVoice_2', file: '/audio_all/en-GB-AlfieNeural.mp3' },
  { id: 'en-GB-HollieNeural', label: 'FVoice_2', file: '/audio_all/en-GB-HollieNeural.mp3' },
  { id: 'en-GB-NoahNeural', label: 'MVoice_3', file: '/audio_all/en-GB-NoahNeural.mp3' },
  { id: 'en-GB-OliverNeural', label: 'MVoice_4', file: '/audio_all/en-GB-OliverNeural.mp3' },
  { id: 'en-GB-ThomasNeural', label: 'MVoice_5', file: '/audio_all/en-GB-ThomasNeural.mp3' },
  { id: 'en-GB-OliviaNeural', label: 'FVoice_3', file: '/audio_all/en-GB-OliviaNeural.mp3' },
  { id: 'en-US-DavisNeural', label: 'MVoice_6', file: '/audio_all/en-US-DavisNeural.mp3' },
  { id: 'en-US-JasonNeural', label: 'MVoice_7', file: '/audio_all/en-US-JasonNeural.mp3' },
  { id: 'en-US-TonyNeural', label: 'MVoice_8', file: '/audio_all/en-US-TonyNeural.mp3' },
  { id: 'en-US-JaneNeural', label: 'FVoice_4', file: '/audio_all/en-US-JaneNeural.mp3' },
  { id: 'en-US-NancyNeural', label: 'FVoice_5', file: '/audio_all/en-US-NancyNeural.mp3' },
  { id: 'en-US-AriaNeural', label: 'FVoice_6', file: '/audio_all/en-US-AriaNeural.mp3' },
  { id: 'en-AU-NatashaNeural', label: 'FVoice_7', file: '/audio_all/en-AU-NatashaNeural.mp3' },
  { id: 'en-AU-WilliamNeural', label: 'MVoice_9', file: '/audio_all/en-AU-WilliamNeural.mp3' },
  { id: 'en-AU-DarrenNeural', label: 'MVoice_10', file: '/audio_all/en-AU-DarrenNeural.mp3' },
  { id: 'en-AU-NeilNeural', label: 'MVoice_11', file: '/audio_all/en-AU-NeilNeural.mp3' },
  { id: 'en-CA-ClaraNeural', label: 'FVoice_8', file: '/audio_all/en-CA-ClaraNeural.mp3' },
  { id: 'en-CA-LiamNeural', label: 'MVoice_12', file: '/audio_all/en-CA-LiamNeural.mp3' }
];

export default function App() {
  const taRef = useRef(null);
  const audioRef = useRef(null);
  const convertedAudioRef = useRef(null);
  const filterRef = useRef(null);

  const [count, setCount] = useState(0);
  const [playing, setPlaying] = useState(null);
  const [genderFilter, setGenderFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertStatus, setConvertStatus] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [convertedUrl, setConvertedUrl] = useState('');
  const [user, setUser] = useState(null);

  let AUTH_API = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000';
  // Fix Render internal hostname issue (e.g. "text-speech-auth" -> "text-speech-auth.onrender.com")
  if (AUTH_API && !AUTH_API.includes('.') && !AUTH_API.includes('localhost')) {
    AUTH_API = `${AUTH_API}.onrender.com`;
  }
  if (AUTH_API && !AUTH_API.startsWith('http')) {
    AUTH_API = `https://${AUTH_API}`;
  }
  // Add /api suffix if not already present
  if (!AUTH_API.endsWith('/api')) {
    AUTH_API = `${AUTH_API}/api`;
  }

  let TTS_API = import.meta.env.VITE_TTS_API_URL || 'http://127.0.0.1:8000';
  // Fix Render internal hostname issue
  if (TTS_API && !TTS_API.includes('.') && !TTS_API.includes('localhost')) {
    TTS_API = `${TTS_API}.onrender.com`;
  }
  if (TTS_API && !TTS_API.startsWith('http')) {
    TTS_API = `https://${TTS_API}`;
  }

  // Load logged-in user
  useEffect(() => {
    fetch(`${AUTH_API}/auth/me`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  // Handle click outside filter
  useEffect(() => {
    const handleClick = e => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    if (filterOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [filterOpen]);

  // Auto adjust textarea height
  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = 'auto';
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, window.innerHeight * 0.8) + 'px';
      setCount(taRef.current.value ? taRef.current.value.replace(/ /g, '').length : 0);
    }
  }, []);

  const handleInput = e => {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, window.innerHeight * 0.8) + 'px';
    setCount(el.value.replace(/ /g, '').length);
  };

  const clearText = () => {
    if (taRef.current) {
      taRef.current.value = '';
      taRef.current.style.height = 'auto';
      taRef.current.focus();
      setCount(0);
    }
  };

  const togglePlay = voice => {
    if (!audioRef.current) return;
    const srcMatches = audioRef.current.src.includes(voice.file);
    if (srcMatches) {
      if (audioRef.current.paused) audioRef.current.play(), setPlaying(voice.id);
      else audioRef.current.pause(), setPlaying(null);
    } else {
      audioRef.current.src = voice.file;
      audioRef.current.play();
      setPlaying(voice.id);
      setSelectedVoice(voice.id);
    }
  };

  const handleAudioEnded = () => setPlaying(null);

  const handleConvert = async () => {
    const text = taRef.current?.value.trim();
    if (!text) return setConvertStatus('Please enter text');
    if (!selectedVoice) return setConvertStatus('Please select a voice');

    setConverting(true);
    setConvertStatus('Converting...');
    try {
      const res = await fetch(`${TTS_API}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: selectedVoice }),
        credentials: 'include'
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setConvertedUrl(url);
        setConvertStatus('Converted successfully!');
      } else setConvertStatus('Conversion failed');
    } catch (err) {
      setConvertStatus('Network error');
    }
    setConverting(false);
  };

  console.log('DEBUG: AUTH_API URL is:', AUTH_API);
  console.log('DEBUG: TTS_API URL is:', TTS_API);

  return (
    <div className="app-root">
      {/* TOP RIGHT LOGIN */}
      <div style={{
        position: 'absolute', top: 16, right: 16, zIndex: 1000,
        background: 'white', padding: '12px 20px', borderRadius: '50px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 14
      }}>
        {user ? (
          <>
            <img src={user.photo} alt="profile" style={{ width: 40, height: 40, borderRadius: '50%' }} />
            <span style={{ fontWeight: 600 }}>Hi, {user.name.split(' ')[0]}</span>
            <a href={`${AUTH_API}/auth/logout`} style={{ color: '#d32f2f', textDecoration: 'none' }}>Logout</a>
          </>
        ) : (
          <a href={`${AUTH_API}/auth/google`} style={{ textDecoration: 'none' }}>
            <button style={{
              background: '#4285f4', color: 'white', border: 'none', padding: '10px 24px',
              borderRadius: '25px', fontWeight: '600', cursor: 'pointer'
            }}>
              Login with Google
            </button>
          </a>
        )}
      </div>

      {/* LEFT COLUMN */}
      <div className="left-col">
        <h1 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '60px' }}>Text to Speech</h1>
        <div className="card">
          <textarea
            ref={taRef}
            placeholder="Type your text here..."
            onInput={handleInput}
            className="input-area"
            style={{ paddingBottom: 64 }}
          />
          <div className="controls">
            <div className="char-count">{count} characters</div>
            <div className="action-row">
              <button type="button" onClick={clearText} disabled={converting} className="btn btn-ghost">Clear</button>
              <button type="button" onClick={handleConvert} disabled={converting} className="btn btn-primary">
                {converting ? 'Converting...' : 'Convert'}
              </button>
            </div>
          </div>
          <div className="status">
            {convertStatus && <div style={{ marginBottom: 8 }}>{convertStatus}</div>}
            {convertedUrl && (
              <div className="result-row">
                <audio controls src={convertedUrl} ref={convertedAudioRef} style={{ width: '100%' }} />
                <a href={convertedUrl} download="TextToSpeechconverted.mp3" className="download-link">Download</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="right-col">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="voice-header">
              <h3>Voice samples</h3>
              <div className="sub">Click a card to play the sample</div>
            </div>
            <div style={{ position: 'relative' }} ref={filterRef}>
              <button type="button" onClick={() => setFilterOpen(open => !open)} aria-expanded={filterOpen} className="filter-btn">Filter ▾</button>
              {filterOpen && (
                <div className="filter-menu">
                  <button type="button" onClick={() => { setGenderFilter('male'); setFilterOpen(false); }} className={genderFilter === 'male' ? 'active' : ''}>Male</button>
                  <button type="button" onClick={() => { setGenderFilter('female'); setFilterOpen(false); }} className={genderFilter === 'female' ? 'active' : ''}>Female</button>
                  <button type="button" onClick={() => { setGenderFilter('all'); setFilterOpen(false); }}>All</button>
                </div>
              )}
            </div>
          </div>
          <div className="voices-grid">
            {VOICES.filter(v => {
              if (genderFilter === 'all') return true;
              if (genderFilter === 'male') return v.label.startsWith('MVoice');
              if (genderFilter === 'female') return v.label.startsWith('FVoice');
              return true;
            }).map(v => (
              <div
                key={v.id}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') togglePlay(v); }}
                onClick={() => setSelectedVoice(v.id)}
                className={`voice-card ${selectedVoice === v.id ? 'selected' : ''}`}
              >
                <div className="label">{v.label}</div>
                <button
                  onClick={e => { e.stopPropagation(); togglePlay(v); }}
                  aria-label={playing === v.id ? 'Pause' : 'Play'}
                  className="icon-btn"
                >
                  {playing === v.id ? '❚❚' : '▶'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <audio ref={audioRef} onEnded={handleAudioEnded} style={{ display: 'none' }} />
    </div>
  );
}