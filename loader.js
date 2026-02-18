// Solo ejecutar si NO estamos en el editor de Prolibu
if (window.location.href.indexOf('/app/automation/proposalbot/edit/') === -1) {
  fetch('https://raw.githubusercontent.com/Im1JuanProlibu/BOT-GEZPOMOTOR/main/index.html?t=' + Date.now())
    .then(function(r) { return r.text(); })
    .then(function(html) {
      document.open();
      document.write(html);
      document.close();
    });
}
