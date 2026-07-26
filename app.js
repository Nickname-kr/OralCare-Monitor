(() => {
"use strict";

const DB_NAME="oralcare-monitor-db", DB_VERSION=3, STORE="records", SETTINGS_STORE="settings", PROFILE_KEY="oralcare-profile-v4";
const REGIONS=[
  {key:"입술",sub:"윗입술·아랫입술",asset:"lips.svg",sites:[{label:"윗입술",asset:"lips_upper.svg"},{label:"아랫입술",asset:"lips_lower.svg"}]},
  {key:"입천장",sub:"앞쪽·뒤쪽",asset:"palate.svg",sites:[{label:"앞쪽 입천장",value:"앞쪽",asset:"palate_front.svg"},{label:"뒤쪽 입천장",value:"뒤쪽",asset:"palate_back.svg"}]},
  {key:"볼",sub:"볼 안쪽",asset:"cheek.svg",sites:[{label:"왼쪽 볼 안쪽",value:"왼쪽",asset:"cheek_left.svg"},{label:"오른쪽 볼 안쪽",value:"오른쪽",asset:"cheek_right.svg"}]},
  {key:"잇몸",sub:"위 잇몸·아래 잇몸",asset:"gingiva.svg",sites:[{label:"위 잇몸",asset:"gingiva_upper.svg"},{label:"아래 잇몸",asset:"gingiva_lower.svg"}]},
  {key:"혀",sub:"윗면·아랫면·옆면",asset:"tongue.svg",sites:[{label:"혀 윗면",value:"윗면",asset:"tongue_top.svg"},{label:"혀 아랫면",value:"아랫면",asset:"tongue_bottom.svg"},{label:"혀 왼쪽 옆면",value:"왼쪽 옆면",asset:"tongue_left.svg"},{label:"혀 오른쪽 옆면",value:"오른쪽 옆면",asset:"tongue_right.svg"}]},
  {key:"입바닥",sub:"혀 아래쪽",asset:"floor.svg",sites:[{label:"입바닥 왼쪽",value:"왼쪽",asset:"floor_left.svg"},{label:"입바닥 가운데",value:"가운데",asset:"floor_center.svg"},{label:"입바닥 오른쪽",value:"오른쪽",asset:"floor_right.svg"}]},
  {key:"어금니 뒤",sub:"마지막 어금니 뒤쪽",asset:"retromolar.svg",sites:[{label:"왼쪽 어금니 뒤",value:"왼쪽",asset:"retromolar_left.svg"},{label:"오른쪽 어금니 뒤",value:"오른쪽",asset:"retromolar_right.svg"}]},
  {key:"목 안쪽",sub:"입을 크게 벌렸을 때 안쪽",asset:"throat.svg",sites:[{label:"목 안쪽 왼쪽",value:"왼쪽",asset:"throat_left.svg"},{label:"목 안쪽 가운데",value:"가운데",asset:"throat_center.svg"},{label:"목 안쪽 오른쪽",value:"오른쪽",asset:"throat_right.svg"}]}
];
const ASSET_BASE="assets/anatomy/";
const GUIDES={
  "입술":["렌즈를 깨끗이 닦아주세요.","입술을 부드럽게 뒤집어 안쪽 점막을 보여주세요.","입술이 접히지 않도록 가볍게 펴주세요.","기준 사진과 비슷한 거리와 각도로 촬영해주세요."],
  "입천장":["렌즈를 깨끗이 닦아주세요.","고개를 약간 뒤로 젖히고 입을 크게 벌려주세요.","혀를 아래로 내려 입천장이 가려지지 않게 해주세요.","앞니와 어금니가 기준 사진과 비슷하게 보이도록 맞춰주세요."],
  "볼":["렌즈를 깨끗이 닦아주세요.","입을 충분히 벌리고 볼을 바깥쪽으로 당겨주세요.","볼 안쪽 점막의 접힌 부분을 최대한 펴주세요.","기준 사진의 치아 배열과 촬영 각도를 맞춰주세요."],
  "잇몸":["렌즈를 깨끗이 닦아주세요.","입술이나 볼을 충분히 당겨 잇몸을 노출해주세요.","치아와 잇몸 경계가 함께 보이게 촬영해주세요.","같은 치아가 화면에 들어오도록 기준 사진과 맞춰주세요."],
  "혀":["렌즈를 깨끗이 닦아주세요.","선택한 면이 카메라를 향하도록 혀를 움직여주세요.","옆면 촬영은 깨끗한 거즈로 혀끝을 잡으면 도움이 됩니다.","기준 사진과 같은 치아와 혀의 방향이 보이도록 맞춰주세요."],
  "입바닥":["렌즈를 깨끗이 닦아주세요.","혀끝을 입천장에 붙여 입바닥을 보여주세요.","입을 충분히 벌리고 혀 아래쪽이 접히지 않게 해주세요.","기준 사진과 같은 앞니와 혀 위치가 보이도록 맞춰주세요."],
  "어금니 뒤":["렌즈를 깨끗이 닦아주세요.","입을 최대한 크게 벌려주세요.","볼을 바깥쪽으로 당겨 마지막 어금니 뒤쪽을 보여주세요.","가능하면 보호자의 도움을 받아 촬영해주세요."],
  "목 안쪽":["렌즈를 깨끗이 닦아주세요.","입을 크게 벌리고 ‘아’ 소리를 내주세요.","혀가 시야를 가리면 아래로 내려주세요.","휴대폰을 목 안쪽으로 무리하게 넣지 마세요."]
};

const $=id=>document.getElementById(id);
const screens=[...document.querySelectorAll(".screen")], historyStack=["intro"];
const state={
  db:null,profile:null,region:"",subsite:"",siteKey:"",selected:"",
  stream:null,facing:"environment",captured:null,captureMeta:null,baseline:null,
  detailId:null,editingId:null,compareSite:"",urls:new Set(),resultUrl:"",persistent:false,installPrompt:null,restorePayload:null,reportRows:[],lastBackupAt:null
};

function toast(message){
  $("toast").textContent=message;$("toast").classList.add("show");
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>$("toast").classList.remove("show"),2500);
}
function current(){return historyStack[historyStack.length-1]}
async function show(name,push=true){
  const target=document.querySelector(`[data-screen="${name}"]`);if(!target)return;
  if(current()==="camera"&&name!=="camera")stopCamera();
  screens.forEach(s=>s.classList.remove("active"));target.classList.add("active");
  if(push&&current()!==name)historyStack.push(name);
  target.querySelector(".scroll")?.scrollTo(0,0);
  if(name==="home")await renderHome();
  if(name==="subsite")renderSubsite();
  if(name==="timeline")await renderTimeline();
  if(name==="detail")await renderDetail();
  if(name==="compare")await renderCompare();
  if(name==="more")await renderMore();
  if(name==="report")await renderReport();
  if(name==="backup")await renderBackup();
  if(name==="editRecordScreen")await renderRecordEditor();
  if(name==="notice")await renderNotice();
  if(name==="camera"){await loadBaseline();await startCamera();}
}
function back(){
  if(historyStack.length>1){if(current()==="camera")stopCamera();historyStack.pop();show(current(),false)}
  else show("intro",false);
}
document.addEventListener("click",e=>{
  const go=e.target.closest("[data-go]");
  if(go){
    if(go.dataset.go==="symptoms"&&current()==="result"){
      resetSymptoms();
    }
    if(go.dataset.go==="region"&&current()!=="subsite"){
      resetRegion();
    }
    show(go.dataset.go);
    return;
  }
  if(e.target.closest("[data-back]"))back();
});

/* Database */
function openDB(){return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,DB_VERSION);
  req.onupgradeneeded=()=>{
    const db=req.result;
    if(!db.objectStoreNames.contains(STORE)){
      const store=db.createObjectStore(STORE,{keyPath:"id",autoIncrement:true});
      store.createIndex("patientId","patientId");
      store.createIndex("patientSite","patientSite");
    }
    if(!db.objectStoreNames.contains(SETTINGS_STORE)){
      db.createObjectStore(SETTINGS_STORE,{keyPath:"key"});
    }
  };
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
})}
function transaction(mode,fn){return new Promise((resolve,reject)=>{
  const tx=state.db.transaction(STORE,mode),store=tx.objectStore(STORE);let req;
  try{req=fn(store)}catch(err){reject(err);return}
  tx.oncomplete=()=>resolve(req?.result);tx.onerror=()=>reject(tx.error||req?.error);tx.onabort=()=>reject(tx.error||new Error("저장 작업이 중단되었습니다."));
})}
const addRecord=r=>transaction("readwrite",s=>s.add(r));
const putRecord=r=>transaction("readwrite",s=>s.put(r));
const removeRecord=id=>transaction("readwrite",s=>s.delete(Number(id)));
const clearRecords=()=>transaction("readwrite",s=>s.clear());
function settingTransaction(mode,fn){return new Promise((resolve,reject)=>{
  const tx=state.db.transaction(SETTINGS_STORE,mode),store=tx.objectStore(SETTINGS_STORE);let req;
  try{req=fn(store)}catch(err){reject(err);return}
  tx.oncomplete=()=>resolve(req?.result);tx.onerror=()=>reject(tx.error||req?.error);tx.onabort=()=>reject(tx.error||new Error("저장 작업이 중단되었습니다."));tx.onabort=()=>reject(tx.error||new Error("설정 저장이 중단되었습니다."));
})}
const putSetting=(key,value)=>settingTransaction("readwrite",s=>s.put({key,value,updatedAt:new Date().toISOString()}));
function getSetting(key){return new Promise((resolve,reject)=>{
  const req=state.db.transaction(SETTINGS_STORE,"readonly").objectStore(SETTINGS_STORE).get(key);
  req.onsuccess=()=>resolve(req.result?.value??null);req.onerror=()=>reject(req.error);
})}
const clearSettings=()=>settingTransaction("readwrite",s=>s.clear());
function allRecords(){return new Promise((resolve,reject)=>{
  const req=state.db.transaction(STORE,"readonly").objectStore(STORE).getAll();
  req.onsuccess=()=>resolve((req.result||[]).sort((a,b)=>new Date(b.capturedAt)-new Date(a.capturedAt)));req.onerror=()=>reject(req.error);
})}
function getRecord(id){return new Promise((resolve,reject)=>{
  const req=state.db.transaction(STORE).objectStore(STORE).get(Number(id));
  req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
})}
function recordsForPatient(patientId=state.profile?.patientNumber){return new Promise((resolve,reject)=>{
  if(!patientId){resolve([]);return}
  const req=state.db.transaction(STORE).objectStore(STORE).index("patientId").getAll(patientId);
  req.onsuccess=()=>resolve((req.result||[]).sort((a,b)=>new Date(b.capturedAt)-new Date(a.capturedAt)));
  req.onerror=()=>reject(req.error);
})}
function recordsForSite(siteKey,patientId=state.profile?.patientNumber){return new Promise((resolve,reject)=>{
  if(!patientId||!siteKey){resolve([]);return}
  const req=state.db.transaction(STORE).objectStore(STORE).index("patientSite").getAll(`${patientId}|${siteKey}`);
  req.onsuccess=()=>resolve((req.result||[]).sort((a,b)=>new Date(b.capturedAt)-new Date(a.capturedAt)));
  req.onerror=()=>reject(req.error);
})}

