import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowDownToLine, Check, Database, FileText, RotateCcw, ShieldCheck } from 'lucide-react';
import { useData } from '../lib/store';
import { useApp } from '../lib/app-context';
import { downloadFile, today } from '../lib/model';
import { Button, Field, PageHeading, Panel } from '../components/ui';
export function SettingsPage() {
  const { data,update,reset,mode,saving,session,lastSaved } = useData();
  const { notify } = useApp();
  const [settings,setSettings] = useState(data.settings);
  const [confirm,setConfirm] = useState(false);
  const [error,setError] = useState('');
  async function save(e: FormEvent) {
    e.preventDefault(); if (!settings.owner.trim() || saving) return;
    try { await update(d => ({...d,settings:{...settings,owner:settings.owner.trim()}})); setError(''); notify(mode==='demo'?'Preview preferences updated. These changes are temporary.':'Business preferences saved to Supabase.'); }
    catch(e) { setError(e instanceof Error ? e.message : 'Could not save preferences.'); }
  }
  return <><PageHeading eyebrow="YOUR BUSINESS SUITE" title="Settle in. Make it yours." description="Business details and preferences shared across your two workspaces."/>
    <div className="settings-grid"><Panel title="Business details" subtitle="These contact details appear on generated invoices."><form onSubmit={save}>
      <fieldset disabled={saving} className="form-fields"><div className="form-grid">
        <Field label="Administrator name" wide><input required value={settings.owner} onChange={e => setSettings({...settings,owner:e.target.value})}/></Field>
        <Field label="Accounts email"><input required type="email" value={settings.email} onChange={e => setSettings({...settings,email:e.target.value})}/></Field>
        <Field label="Business phone"><input type="tel" value={settings.phone} onChange={e => setSettings({...settings,phone:e.target.value})}/></Field>
        <Field label="Business address" wide><input value={settings.address} onChange={e => setSettings({...settings,address:e.target.value})}/></Field>
      </div><div className="setting-toggle"><div><b>Open invoice after payment</b><p>Invoices are always generated. Choose whether to open them immediately.</p></div><label className="switch"><input type="checkbox" aria-label="Open invoice after recording payment" checked={settings.autoInvoice} onChange={e => setSettings({...settings,autoInvoice:e.target.checked})}/><span/></label></div>
      {error && <p className="form-error" role="alert">{error}</p>}<div className="form-footer"><Button type="submit"><Check size={16}/>{saving?'Saving…':'Save preferences'}</Button></div></fieldset>
    </form></Panel><div><Panel title={mode==='demo'?'A safe place to try things':'Your connected workspace'} subtitle={mode==='demo'?'Explore without changing live records.':'Your records are saved in Supabase.'}>
      <div className="settings-status"><span className="attention-icon blue"><Database size={21}/></span><div><b>{mode==='demo'?'Temporary sample data':'Supabase database'}</b><p>{mode==='demo'?'Changes stay in memory and reset when you refresh or return to Demo mode. Nothing is written to Supabase.':lastSaved?`Last saved ${new Date(lastSaved).toLocaleString('en-ZA',{timeZone:'Africa/Johannesburg'})}. Use the reload button to fetch changes from another device.`:'Your workspace is empty. Your first saved record will create your private business workspace.'}</p></div></div>
      <div className="settings-status"><span className="attention-icon blue"><FileText size={21}/></span><div><b>Invoice generation is on</b><p>Printable invoices are created automatically. Email delivery isn’t connected yet.</p></div></div>
      <div className="settings-status"><span className="attention-icon blue"><ShieldCheck size={21}/></span><div><b>{mode==='demo'?'Separate from live records':'Private to your account'}</b><p>{mode==='demo'?'The Demo / Live toggle switches data sources. Sample records are never copied into your live database.':`Signed in as ${session?.user.email}. Only this account can access these business records.`}</p></div></div>
    </Panel><Panel title={mode==='demo'?'Keep a copy. Or start fresh.':'Keep a copy of your records.'} className="reset-panel"><p className="muted">Download a JSON snapshot of both workspaces for safekeeping.</p><Button variant="secondary" onClick={() => downloadFile(`t2pks-${mode}-backup-${today()}.json`,JSON.stringify(data,null,2),'application/json')}><ArrowDownToLine size={16}/>Download {mode==='demo'?'demo':'business'} backup</Button>
      {mode==='demo' && <div className="reset-area">{confirm ? <><p>Reset both demo workspaces to the original sample data? Live records are kept separately.</p><div className="inline-actions"><Button variant="secondary" onClick={() => setConfirm(false)}>Keep changes</Button><Button variant="danger" onClick={() => { reset(); setConfirm(false); notify('Both demo workspaces have been reset.'); }}>Reset demo</Button></div></> : <button className="muted-link" onClick={() => setConfirm(true)}><RotateCcw size={15}/>Reset demo data</button>}</div>}
    </Panel></div></div></>;
}
