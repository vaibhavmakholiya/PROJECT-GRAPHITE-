import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link, useParams } from 'react-router-dom';
import logo from './assests/sanchay-logo.png';

const getAll = () => Promise.resolve(JSON.parse(localStorage.getItem('sanchay')||'[]'));

const addRecord = (r) => {
  const a = JSON.parse(localStorage.getItem('sanchay')||'[]');
  const entry = {...r, isOffline: !navigator.onLine, status: !navigator.onLine ? 'offline' : 'synced', date: new Date().toISOString()};
  a.push(entry);
  localStorage.setItem('sanchay', JSON.stringify(a));
  return Promise.resolve();
};

const syncPendingRecords = () => {
  const a = JSON.parse(localStorage.getItem('sanchay')||'[]');
  let changed = false;
  const updated = a.map(x => {
    if (x.isOffline) { changed = true; return {...x, isOffline:false, status:'synced'}; }
    return x;
  });
  if (changed) {
    localStorage.setItem('sanchay', JSON.stringify(updated));
    window.dispatchEvent(new Event('sanchay-sync'));
  }
  return changed;
};

function useOnline(){
  const [o,setO]=useState(navigator.onLine);
  useEffect(()=>{
    const onOnline = () => { setO(true); syncPendingRecords(); };
    const onOffline = () => setO(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return()=>{ window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); }
  },[]);
  return o;
}

function Sidebar(){
  const online = useOnline();
  return(
    <div className="w-60 bg-[#1F1F2E] min-h-screen p-4 hidden md:flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-8"><img src={logo} className="w-8 h-8 rounded-full bg-white p-1" alt="logo"/><b className="text-white text-sm tracking-[0.2em]">SANCHAY</b></div>
        <div className="space-y-1 text-[13px]">
          <Link to="/home" className="flex gap-3 bg-white/10 text-white rounded-lg p-2.5">⊞ Dashboard</Link>
          <Link to="/group" className="flex gap-3 text-white/60 p-2.5">Members</Link>
          <Link to="/history" className="flex gap-3 text-white/60 p-2.5">Transactions</Link>
          <Link to="/loan" className="flex gap-3 text-white/60 p-2.5">Loans</Link>
          <Link to="/withdraw" className="flex gap-3 text-white/60 p-2.5">Withdraw</Link>
        </div>
      </div>
      <div className={`text-[11px] px-3 py-2 rounded-full text-center ${online?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}`}>{online ? '● Online - Auto Sync ON' : '○ Offline'}</div>
    </div>
  )
}

function Splash(){ const n=useNavigate(); useEffect(()=>{ const t=setTimeout(()=>n('/home'),1000); return()=>clearTimeout(t)},[n]); return(<div className="min-h-screen bg-[#1F1F2E] flex flex-col items-center justify-center"><img src={logo} className="w-24 h-24 bg-white rounded-full p-2" alt="logo"/><h1 className="text-white mt-4 tracking-widest font-bold">SANCHAY</h1></div>)}