/* Helpers */
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function siteKey(r,s){return `${r}::${s}`}
function label(r){return r.selected||`${r.region} · ${r.subsite}`}
function symptoms(r){return r?.symptoms?.length?r.symptoms.join(", "):"증상 기록 없음"}
function fmt(v,time=false){const d=new Date(v);return Number.isNaN(d.getTime())? "—":new Intl.DateTimeFormat("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit",...(time?{hour:"2-digit",minute:"2-digit"}:{})}).format(d)}
function short(v){return new Intl.DateTimeFormat("ko-KR",{month:"2-digit",day:"2-digit"}).format(new Date(v))}
function addDays(v,n){const d=new Date(v);d.setDate(d.getDate()+Number(n));return d}
function dayDiff(a,b=new Date()){const x=new Date(a),y=new Date(b);x.setHours(0,0,0,0);y.setHours(0,0,0,0);return Math.round((y-x)/86400000)}
function urlFor(blob){const u=URL.createObjectURL(blob);state.urls.add(u);return u}
function clearUrls(){state.urls.forEach(URL.revokeObjectURL);state.urls.clear()}
function formatBytes(n){if(n<1024)return`${n} B`;if(n<1048576)return`${(n/1024).toFixed(1)} KB`;return`${(n/1048576).toFixed(1)} MB`}

function uuid(){return crypto?.randomUUID?crypto.randomUUID():`om-${Date.now()}-${Math.random().toString(36).slice(2,12)}`}
function safeFileName(value){return String(value||"oralcare").replace(/[^0-9A-Za-z가-힣._-]+/g,"_").replace(/^_+|_+$/g,"")||"oralcare"}
function toLocalDateTimeInput(value){const d=new Date(value);if(Number.isNaN(d.getTime()))return"";const pad=n=>String(n).padStart(2,"0");return`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`}
function parseLocalDateBoundary(value,end=false){if(!value)return null;const d=new Date(`${value}T${end?"23:59:59.999":"00:00:00"}`);return Number.isNaN(d.getTime())?null:d}
function recordIdentity(r){return r.recordUuid||`${r.patientId}|${r.siteKey}|${r.capturedAt}`}
async function blobToDataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)})}
function dataUrlToBlob(dataUrl){const [head,data]=String(dataUrl).split(",");if(!head||!data)throw new Error("잘못된 이미지 데이터");const mime=(head.match(/data:([^;]+)/)||[])[1]||"application/octet-stream";const binary=atob(data);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return new Blob([bytes],{type:mime})}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200)}
async function shareFile(file,title,text){if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({title,text,files:[file]});return true}return false}

/* Profile and storage persistence */
async function requestPersistentStorage(){
  try{
    if(!navigator.storage){state.persistent=false;return false}
    if(await navigator.storage.persisted?.()){state.persistent=true;updatePersistenceUI();return true}
    state.persistent=Boolean(await navigator.storage.persist?.());updatePersistenceUI();return state.persistent;
  }catch{state.persistent=false;updatePersistenceUI();return false}
}
function updatePersistenceUI(){
  const msg=state.persistent
    ? "이 브라우저가 가능한 범위에서 기록을 영구 보관하도록 설정되었습니다."
    : "기기 내부에 저장되지만 브라우저 정리 또는 장기간 미사용 시 삭제될 수 있습니다.";
  if($("introStorageStatus"))$("introStorageStatus").textContent=msg;
  if($("persistenceMessage"))$("persistenceMessage").textContent=msg;
  if($("persistenceStatus"))$("persistenceStatus").textContent=state.persistent?"영구 저장 요청 승인됨":"브라우저 로컬 저장";
}
async function loadProfile(){
  let profile=null;
  try{profile=JSON.parse(localStorage.getItem(PROFILE_KEY)||"null")}catch{}
  if(!profile){try{profile=await getSetting("profile")}catch{}}
  if(!profile){
    try{
      const rows=await allRecords();
      const recovered=rows.find(r=>r.patientId);
      if(recovered){profile={patientNumber:recovered.patientId,displayName:"환자",intervalDays:14,recovered:true};await putSetting("profile",profile);localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));toast("기존 촬영 기록에서 환자번호를 복구했습니다.")}
    }catch{}
  }
  state.profile=profile;
  try{state.lastBackupAt=await getSetting("lastBackupAt")}catch{state.lastBackupAt=null}
  $("startApp").textContent=state.profile?"기록 계속하기":"시작하기";
  try{state.persistent=Boolean(await navigator.storage?.persisted?.())}catch{state.persistent=false}
  updatePersistenceUI();
}
async function saveProfile(profile){
  const old=state.profile?.patientNumber;
  if(old&&old!==profile.patientNumber){
    const rows=await recordsForPatient(old);
    for(const r of rows){r.patientId=profile.patientNumber;r.patientSite=`${profile.patientNumber}|${r.siteKey}`;await putRecord(r)}
  }
  state.profile=profile;
  localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));
  await putSetting("profile",profile);
}
$("startApp").onclick=async()=>{await requestPersistentStorage();show(state.profile?"home":"profile")};
$("profileForm").onsubmit=async e=>{
  e.preventDefault();const patientNumber=$("patientNumber").value.trim();
  if(!patientNumber){toast("환자번호를 입력해주세요.");return}
  try{
    await requestPersistentStorage();
    await saveProfile({patientNumber,displayName:$("displayName").value.trim()||"환자",intervalDays:Number($("intervalDays").value)||14});
    historyStack.splice(0,historyStack.length,"home");await show("home",false);toast("기본정보를 저장했습니다.");
  }catch(err){console.error(err);toast("기본정보를 저장하지 못했습니다.")}
};
function editProfile(){
  $("patientNumber").value=state.profile?.patientNumber||"";
  $("displayName").value=state.profile?.displayName||"";
  $("intervalDays").value=String(state.profile?.intervalDays||14);show("profile");
}

