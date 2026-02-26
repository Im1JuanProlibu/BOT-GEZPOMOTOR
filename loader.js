(function () {
  var REPO_RAW = 'https://raw.githubusercontent.com/Im1JuanProlibu/BOT-GEZPOMOTOR/main/voyah-bot.html';
  var URL = REPO_RAW + '?t=' + Date.now();

  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    s.onerror = function () { console.warn('⚠️ No se pudo cargar:', src); cb(); };
    document.body.appendChild(s);
  }

  function loadInOrder(srcs, cb) {
    if (!srcs.length) return cb();
    loadScript(srcs[0], function () { loadInOrder(srcs.slice(1), cb); });
  }

  fetch(URL)
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    })
    .then(function (html) {
      var tmp = document.createElement('div');
      tmp.innerHTML = html;

      var srcs = [];
      var inlineCode = '';

      tmp.querySelectorAll('script').forEach(function (s) {
        if (s.src) {
          srcs.push(s.src);
          s.parentNode.removeChild(s);
        } else {
          inlineCode += s.textContent;
          s.parentNode.removeChild(s);
        }
      });

      var container = document.getElementById('bot-gezpomotor');
      if (container) {
        container.innerHTML = tmp.innerHTML;
      }

      loadInOrder(srcs, function () {
        var sc = document.createElement('script');
        sc.textContent = inlineCode;
        document.body.appendChild(sc);
      });
    })
    .catch(function (e) {
      console.error('❌ Error cargando bot desde GitHub:', e);
      var container = document.getElementById('bot-gezpomotor');
      if (container) {
        container.innerHTML = '<p style="color:red;padding:20px;">Error cargando el bot. Por favor recarga la página.</p>';
      }
    });
})();
