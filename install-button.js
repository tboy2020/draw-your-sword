/* ============================================================================
   install-button.js  —  Universal "Install app" button for ANYONE
   Pastor Taiwo's learning apps (drop-in, no dependencies).

   WHY: a plain beforeinstallprompt button stays hidden on iPhone/iPad Safari and
   desktop Firefox, so most families saw no way to install. This shows an install
   option to EVERYONE who hasn't already installed, and does the right thing:
     - Chrome / Edge / Android ...... native one-tap install prompt
     - iPhone / iPad (Safari) ....... "Add to Home Screen" steps (Share -> Add)
     - Desktop Firefox / others ..... short how-to steps
     - Already installed ............ nothing shows

   USE: copy this file into the app folder (next to index.html) and add, just
   before </body>:
       <script src="install-button.js" defer></script>
   If the page already has a <button id="installBtn">, this enhances it. Otherwise
   it injects a small, dismissible floating pill tinted to the app's theme-color.
   ========================================================================== */
(function(){
  function start(){
    // Already installed / launched from home screen? Do nothing.
    var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
                     || window.navigator.standalone === true;
    if(standalone) return;

    // Don't nag if dismissed earlier this visit.
    try{ if(sessionStorage.getItem('ipwa-dismissed')==='1') return; }catch(e){}

    var ua = navigator.userAgent || '';
    var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var isAndroid = /Android/.test(ua);
    var deferred = null;

    // Pill tint = the app's own theme-color (so it feels native to each app).
    var tint = '#6d5bff';
    var meta = document.querySelector('meta[name="theme-color"]');
    if(meta && meta.content) tint = meta.content.trim();
    var appName = (document.title || 'this app').split(/[—–|-]/)[0].trim();

    // Find an existing button, or build a floating pill.
    var btn = document.getElementById('installBtn');
    var floating = false;
    if(!btn){
      floating = true;
      var bar = document.createElement('div');
      bar.id = 'ipwa-bar';
      btn = document.createElement('button');
      btn.id = 'installBtn';
      btn.type = 'button';
      btn.innerHTML = '📲 Install app';
      var x = document.createElement('button');
      x.id = 'ipwa-x'; x.type = 'button'; x.setAttribute('aria-label','Dismiss'); x.innerHTML = '×';
      x.addEventListener('click', function(){
        bar.parentNode && bar.parentNode.removeChild(bar);
        try{ sessionStorage.setItem('ipwa-dismissed','1'); }catch(e){}
      });
      bar.appendChild(btn); bar.appendChild(x);
      injectBarCss(tint);
      document.body.appendChild(bar);
    }

    btn.addEventListener('click', function(){
      if(deferred){ deferred.prompt(); deferred.userChoice.then(function(){ deferred = null; }); return; }
      openSheet();
    });
    window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); deferred = e; });
    window.addEventListener('appinstalled', function(){
      var bar = document.getElementById('ipwa-bar'); if(bar && bar.parentNode) bar.parentNode.removeChild(bar);
      closeSheet();
    });

    // ---------- instruction sheet ----------
    var ov;
    function build(){
      var css = ''
        + '.ipwa-ov{position:fixed;inset:0;z-index:100000;display:none;align-items:flex-end;justify-content:center;background:rgba(8,12,24,.6);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}'
        + '.ipwa-ov.show{display:flex}'
        + '.ipwa-sheet{background:#fff;color:#14233b;width:100%;max-width:460px;border-radius:22px 22px 0 0;padding:22px 20px calc(20px + env(safe-area-inset-bottom));box-shadow:0 -12px 44px rgba(0,0,0,.4);font-family:inherit;text-align:left;animation:ipwaup .22s ease}'
        + '@keyframes ipwaup{from{transform:translateY(34px);opacity:.5}to{transform:none;opacity:1}}'
        + '.ipwa-sheet h4{margin:2px 0 4px;font-size:20px}'
        + '.ipwa-sheet .isub{margin:0 0 12px;font-size:14px;color:#5a6b85}'
        + '.ipwa-step{display:flex;gap:11px;align-items:flex-start;margin:11px 0;font-size:15.5px;line-height:1.45;color:#28384f}'
        + '.ipwa-step b{color:#14233b}'
        + '.ipwa-step .num{flex:none;width:26px;height:26px;border-radius:50%;background:'+tint+';color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:14px}'
        + '.ipwa-close{margin-top:16px;width:100%;border:0;border-radius:14px;padding:14px;font-family:inherit;font-weight:800;font-size:16px;background:'+tint+';color:#fff;cursor:pointer}';
      var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
      ov = document.createElement('div'); ov.className = 'ipwa-ov';
      ov.addEventListener('click', function(e){ if(e.target === ov) closeSheet(); });
      document.body.appendChild(ov);
    }
    function steps(){
      if(isIOS) return [['1','Tap the <b>Share</b> button &nbsp;⬆️&nbsp; at the bottom of Safari.'],['2','Scroll down and tap <b>Add to Home Screen</b>.'],['3','Tap <b>Add</b> — the app icon appears on your home screen.']];
      if(isAndroid) return [['1','Tap the <b>⋮ menu</b> at the top-right of Chrome.'],['2','Tap <b>Add to Home screen</b> (or <b>Install app</b>).'],['3','Tap <b>Install</b> — it opens like a real app, even offline.']];
      return [['1','Look in the address bar for the <b>install icon</b> &nbsp;⊕&nbsp; (a little screen).'],['2','Or open the browser menu and choose <b>Install…</b> / <b>Add to Home Screen</b>.'],['3','Confirm <b>Install</b> — it opens in its own window, even offline.']];
    }
    function openSheet(){
      if(!ov) build();
      var rows = steps().map(function(s){ return '<div class="ipwa-step"><span class="num">'+s[0]+'</span><span>'+s[1]+'</span></div>'; }).join('');
      ov.innerHTML = '<div class="ipwa-sheet"><h4>📲 Add '+appName+' to your device</h4><p class="isub">It opens full-screen and works offline — no app store, no sign-up.</p>'+rows+'<button class="ipwa-close" type="button">Got it</button></div>';
      ov.querySelector('.ipwa-close').addEventListener('click', closeSheet);
      requestAnimationFrame(function(){ ov.classList.add('show'); });
    }
    function closeSheet(){ if(ov) ov.classList.remove('show'); }
  }

  function injectBarCss(tint){
    var css = ''
      + '#ipwa-bar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(14px + env(safe-area-inset-bottom));z-index:99998;display:flex;align-items:stretch;gap:0;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.3);overflow:hidden;font-family:inherit}'
      + '#ipwa-bar #installBtn{border:0;cursor:pointer;font-family:inherit;font-weight:800;font-size:15.5px;color:#fff;background:'+tint+';padding:12px 18px}'
      + '#ipwa-bar #ipwa-x{border:0;cursor:pointer;color:#fff;background:rgba(0,0,0,.22);font-size:20px;line-height:1;padding:0 14px}'
      + '@media (prefers-reduced-motion:reduce){#ipwa-bar{transition:none}}';
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