/* Anatomy assets and two-step region selection */
function assetPath(name){return `${ASSET_BASE}${name}`}
function currentRegionConfig(){return REGIONS.find(r=>r.key===state.region)||null}
function currentSubsiteConfig(){return currentRegionConfig()?.sites.find(s=>(s.value||s.label)===state.subsite)||null}
function renderRegions(){
  $("mainRegions").innerHTML=REGIONS.map(r=>`<button class="region-card region-card-v31" data-region="${r.key}"><div class="region-visual-v31"><img src="${assetPath(r.asset)}" alt="${esc(r.key)} 안내 그림"></div><footer><div><strong>${r.key}</strong><small>${r.sub}</small></div><span>›</span></footer></button>`).join("");
}
function resetRegion(){
  state.region=state.subsite=state.siteKey=state.selected="";
  $("selectionText").textContent="아직 선택하지 않았습니다.";
  $("regionNext").disabled=true;$("subsiteSticky").classList.add("hidden");
  document.querySelectorAll(".region-card,.subsite-option").forEach(x=>x.classList.remove("selected"));
}
function selectRegion(region){
  state.region=region;state.subsite=state.siteKey=state.selected="";
  document.querySelectorAll(".region-card").forEach(x=>x.classList.toggle("selected",x.dataset.region===region));
  show("subsite");
}
function renderSubsite(){
  const r=currentRegionConfig();if(!r)return;
  $("subsiteEyebrow").textContent=r.key;
  $("subsiteTitle").innerHTML=r.key==="혀"?"혀의 어느 면을<br>촬영하나요?":`${r.key}의 어느 위치를<br>촬영하나요?`;
  $("subsiteDescription").textContent="선택 버튼을 누르면 큰 그림의 강조 영역이 바뀝니다.";
  $("subsitePreview").src=assetPath(r.asset);$("subsitePreview").alt=`${r.key} 세부 위치 안내`;
  $("subsitePreviewLabel").textContent="세부 위치를 선택해주세요.";
  $("subsites").innerHTML=r.sites.map(s=>`<button class="subsite-option" data-subsite="${esc(s.value||s.label)}" data-asset="${s.asset}" data-display="${esc(s.label)}"><b>${esc(s.label)}</b><span>✓</span></button>`).join("");
  $("selectionText").textContent="아직 선택하지 않았습니다.";$("regionNext").disabled=true;$("subsiteSticky").classList.add("hidden");
}
function selectSubsite(sub,asset,display){
  state.subsite=sub;state.siteKey=siteKey(state.region,sub);state.selected=`${state.region} · ${display||sub}`;
  document.querySelectorAll(".subsite-option").forEach(x=>x.classList.toggle("selected",x.dataset.subsite===sub));
  $("subsitePreview").src=assetPath(asset);$("subsitePreviewLabel").textContent=display||sub;
  $("selectionText").textContent=state.selected;$("regionNext").disabled=false;$("subsiteSticky").classList.remove("hidden");
  toast(`${state.selected}을 선택했습니다.`);
}
$("mainRegions").onclick=e=>{const b=e.target.closest("[data-region]");if(b)selectRegion(b.dataset.region)};
$("subsites").onclick=e=>{const b=e.target.closest("[data-subsite]");if(b)selectSubsite(b.dataset.subsite,b.dataset.asset,b.dataset.display)};
$("regionNext").onclick=()=>{if(!state.siteKey)return;updateGuide();show("guide")};
function updateGuide(){
  $("guideLabel").textContent=$("cameraLabel").textContent=$("resultLabel").textContent=state.selected;
  const asset=currentSubsiteConfig()?.asset||currentRegionConfig()?.asset;
  $("guideArt").innerHTML=`<img src="${assetPath(asset)}" alt="${esc(state.selected)} 촬영 위치 안내">`;
  $("guideList").innerHTML=(GUIDES[state.region]||GUIDES["볼"]).map((g,i)=>`<article><span>${i+1}</span><div><b>${esc(g)}</b><p>${i===3?"기준 사진 오버레이를 이용하면 위치와 각도를 맞추는 데 도움이 됩니다.":"안전하고 선명한 촬영을 위한 안내입니다."}</p></div></article>`).join("");
}

