function cargarCotizador() {
  var html = `
    <div id="chatbot-automotriz">
      <!-- todo tu HTML del cotizador aquí -->
    </div>
  `;
  
  var div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div);
}

// Se ejecuta automáticamente al cargar
cargarCotizador();
