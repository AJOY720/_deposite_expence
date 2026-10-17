const $=id=>document.getElementById(id);
const KEY='joma-khoroch-v2-records', PINKEY='joma-khoroch-v2-pin';
let records=[];try{records=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){records=[]}
let unlocked=false;
const today=new Date(), pad=n=>String(n).padStart(2,'0'), todayStr=`${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
$('date').value=todayStr;
const money=n=>new Intl.NumberFormat('bn-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(n);
const persist=()=>{localStorage.setItem(KEY,JSON.stringify(records));render()};
const pinConfig=()=>{try{return JSON.parse(localStorage.getItem(PINKEY)||'null')}catch(e){return null}};
async function hash(text){const data=new TextEncoder().encode(text);const digest=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function showApp(){unlocked=true;$('lockScreen').hidden=true;$('app').hidden=false;render()}
function lock(){unlocked=false;$('app').hidden=true;$('lockScreen').hidden=false;$('pinInput').value='';$('lockError').textContent='';$('setupArea').hidden=!!pinConfig();$('unlockForm').hidden=!pinConfig();$('lockTitle').textContent=pinConfig()?'জমা-খরচ আনলক করুন':'প্রথমবার PIN সেট করুন';$('lockText').textContent=pinConfig()?'আপনার PIN/পাসওয়ার্ড লিখুন':'অ্যাপ ব্যবহারের আগে একটি PIN তৈরি করুন';}
$('unlockForm').addEventListener('submit',async e=>{e.preventDefault();const cfg=pinConfig();if(!cfg)return;const got=await hash($('pinInput').value);if(got===cfg.hash)showApp();else $('lockError').textContent='PIN/পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।'});
$('setupForm').addEventListener('submit',async e=>{e.preventDefault();const a=$('newPin').value,b=$('confirmPin').value;if(a.length<4){$('lockError').textContent='কমপক্ষে ৪ অক্ষর/সংখ্যা দিন।';return}if(a!==b){$('lockError').textContent='দুটি PIN/পাসওয়ার্ড মিলছে না।';return}if(!crypto.subtle){$('lockError').textContent='এই ব্রাউজারে নিরাপদ PIN সেট করা যাচ্ছে না। HTTPS সাইটে খুলুন।';return}localStorage.setItem(PINKEY,JSON.stringify({hash:await hash(a)}));showApp()});
$('lockNow').addEventListener('click',lock);
$('changePin').addEventListener('click',async()=>{const cfg=pinConfig();if(!cfg)return;const current=prompt('বর্তমান PIN/পাসওয়ার্ড লিখুন:');if(current===null)return;if(await hash(current)!==cfg.hash){alert('বর্তমান PIN/পাসওয়ার্ড সঠিক নয়।');return}const next=prompt('নতুন PIN/পাসওয়ার্ড দিন (কমপক্ষে ৪ অক্ষর/সংখ্যা):');if(next===null)return;if(next.length<4){alert('কমপক্ষে ৪ অক্ষর/সংখ্যা দিন।');return}const confirmNext=prompt('নতুন PIN/পাসওয়ার্ড আবার লিখুন:');if(next!==confirmNext){alert('দুটি PIN/পাসওয়ার্ড মিলছে না।');return}localStorage.setItem(PINKEY,JSON.stringify({hash:await hash(next)}));alert('PIN/পাসওয়ার্ড পরিবর্তন হয়েছে।');lock()});
$('entryForm').addEventListener('submit',e=>{e.preventDefault();const amount=Number($('amount').value),editId=$('editId').value;if(!Number.isFinite(amount)||amount<=0){alert('সঠিক টাকার পরিমাণ লিখুন।');return}const item={id:editId||Date.now().toString(36)+Math.random().toString(36).slice(2,7),type:document.querySelector('input[name="type"]:checked').value,amount,note:$('note').value.trim(),category:$('category').value,date:$('date').value};if(editId){records=records.map(x=>x.id===editId?item:x)}else records.push(item);persist();resetForm()});
function resetForm(){$('entryForm').reset();$('editId').value='';$('date').value=todayStr;$('formTitle').textContent='নতুন হিসাব যোগ করুন';$('saveBtn').textContent='হিসাব সেভ করুন';$('cancelEdit').hidden=true}
$('cancelEdit').addEventListener('click',resetForm);
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function selectedReport(){const type=$('reportType').value;return records.filter(x=>type==='month'?x.date.startsWith($('reportMonth').value):x.date.startsWith($('reportYear').value))}
function sum(list,type){return list.filter(x=>x.type===type).reduce((s,x)=>s+x.amount,0)}
function csvDownload(list,filename){if(!list.length){alert('ডাউনলোড করার মতো হিসাব নেই।');return}const rows=[['তারিখ','ধরন','বিবরণ','ক্যাটাগরি','টাকার পরিমাণ'],...list.map(x=>[x.date,x.type==='income'?'জমা':'খরচ',x.note,x.category,x.amount])];const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');const a=document.createElement('a');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function render(){
 const inc=sum(records,'income'),exp=sum(records,'expense');$('totalIncome').textContent=money(inc);$('totalExpense').textContent=money(exp);$('balance').textContent=money(inc-exp);
 const months=[...new Set(records.map(x=>x.date.slice(0,7)).filter(Boolean))].sort().reverse();const old=$('filterMonth').value;
 $('filterMonth').innerHTML='<option value="all">সব মাস</option>'+months.map(m=>`<option value="${m}">${m}</option>`).join('');if(months.includes(old))$('filterMonth').value=old;
 const allMonths=[...new Set([todayStr.slice(0,7),...records.map(x=>x.date.slice(0,7)).filter(Boolean)])].sort().reverse();const rm=$('reportMonth').value;
 $('reportMonth').innerHTML=allMonths.map(m=>`<option value="${m}">${m}</option>`).join('');if(allMonths.includes(rm))$('reportMonth').value=rm;else $('reportMonth').value=todayStr.slice(0,7);
 const years=[...new Set([String(today.getFullYear()),...records.map(x=>x.date.slice(0,4)).filter(Boolean)])].sort().reverse();const ry=$('reportYear').value;
 $('reportYear').innerHTML=years.map(y=>`<option value="${y}">${y}</option>`).join('');if(years.includes(ry))$('reportYear').value=ry;else $('reportYear').value=String(today.getFullYear());
 const report=selectedReport(),ri=sum(report,'income'),re=sum(report,'expense');$('reportIncome').textContent=money(ri);$('reportExpense').textContent=money(re);$('reportNet').textContent=money(ri-re);
 const q=$('search').value.toLocaleLowerCase(),type=$('filterType').value,month=$('filterMonth').value;
 const list=records.filter(x=>(type==='all'||x.type===type)&&(month==='all'||x.date.startsWith(month))&&(`${x.note} ${x.category} ${x.date}`).toLocaleLowerCase().includes(q)).sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
 $('entries').innerHTML=list.map(x=>`<div class="entry"><div class="entryInfo"><strong>${esc(x.note)}</strong><div class="meta">${esc(x.category)} • ${esc(x.date)}</div><div class="entryActions"><button class="editBtn" data-action="edit" data-id="${x.id}">✏️ Edit</button><button class="delete" data-action="delete" data-id="${x.id}">মুছুন</button></div></div><div class="money ${x.type}">${x.type==='income'?'+':'−'}${money(x.amount)}</div></div>`).join('');$('empty').hidden=list.length>0;
 $('monthWrap').hidden=$('reportType').value!=='month';$('yearWrap').hidden=$('reportType').value!=='year';
}
$('entries').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const x=records.find(r=>r.id===b.dataset.id);if(!x)return;if(b.dataset.action==='delete'){if(confirm(`“${x.note}” হিসাবটি মুছে ফেলবেন?`)){records=records.filter(r=>r.id!==x.id);persist();if($('editId').value===x.id)resetForm()}}else{$('editId').value=x.id;$('amount').value=x.amount;$('note').value=x.note;$('category').value=x.category;$('date').value=x.date;document.querySelector(`input[name="type"][value="${x.type}"]`).checked=true;$('formTitle').textContent='হিসাব সম্পাদনা করুন';$('saveBtn').textContent='পরিবর্তন সেভ করুন';$('cancelEdit').hidden=false;window.scrollTo({top:0,behavior:'smooth'})}});
['search','filterType','filterMonth','reportType','reportMonth','reportYear'].forEach(id=>$(id).addEventListener('input',render));
$('exportAll').addEventListener('click',()=>csvDownload(records,'joma-khoroch-all.csv'));
$('exportReport').addEventListener('click',()=>csvDownload(selectedReport(),'joma-khoroch-report-'+($('reportType').value==='month'?$('reportMonth').value:$('reportYear').value)+'.csv'));
let deferredPrompt;$('installBtn')?.remove();window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
lock();render();