/* Camera */
function setOpacity(v){v=Math.max(0,Math.min(100,Number(v)));$("opacity").value=v;$("opacityValue").textContent=`${v}%`;$("baselineOverlay").style.opacity=v/100}
$("opacity").oninput=e=>setOpacity(e.target.value);$("minus").onclick=()=>setOpacity(+$("opacity").value-10);$("plus").onclick=()=>setOpacity(+$("opacity").value+10);
async function loadBaseline(){
  if(state.baselineUrl){URL.revokeObjectURL(state.baselineUrl);state.urls.delete(state.baselineUrl)}
  const rows=await recordsForSite(state.siteKey);state.baseline=rows.find(r=>r.isBaseline)||null;
  if(state.baseline){state.baselineUrl=urlFor(state.baseline.imageBlob);$("baselineOverlay").src=state.baselineUrl;$("baselineOverlay").classList.add("show");$("noBaseline").classList.add("hidden")}
  else{$("baselineOverlay").classList.remove("show");$("noBaseline").classList.remove("hidden")}
  applyMirror();
}
function applyMirror(){
  const front=state.facing==="user";$("video").classList.toggle("mirror",front);$("baselineOverlay").classList.toggle("mirror",front);
  $("orientation").textContent=front?"전면 미리보기 · 거울 화면 / 저장 시 실제 방향":"후면 카메라 · 실제 좌우 방향";
}
async function startCamera(){
  if(!navigator.mediaDevices?.getUserMedia){cameraError("실시간 카메라를 지원하지 않는 브라우저입니다.");return}
  stopCamera();$("cameraPlaceholder").classList.remove("hidden");$("cameraStatus").textContent="카메라 권한 요청 중";applyMirror();
  try{
    state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:state.facing},width:{ideal:1920},height:{ideal:1080}},audio:false});
    $("video").srcObject=state.stream;await $("video").play();$("cameraPlaceholder").classList.add("hidden");
    $("cameraStatus").textContent=state.facing==="user"?"전면 카메라 연결됨":"후면 카메라 연결됨";applyMirror();
  }catch(err){cameraError(err?.name==="NotAllowedError"?"카메라 권한이 거부되었습니다.":"카메라를 시작하지 못했습니다. 왼쪽 버튼으로 기본 카메라를 사용하세요.")}
}
function stopCamera(){if(state.stream){state.stream.getTracks().forEach(t=>t.stop());state.stream=null}$("video").srcObject=null}
function cameraError(msg){$("cameraStatus").textContent="카메라 연결 필요";$("cameraPlaceholder").classList.remove("hidden");$("cameraPlaceholder").querySelector("b").textContent="카메라를 열지 못했습니다.";$("cameraPlaceholder").querySelector("p").textContent=msg}
$("retryCamera").onclick=startCamera;$("switchCamera").onclick=async()=>{state.facing=state.facing==="environment"?"user":"environment";applyMirror();await startCamera()};
$("fallback").onclick=()=>$("fallbackInput").click();
$("fallbackInput").onchange=async e=>{const f=e.target.files?.[0];e.target.value="";if(!f)return;try{const p=await fileToImage(f);await setCapture(p.blob,p.canvas,"file")}catch(err){console.error(err);toast("사진을 처리하지 못했습니다.")}};
$("shutter").onclick=async()=>{
  const v=$("video");if(!state.stream||!v.videoWidth){toast("카메라가 준비되지 않았습니다.");return}
  try{
    const c=document.createElement("canvas");c.width=v.videoWidth;c.height=v.videoHeight;c.getContext("2d").drawImage(v,0,0);
    const p=await resize(c);state.captureSource=state.facing==="user"?"front-corrected":"rear";flash();setTimeout(()=>setCapture(p.blob,p.canvas,state.captureSource),220);
  }catch(err){console.error(err);toast("촬영을 처리하지 못했습니다.")}
};
function flash(){$("cameraView").animate([{filter:"brightness(1)"},{filter:"brightness(2.3)"},{filter:"brightness(1)"}],{duration:220})}
async function fileToImage(file){let bmp;try{bmp=await createImageBitmap(file,{imageOrientation:"from-image"})}catch{bmp=await createImageBitmap(file)}const c=document.createElement("canvas");c.width=bmp.width;c.height=bmp.height;c.getContext("2d").drawImage(bmp,0,0);bmp.close?.();return resize(c)}
async function resize(source,max=1600,q=.84){
  const scale=Math.min(1,max/Math.max(source.width,source.height)),w=Math.max(1,Math.round(source.width*scale)),h=Math.max(1,Math.round(source.height*scale));
  const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,w,h);x.drawImage(source,0,0,w,h);
  const blob=await new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error("jpeg")),"image/jpeg",q));return{blob,canvas:c}
}
function quality(c){
  const w=Math.min(180,c.width),h=Math.max(1,Math.round(c.height*w/c.width)),s=document.createElement("canvas");s.width=w;s.height=h;const x=s.getContext("2d",{willReadFrequently:true});x.drawImage(c,0,0,w,h);
  const p=x.getImageData(0,0,w,h).data;let total=0,diff=0,prev=null;
  for(let i=0;i<p.length;i+=4){const b=.2126*p[i]+.7152*p[i+1]+.0722*p[i+2];total+=b;if(prev!==null)diff+=Math.abs(b-prev);prev=b}
  const bright=total/(p.length/4),contrast=diff/Math.max(1,p.length/4-1);
  return{width:c.width,height:c.height,bright:Math.round(bright),contrast:Math.round(contrast*10)/10,res:c.width>=720&&c.height>=720,light:bright>=42&&bright<=222,sharp:contrast>=5.5}
}
function renderQuality(q){
  const score=Number(q.res)+Number(q.light)+Number(q.sharp);$("qualityScore").textContent=`${score}/3`;$("qualityTitle").textContent=score===3?"기본 촬영 조건이 확인되었습니다.":"재촬영이 필요한지 확인해주세요.";
  $("qualityList").innerHTML=`<li>${q.res?"✓":"!"} 해상도 ${q.width} × ${q.height}px</li><li>${q.light?"✓":"!"} 평균 밝기 ${q.bright}</li><li>${q.sharp?"✓":"!"} 기본 선명도 지표 ${q.contrast}</li><li>병소 포함 여부와 정확한 초점은 직접 확인해주세요.</li>`;
}
async function setCapture(blob,canvas,source){
  state.captured=blob;state.captureMeta={width:canvas.width,height:canvas.height,quality:quality(canvas),source};
  if(state.resultUrl){URL.revokeObjectURL(state.resultUrl);state.urls.delete(state.resultUrl)}state.resultUrl=urlFor(blob);$("resultImage").src=state.resultUrl;renderQuality(state.captureMeta.quality);updateGuide();await show("result");
}
$("flipResult").onclick=async()=>{
  if(!state.captured)return;const bmp=await createImageBitmap(state.captured),c=document.createElement("canvas");c.width=bmp.width;c.height=bmp.height;const x=c.getContext("2d");x.translate(c.width,0);x.scale(-1,1);x.drawImage(bmp,0,0);bmp.close?.();const p=await resize(c);await setCapture(p.blob,p.canvas,(state.captureMeta?.source||"file")+"-flipped");toast("사진을 좌우 반전했습니다.");
};

/* Symptoms and save */
const symptomInputs=[...document.querySelectorAll("#symptomChecks input")];
symptomInputs.forEach(input=>input.onchange=()=>{
  const none=symptomInputs.find(x=>x.dataset.none!==undefined);
  if(input.dataset.none!==undefined&&input.checked)symptomInputs.filter(x=>x!==input).forEach(x=>x.checked=false);
  else if(input.checked)none.checked=false;
});
function selectedSymptoms(){return symptomInputs.filter(x=>x.checked).map(x=>x.value)}
function resetSymptoms(){symptomInputs.forEach(x=>x.checked=false);$("memo").value="";state.editingId=null;$("symptomTitle").textContent="증상 기록";$("saveRecord").textContent="기록 저장하기"}
async function editSymptoms(record){state.editingId=record.id;symptomInputs.forEach(x=>x.checked=record.symptoms?.includes(x.value)||false);$("memo").value=record.memo||"";$("symptomTitle").textContent="증상 기록 수정";$("saveRecord").textContent="수정 내용 저장";await show("symptoms")}
$("saveRecord").onclick=async()=>{
  const syms=selectedSymptoms();if(!syms.length){toast("증상이 없다면 ‘특별한 증상 없음’을 선택해주세요.");return}
  try{
    if(state.editingId){
      const r=await getRecord(state.editingId);r.symptoms=syms;r.memo=$("memo").value.trim();r.updatedAt=new Date().toISOString();await putRecord(r);state.detailId=r.id;resetSymptoms();toast("증상과 메모를 수정했습니다.");await show("detail");return;
    }
    if(!state.captured||!state.siteKey){toast("촬영 정보가 없습니다.");return}
    const existing=await recordsForSite(state.siteKey),now=new Date(),isBaseline=existing.length===0;
    const r={patientId:state.profile.patientNumber,patientSite:`${state.profile.patientNumber}|${state.siteKey}`,siteKey:state.siteKey,region:state.region,subsite:state.subsite,selected:state.selected,capturedAt:now.toISOString(),updatedAt:now.toISOString(),imageBlob:state.captured,imageWidth:state.captureMeta.width,imageHeight:state.captureMeta.height,symptoms:syms,memo:$("memo").value.trim(),isBaseline,cameraFacing:state.facing,captureSource:state.captureMeta.source,quality:state.captureMeta.quality};
    await requestPersistentStorage();const id=await addRecord(r);r.id=Number(id);const verified=await getRecord(r.id);if(!verified)throw new Error("저장 확인 실패");renderComplete(r);resetSymptoms();state.captured=null;await show("complete");
  }catch(err){console.error(err);toast(err?.name==="QuotaExceededError"?"기기 저장 공간이 부족합니다.":"기록을 저장하지 못했습니다.")}
};
function renderComplete(r){
  $("completeTitle").textContent=r.isBaseline?"기준 사진과 첫 기록을 저장했습니다.":"오늘의 촬영 기록을 저장했습니다.";
  $("completeNext").innerHTML=`다음 권장 촬영일은 <b>${fmt(addDays(r.capturedAt,state.profile.intervalDays))}</b>입니다.`;
  $("completeSite").textContent=label(r);$("completeDate").textContent=fmt(r.capturedAt,true);$("completeType").textContent=r.isBaseline?"기준 사진":"순차 촬영";$("completeSymptoms").textContent=symptoms(r);
}

