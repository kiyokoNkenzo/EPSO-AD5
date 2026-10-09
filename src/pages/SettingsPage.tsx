import { AlertTriangle, BellRing, Check, Download, FileUp, RotateCcw, Save, Settings2 } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Modal } from '../components/Modal';
import { formatDate } from '../lib/date';
import { parseImportedAppState } from '../lib/stateMigration';
import { useAppState } from '../state/AppState';
import type { UserProfile } from '../types';

const languages = [
  'Bulgarian', 'Croatian', 'Czech', 'Danish', 'Dutch', 'English', 'Estonian', 'Finnish', 'French', 'German', 'Greek', 'Hungarian', 'Irish', 'Italian', 'Latvian', 'Lithuanian', 'Maltese', 'Polish', 'Portuguese', 'Romanian', 'Slovak', 'Slovenian', 'Spanish', 'Swedish'
];

export function SettingsPage() {
  const { state, updateProfile, importState, resetState } = useAppState();
  const [draft, setDraft] = useState<UserProfile>(state.profile);
  const [saved, setSaved] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    updateProfile(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const exportProgress = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ad5-progress-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importProgress = async (event: ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = parseImportedAppState(await file.text());
      if (!parsed) throw new Error('Invalid progress file');
      importState(parsed);
      setDraft(parsed.profile);
    } catch {
      setImportError('That file is not a valid AD5 Companion export.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="page narrow-page">
      <PageHeader eyebrow="LOCAL PREFERENCES" title="Settings" description="Your profile and progress stay in this browser. No account, analytics or server database is used." />

      <form onSubmit={submit} className="settings-stack">
        <section className="card settings-card">
          <div className="settings-heading"><span><Settings2 size={20} /></span><div><h2>Study profile</h2><p>Used only to tailor the local dashboard and plan.</p></div></div>
          <div className="form-grid">
            <label className="field full"><span>Name <small>optional</small></span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="How should the app greet you?" /></label>
            <label className="field"><span>Language 1 <small>reasoning</small></span><select value={draft.language1} onChange={(event) => setDraft({ ...draft, language1: event.target.value })}>{languages.map((language) => <option key={language}>{language}</option>)}</select></label>
            <label className="field"><span>Language 2 <small>Part 2</small></span><select value={draft.language2} onChange={(event) => setDraft({ ...draft, language2: event.target.value })}>{languages.map((language) => <option key={language}>{language}</option>)}</select></label>
            {draft.language1 === draft.language2 && <p className="field-error full"><AlertTriangle size={15} /> EPSO requires two different official EU languages.</p>}
          </div>
        </section>

        <section className="card settings-card">
          <div className="settings-heading"><span><Save size={20} /></span><div><h2>Planning targets</h2><p>Fallback dates for the countdown until you record your EPSO invitation.</p></div></div>
          <div className="form-grid">
            <label className="field"><span>Part 1 target</span><input type="date" required value={draft.phase1Target} onChange={(event) => setDraft({ ...draft, phase1Target: event.target.value })} /><small>EPSO plans Part 1 from November 2026. Once your invitation arrives, record it under <Link to="/coach#part1">Coach → Part 1 roll-out</Link>; countdowns then follow it.</small></label>
            <label className="field"><span>Part 2 placeholder</span><input type="date" required value={draft.phase2Target} onChange={(event) => setDraft({ ...draft, phase2Target: event.target.value })} /><small>EPSO confirms 2027; exact date is unannounced.</small></label>
            <label className="field full"><span>Weekly session goal: {draft.weeklyGoal}</span><input className="range" type="range" min="3" max="7" value={draft.weeklyGoal} onChange={(event) => setDraft({ ...draft, weeklyGoal: Number(event.target.value) })} /></label>
          </div>
          <button className="button primary" disabled={draft.language1 === draft.language2} type="submit">{saved ? <><Check size={17} /> Saved</> : <><Save size={17} /> Save preferences</>}</button>
        </section>
      </form>

      <section className="card settings-card data-card reminder-settings-link">
        <div className="settings-heading"><span><BellRing size={20} /></span><div><h2>Daily study reminder</h2><p>Use a recurring calendar alert, an in-page browser notification, or the optional Docker email worker.</p></div></div>
        <Link className="button secondary" to="/reminders">Configure reminders</Link>
      </section>

      <section className="card settings-card data-card">
        <div><h2>Your local data</h2><p>Back up test history, reading progress and review scheduling as JSON. Flashcard content is already bundled with the app.</p></div>
        <div className="data-actions">
          <button className="button secondary" onClick={exportProgress}><Download size={17} /> Export progress</button>
          <button className="button secondary" onClick={() => fileRef.current?.click()}><FileUp size={17} /> Import progress</button>
          <input ref={fileRef} className="sr-only" type="file" accept="application/json" onChange={importProgress} />
        </div>
        {importError && <p className="field-error"><AlertTriangle size={15} /> {importError}</p>}
        <div className="data-summary">
          <span><strong>{state.attempts.length}</strong> attempts</span>
          <span><strong>{Object.keys(state.schedules).length}</strong> card schedules</span>
          <span><strong>{state.mistakes.filter((mistake) => !mistake.resolved).length}</strong> open mistakes</span>
          <span><strong>{state.writingPractices.length}</strong> writing drills</span>
          <span><strong>{state.completedReadings.length}</strong> readings</span>
        </div>
      </section>

      <section className="danger-zone">
        <div><h3>Reset local progress</h3><p>Returns targets to their defaults and removes your study history from this browser.</p></div>
        <button className="button danger" onClick={() => setResetOpen(true)}><RotateCcw size={17} /> Reset</button>
      </section>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset all local progress?">
        <div className="confirm-dialog"><AlertTriangle size={28} /><p>This cannot be undone unless you exported a backup first.</p><div><button className="button secondary" onClick={() => setResetOpen(false)}>Cancel</button><button className="button danger" onClick={() => { resetState(); setDraft({ name: '', language1: 'English', language2: 'French', phase1Target: '2026-11-01', phase2Target: '2027-03-15', weeklyGoal: 5 }); setResetOpen(false); }}>Reset everything</button></div></div>
      </Modal>
    </div>
  );
}
