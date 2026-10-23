import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Data } from './model';
import { createSeed } from './seed';
import { emptyData, isData, savedRevision } from './persistence';
import { supabase } from './supabase';
export type DataMode = 'demo' | 'live';
type Status = 'ready' | 'loading' | 'signed-out' | 'error';
type Store = { data: Data; update: (fn: (previous: Data) => Data) => Promise<void>; reset: () => void; storageError: string; mode: DataMode; switchMode: (mode: DataMode) => void; session: Session | null; status: Status; saving: boolean; configured: boolean; reload: () => void; signOut: () => Promise<void>; datasetKey: number; lastSaved: string };
const Context = createContext<Store | null>(null);
export function DataProvider({ children }: { children: ReactNode }) {
  const [data,setData] = useState<Data>(createSeed);
  const [mode,setMode] = useState<DataMode>('demo');
  const [session,setSession] = useState<Session | null>(null);
  const [authReady,setAuthReady] = useState(!supabase);
  const [status,setStatus] = useState<Status>('ready');
  const [storageError,setError] = useState('');
  const [saving,setSaving] = useState(false);
  const [datasetKey,setDatasetKey] = useState(0);
  const [loadKey,setLoadKey] = useState(0);
  const [lastSaved,setLastSaved] = useState('');
  const current = useRef({data,revision:0,mode:mode as DataMode,status:status as Status,userId:'',busy:false});
  const userId = session?.user.id ?? '';
  useEffect(() => {
    // Retire the old persisted demo. Preview records now live only in memory.
    try { localStorage.removeItem('t2pks-demo-v1'); } catch { /* Storage is optional in Demo mode. */ }
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(({data,error}) => { if(mounted) { setSession(data.session); if(error) setError(error.message); setAuthReady(true); } }).catch(() => { if(mounted) setAuthReady(true); });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,next) => { if(mounted) { setSession(next); setAuthReady(true); } });
    return () => { mounted=false; subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if(mode !== 'live') return;
    let cancelled = false;
    const blank=emptyData(); current.current={...current.current,data:blank,revision:0,status:'loading',userId}; setData(blank); setDatasetKey(k=>k+1); setError(''); setLastSaved('');
    if(!authReady) { setStatus('loading'); return; }
    if(!supabase || !userId) { current.current.status='signed-out'; setStatus('signed-out'); return; }
    setStatus('loading');
    Promise.resolve(supabase.from('business_workspaces').select('data, revision, updated_at').eq('owner_id',userId).maybeSingle()).then(({data:row,error}) => {
      if(cancelled) return;
      if(error || (row && !isData(row.data))) { const message=error?.message ?? 'The live workspace has an unsupported data format.'; setError(message); setStatus('error'); current.current.status='error'; return; }
      const loaded=row ? row.data as Data : emptyData();
      current.current={...current.current,data:loaded,revision:row?.revision ?? 0,status:'ready',userId}; setData(loaded); setStatus('ready'); setLastSaved(row?.updated_at ?? '');
    }).catch((error: unknown) => { if(!cancelled) { setError(error instanceof Error ? error.message : 'Could not load live records.'); setStatus('error'); current.current.status='error'; } });
    return () => { cancelled=true; };
  }, [mode,userId,authReady,loadKey]);
  const switchMode = useCallback((next: DataMode) => {
    if(current.current.busy || next===current.current.mode) return;
    const nextData=next==='demo' ? createSeed() : emptyData();
    current.current={data:nextData,revision:0,mode:next,status:next==='demo'?'ready':'loading',userId:'',busy:false};
    setData(nextData); setMode(next); setStatus(next==='demo'?'ready':'loading'); setError(''); setLastSaved(''); setDatasetKey(k=>k+1);
  }, []);
  const update = useCallback(async (fn: (previous: Data) => Data) => {
    const snapshot=current.current;
    if(snapshot.busy) throw new Error('A save is already in progress. Please try again in a moment.');
    if(snapshot.status!=='ready') throw new Error('Wait for your live workspace to finish loading before making changes.');
    const next=fn(snapshot.data);
    if(snapshot.mode==='demo') { current.current={...snapshot,data:next}; setData(next); return; }
    if(!supabase || !snapshot.userId) throw new Error('Sign in to save live records.');
    current.current.busy=true; setSaving(true); setError('');
    try {
      const {data:result,error}=await supabase.rpc('save_business_workspace',{expected_revision:snapshot.revision,next_data:next});
      if(error) throw new Error(error.code==='40001' ? 'Another tab changed these records. Reload live records before saving again.' : error.message);
      const revision=savedRevision(result);
      // A session change during a save must never display another owner’s data.
      if(current.current.mode===snapshot.mode && current.current.userId===snapshot.userId) { current.current={...current.current,data:next,revision}; setData(next); setLastSaved(result[0].updated_at); }
    } catch(error) { const message=error instanceof Error ? error.message : 'Save failed. Your change was not saved.'; setError(message); throw new Error(message); }
    finally { current.current.busy=false; setSaving(false); }
  }, []);
  const reset = useCallback(() => { if(current.current.mode!=='demo') return; const fresh=createSeed(); current.current.data=fresh; setData(fresh); setDatasetKey(k=>k+1); }, []);
  const reload = useCallback(() => { if(!current.current.busy) setLoadKey(k=>k+1); }, []);
  const signOut = useCallback(async () => { if(current.current.busy || !supabase) return; const {error}=await supabase.auth.signOut({scope:'local'}); if(error) throw error; }, []);
  return <Context.Provider value={{data,update,reset,storageError,mode,switchMode,session,status:mode==='live' && current.current.userId!==userId ? 'loading' : status,saving,configured:!!supabase,reload,signOut,datasetKey,lastSaved}}>{children}</Context.Provider>;
}
export function useData() { const context=useContext(Context); if(!context) throw new Error('DataProvider is required'); return context; }