/* Home */
async function renderHome(){
  if(!state.profile){show("profile");return}clearUrls();const rows=await recordsForPatient(),latest=rows[0];
  $("homePatient").textContent=`환자번호 ${state.profile.patientNumber}`;$("homeName").textContent=state.profile.displayName||"환자";$("statRecords").textContent=`${rows.length}회`;$("statSites").textContent=`${new Set(rows.map(r=>r.siteKey)).size}곳`;
  if(latest){
    const next=addDays(latest.capturedAt,state.profile.intervalDays),remain=-dayDiff(next);
    $("nextBadge").textContent=remain<0?`${Math.abs(remain)}일 지남`:remain===0?"오늘 촬영":`${remain}일 후`;$("nextDate").textContent=fmt(next);$("nextSite").textContent=`${label(latest)} · ${state.profile.intervalDays}일 간격`;
    const elapsed=dayDiff(rows[rows.length-1].capturedAt),expected=Math.max(1,Math.floor(elapsed/state.profile.intervalDays)+1);$("statRate").textContent=`${Math.min(100,Math.round(rows.length/expected*100))}%`;
  }else{$("nextBadge").textContent="첫 촬영";$("nextDate").textContent="기준 사진을 등록하세요";$("nextSite").textContent="촬영 부위를 선택해 시작합니다.";$("statRate").textContent="—"}
  const recent=rows.slice(0,3);$("homeRecent").innerHTML=recent.map(r=>`<button class="recent-card" data-id="${r.id}"><img src="${urlFor(r.imageBlob)}"><b>${esc(label(r))}</b><small>${short(r.capturedAt)}${r.isBaseline?" · 기준":""}</small></button>`).join("");
  $("homeRecent").classList.toggle("hidden",!recent.length);$("homeEmpty").classList.toggle("hidden",!!recent.length);
  if(latest){$("homeSymptom").innerHTML=`<span>${latest.symptoms.includes("특별한 증상 없음")?"✓":"!"}</span><div><b>${esc(symptoms(latest))}</b><small>${fmt(latest.capturedAt)} · ${esc(label(latest))}</small></div><i>›</i>`;$("homeSymptom").onclick=()=>{state.detailId=latest.id;show("detail")}}
  else{$("homeSymptom").innerHTML=`<span>✓</span><div><b>기록이 없습니다.</b><small>촬영 후 증상을 기록할 수 있습니다.</small></div><i>›</i>`;$("homeSymptom").onclick=null}
}
$("homeRecent").onclick=e=>{const b=e.target.closest("[data-id]");if(b){state.detailId=+b.dataset.id;show("detail")}};

/* Timeline and detail */
async function renderTimeline(){
  clearUrls();const rows=await recordsForPatient(),filter=$("timelineFilter"),old=filter.value||"all",sites=[...new Map(rows.map(r=>[r.siteKey,label(r)])).entries()];
  filter.innerHTML=`<option value="all">전체</option>`+sites.map(([k,v])=>`<option value="${esc(k)}">${esc(v)}</option>`).join("");filter.value=sites.some(([k])=>k===old)?old:"all";
  const from=parseLocalDateBoundary($("timelineFrom").value),to=parseLocalDateBoundary($("timelineTo").value,true);
  const symptomOnly=$("timelineSymptomOnly").checked,baselineOnly=$("timelineBaselineOnly").checked;
  const list=rows.filter(r=>{
    const d=new Date(r.capturedAt);
    return (filter.value==="all"||r.siteKey===filter.value)&&(!from||d>=from)&&(!to||d<=to)&&(!baselineOnly||r.isBaseline)&&(!symptomOnly||!(r.symptoms||[]).includes("특별한 증상 없음"));
  });
  $("timelineCount").textContent=`${list.length}/${rows.length}회`;$("timelineSites").textContent=`${sites.length}곳`;$("timelineBaselines").textContent=`${rows.filter(r=>r.isBaseline).length}장`;
  $("timelineList").innerHTML=list.map(r=>`<article class="timeline-row"><div class="timeline-dot"><i></i></div><div><div class="timeline-meta"><b>${fmt(r.capturedAt,true)}</b>${r.isBaseline?"<span>기준 사진</span>":""}</div><div class="timeline-card" data-id="${r.id}"><img src="${urlFor(r.imageBlob)}"><div><b>${esc(label(r))}</b><p>${esc(symptoms(r))}${r.memo?` · ${esc(r.memo)}`:""}</p></div></div></div></article>`).join("");
  $("timelineList").classList.toggle("hidden",!list.length);$("timelineEmpty").classList.toggle("hidden",!!list.length);
}
$("timelineFilter").onchange=renderTimeline;$("timelineList").onclick=e=>{const b=e.target.closest("[data-id]");if(b){state.detailId=+b.dataset.id;show("detail")}};
async function renderDetail(){
  const r=await getRecord(state.detailId);if(!r){toast("기록을 찾지 못했습니다.");show("timeline");return}clearUrls();
  $("detailImage").src=urlFor(r.imageBlob);$("detailSite").textContent=label(r);$("detailDate").textContent=fmt(r.capturedAt,true);$("detailSymptoms").textContent=symptoms(r);$("detailMemo").textContent=r.memo||"없음";
  $("detailCamera").textContent=r.captureSource?.includes("front")?"전면 카메라 · 실제 좌우 방향 보정":r.captureSource?.includes("file")?"기본 카메라 또는 앨범":"후면 카메라";
  $("baselineBadge").classList.toggle("hidden",!r.isBaseline);$("setBaseline").disabled=r.isBaseline;$("setBaseline").textContent=r.isBaseline?"현재 기준 사진입니다":"이 사진을 기준 사진으로 지정";
}
$("editRecord").onclick=()=>show("editRecordScreen");
$("deleteRecord").onclick=async()=>{
  const r=await getRecord(state.detailId);if(!r)return;
  const unbacked=!state.lastBackupAt||new Date(r.updatedAt||r.capturedAt)>new Date(state.lastBackupAt);
  if(unbacked&&!confirm("이 기록은 마지막 백업 이후 생성되거나 수정되었습니다. 백업 없이 삭제할까요?"))return;
  if(!confirm("이 기록을 삭제할까요? 복구할 수 없습니다."))return;
  await removeRecord(r.id);if(r.isBaseline){const remain=await recordsForSite(r.siteKey);if(remain.length){const oldest=[...remain].sort((a,b)=>new Date(a.capturedAt)-new Date(b.capturedAt))[0];oldest.isBaseline=true;await putRecord(oldest)}}
  toast("기록을 삭제했습니다.");show("timeline");
};
$("setBaseline").onclick=async()=>{
  const r=await getRecord(state.detailId);if(!r||r.isBaseline||!confirm("이 사진을 새로운 기준 사진으로 지정할까요?"))return;
  for(const x of await recordsForSite(r.siteKey)){const next=x.id===r.id;if(x.isBaseline!==next){x.isBaseline=next;await putRecord(x)}}toast("기준 사진을 변경했습니다.");renderDetail();
};
$("compareDetail").onclick=async()=>{const r=await getRecord(state.detailId);if(r){state.compareSite=r.siteKey;show("compare")}};

