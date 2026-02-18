console.log('🟡 [test.js] Archivo cargado correctamente');

function cargarCotizador() {
  console.log('🔄 [test.js] Ejecutando cargarCotizador()...');
  
  var html = `
    <p>esto es una prueba</p>
  `;
  
  console.log('📄 [test.js] HTML preparado:', html);
  
  document.body.insertAdjacentHTML('beforeend', html);
  
  console.log('✅ [test.js] HTML insertado en el body!');
}

cargarCotizador();
```

Actualiza el `test.js` en GitHub con esto, purga el caché:
```
https://purge.jsdelivr.net/gh/Im1JuanProlibu/BOT-GEZPOMOTOR@main/test.js
