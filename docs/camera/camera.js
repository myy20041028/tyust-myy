let stream = null;
let currentDeviceId = null;
let lastDevices = [];

const videoEl = document.getElementById("video");
const placeholderEl = document.getElementById("placeholder");
const cameraSelect = document.getElementById("cameraSelect");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const refreshBtn = document.getElementById("refreshBtn");
const backBtn = document.getElementById("backBtn");

// 初始化
window.addEventListener("DOMContentLoaded", () => {
  initCameraSystem();
});

function initCameraSystem() {
  loadCameras();
}

/* =========================
   🔄 获取摄像头列表（核心修复）
========================= */
async function loadCameras() {
  try {
    // ⭐关键：手动刷新时强制授权一次
    try {
      const temp = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      temp.getTracks().forEach(t => t.stop());
    } catch (e) {
      console.log("未授权或拒绝权限:", e);
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === "videoinput");

    const oldValue = cameraSelect.value;
    cameraSelect.innerHTML = "";

    videoDevices.forEach((device, index) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.text = device.label || `摄像头 ${index + 1}`;
      cameraSelect.appendChild(option);
    });

    // 保留选择
    if (oldValue && videoDevices.some(d => d.deviceId === oldValue)) {
      cameraSelect.value = oldValue;
    }

    lastDevices = videoDevices;

    console.log("设备刷新完成:", videoDevices);

  } catch (err) {
    console.log("摄像头加载失败:", err);
  }
}

/* =========================
   📷 打开摄像头
========================= */
function startSelectedCamera() {
  currentDeviceId = cameraSelect.value;
  startCameraById(currentDeviceId);
}

async function startCameraById(deviceId) {
  try {
    stopCamera();

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        aspectRatio: { ideal: 4 / 3 }
      },
      audio: false
    });

    videoEl.srcObject = stream;
    videoEl.style.display = "block";
    placeholderEl.style.display = "none";

  } catch (err) {
    alert("摄像头打开失败：" + err.message);
    console.error(err);
  }
}

/* =========================
   ⛔ 关闭摄像头
========================= */
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }

  videoEl.srcObject = null;
  videoEl.style.display = "none";
  placeholderEl.style.display = "flex";
}

/* =========================
   🔘 返回主页
========================= */
function goHome() {
  stopCamera();
  window.location.href = '/tyust-myy/index.html';
}

/* =========================
   🎯 按钮绑定
========================= */
startBtn.addEventListener("click", startSelectedCamera);
stopBtn.addEventListener("click", stopCamera);
refreshBtn.addEventListener("click", loadCameras);
backBtn.addEventListener("click", goHome);