/* Compare */
async function renderCompare(){
  clearUrls();const rows=await recordsForPatient(),groups=new Map();rows.forEach(r=>{if(!groups.has(r.siteKey))groups.set(r.siteKey,[]);groups.get(r.siteKey).push(r)});
  const candidates=[...groups.entries()].filter(([,v])=>v.length>=2);$("compareSite").innerHTML=candidates.map(([k,v])=>`<option value="${esc(k)}">${esc(label(v[0]))}</option>`).join("");
  if(!candidates.length){$("compareContent").classList.add("hidden");$("compareEmpty").classList.remove("hidden");return}
  $("compareContent").classList.remove("hidden");$("compareEmpty").classList.add("hidden");
  const chosen=candidates.some(([k])=>k===state.compareSite)?state.compareSite:candidates[0][0];$("compareSite").value=chosen;state.compareSite=chosen;await populateCompare(groups.get(chosen));
}
async function populateCompare(rows){
  const ordered=[...rows].sort((a,b)=>new Date(a.capturedAt)-new Date(b.capturedAt)),options=ordered.map(r=>`<option value="${r.id}">${fmt(r.capturedAt)}${r.isBaseline?" · 기준":""}</option>`).join("");
  $("compareBeforeSelect").innerHTML=options;$("compareAfterSelect").innerHTML=options;$("compareBeforeSelect").value=(ordered.find(r=>r.isBaseline)||ordered[0]).id;$("compareAfterSelect").value=ordered.at(-1).id;await updateCompare();
}
async function updateCompare(){
  const a=await getRecord(+$("compareBeforeSelect").value),b=await getRecord(+$("compareAfterSelect").value);if(!a||!b)return;clearUrls();
  $("compareBefore").src=urlFor(a.imageBlob);$("compareAfter").src=urlFor(b.imageBlob);$("beforeLabel").textContent=short(a.capturedAt);$("afterLabel").textContent=short(b.capturedAt);setCompare($("compareRange").value);
}
function setCompare(v){$("compareClip").style.width=`${v}%`;$("divider").style.left=`${v}%`}
$("compareSite").onchange=async e=>{state.compareSite=e.target.value;populateCompare(await recordsForSite(state.compareSite))};$("compareBeforeSelect").onchange=updateCompare;$("compareAfterSelect").onchange=updateCompare;$("compareRange").oninput=e=>setCompare(e.target.value);
document.querySelector(".compare-modes").onclick=e=>{const b=e.target.closest("[data-mode]");if(!b)return;document.querySelectorAll(".compare-modes button").forEach(x=>x.classList.toggle("active",x===b));$("compareView").classList.toggle("side",b.dataset.mode==="side")};

/* More */
async function renderMore(){
  const rows=await recordsForPatient();updatePersistenceUI();$("moreName").textContent=state.profile?.displayName||"환자";$("morePatient").textContent=`환자번호 ${state.profile?.patientNumber||"—"}`;$("avatar").textContent=(state.profile?.displayName||"환").slice(0,1);
  let text=`${rows.length}개의 촬영 기록`;try{if(navigator.storage?.estimate){const e=await navigator.storage.estimate();text+=` · 브라우저 사용량 ${formatBytes(e.usage||0)}`}}catch{}$("storageText").textContent=text;
}
$("editProfile").onclick=editProfile;$("editProfile2").onclick=editProfile;
$("clearData").onclick=async()=>{
  const status=await backupStatus();if(status.unbacked&&!confirm(`마지막 백업 이후 변경된 기록이 ${status.unbacked}개 있습니다. 백업 없이 계속할까요?`))return;
  if(!confirm("모든 사진과 기록, 기본정보를 삭제할까요?")||!confirm("정말 삭제하시겠습니까? 복구할 수 없습니다."))return;
  await clearRecords();await clearSettings();localStorage.removeItem(PROFILE_KEY);state.profile=null;state.lastBackupAt=null;await loadProfile();resetRegion();historyStack.splice(0,historyStack.length,"intro");show("intro",false);toast("모든 로컬 데이터를 삭제했습니다.");
};
async function renderNotice(){const rows=await recordsForPatient(),latest=rows[0];$("noticeNext").textContent=latest?`${fmt(addDays(latest.capturedAt,state.profile.intervalDays))}에 다음 촬영을 권장합니다.`:"첫 촬영 후 다음 날짜가 계산됩니다."}



/* Phase 4: advanced record editing */
const editSymptomInputs=[...document.querySelectorAll("#editSymptomChecks input")];
editSymptomInputs.forEach(input=>input.onchange=()=>{
  const none=editSymptomInputs.find(x=>x.dataset.none!==undefined);
  if(input.dataset.none!==undefined&&input.checked)editSymptomInputs.filter(x=>x!==input).forEach(x=>x.checked=false);
  else if(input.checked)none.checked=false;
});
function fillEditSubsites(region,selected){
  const cfg=REGIONS.find(x=>x.key===region);$("editSubsite").innerHTML=(cfg?.sites||[]).map(s=>`<option value="${esc(s.value||s.label)}">${esc(s.label)}</option>`).join("");
  if(selected)$("editSubsite").value=selected;
}
async function renderRecordEditor(){
  const r=await getRecord(state.detailId);if(!r){toast("수정할 기록을 찾지 못했습니다.");show("timeline");return}
  $("editCapturedAt").value=toLocalDateTimeInput(r.capturedAt);
  $("editRegion").innerHTML=REGIONS.map(x=>`<option value="${esc(x.key)}">${esc(x.key)}</option>`).join("");$("editRegion").value=r.region;fillEditSubsites(r.region,r.subsite);
  editSymptomInputs.forEach(x=>x.checked=(r.symptoms||[]).includes(x.value));$("editMemo").value=r.memo||"";
}
$("editRegion").onchange=e=>fillEditSubsites(e.target.value,"");
$("saveRecordEdit").onclick=async()=>{
  const r=await getRecord(state.detailId);if(!r)return;
  const selectedSymptoms=editSymptomInputs.filter(x=>x.checked).map(x=>x.value);if(!selectedSymptoms.length){toast("증상이 없다면 ‘특별한 증상 없음’을 선택해주세요.");return}
  const oldSite=r.siteKey,wasBaseline=r.isBaseline,newRegion=$("editRegion").value,newSub=$("editSubsite").value,cfg=REGIONS.find(x=>x.key===newRegion),siteCfg=cfg?.sites.find(x=>(x.value||x.label)===newSub);
  r.region=newRegion;r.subsite=newSub;r.siteKey=siteKey(newRegion,newSub);r.selected=`${newRegion} · ${siteCfg?.label||newSub}`;r.patientSite=`${r.patientId}|${r.siteKey}`;r.capturedAt=new Date($("editCapturedAt").value).toISOString();r.symptoms=selectedSymptoms;r.memo=$("editMemo").value.trim();r.updatedAt=new Date().toISOString();
  if(oldSite!==r.siteKey){
    const targetRows=await recordsForSite(r.siteKey);
    if(wasBaseline){
      r.isBaseline=!targetRows.some(x=>x.isBaseline);
      const oldRows=(await recordsForSite(oldSite)).filter(x=>x.id!==r.id);if(oldRows.length&&!oldRows.some(x=>x.isBaseline)){const oldest=[...oldRows].sort((a,b)=>new Date(a.capturedAt)-new Date(b.capturedAt))[0];oldest.isBaseline=true;oldest.updatedAt=new Date().toISOString();await putRecord(oldest)}
    }else if(!targetRows.length){r.isBaseline=true}
  }
  await putRecord(r);toast("기록 정보를 수정했습니다.");show("detail");
};

/* Image download and sharing */
$("downloadImage").onclick=async()=>{const r=await getRecord(state.detailId);if(!r)return;downloadBlob(r.imageBlob,`${safeFileName(r.patientId)}_${r.capturedAt.slice(0,10)}_${safeFileName(label(r))}.jpg`)};
$("shareImage").onclick=async()=>{const r=await getRecord(state.detailId);if(!r)return;const file=new File([r.imageBlob],`${safeFileName(r.patientId)}_${r.capturedAt.slice(0,10)}_${safeFileName(label(r))}.jpg`,{type:r.imageBlob.type||"image/jpeg"});try{if(!(await shareFile(file,"OralCare 촬영 사진",`${label(r)} · ${fmt(r.capturedAt)}`)))toast("이 브라우저는 파일 공유를 지원하지 않습니다. 원본 사진 저장을 이용해주세요.")}catch(err){if(err?.name!=="AbortError")toast("사진을 공유하지 못했습니다.")}};

