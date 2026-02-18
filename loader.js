function cargarCotizador() {
  var html = `
   <title>Cotizador Voyah - GezpoMotor</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <link rel="stylesheet" href="//s3.amazonaws.com/cdn.nodriza.io/assets/css/chatbot.automotriz.css">
  <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/css/intlTelInput.css">
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.2/jquery.min.js"></script>
  <script src="https://s3.amazonaws.com/cdn.nodriza.io/sdk/nodriza@lastest/nodriza-sdk.bundle.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.11/lodash.core.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/intlTelInput.min.js"></script>

<style>
  @font-face {
    font-family: 'FordAntenna';
      src: url('//cdn.jsdelivr.net/gh/jerobles/fonts@master/FordAntenna-Bold.eot') format('embedded-opentype');
      src: url('//cdn.jsdelivr.net/gh/jerobles/fonts@master/FordAntenna-Bold.woff') format('woff');
      font-weight: 700;
      font-style: normal;
        }
  @font-face {
    font-family: 'FordAntenna';
      src: url('//cdn.jsdelivr.net/gh/jerobles/fonts@master/FordAntenna-Medium.eot') format('embedded-opentype');
      src: url('//cdn.jsdelivr.net/gh/jerobles/fonts@master/FordAntenna-Medium.woff') format('woff');
      font-weight: 500;
      font-style: normal;
        }
  @font-face {
    font-family: 'FordAntenna';
      src: url('//cdn.jsdelivr.net/gh/jerobles/fonts@master/FordAntenna-Regular.eot') format('embedded-opentype');
      src: url('//cdn.jsdelivr.net/gh/jerobles/fonts@master/FordAntenna-Regular.woff') format('woff');
      font-weight: 400;
      font-style: normal;
        }
  @font-face {
    font-family: 'FordAntenna';
      src: url('//cdn.jsdelivr.net/gh/jerobles/fonts@master/FordAntenna-Light.eot') format('embedded-opentype');
      src: url('//cdn.jsdelivr.net/gh/jerobles/fonts@master/FordAntenna-Light.woff') format('woff');
      font-weight: 300;
      font-style: normal;
        }     
  #chatbot-automotriz * {
    font-family: 'FordAntenna' !important;
  }
  #chatbot-automotriz {
    overflow: visible;
  }
  #chatbot-automotriz #background {
    background-position: left;
  }
  #chatbot-automotriz footer {
    bottom: 10px;
    opacity: 0.7;
    font-size: 0.7rem;
  }

  .iti {
    width: 100%;
  }

  .form-group input[type="tel"] {
    padding-left: 60px;
  }

  .iti__country-list {
    background-color: #fff;
  }

  .iti__country-list .iti__country {
    color: #000 !important;
  }

  .iti__country-list .iti__country:hover,
  .iti__country-list .iti__country:focus {
    background-color: #f0f0f0;
  }

  .iti__selected-dial-code {
    color: #000 !important;
  }

  .select2-container--default .select2-selection--single {
      background-color: #f8f9fa;
      border: 1px solid #ced4da;
      border-radius: 4px;
      height: 38px;
      display: flex;
      align-items: center;
      padding-left: 8px;
  }
  .select2-container--default .select2-selection--single .select2-selection__arrow {
      height: 36px;
      right: 8px;
  }
  .select2-container--default .select2-selection--single .select2-selection__placeholder {
      color: #6c757d;
  }
  .select2-container--default .select2-results__option--highlighted[aria-selected] {
      background-color: #007bff;
      color: white;
  }
  .select2.select2-container.select2-container--default {
      width:100% !important;
  }
</style>

<script type="text/javascript">

    /*====== VARIABLES GLOBALES =========*/
    var domain = 'gezpomotor.prolibu.com';
    var botName = 'NoAgentBot-voyah';
    var bearerToken = '2f7030e1-0580-4644-8c20-19645fef6020';
    var currency = 'COP';
    const useWebhookHubspot = true;
    const pipelineId = '1000390393';
    const dealstageId = '1531786953';
    const pricingListFilter = 'Voyah';
    const departmentFilter = 'voyah'; // ✅ NUEVO: Filtro por departamento
    let fullPhoneNumber = '';

    const customAttributes = [
        {
            "name": "Prolibu",
            "idAttribute": "fuente_del_lead",
            "model": "contacts"
        }
    ]    
    
    let productsList = [];
    let agentsList = [];
    let currentAgentIndex = Math.floor(Math.random() * 1000);
    var params = {hostname: domain};
    window.nodriza = new Nodriza(params);        

    function error(msg) {
        alert(msg);
    }

    function success(msg) {
        alert(msg);
    }

    function fetchData(url, method, params, headers, successCallback, errorCallback) {
        $.ajax({
            url: url,
            method: method,
            data: params || {},
            headers: headers || {},
            success: successCallback,
            error: function(jqXHR, textStatus, errorThrown) {
                console.error("Error en la solicitud:", textStatus, errorThrown);
                if (errorCallback) {
                    errorCallback(jqXHR);
                }
            }
        });
    }

    // ✅ FUNCIÓN ACTUALIZADA: Carga TODOS los agentes activos y filtra por departamento
    function loadAgents() {
        fetchData(
            `https://${domain}/v1/publicservices/getAgents`,
            "GET",
            {
                status: 'active',  // ✅ Solo activos
                roles: ['agent']   // ✅ Solo rol agent
                // ❌ SIN chatbot - Para traer TODOS los agentes
            },
            {},
            function(data) {
                console.log('Agentes recibidos (todos):', data);
                
                let agents = Array.isArray(data) ? data : (data.results || []);
                
                if (!agents || agents.length === 0) {
                    console.error('No hay agentes disponibles');
                    agentsList = [];
                    return;
                }
                
                // ✅ FILTRAR SOLO LOS DEL DEPARTAMENTO "voyah"
                let voyahAgents = agents.filter(function(agent) {
                    let agentDept = agent.department || '';
                    return agentDept.toLowerCase().trim() === departmentFilter.toLowerCase().trim();
                });
                
                console.log('Agentes filtrados por departamento "' + departmentFilter + '":', voyahAgents.length);
                
                if (voyahAgents.length === 0) {
                    console.error('No hay agentes en el departamento ' + departmentFilter);
                    agentsList = [];
                    return;
                }
                
                agentsList = voyahAgents.map(function(agent) {
                    return {
                        email: agent.email,
                        firstName: agent.firstName || agent.firstname || '',
                        lastName: agent.lastName || agent.lastname || '',
                        department: agent.department || ''
                    };
                });
                
                console.log('Agentes del departamento "' + departmentFilter + '" cargados:', agentsList);
            },
            function(error) {
                console.error('Error cargando agentes:', error);
                agentsList = [];
            }
        );
    }

    function getNextAgent() {
        if (!agentsList || agentsList.length === 0) {
            console.warn('No hay agentes disponibles del departamento ' + departmentFilter);
            return null;
        }
        
        const agent = agentsList[currentAgentIndex % agentsList.length];
        currentAgentIndex++;
        
        console.log('Agente asignado:', agent.email, '(Departamento:', agent.department + ')');
        return agent.email;
    }

    function loadProducts() {
        fetchData(
            `https://${domain}/v1/product`,
            "GET",
            { limit: 1000 },
            { Authorization: `Bearer ${bearerToken}` },
            function(response) {
                if (!response || response.length === 0) {
                    console.error("No se recibieron productos");
                    return;
                }
                
                productsList = response.map(product => {
                    let pricingListName = null;
                    
                    if (product.pricingList) {
                        if (typeof product.pricingList === 'object') {
                            pricingListName = product.pricingList.name;
                        } else if (typeof product.pricingList === 'string') {
                            pricingListName = product.pricingList;
                        }
                    }
                    
                    return {
                        sku: product.sku,
                        name: product.name,
                        disabled: product.disabled,
                        pricingList: pricingListName
                    };
                });

                $("#model").empty().append(getModelOptions());
                $("#model").select2({
                    placeholder: "Seleccione el Modelo",
                    allowClear: true
                });

                let $modelOptions = $("#model option");
                $modelOptions.sort((a, b) => {
                    const textA = $(a).text().toUpperCase();
                    const textB = $(b).text().toUpperCase();
                    return textA.localeCompare(textB);
                });
                $("#model").html($modelOptions).trigger("change");
            },
            function(error) {
                console.error("Error en la consulta de productos:", error);
            }
        );
    }

    function getSelectedProducts() {
        if (!productsList) {
            console.error('productsList no está definido');
            return [];
        }
        
        return productsList.filter(product => {
            if (product.disabled) return false;
            
            if (!product.pricingList) return false;
            
            const pricingListNorm = product.pricingList.toLowerCase().trim();
            const filterNorm = pricingListFilter.toLowerCase().trim();
            
            return pricingListNorm.includes(filterNorm) || filterNorm.includes(pricingListNorm);
        });
    }

    function getModelOptions() {
        let selectedProducts = getSelectedProducts();
        
        if (!selectedProducts.length) {
            console.warn("No hay productos de Voyah disponibles");
        }
        
        let options = selectedProducts.map(product => {
            return `<option value="${product.sku}">${product.name}</option>`;
        }).join('');
        
        options += '<option value="" selected="selected">Seleccione un modelo</option>';
        return options;
    }

    function getProductsBy(key, values) {
        if (typeof values === 'string') values = [values];
        for (let i = 0; i < productsList.length; i++) {
            for (let j = 0; j < values.length; j++) {
                if (productsList[i][key] === values[j]) return productsList[i];
            }
        }
    }

    function updateFullPhoneNumber() {
        fullPhoneNumber = `+${iti.getSelectedCountryData().dialCode}${$("#mobile").val()}`;
    }
           
    function submitForm(e) {
        e.preventDefault();
        let fields = $("#contact-form").serializeArray();
        let json = {};
        for (let i = 0; i < fields.length; i++) {
            json[fields[i].name] = fields[i].value;
        }
        
        if (json.authorized !== 'on') return error('Por favor acepte nuestras politicas de tratamiento de datos para continuar.');
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test($('#email').val())) return error('Email inválido');
        
        let code = $('#code').val();
        nodriza.api.confirmationCode.confirm({code: code}, function(err, results) {
            if (!_.isEmpty(err)) {
                alert('Código de confirmación inválido. Se refrescara el formulario.');
                window.location.reload();
                return;
            }
            if (results && results.hash) {
                json.hash = results.hash;
                createProposal(json);
            }
        });
    }

    function createProposal(json) {
        customAttributes[0].value = 'Cotizador Web Voyah';
        
        let model = getProductsBy('sku', json.model);
        
        if (!model) {
            return error('Error: Producto no encontrado. Por favor intente nuevamente.');
        }
        
        const assignedAgent = getNextAgent();
        
        if (!assignedAgent) {
            console.warn('No se pudo asignar agente del departamento ' + departmentFilter);
            return error('No hay agentes disponibles en este momento. Por favor intente más tarde.');
        }
        
        console.log('Agente asignado para esta cotización:', assignedAgent);
        
        let to = {
            firstName: json.firstName,
            lastName: json.lastName,
            mobile: fullPhoneNumber,
            email: json.email,
            agent: assignedAgent
        };
        
        let opt = {
            chatbot: botName,
            to: to,
            doc: {
                title: 'Cotización ' + json.firstName + " " + json.lastName + ' - ' + model.name,
                products: [{
                    id: model.sku,
                    quantity: 1
                }],
                status: 'Ready',
                currency: currency,
                metadata: {
                    "webhook": useWebhookHubspot,
                    "customAttributes": customAttributes,
                    "pipeline": pipelineId,
                    "dealstage": dealstageId,
                    "customNameDealHubspot": to.firstName + ' ' + to.lastName + ' - ' + model.name,
                    "agentEmail": assignedAgent,
                    "deal_currency_code": currency
                },
                dic: { hash: json.hash }
            },
            emailClient: true,
            emailAgent: true,
            assignedAgentEmail: assignedAgent
        };
        
        console.log('Generando propuesta con payload:', opt);
        
        window.nodriza.api.proposalbot.generate(opt, function(err, res) {
            if (err) {
                console.error('Error generando propuesta:', err);
                return error('Error al generar la cotización. Por favor intente nuevamente.');
            }
            
            if (!res || !res.url) {
                console.error('Respuesta inválida:', res);
                return error('Error: No se recibió el enlace de la cotización.');
            }
            
            console.log('Propuesta generada exitosamente:', res.url);
            
            alert('¡Cotización generada! Serás redirigido a WhatsApp.');
            window.location = "https://api.whatsapp.com/send?phone=" + fullPhoneNumber + 
                             "&text=Hola " + json.firstName + " " + json.lastName + 
                             " da click para ver tu propuesta comercial " + res.url;
        });
    }

    $(document).ready(function() {
        loadAgents();
        loadProducts();
        
        $('#confirmation-container').append('<embed id="confirmation-code" height="60px" src="https://' + domain + '/v1/ConfirmationCode/?color=white&noise=2&size=4">');

        $("#model").select2({
            placeholder: "Seleccione el Modelo",
            allowClear: true
        });

        let input = document.querySelector("#mobile");
        let iti = window.intlTelInput(input, {
            separateDialCode: true,
            initialCountry: "co",
            preferredCountries: ['co'],
            utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
        });

        $("#mobile").on("input", updateFullPhoneNumber);
        input.addEventListener("countrychange", updateFullPhoneNumber);
        window.iti = iti;
        
        setTimeout(updateFullPhoneNumber, 1000);
    });  
 
