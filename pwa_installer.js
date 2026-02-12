/**
 * PWA Installer Module v1
 */
(function () {
    const script = document.currentScript;
    
    const config = {
        triggerId: script?.getAttribute('data-trigger-id') || null,
        appName: script?.getAttribute('data-app-name') || 'Web App',
        appIcon: script?.getAttribute('data-app-icon') || '/favicon.ico',
        theme: script?.getAttribute('data-app-color') || 'auto', // auto, light, dark
        btnPosition: script?.getAttribute('data-app-btn-position') || 'left', // right, left
        btnText: script?.getAttribute('data-app-btn-text') || 'Install App',
        title: script?.getAttribute('data-app-title') || 'Install App',
        installText: script?.getAttribute('data-app-install-text') || 'Install App',
        iosText: script?.getAttribute('data-app-ios-test') || 'Add to Home Screen',
        iosSubtitle: script?.getAttribute('data-ios-subtitle') || 'Tap the Share button and select "Add to Home Screen"'
    };
  
    const icons = {
      close: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
      download: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><path d="M12 18h.01"></path><path d="M12 6v6"></path><path d="M15 9l-3 3-3-3"></path></svg>`,
      share: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`,
      iosAdd: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="4"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>`
    };
  
    let deferredPrompt = null;
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  
    if (isStandalone) return;
  
    const themes = {
      light: `
        --pwa-bg: #ffffff;
        --pwa-text: #1c1c1e;
        --pwa-subtext: #86868b;
        --pwa-card-bg: #f2f2f7;
        --pwa-action-bg: #e5e5ea;
        --pwa-action-hover: #d1d1d6;
        --pwa-accent: #007aff;
        --pwa-border: #c7c7cc;
      `,
      dark: `
        --pwa-bg: #1c1c1e;
        --pwa-text: #ffffff;
        --pwa-subtext: #98989d;
        --pwa-card-bg: #2c2c2e;
        --pwa-action-bg: #2c2c2e;
        --pwa-action-hover: #3a3a3c;
        --pwa-accent: #0a84ff;
        --pwa-border: #38383a;
      `
    };
  
    let cssVars = config.theme === 'auto' 
      ? `:root { ${themes.light} } @media (prefers-color-scheme: dark) { :root { ${themes.dark} } }`
      : `:root { ${themes[config.theme] || themes.light} }`;
  
    const btnPosStyle = config.btnPosition === 'left' ? 'left: 20px;' : 'right: 20px;';
  
    const styles = `
      ${cssVars}
      .pwa-hidden { display: none !important; }
      .pwa-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9998;
          opacity: 0; transition: opacity 0.3s; backdrop-filter: blur(4px);
      }
      .pwa-modal {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
          background: var(--pwa-bg); color: var(--pwa-text);
          border-radius: 24px 24px 0 0; padding: 24px;
          box-shadow: 0 -10px 40px rgba(0,0,0,0.3);
          transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          font-family: -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
          max-width: 500px; margin: 0 auto;
      }
      .pwa-modal.active { transform: translateY(0); }
      .pwa-backdrop.active { opacity: 1; }
      
      .pwa-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
      .pwa-title { font-size: 18px; font-weight: 600; margin: 0; opacity: 0.9; }
      .pwa-close { 
          background: transparent; border: none; color: var(--pwa-subtext); 
          cursor: pointer; padding: 4px; display: flex;
      }
  
      .pwa-app-info {
          display: flex; align-items: center; background: var(--pwa-card-bg);
          padding: 16px; border-radius: 20px; margin-bottom: 20px;
      }
      .pwa-app-icon { margin-right: 16px; padding: 5px; background: #fff; border-radius: 12px; }
      .pwa-icon-img { width: 50px; height: 50px; object-fit: cover; }
      .pwa-app-name { font-size: 17px; font-weight: 700; margin-bottom: 2px; }
      .pwa-app-host { font-size: 13px; color: var(--pwa-subtext); }
  
      .pwa-action-area {
          width: 100%; box-sizing: border-box;
          background: var(--pwa-action-bg);
          border: 1px solid var(--pwa-border); 
          border-radius: 24px;
          padding: 40px 20px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          transition: transform 0.1s, background 0.2s;
          margin-top: 10px;
      }
      .pwa-action-area:active { transform: scale(0.98); background: var(--pwa-action-hover); }
      
      .pwa-big-icon { color: var(--pwa-subtext); transition: color 0.2s; }
      .pwa-action-area:hover .pwa-big-icon { color: var(--pwa-text); }
      
      .pwa-action-text { font-size: 15px; font-weight: 600; color: var(--pwa-text); opacity: 0.9; }
  
      /* iOS инструкция */
      .pwa-ios-hint {
          text-align: center; color: var(--pwa-subtext); font-size: 13px; line-height: 1.5;
          margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--pwa-border);
      }
  
      /* Плавающая кнопка вызова (если нет своей) */
      .pwa-float-btn {
          position: fixed; bottom: 20px; ${btnPosStyle} z-index: 9990;
          background: var(--pwa-accent); color: white;
          border: none; border-radius: 50px; padding: 12px 20px;
          font-weight: 600; box-shadow: 0 4px 14px rgba(0,0,0,0.3);
          cursor: pointer; display: none; align-items: center; gap: 8px;
      }
      .pwa-float-btn svg { width: 20px; height: 20px; }
    `;
  
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  
    const modalHTML = `
      <div id="pwa-backdrop" class="pwa-backdrop pwa-hidden"></div>
      <div id="pwa-modal" class="pwa-modal pwa-hidden">
          <div class="pwa-header">
              <div class="pwa-title">${config.title}</div>
              <button id="pwa-close" class="pwa-close">${icons.close}</button>
          </div>
          
          <div class="pwa-app-info">
              <div class="pwa-app-icon">
                <img src="${config.appIcon}" class="pwa-icon-img" alt="App Icon">
              </div>
              <div>
                  <div class="pwa-app-name">${config.appName}</div>
                  <div class="pwa-app-host">${window.location.hostname}</div>
              </div>
          </div>
  
          <!-- Большая область клика вместо маленькой кнопки -->
          <div id="pwa-install-btn" class="pwa-action-area">
              <div class="pwa-big-icon">
                  ${isIos ? icons.iosAdd : icons.download}
              </div>
              <div class="pwa-action-text">
                  ${isIos ? config.iosText : config.installText}
              </div>
          </div>
  
          <div id="pwa-ios-hint" class="pwa-ios-hint" style="display: ${isIos ? 'block' : 'none'}">
             ${icons.share} <br> ${config.iosSubtitle}
          </div>
      </div>
    `;
  
    const container = document.createElement('div');
    container.innerHTML = modalHTML;
    document.body.appendChild(container);
  
    const backdrop = document.getElementById('pwa-backdrop');
    const modal = document.getElementById('pwa-modal');
    const closeBtn = document.getElementById('pwa-close');
    const installBtn = document.getElementById('pwa-install-btn');
    
    let floatBtn = null;
    if (!config.triggerId) {
      floatBtn = document.createElement('button');
      floatBtn.className = 'pwa-float-btn';
      floatBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> <span>${config.btnText}</span>`;
      document.body.appendChild(floatBtn);
      floatBtn.addEventListener('click', showModal);
    }
  
    function showModal() {
      backdrop.classList.remove('pwa-hidden');
      modal.classList.remove('pwa-hidden');
      requestAnimationFrame(() => {
          backdrop.classList.add('active');
          modal.classList.add('active');
      });
    }
  
    function hideModal() {
      backdrop.classList.remove('active');
      modal.classList.remove('active');
      setTimeout(() => {
          backdrop.classList.add('pwa-hidden');
          modal.classList.add('pwa-hidden');
      }, 300);
    }
  
    closeBtn.addEventListener('click', hideModal);
    backdrop.addEventListener('click', hideModal);
  
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      //console.log('PWA: Ready');
      if (floatBtn) floatBtn.style.display = 'flex';
    });
  
    installBtn.addEventListener('click', async () => {
      if (isIos) {
          const hint = document.getElementById('pwa-ios-hint');
          hint.style.transition = "transform 0.2s";
          hint.style.transform = "scale(1.05)";
          setTimeout(() => hint.style.transform = "scale(1)", 200);
          return;
      }
  
      if (!deferredPrompt) return;
  
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
          deferredPrompt = null;
          hideModal();
          if (floatBtn) floatBtn.style.display = 'none';
      } else {
          //console.log('PWA: Отменено, но окно оставляем открытым');
      }
    });
  
    if (config.triggerId) {
      document.addEventListener('click', (e) => {
          const target = e.target.closest(`#${config.triggerId}`);
          if (target) {
              e.preventDefault();
              if (deferredPrompt || isIos) {
                  showModal();
              }
          }
      });
    } else if (isIos && floatBtn) {
      floatBtn.style.display = 'flex';
    }
  })();