function Home(){
  const [total,setTotal]=useState(0); const [all,setAll]=useState([]); const online=useOnline(); const [stats,setStats]=useState({contrib:0,withdraw:0,loan:0});
  const loadData = () => {
    getAll().then(a=>{
      const contrib = a.filter(x=>x.type!=='Withdrawal' && x.type!=='Loan').reduce((s,x)=>s+x.amount,0);
      const withdraw = a.filter(x=>x.type==='Withdrawal').reduce((s,x)=>s+x.amount,0);
      const loan = a.filter(x=>x.type==='Loan').reduce((s,x)=>s+x.amount,0);
      setStats({contrib,withdraw,loan}); setTotal(contrib - withdraw + loan); setAll([...a].reverse());
    })
  };
  useEffect(()=>{
    loadData();
    const handleSync = () => { syncPendingRecords(); loadData(); };
    window.addEventListener('sanchay-sync', loadData);
    window.addEventListener('online', handleSync);
    const interval = setInterval(()=>{ if(navigator.onLine) { if(syncPendingRecords()) loadData(); } }, 2000);
    return()=>{ window.removeEventListener('sanchay-sync', loadData); window.removeEventListener('online', handleSync); clearInterval(interval); }
  },[]);
  const pending = all.filter(x=>x.isOffline).length;
  return(
    <div className="flex bg-[#F8F8FC] min-h-screen"><Sidebar/><div className="flex-1 p-4 md:p-6 pb-20">
      <div className="flex justify-between mb-5"><div><h1 className="font-bold text-[18px]">Good morning, Shagun</h1><p className="text-[11px] text-gray-500">{online ? 'Auto sync active - no click needed' : 'Offline mode - will auto sync when online'}</p></div><div className="flex gap-2 items-center"><span className={`text-[10px] px-2 py-1 rounded-full ${online?'bg-green-50 text-green-700':'bg-red-50 text-red-600'}`}>{online?'● Online':'○ Offline'}</span><img src={logo} className="w-8 h-8 rounded-full border bg-white" alt="logo"/></div></div>
      <div className="bg-[#1F1F2E] rounded-2xl p-5 text-white flex justify-between"><div><p className="text-[11px] opacity-60">Group Total Balance</p><p className="text-[32px] font-bold mt-1">₹ {total.toLocaleString('en-IN')}</p><div className="flex gap-6 mt-4 text-[11px]"><div><p className="opacity-60">Contributions</p><b>₹ {stats.contrib}</b></div><div><p className="opacity-60">Withdrawals</p><b>₹ {stats.withdraw}</b></div><div><p className="opacity-60">Loans</p><b>₹ {stats.loan}</b></div></div></div><div className="bg-white/10 rounded-lg p-3 h-fit text-center min-w-[90px]"><p className="text-[10px]">Offline Pending</p><b className="text-xl">{pending}</b><p className="text-[9px] mt-1 opacity-70">{pending>0 ? 'Auto syncing...' : 'All synced'}</p></div></div>
      <div className="mt-6"><h3 className="text-sm font-bold mb-3">Quick Actions</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-3"><Link to="/add" className="bg-white border rounded-xl p-4"><p className="text-xs font-bold">+ Add Contribution</p><p className="text-[10px] text-gray-500">With Aadhaar</p></Link><Link to="/withdraw" className="bg-white border rounded-xl p-4"><p className="text-xs font-bold">↑ Withdraw</p><p className="text-[10px] text-gray-500">With Aadhaar</p></Link><Link to="/loan" className="bg-white border rounded-xl p-4"><p className="text-xs font-bold">$ Add Loan</p><p className="text-[10px] text-gray-500">With Aadhaar</p></Link><Link to="/history" className="bg-white border rounded-xl p-4"><p className="text-xs font-bold">View Transactions</p></Link></div></div>
      <div className="mt-6 bg-white border rounded-xl p-4"><div className="flex justify-between"><h3 className="text-sm font-bold">Recent Activity (Auto Sync)</h3><Link to="/history" className="text-[11px] text-gray-500">View All</Link></div><div className="mt-3 space-y-2 text-[12px]">{all.slice(0,6).map(r=>(<Link key={r.id} to={`/receipt/${r.id}`}><div className={`flex justify-between items-center border-b py-2.5 px-2 rounded-lg mb-1 ${r.isOffline ? 'bg-red-50 border border-red-300 text-red-700' : 'bg-green-50/50 border border-green-200'}`}><span className="w-24 truncate font-medium">{r.name}</span><span className={`px-2 rounded-full text-[10px] border ${r.isOffline?'bg-red-100 text-red-700':'bg-green-100 text-green-700'}`}>{r.type}</span><span className="font-bold">₹{r.amount}</span><span className="text-[10px]">XXXX-{r.aadhaar||'1234'}</span><span className={`text-[10px] font-bold ${r.isOffline?'text-red-600':'text-green-600'}`}>{r.isOffline?'● Offline (auto sync pending)':'● Synced'}</span></div></Link>))}</div></div>
    </div></div>
  )
}

