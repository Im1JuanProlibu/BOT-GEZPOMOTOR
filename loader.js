(function() {
  var GITHUB_URL = 'https://raw.githubusercontent.com/Im1JuanProlibu/BOT-GEZPOMOTOR/main/voyah-bot.html?t=' + Date.now();

  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src; s.onload = cb;
    s.onerror = function() { cb(); };
    document.body.appendChild(s);
  }

  function loadInOrder(srcs, cb) {
    if (!srcs.length) return cb();
    loadScript(srcs[0], function() { loadInOrder(srcs.slice(1), cb); });
  }

  fetch(GITHUB_URL)
    .then(function(r) { return r.text(); })
    .then(function(html) {
      var tmp = document.createElement('div');
      tmp.innerHTML = html;
      var srcs = [], code = '';
      tmp.querySelectorAll('script').forEach(function(s) {
        if (s.src) { srcs.push(s.src); s.remove(); }
        else { code += s.textContent; s.remove(); }
      });
      document.getElementById('bot-gezpomotor').innerHTML = tmp.innerHTML;
      loadInOrder(srcs, function() {
        var sc = document.createElement('script');
        sc.textContent = code;
        document.body.appendChild(sc);
      });
    });
})();
