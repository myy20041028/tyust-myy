let audio;
let songs = [];
let currentIndex = -1;

const BASE_URL = "https://myy666.asia";

window.onload = () => {
  audio = document.getElementById("audio");

  // 搜索
  document.getElementById("searchBtn").onclick = searchMusic;
  document.getElementById("search").addEventListener("keydown", e=>{
    if(e.key === "Enter") searchMusic();
  });

  // 播放控制
  document.getElementById("play").onclick = ()=>audio.play();
  document.getElementById("pause").onclick = ()=>audio.pause();
  document.getElementById("prev").onclick = ()=>changeSong(-1);
  document.getElementById("next").onclick = ()=>changeSong(1);

  audio.ontimeupdate = updateProgress;
  audio.onended = ()=>changeSong(1);

  document.getElementById("progress").oninput = (e)=>{
    if(audio.duration){
      audio.currentTime = (e.target.value/100)*audio.duration;
    }
  };
};

// ================= 搜索 =================
async function searchMusic(){
  const key = document.getElementById("search").value.trim();
  if(!key) return;

  const res = await fetch(`${BASE_URL}/search?keywords=${encodeURIComponent(key)}`);
  const data = await res.json();

  songs = (data.result?.songs || []).slice(0,15);
  renderList();
}

// ================= 列表 =================
function renderList(){
  const list = document.getElementById("list");
  list.innerHTML = "";

  songs.forEach((song,i)=>{
    const div = document.createElement("div");
    div.className = "song";
    div.innerHTML = `
      <span>${song.name}</span>
      <span style="color:#94a3b8">${song.artists?.[0]?.name || ""}</span>
    `;
    div.onclick = ()=>play(i);
    list.appendChild(div);
  });
}

// ================= 播放 =================
async function play(index){
  currentIndex = index;
  const song = songs[index];
  if(!song) return;

  const res = await fetch(`${BASE_URL}/song/url?id=${song.id}`);
  const data = await res.json();

  const url = data.data?.[0]?.url;
  if(!url){
    alert("无播放权限");
    return;
  }

  audio.src = url;
  audio.play();

  document.getElementById("title").innerText = song.name;
  document.getElementById("artist").innerText = song.artists?.[0]?.name || "";

  document.getElementById("cover").style.backgroundImage =
    `url(${song.album?.picUrl || ""})`;

  highlight();
}

// ================= 切歌 =================
function changeSong(step){
  const next = currentIndex + step;
  if(next>=0 && next<songs.length) play(next);
}

// ================= 高亮 =================
function highlight(){
  document.querySelectorAll(".song").forEach((el,i)=>{
    el.classList.toggle("active", i===currentIndex);
  });
}

// ================= 进度 =================
function updateProgress(){
  const p = document.getElementById("progress");
  const t = document.getElementById("time");

  if(!audio.duration) return;

  p.value = (audio.currentTime/audio.duration)*100;

  t.innerText = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
}

function fmt(s){
  const m = Math.floor(s/60);
  const ss = Math.floor(s%60);
  return `${m}:${ss<10?'0'+ss:ss}`;
}