const CONFIG = {
  BASE_URL: 'triptaktikdeploy-production.up.railway.app/api', 
};

function showNotification(message, type = 'success') {
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      display: flex; flex-direction: column; gap: 10px;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? '#4CAF50' : '#f44336';
  
  toast.style.cssText = `
    background-color: ${bgColor}; color: white; padding: 15px 25px;
    border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    font-family: 'Poppins', sans-serif; font-size: 14px;
    opacity: 0; transform: translateX(100%); transition: all 0.5s ease;
  `;
  toast.innerText = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 10);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => { toast.remove(); }, 500);
  }, 3000);
}