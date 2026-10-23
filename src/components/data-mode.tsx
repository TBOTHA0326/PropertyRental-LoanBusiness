import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, Database, FlaskConical, LoaderCircle, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { useData } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Button, Field } from './ui';
export function ModeControl() {
  const {mode,switchMode,saving,status,session,reload,signOut} = useData();
  const [error,setError] = useState('');
  return <div className="mode-control"><div className="mode-toggle" aria-label="Data mode"><button aria-pressed={mode==='demo'} className={mode==='demo'?'selected':''} disabled={saving} title="Sample data. Changes are not saved." onClick={()=>switchMode('demo')}><FlaskConical size={13}/>Demo</button><button aria-pressed={mode==='live'} className={mode==='live'?'selected live-selected':''} disabled={saving} title="Your private Supabase records" onClick={()=>switchMode('live')}><Database size={13}/>Live</button></div>{mode==='live' && session && <><button className="icon-button" title="Reload live records" aria-label="Reload live records" disabled={saving || status==='loading'} onClick={reload}><RefreshCw size={14}/></button><button className="icon-button" title={`Sign out of ${session.user.email}`} aria-label="Sign out" disabled={saving} onClick={async()=>{try{await signOut();}catch(e){setError(e instanceof Error?e.message:'Could not sign out.');}}}><LogOut size={14}/></button></>}{saving && <span className="save-indicator"><LoaderCircle className="spin" size={13}/>Saving</span>}{error && <span role="alert" className="mode-error">{error}</span>}</div>;
}
export function LiveGate() {
  const {status,configured,reload,switchMode,storageError} = useData();
  const [signUp,setSignUp] = useState(false);
  const [email,setEmail] = useState(''); const [password,setPassword] = useState('');
  const [busy,setBusy] = useState(false); const [error,setError] = useState(''); const [message,setMessage] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault(); if(!supabase) return; setBusy(true); setError(''); setMessage('');
    try {
      if(signUp) { const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:window.location.origin}}); if(error) throw error; if(!data.session) setMessage('Check your email to confirm your account, then return here and sign in.'); }
      else { const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password}); if(error) throw error; }
    } catch(e) { setError(e instanceof Error ? e.message : 'We couldn’t sign you in. Please try again.'); }
    finally { setBusy(false); }
  }
  if(status==='loading') return <div className="live-gate"><div className="live-gate-card loading-card"><LoaderCircle className="spin" size={28}/><h1>Opening your live workspace.</h1><p>Loading your records securely from Supabase.</p></div></div>;
  if(status==='error' || !configured) return <div className="live-gate"><div className="live-gate-card"><span className="auth-icon"><Database size={26}/></span><span className="eyebrow">LIVE WORKSPACE</span><h1>{configured?'Let’s reconnect.':'One connection to finish.'}</h1><p>{configured ? storageError : 'Add your Supabase URL and publishable key to the deployment’s environment variables to enable Live mode.'}</p><div className="inline-actions"><Button variant="secondary" onClick={()=>switchMode('demo')}>Back to Demo</Button>{configured && <Button onClick={reload}><RefreshCw size={15}/>Try again</Button>}</div></div></div>;
  return <div className="live-gate"><div className="auth-intro"><span className="eyebrow">SAME BUSINESS. YOUR REAL RECORDS.</span><h1>A fresh start.<br/>A place for your business.</h1><p>Your live workspace starts empty. Add your rooms, tenants and clients, and keep them securely saved in Supabase.</p><div><ShieldCheck size={18}/><span>Private to your signed-in account</span></div><div><Database size={18}/><span>Shared across your devices</span></div><div><FlaskConical size={18}/><span>Demo data stays in Demo mode</span></div></div><div className="live-gate-card"><span className="auth-icon"><Database size={24}/></span><h2>{signUp?'Create your business account.':'Welcome to your live workspace.'}</h2><p>{signUp?'One account for Properties and Loans.':'Sign in to access your saved business records.'}</p><form onSubmit={submit}><Field label="Email address"><input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field><Field label="Password"><input required minLength={signUp?8:1} type="password" autoComplete={signUp?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/></Field>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}<Button type="submit" disabled={busy}>{busy?<LoaderCircle className="spin" size={15}/>:<ArrowRight size={15}/>} {busy?'Please wait…':signUp?'Create account':'Sign in'}</Button></form><button className="auth-switch" onClick={()=>{setSignUp(v=>!v);setError('');setMessage('');}}>{signUp?'Already have an account? Sign in':'First time here? Create an account'}</button><small className="auth-footnote">Your Supabase dashboard login is separate from this app’s business account.</small></div></div>;
}
