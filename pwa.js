/* CampusBite — register service worker + "Install app" banner (Android prompt / iOS how-to) */
(function () {
  'use strict';
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (e) { console.warn('SW failed', e); });
    });
  }
  var standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  var dismissed = false;
  try { dismissed = sessionStorage.getItem('cb_install_x') === '1'; } catch (e) {}
  if (standalone || dismissed) return;

  var deferred = null, bar = null;
  function build(text, withBtn) {
    if (bar) return;
    bar = document.createElement('div'); bar.id = 'cbInstall'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Install CampusBite');
    bar.innerHTML = '<img src="icons/icon-192.png" alt=""><div><b>Install CampusBite</b>' + text + '</div>' +
      (withBtn ? '<button class="go" type="button">Install</button>' : '') + '<button class="x" type="button" aria-label="Dismiss">✕</button>';
    document.body.appendChild(bar);
    bar.querySelector('.x').onclick = function () { bar.classList.remove('show'); try { sessionStorage.setItem('cb_install_x', '1'); } catch (e) {} };
    var go = bar.querySelector('.go');
    if (go) go.onclick = function () {
      if (!deferred) return; deferred.prompt();
      deferred.userChoice.finally(function () { deferred = null; bar.classList.remove('show'); });
    };
    setTimeout(function () { bar.classList.add('show'); }, 4000);
  }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; build('Add it to your home screen for one-tap ordering.', true); });
  window.addEventListener('appinstalled', function () { if (bar) bar.classList.remove('show'); });
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  if (ios) build('Tap <b style="display:inline">Share</b> then <b style="display:inline">Add to Home Screen</b>.', false);
})();