/* Backup and restore */
async function makeBackupPayload(){
  const rows=await recordsForPatient();const packed=[];
  for(const r of rows){packed.push({...r,id:undefined,imageBlob:undefined,recordUuid:r.recordUuid||uuid(),imageDataUrl:await blobToDataUrl(r.imageBlob),updatedAt:r.updatedAt||r.capturedAt})}
  return {format:"oralcare-monitor-backup",version:1,exportedAt:new Date().toISOString(),profile:state.profile,records:packed};
}
async function createBackupFile(){const payload=await makeBackupPayload();return new File([JSON.stringify(payload)],`${safeFileName(state.profile?.patientNumber)}_oralcare_backup_${new Date().toISOString().slice(0,10)}.oralcare.json`,{type:"application/json"})}
async function markBackup(){state.lastBackupAt=new Date().toISOString();await putSetting("lastBackupAt",state.lastBackupAt);await renderBackup();}
async function exportBackup(share=false){
  try{const file=await createBackupFile();if(share){if(!(await shareFile(file,"OralCare 전체 기록 백업","임상사진과 기록이 포함된 백업 파일입니다.")))downloadBlob(file,file.name)}else downloadBlob(file,file.name);await markBackup();toast(share?"백업 파일을 공유했습니다.":"백업 파일을 저장했습니다.")}
  catch(err){console.error(err);if(err?.name!=="AbortError")toast("백업 파일을 만들지 못했습니다.")}
}
$("exportBackup").onclick=()=>exportBackup(false);$("shareBackup").onclick=()=>exportBackup(true);$("chooseRestoreFile").onclick=()=>$("restoreFileInput").click();
$("restoreFileInput").onchange=async e=>{
  const file=e.target.files?.[0];e.target.value="";if(!file)return;
  try{const payload=JSON.parse(await file.text());if(payload.format!=="oralcare-monitor-backup"||!Array.isArray(payload.records)||!payload.profile)throw new Error("지원하지 않는 백업 형식");state.restorePayload=payload;$("restoreFileSummary").textContent=`${payload.profile.patientNumber} · ${payload.records.length}개 기록 · ${fmt(payload.exportedAt)}`;$("restoreOptions").classList.remove("hidden")}
  catch(err){console.error(err);state.restorePayload=null;$("restoreOptions").classList.add("hidden");toast("올바른 OralCare 백업 파일이 아닙니다.")}
};
async function restoreBackup(replace=false){
  const payload=state.restorePayload;if(!payload)return;
  if(!replace&&state.profile?.patientNumber&&state.profile.patientNumber!==payload.profile.patientNumber){toast("다른 환자번호의 백업은 병합할 수 없습니다. 전체 교체 복원을 사용해주세요.");return}
  if(replace&&!confirm("현재 기기의 기록과 기본정보를 모두 삭제하고 백업 파일로 교체할까요?"))return;
  try{
    if(replace){await clearRecords();await clearSettings();localStorage.removeItem(PROFILE_KEY)}
    const existing=replace?[]:await allRecords(),byIdentity=new Map(existing.map(r=>[recordIdentity(r),r]));let added=0,updated=0,skipped=0;
    for(const incoming of payload.records){
      const identity=incoming.recordUuid||`${incoming.patientId}|${incoming.siteKey}|${incoming.capturedAt}`,old=byIdentity.get(identity),blob=dataUrlToBlob(incoming.imageDataUrl);
      const row={...incoming,id:old?.id,recordUuid:incoming.recordUuid||uuid(),imageDataUrl:undefined,imageBlob:blob,patientId:payload.profile.patientNumber,patientSite:`${payload.profile.patientNumber}|${incoming.siteKey}`,updatedAt:incoming.updatedAt||incoming.capturedAt};
      if(old){if(new Date(row.updatedAt)>new Date(old.updatedAt||old.capturedAt)){await putRecord(row);updated++}else skipped++}else{delete row.id;await addRecord(row);added++;byIdentity.set(identity,row)}
    }
    await saveProfile({...payload.profile,patientNumber:payload.profile.patientNumber});state.lastBackupAt=payload.exportedAt||new Date().toISOString();await putSetting("lastBackupAt",state.lastBackupAt);state.restorePayload=null;$("restoreOptions").classList.add("hidden");toast(`복원 완료: 추가 ${added}, 수정 ${updated}, 유지 ${skipped}`);await renderBackup();
  }catch(err){console.error(err);toast("백업 복원 중 오류가 발생했습니다.")}
}
$("mergeRestore").onclick=()=>restoreBackup(false);$("replaceRestore").onclick=()=>restoreBackup(true);
async function renderBackup(){
  const rows=await recordsForPatient();state.lastBackupAt=await getSetting("lastBackupAt");const unbacked=rows.filter(r=>!state.lastBackupAt||new Date(r.updatedAt||r.capturedAt)>new Date(state.lastBackupAt)).length;
  $("backupRecordCount").textContent=`${rows.length}개`;$("lastBackupText").textContent=state.lastBackupAt?fmt(state.lastBackupAt,true):"없음";$("unbackedCount").textContent=`${unbacked}개`;
}

/* Calendar export */
$("exportCalendar").onclick=async()=>{
  const rows=await recordsForPatient(),latest=rows[0];if(!latest){toast("먼저 촬영 기록을 저장해주세요.");return}const next=addDays(latest.capturedAt,state.profile.intervalDays),pad=n=>String(n).padStart(2,"0"),stamp=d=>`${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`,end=new Date(next.getTime()+30*60000);
  const ics=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//OralCare Monitor//KO\r\nBEGIN:VEVENT\r\nUID:${uuid()}@oralcare-monitor\r\nDTSTAMP:${stamp(new Date())}\r\nDTSTART:${stamp(next)}\r\nDTEND:${stamp(end)}\r\nSUMMARY:구강점막 사진 촬영\r\nDESCRIPTION:${label(latest)} 정기 촬영 예정일\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;downloadBlob(new Blob([ics],{type:"text/calendar;charset=utf-8"}),`${safeFileName(state.profile.patientNumber)}_다음촬영일.ics`);toast("캘린더 파일을 저장했습니다.")
};

