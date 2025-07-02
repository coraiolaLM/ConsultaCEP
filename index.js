// Função principal para consultar CEP
const consultaCep = () => {
    const cepbruto = document.querySelector('#cep').value;
    const ceplimpo = cepbruto.replace('-', '');
    const cepLength = ceplimpo.length;

    if (cepLength === 8) {
        const cep = ceplimpo;
        const tabela = document.querySelector('#tabela');
        const cepsSalvos = JSON.parse(localStorage.getItem('cepsSalvos')) || {};

        if (cepsSalvos[cep]) {
            alert("CEP já inserido na tabela");
            return;
        }

        // Mostrar loading
        const loadingRow = document.createElement('tr');
        loadingRow.innerHTML = `
            <td colspan="3" class="loading-row">
                <div class="loading-spinner"></div>
                <span>Consultando CEP...</span>
            </td>
        `;
        tabela.appendChild(loadingRow);

        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(resposta => {
                if (!resposta.ok) throw new Error("CEP não encontrado");
                return resposta.json();
            })
            .then(json => {
                // Remover loading
                tabela.removeChild(loadingRow);

                if (json.erro) {
                    alert("CEP inexistente, verifique-o.");
                    return;
                }
                
                criarLinhaCEP(json, cep, false);
                setupTableLabels();
            })
            .catch(error => {
                tabela.removeChild(loadingRow);
                console.error("Erro:", error);
                alert(error.message || "Erro ao consultar CEP");
            });
    } else {
        alert("CEP deve conter exatamente 8 dígitos numéricos");
    }
};

// Função para criar linha de CEP
const criarLinhaCEP = (json, cep, isSaved) => {
    const tabela = document.querySelector('#tabela');
    
    const linhaTitulo = document.createElement('tr');
    linhaTitulo.innerHTML = `
        <td colspan="3" class="cep-title">${json.cep}</td>
    `;
    tabela.appendChild(linhaTitulo);
    
    const linhaDados1 = document.createElement('tr');
    linhaDados1.innerHTML = `
        <td data-label="Logradouro">${json.logradouro || '-'}</td>
        <td data-label="Bairro">${json.bairro || '-'}</td>
        <td data-label="Cidade">${json.localidade || '-'}</td>
    `;
    tabela.appendChild(linhaDados1);
    
    const linhaDados2 = document.createElement('tr');
    linhaDados2.innerHTML = `
        <td data-label="Estado">${json.uf || '-'}</td>
        <td data-label="IBGE">${json.ibge || '-'}</td>
        <td data-label="DDD">${json.ddd || '-'}</td>
    `;
    tabela.appendChild(linhaDados2);
    
    const linhaBotoes = document.createElement('tr');
    linhaBotoes.innerHTML = `
        <td colspan="3">
            <div class="button-group">
                ${isSaved ? 
                    `<button onclick="removerCep('${cep}')" class="botão remover">Remover CEP</button>` : 
                    `<button onclick="salvarCep('${cep}')" class="botão salvar">Salvar CEP</button>`
                }
                <button onclick="consultarClima('${json.localidade}')" class="botão clima">Consultar clima</button>
            </div>
        </td>
    `;
    tabela.appendChild(linhaBotoes);
    
    const linhaEspaco = document.createElement('tr');
    linhaEspaco.innerHTML = `<td colspan="3" class="espaco"></td>`;
    tabela.appendChild(linhaEspaco);
};

// Função para salvar CEP
const salvarCep = (cep) => {
    const cepsSalvos = JSON.parse(localStorage.getItem('cepsSalvos')) || {};
    
    if (cepsSalvos[cep]) {
        alert("CEP já está salvo.");
        return;
    }

    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(resposta => {
            if (!resposta.ok) throw new Error("Erro ao buscar CEP");
            return resposta.json();
        })
        .then(json => {
            if (json.erro) {
                alert("CEP inexistente, verifique-o.");
                return;
            }

            cepsSalvos[cep] = json;
            localStorage.setItem('cepsSalvos', JSON.stringify(cepsSalvos));
            alert(`CEP ${cep} salvo com sucesso!`);
            imprimirCepsSalvos();
        })
        .catch(error => {
            console.error("Erro:", error);
            alert(error.message || "Erro ao salvar CEP");
        });
};

