window.addEventListener('DOMContentLoaded', () => {

  // 摄像头按钮
  const cameraBtn = document.getElementById('goCameraBtn');
  if (cameraBtn) {
    cameraBtn.addEventListener('click', () => {
      window.location.href = '/tyust-myy/camera/camera.html';
    });
  }

  // ROS按钮
  const rosBtn = document.getElementById('goROSBtn');
  if (rosBtn) {
    rosBtn.addEventListener('click', () => {
      window.location.href = '/tyust-myy/ros/ros.html';
    });
  }

  // 聊天按钮
  const chatBtn = document.getElementById('goChatBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      window.location.href = '/tyust-myy/chat/chat.html';
    });
  }

  // 音乐按钮
  const musicBtn = document.getElementById('goMUSICBtn'); 
  if (musicBtn) {
    musicBtn.addEventListener('click', () => {
      window.location.href = '/tyust-myy/music/music.html';
    });
  }
 
});