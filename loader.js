(function () {
  console.log('🚀 [LOADER] Iniciando...');

  var REPO_RAW = 'https://raw.githubusercontent.com/Im1JuanProlibu/BOT-GEZPOMOTOR/main/voyah-bot.html';
  var URL = REPO_RAW + '?t=' + Date.now();
  console.log('🔗 [LOADER] URL:', URL);

  function loadScript(src, cb) {
    console.log('📦 [LOADER] Cargando script:', src);
    var s = document.createElement('script');
    s.src = src;
    s.onload = function () { console.log('✅ [LOADER] Cargado:', src); cb(); };
    s.onerror = function () { console.warn('⚠️ [LOADER] Error cargando:', src); cb(); };
    document.body.appendChild(s);
  }

  function loadInOrder(srcs, cb) {
    if (!srcs.length) {
      console.log('✅ [LOADER] Todos los scripts externos listos.');
      return cb();
    }
    loadScript(srcs[0], function () { loadInOrder(srcs.slice(1), cb); });
  }

  console.log('📡 [LOADER] Haciendo fetch a GitHub...');
  fetch(URL)
    .then(function (r) {
      console.log('📡 [LOADER] Respuesta HTTP:', r.status, r.ok ? 'OK' : 'FALLO');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    })
    .then(function (html) {
      console.log('📄 [LOADER] HTML recibido, longitud:', html.length);

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

      console.log('🔍 [LOADER] Scripts externos encontrados:', srcs.length);
      console.log('🔍 [LOADER] Código inline longitud:', inlineCode.length);

      var container = document.getElementById('bot-gezpomotor');
      console.log('🔍 [LOADER] Contenedor #bot-gezpomotor:', container ? '✅ encontrado' : '❌ NO encontrado');

      if (container) {
        container.innerHTML = tmp.innerHTML;
        console.log('✅ [LOADER] HTML inyectado en contenedor');
      }

      loadInOrder(srcs, function () {
        console.log('⚙️ [LOADER] Ejecutando script inline...');
        var sc = document.createElement('script');
        sc.textContent = inlineCode;
        document.body.appendChild(sc);
        console.log('🎉 [LOADER] Bot completamente cargado.');

        // Verificación final
        setTimeout(function () {
          console.log('🔎 [LOADER] jQuery:', typeof $ !== 'undefined' ? '✅' : '❌');
          console.log('🔎 [LOADER] Nodriza:', typeof Nodriza !== 'undefined' ? '✅' : '❌');
          console.log('🔎 [LOADER] select2:', typeof $ !== 'undefined' && $.fn && $.fn.select2 ? '✅' : '❌');
          console.log('🔎 [LOADER] #model:', document.getElementById('model') ? '✅' : '❌');
          console.log('🔎 [LOADER] #mobile:', document.getElementById('mobile') ? '✅' : '❌');
          console.log('🔎 [LOADER] productsList:', typeof productsList !== 'undefined' ? productsList.length + ' items' : '❌ no definido');
          console.log('🔎 [LOADER] agentsList:', typeof agentsList !== 'undefined' ? agentsList.length + ' items' : '❌ no definido');
        }, 3000);
      });
    })
    .catch(function (e) {
      console.error('❌ [LOADER] Error:', e.message);
      var container = document.getElementById('bot-gezpomotor');
      if (container) {
        container.innerHTML = '<p style="color:red;padding:20px;">Error cargando el bot: ' + e.message + '</p>';
      }
    });
})();