function Add(){ const nav=useNavigate(); const [n,setN]=useState(''); const [a,setA]=useState(''); const [ad,setAd]=useState(''); const save=async()=>{ if(!n||!a||!ad) return alert('Name, Amount, Aadhaar bharo'); await addRecord({id:Date.now(),name:n,aadhaar:ad,amount:Number(a),type:"Contribution"}); nav('/home'); }; return(<div className="flex min-h-screen bg-[#F8F8FC]"><Sidebar/><div className="flex-1 p-6"><Link to="/home" className="text-sm">← Back</Link><h2 className="font-bold mt-3">Add Contribution</h2><div className="bg-white border rounded-xl p-6 mt-4 max-w-md"><input value={n} onChange={e=>setN(e.target.value)} placeholder="Member Name" className="w-full border p-3 rounded-xl mb-3" /><input value={ad} onChange={e=>setAd(e.target.value)} placeholder="Aadhaar Last 4" maxLength={4} className="w-full border p-3 rounded-xl mb-3 tracking-widest" /><input value={a} onChange={e=>setA(e.target.value)} placeholder="Amount" type="number" className="w-full border p-3 rounded-xl mb-4" /><button onClick={save} className="w-full bg-[#FF4D5A] text-white rounded-full py-3 font-bold">Save</button></div></div></div>)}
function Withdraw(){ const nav=useNavigate(); const [n,setN]=useState(''); const [a,setA]=useState(''); const [ad,setAd]=useState(''); const [reason,setReason]=useState(''); const save=async()=>{ if(!n||!a||!ad) return alert('Name, Amount, Aadhaar bharo'); await addRecord({id:Date.now(),name:n,aadhaar:ad,amount:Number(a),type:"Withdrawal",reason}); nav('/home'); }; return(<div className="flex min-h-screen bg-[#F8F8FC]"><Sidebar/><div className="flex-1 p-6"><Link to="/home" className="text-sm">← Back</Link><h2 className="font-bold mt-3">Withdraw Money</h2><p className="text-[11px] text-gray-500">With Aadhaar</p><div className="bg-white border rounded-xl p-6 mt-4 max-w-md"><input value={n} onChange={e=>setN(e.target.value)} placeholder="Member Name" className="w-full border p-3 rounded-xl mb-3" /><input value={ad} onChange={e=>setAd(e.target.value)} placeholder="Aadhaar Last 4" maxLength={4} className="w-full border p-3 rounded-xl mb-3 tracking-widest" /><input value={a} onChange={e=>setA(e.target.value)} placeholder="Amount" type="number" className="w-full border p-3 rounded-xl mb-3" /><input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason" className="w-full border p-3 rounded-xl mb-4" /><button onClick={save} className="w-full bg-[#1F1F2E] text-white rounded-full py-3 font-bold">Withdraw ₹{a||0}</button></div></div></div>)}
function LoanPage(){ const nav=useNavigate(); const [n,setN]=useState(''); const [a,setA]=useState(''); const [ad,setAd]=useState(''); const [purpose,setPurpose]=useState(''); const save=async()=>{ if(!n||!a||!ad) return alert('Name, Loan, Aadhaar bharo'); await addRecord({id:Date.now(),name:n,aadhaar:ad,amount:Number(a),type:"Loan",purpose}); nav('/home'); }; return(<div className="flex min-h-screen bg-[#F8F8FC]"><Sidebar/><div className="flex-1 p-6"><Link to="/home" className="text-sm">← Back</Link><h2 className="font-bold mt-3">Add Loan</h2><p className="text-[11px] text-gray-500">With Aadhaar</p><div className="bg-white border rounded-xl p-6 mt-4 max-w-md"><input value={n} onChange={e=>setN(e.target.value)} placeholder="Member Name" className="w-full border p-3 rounded-xl mb-3" /><input value={ad} onChange={e=>setAd(e.target.value)} placeholder="Aadhaar Last 4" maxLength={4} className="w-full border p-3 rounded-xl mb-3 tracking-widest" /><input value={a} onChange={e=>setA(e.target.value)} placeholder="Loan Amount" type="number" className="w-full border p-3 rounded-xl mb-3" /><input value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="Purpose" className="w-full border p-3 rounded-xl mb-4" /><button onClick={save} className="w-full bg-[#FF4D5A] text-white rounded-full py-3 font-bold">Add Loan ₹{a||0}</button></div></div></div>)}
function History(){ const [all,setAll]=useState([]); useEffect(()=>{getAll().then(a=>setAll([...a].reverse()))},[]); return(<div className="flex min-h-screen bg-[#F8F8FC]"><Sidebar/><div className="flex-1 p-6"><h2 className="font-bold">Transaction History</h2><div className="bg-white border rounded-xl mt-4 p-4">{all.map(r=>(<Link key={r.id} to={`/receipt/${r.id}`}><div className={`flex justify-between py-2.5 border-b text-xs px-2 rounded-lg mb-1 ${r.isOffline ? 'bg-red-50 border border-red-200 text-red-700' : ''}`}><span>{r.name}</span><span>{r.type}</span><span>₹{r.amount}</span><span>XXXX-{r.aadhaar||'----'}</span><span className={`${r.isOffline?'text-red-600 font-bold':'text-green-600'}`}>{r.isOffline?'● Offline (auto)':'● Synced'}</span></div></Link>))}</div></div></div>)}
function GroupPage(){ const [all,setAll]=useState([]); useEffect(()=>{getAll().then(setAll)},[]); return(<div className="flex min-h-screen bg-[#F8F8FC]"><Sidebar/><div className="flex-1 p-6"><h2 className="font-bold">Members</h2><div className="bg-white border rounded-xl mt-4 p-4">{all.map(m=><div key={m.id} className={`py-2 border-b text-sm flex justify-between px-2 rounded mb-1 ${m.isOffline?'bg-red-50 text-red-700 border border-red-200':''}`}><span>{m.name} - {m.type} - XXXX-{m.aadhaar||'----'}</span><span className="text-xs">{m.isOffline?'Offline (auto sync)':'Synced'}</span></div>)}</div></div></div>)}
function Receipt(){ const {id}=useParams(); const [r,setR]=useState(null); useEffect(()=>{getAll().then(a=>setR(a.find(x=>String(x.id)===String(id))))},[id]); if(!r) return <div className="p-5">Loading...</div>; return(<div className="min-h-screen bg-[#F5F1E8] p-5 flex flex-col items-center"><Link to="/home" className="self-start text-sm mb-4">← Back</Link><div className={`bg-white border-2 border-dashed rounded-[20px] p-6 w-full max-w-sm shadow-lg ${r.isOffline?'border-red-300 bg-red-50/30':''}`}><div className="flex flex-col items-center"><div className="flex items-center gap-2"><img src={logo} className="w-10 h-10 bg-white rounded-full p-1 border" alt="logo"/><div><b className="text-[#0F4C4C] tracking-widest">SANCHAY</b><p className="text-[10px] text-gray-500 -mt-1">Mahila Bachat Samiti</p></div></div><h3 className="font-bold text-[22px] mt-4">Payment Receipt</h3></div><div className="mt-8 text-sm space-y-3.5"><div className="flex justify-between"><span className="text-gray-500">Member Name</span><b>{r.name}</b></div><div className="flex justify-between"><span className="text-gray-500">Aadhaar</span><span>XXXX-XXXX-{r.aadhaar||'1234'}</span></div><div className="flex justify-between"><span className="text-gray-500">Type</span><span>{r.type}</span></div><div className="flex justify-between items-center"><span className="text-gray-500">Amount</span><b className="text-[32px] text-[#0F4C4C]">₹{r.amount}</b></div><div className="flex justify-between"><span className="text-gray-500">Status</span><b className={`${r.isOffline?'text-red-600':'text-green-600'}`}>{r.isOffline?'● Offline - Auto sync pending':'● Synced'}</b></div><div className="flex justify-between text-xs"><span className="text-gray-500">Date</span><span>{new Date(r.date).toLocaleString()}</span></div></div><button onClick={()=>window.print()} className="w-full bg-[#8EC6C6] text-white rounded-xl py-3 mt-5 font-bold">🖨️ Print Receipt</button><Link to="/home" className="block text-center mt-3 bg-[#1F1F2E] text-white rounded-xl py-2 text-sm">Done</Link></div></div>)}

export default function App(){
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash/>} />
        <Route path="/home" element={<Home/>} />
        <Route path="/add" element={<Add/>} />
        <Route path="/withdraw" element={<Withdraw/>} />
        <Route path="/loan" element={<LoanPage/>} />
        <Route path="/history" element={<History/>} />
        <Route path="/group" element={<GroupPage/>} />
        <Route path="/receipt/:id" element={<Receipt/>} />
      </Routes>
    </BrowserRouter>
  )
}