// Função para imprimir CEPs salvos
const imprimirCepsSalvos = () => {
    const tabela = document.querySelector('#tabela');
    tabela.innerHTML = '';
    const cepsSalvos = JSON.parse(localStorage.getItem('cepsSalvos')) || {};
    
    if (Object.keys(cepsSalvos).length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="3" class="empty-message">
                    Nenhum CEP salvo ainda. Consulte um CEP para começar!
                </td>
            </tr>
        `;
        return;
    }
    
    for (const cep in cepsSalvos) {
        criarLinhaCEP(cepsSalvos[cep], cep, true);
    }
    
    setupTableLabels();
};

// Função para remover CEP
const removerCep = (cep) => {
    if (!confirm(`Deseja realmente remover o CEP ${cep}?`)) return;
    
    const cepsSalvos = JSON.parse(localStorage.getItem('cepsSalvos')) || {};
    if (!cepsSalvos[cep]) {
        alert("CEP não encontrado.");
        return;
    }
    
    delete cepsSalvos[cep];
    localStorage.setItem('cepsSalvos', JSON.stringify(cepsSalvos));
    imprimirCepsSalvos();
};

// Função para apagar todos CEPs
const apagartodoscep = () => {
    if (!confirm("Deseja realmente remover TODOS os CEPs salvos?")) return;
    localStorage.clear();
    imprimirCepsSalvos();
    alert("Todos os CEPs foram removidos com sucesso!");
};

// Função para limpar consultas
const limparconsultas = () => {
    const tabela = document.querySelector('#tabela');
    tabela.innerHTML = '';
};

// Função para consultar clima
const consultarClima = async (localidade) => {
    const modal = document.getElementById("climateModal");
    const climateInfo = document.getElementById("climateInfo");
    
    climateInfo.innerHTML = `
        <div class="weather-icon">⏳</div>
        <p>Buscando dados para ${localidade}...</p>
    `;
    modal.style.display = "block";

    try {
        // 1. Buscar coordenadas
        const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(localidade)}&country=Brazil&format=json`
        );
        
        if (!geoResponse.ok) throw new Error("Erro ao buscar localização");
        const geoData = await geoResponse.json();
        
        if (!geoData.length) throw new Error(`Localidade "${localidade}" não encontrada`);

        const { lat, lon, display_name } = geoData[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        if (isNaN(latitude)) throw new Error("Latitude inválida");
        if (isNaN(longitude)) throw new Error("Longitude inválida");

        // 2. Buscar dados climáticos
        const climaResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`
        );
        
        if (!climaResponse.ok) throw new Error("Erro ao buscar clima");
        const climaData = await climaResponse.json();
        
        if (!climaData.current) throw new Error("Dados climáticos indisponíveis");

        // Exibir resultados
        exibirDadosClimaticos(climaData.current, display_name, latitude, longitude);
    } catch (error) {
        console.error("Erro:", error);
        climateInfo.innerHTML = `
            <div class="weather-icon">⚠️</div>
            <p class="error">${error.message}</p>
            <p class="weather-footer">Tente novamente mais tarde</p>
        `;
    }

    // Configurar fechamento do modal
    const closeBtn = document.querySelector(".close");
    closeBtn.onclick = () => modal.style.display = "none";

    window.onclick = (event) => {
        if (event.target === modal) modal.style.display = "none";
    };
};

// Função auxiliar para exibir dados climáticos
const exibirDadosClimaticos = (current, display_name, lat, lon) => {
    const climateInfo = document.getElementById("climateInfo");
    const weatherEmoji = getWeatherEmoji(current.weather_code);
    const cityName = display_name.split(",")[0];
    const date = new Date().toLocaleDateString('pt-BR', { 
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    });

    climateInfo.innerHTML = `
        <div class="weather-icon">${weatherEmoji}</div>
        <div class="temperature">${current.temperature_2m}°C</div>
        <h3>${cityName}</h3>
        <p>${date}</p>
        
        <div class="weather-details">
            <div class="weather-detail">
                <div>💧</div>
                <span>Umidade</span>
                <strong>${current.relative_humidity_2m}%</strong>
            </div>
            <div class="weather-detail">
                <div>📍</div>
                <span>Coordenadas</span>
                <strong>${lat.toFixed(2)}, ${lon.toFixed(2)}</strong>
            </div>
        </div>
        
        <p class="weather-footer">* Dados em tempo real</p>
    `;
};

// Função para mapear código do tempo para emoji
const getWeatherEmoji = (code) => {
    const emojis = {
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
        51: '🌧️', 53: '🌧️', 55: '🌧️', 56: '🌧️', 57: '🌧️',
        61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌧️', 67: '🌧️',
        71: '❄️', 73: '❄️', 75: '❄️', 77: '❄️', 80: '🌧️',
        81: '🌧️', 82: '🌧️', 85: '❄️', 86: '❄️', 95: '⛈️',
        96: '⛈️', 99: '⛈️'
    };
    return emojis[code] || '🌤️';
};

// Configurar labels para tabela em mobile
const setupTableLabels = () => {
    const cells = document.querySelectorAll('.table td');
    const labels = {
        'logradouro': 'Logradouro',
        'bairro': 'Bairro',
        'localidade': 'Cidade',
        'uf': 'Estado',
        'ibge': 'IBGE',
        'ddd': 'DDD'
    };
    
    cells.forEach(cell => {
        for (const key in labels) {
            if (cell.textContent.includes(key)) {
                cell.setAttribute('data-label', labels[key]);
                break;
            }
        }
    });
};

// Inicializar a página
window.addEventListener('load', () => {
    imprimirCepsSalvos();
    
    // Configurar evento de tecla para o input
    document.querySelector('#cep').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') consultaCep();
    });
});