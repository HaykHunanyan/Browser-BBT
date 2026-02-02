window.addEventListener('DOMContentLoaded', async () => {
  const webview = document.getElementById('view');
  const profileSelect = document.getElementById('profile');
  const goBtn = document.getElementById('go');
  const switchBtn = document.getElementById('switch');
  const newBtn = document.getElementById('new');
  const input = document.getElementById('url');


  const params = new URLSearchParams(window.location.search);
  const activeProfile = params.get('profile');
  
  // 🔥 load profiles (OBJECT)
  const profiles = await window.api.getProfiles();
  profileSelect.innerHTML = '';

  Object.keys(profiles).forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    profileSelect.appendChild(opt);
  });

  webview.addEventListener('dom-ready', () => {
    console.log('✅ webview ready');
  });

  if (activeProfile) profileSelect.value = activeProfile;

  goBtn.onclick = () => {
    let url = input.value.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    webview.src = url;
  };

  switchBtn.onclick = () => {
    window.api.switchProfile(profileSelect.value);
  };

  newBtn.onclick = async () => {
    const newProfile = await window.api.createProfile();
    window.api.switchProfile(newProfile);
  };
});