</script>




<div id="chatbot-automotriz">   
    <div id="logo-container" class="d-md-none">
        <div class="row">
            <div class="col-8 brand-name">Cotizador Voyah</div>
            <div class="col-4 padding-right text-right"></div>
        </div>
    </div>

    <div id="image-selecte-mobile" class="d-md-none" style="background-image: url(https://s3.amazonaws.com/files.nodriza.io/gezpomotor/bot/Voyah-Logo.jpg);"></div>
    
    <div class="row">       
        <div id="background" class="col col-12 col-sm-12 col-md-6 col-md-6 col-xl-8" style="background-image: url(https://s3.amazonaws.com/files.nodriza.io/gezpomotor/bot/Voyah-Logo.jpg);"></div>
        
        <form id="contact-form" class="col col-12 col-sm-12 col-md-6 col-xl-4" onsubmit="return submitForm(event);">
            <div id="info-container">
                <div class="row">
                    <div class="col-12 padding-right">
                        <h3 class="d-none d-lg-block">Déjenos sus datos y reciba una cotización al instante:</h3>
                        <h5 class="d-md-none">Déjenos sus datos y reciba una cotización al instante:</h5>
                    </div>
                </div>
                <br>
                <div class="row">
                    <fieldset class="col-12 padding-right">
                        <h4 class="d-none d-lg-block">Seleccione el Modelo:</h4>
                        <h6 class="d-lg-none">Seleccione el Modelo:</h6>
                        <div class="form-group">
                            <select class="form-control" name="model" id="model" required="">
                                <option value="">Cargando modelos...</option>
                            </select>
                        </div>

                        <h4 class="d-none d-lg-block">Datos del lead:</h4>
                        <h6 class="d-lg-none">Datos del lead:</h6>                    
                        <div class="form-group">
                            <input class="form-control" type="text" name="firstName" id="firstName" placeholder="Nombre" required="">
                        </div>
                        <div class="form-group">
                            <input class="form-control" type="text" name="lastName" id="lastName" placeholder="Apellido" required="">
                        </div>
                        <div class="form-group">
                            <input class="form-control" type="tel" name="mobile" id="mobile" placeholder="Celular" required="">
                        </div>
                        <div class="form-group">
                            <input class="form-control" type="email" name="email" id="email" placeholder="Email" required="">
                        </div>
                        <div class="form-group">
                            <p id="confirmation-container"></p>
                        </div>
                        <div class="form-group">
                            <input class="form-control" type="text" name="code" id="code" placeholder="Confirme el siguiente número:" required="">
                        </div>
                        
                        <div class="form-group checkbox">
                            <label for="promotions">
                                <input type="checkbox" name="promotions" id="promotions" checked="">
                                Autorizo el uso de mis datos para recibir información sobre promociones, eventos y descuentos.
                            </label>
                        </div>
                        <div class="form-group checkbox">
                            <label for="authorized">
                                <input type="checkbox" name="authorized" id="authorized" checked="">
                                Autorizo el uso de mis datos según la <a href="#" target="_blank" style="text-decoration: underline;">política de clientes</a>
                            </label>
                        </div>
                        <div class="form-group">
                            <input class="form-control btn btn-primary" id="submit-btn" type="submit" value="COTIZAR AHORA!">
                        </div>
                    </fieldset>
                </div>
            </div>
        </form>
    </div>   
    <footer class="row" style="font-size:12px; padding-left:2%; opacity: 0.7;">
        <p id="copyright">©2024 Todos los derechos reservados.</p>
    </footer>
</div>
  `;
  
  var div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div);
}
cargarCotizador();