/* Report */
function reportDateFilter(rows){const site=$("reportSite").value,from=parseLocalDateBoundary($("reportFrom").value),to=parseLocalDateBoundary($("reportTo").value,true);return rows.filter(r=>{const d=new Date(r.capturedAt);return(site==="all"||r.siteKey===site)&&(!from||d>=from)&&(!to||d<=to)})}
async function renderReport(){
  clearUrls();const rows=await recordsForPatient(),sites=[...new Map(rows.map(r=>[r.siteKey,label(r)])).entries()],old=$("reportSite").value||"all";$("reportSite").innerHTML=`<option value="all">전체 부위</option>`+sites.map(([k,v])=>`<option value="${esc(k)}">${esc(v)}</option>`).join("");$("reportSite").value=sites.some(([k])=>k===old)?old:"all";await refreshReportList();
}
async function refreshReportList(){
  clearUrls();const filtered=reportDateFilter(await recordsForPatient());state.reportRows=filtered;$("reportRecordList").innerHTML=filtered.map(r=>`<label class="report-record"><input type="checkbox" value="${r.id}" checked><span class="fake-check">✓</span><img src="${urlFor(r.imageBlob)}"><div><b>${esc(label(r))}</b><small>${fmt(r.capturedAt,true)} · ${esc(symptoms(r))}</small>${r.isBaseline?"<em>기준 사진</em>":""}</div></label>`).join("");$("reportRecordList").classList.toggle("hidden",!filtered.length);$("reportEmpty").classList.toggle("hidden",!!filtered.length);$("selectAllReportRecords").checked=true;updateReportSelectedCount();
}
function selectedReportRows(){const ids=new Set([...document.querySelectorAll("#reportRecordList input:checked")].map(x=>Number(x.value)));return state.reportRows.filter(r=>ids.has(r.id))}
function updateReportSelectedCount(){$("reportSelectedCount").textContent=`${selectedReportRows().length}개 선택`}
$("reportRecordList").onchange=updateReportSelectedCount;$("selectAllReportRecords").onchange=e=>{document.querySelectorAll("#reportRecordList input").forEach(x=>x.checked=e.target.checked);updateReportSelectedCount()};$("reportSite").onchange=refreshReportList;$("reportFrom").onchange=refreshReportList;$("reportTo").onchange=refreshReportList;
document.querySelector(".report-quick").onclick=e=>{const b=e.target.closest("[data-period]");if(!b)return;document.querySelectorAll(".report-quick button").forEach(x=>x.classList.toggle("active",x===b));const p=b.dataset.period;if(p==="all"){$("reportFrom").value="";$("reportTo").value=""}else{const to=new Date(),from=new Date();from.setDate(to.getDate()-Number(p));$("reportFrom").value=from.toISOString().slice(0,10);$("reportTo").value=to.toISOString().slice(0,10)}refreshReportList()};
async function buildReportHtml(){
  const rows=selectedReportRows();if(!rows.length)throw new Error("리포트에 포함할 기록을 선택해주세요.");const includeSymptoms=$("reportIncludeSymptoms").checked,includeQuality=$("reportIncludeQuality").checked,images=[];
  for(const r of rows){images.push({...r,imageDataUrl:await blobToDataUrl(r.imageBlob)})}
  const grouped=new Map();images.sort((a,b)=>new Date(a.capturedAt)-new Date(b.capturedAt)).forEach(r=>{if(!grouped.has(r.siteKey))grouped.set(r.siteKey,[]);grouped.get(r.siteKey).push(r)});
  const sections=[...grouped.values()].map(group=>`<section><h2>${esc(label(group[0]))}</h2><div class="grid">${group.map(r=>`<article><img src="${r.imageDataUrl}"><div class="meta"><b>${fmt(r.capturedAt,true)}</b>${r.isBaseline?"<span>기준 사진</span>":""}</div>${includeSymptoms?`<p><strong>증상:</strong> ${esc(symptoms(r))}</p><p><strong>메모:</strong> ${esc(r.memo||"없음")}</p>`:""}${includeQuality&&r.quality?`<p><strong>기본 품질:</strong> ${esc(JSON.stringify(r.quality))}</p>`:""}</article>`).join("")}</div></section>`).join("");
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>OralCare Monitoring Report</title><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif;color:#172337;margin:0}header{border-bottom:3px solid #123d78;padding-bottom:12px;margin-bottom:18px}h1{margin:0;color:#123d78;font-size:24px}header p{margin:6px 0 0;color:#67768a;font-size:11px}.patient{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:13px 0;padding:10px;background:#f3f7fb;border-radius:8px;font-size:10px}h2{font-size:16px;color:#123d78;margin:22px 0 10px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}article{break-inside:avoid;border:1px solid #dce5ee;border-radius:9px;padding:8px}article img{width:100%;height:190px;object-fit:contain;background:#f2f4f6;border-radius:6px}.meta{display:flex;justify-content:space-between;align-items:center;margin-top:7px;font-size:10px}.meta span{padding:3px 6px;border-radius:999px;background:#e8f1fb;color:#123d78;font-size:8px}article p{margin:5px 0;font-size:9px;line-height:1.45}footer{margin-top:22px;padding-top:10px;border-top:1px solid #dce5ee;color:#738197;font-size:8px;line-height:1.5}@media print{button{display:none}}@media(max-width:600px){.grid{grid-template-columns:1fr}article img{height:auto}}</style></head><body><header><h1>OralCare Monitoring Report</h1><p>환자가 기록한 구강점막 사진과 증상 요약</p></header><div class="patient"><div><b>환자번호</b><br>${esc(state.profile.patientNumber)}</div><div><b>작성일</b><br>${fmt(new Date(),true)}</div><div><b>포함 기록</b><br>${rows.length}개</div><div><b>추적 부위</b><br>${new Set(rows.map(r=>r.siteKey)).size}곳</div></div>${sections}<footer>본 리포트는 환자의 자가 촬영 기록을 정리한 자료이며 진단, 병소 크기 측정 또는 악화 판정을 제공하지 않습니다. 임상 판단은 의료진의 진찰과 필요한 검사에 따라 이루어져야 합니다.</footer></body></html>`;
}
$("printReport").onclick=async()=>{const w=window.open("","_blank");if(!w){toast("팝업이 차단되었습니다. 브라우저 설정을 확인해주세요.");return}w.document.write("<p style=\"font-family:sans-serif;padding:24px\">리포트를 준비하고 있습니다...</p>");try{const html=await buildReportHtml();w.document.open();w.document.write(html);w.document.close();w.onload=()=>setTimeout(()=>w.print(),350)}catch(err){w.close();console.error(err);toast(err.message||"리포트를 만들지 못했습니다.")}};
$("downloadReportHtml").onclick=async()=>{try{const html=await buildReportHtml();downloadBlob(new Blob([html],{type:"text/html;charset=utf-8"}),`${safeFileName(state.profile.patientNumber)}_oralcare_report_${new Date().toISOString().slice(0,10)}.html`);toast("리포트 파일을 저장했습니다.")}catch(err){toast(err.message||"리포트를 만들지 못했습니다.")}};

/* Backup status and More */
async function backupStatus(){const rows=await recordsForPatient();state.lastBackupAt=await getSetting("lastBackupAt");const unbacked=rows.filter(r=>!state.lastBackupAt||new Date(r.updatedAt||r.capturedAt)>new Date(state.lastBackupAt)).length;return{rows,unbacked}}
async function updateHomeBackup(){const {rows,unbacked}=await backupStatus();$("homeBackupTitle").textContent=unbacked?`${unbacked}개 기록을 백업해주세요.`:"최근 기록까지 백업했습니다.";$("homeBackupText").textContent=state.lastBackupAt?`마지막 백업 ${fmt(state.lastBackupAt,true)}`:rows.length?"아직 백업한 기록이 없습니다.":"첫 촬영 후 백업할 수 있습니다."}
const originalRenderHome=renderHome;renderHome=async function(){await originalRenderHome();await updateHomeBackup()};
const originalRenderMore=renderMore;renderMore=async function(){await originalRenderMore();const {unbacked}=await backupStatus();$("moreBackupStatus").querySelector("b").textContent=unbacked?`${unbacked}개 기록 백업 필요`:"백업 상태 양호";$("moreBackupStatus").querySelector("small").textContent=state.lastBackupAt?`마지막 백업 ${fmt(state.lastBackupAt,true)}`:"백업 기록 없음";updateInstallUI()};

/* PWA */
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();state.installPrompt=e;updateInstallUI()});
window.addEventListener("appinstalled",()=>{state.installPrompt=null;toast("홈 화면에 앱을 설치했습니다.");updateInstallUI()});
function isStandalone(){return window.matchMedia?.("(display-mode: standalone)").matches||window.navigator.standalone===true}
function updateInstallUI(){if(!$("installApp"))return;$("installAppText").textContent=isStandalone()?"홈 화면 앱으로 실행 중":state.installPrompt?"이 기기에 앱 설치 가능":"아이폰은 공유 → 홈 화면에 추가"}
$("installApp").onclick=async()=>{if(isStandalone()){toast("이미 홈 화면 앱으로 실행 중입니다.");return}if(state.installPrompt){state.installPrompt.prompt();await state.installPrompt.userChoice;state.installPrompt=null;updateInstallUI()}else toast("아이폰 Safari에서는 공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 선택하세요.")};
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(console.error));

/* Filters */
["timelineFrom","timelineTo","timelineBaselineOnly","timelineSymptomOnly"].forEach(id=>$(id).onchange=renderTimeline);$("resetTimelineFilters").onclick=()=>{$("timelineFrom").value="";$("timelineTo").value="";$("timelineBaselineOnly").checked=false;$("timelineSymptomOnly").checked=false;$("timelineFilter").value="all";renderTimeline()};


/* Init */
window.addEventListener("pagehide",()=>{stopCamera();clearUrls()});
window.addEventListener("keydown",e=>{if(e.key==="Escape")back()});
(async()=>{
  try{
    state.db=await openDB();await loadProfile();
    const migrationRows=await allRecords();for(const r of migrationRows){let changed=false;if(!r.recordUuid){r.recordUuid=uuid();changed=true}if(!r.updatedAt){r.updatedAt=r.capturedAt;changed=true}if(changed)await putRecord(r)}
    renderRegions();resetRegion();setOpacity(45);updateInstallUI();
    if(state.profile){$("patientNumber").value=state.profile.patientNumber;$("displayName").value=state.profile.displayName||"";$("intervalDays").value=String(state.profile.intervalDays||14)}
  }catch(err){console.error(err);toast("기기 저장소를 열지 못했습니다.")}
})();
})();