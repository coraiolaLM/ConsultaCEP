const consultaCep = () => {
    //receb o cep do imput, tanto com quanto sem "-", confere se o cep tem 8 caracteres, confere se o cep já ta inserido na tabela, 
    //confere se o cep é existente pela api, caso o cep for existente, cria um filho(tr) na table que recebe as informações puchadas
    //pela api, e printa ao usuario.captura e avisa ao usuario caso tenha algum erro de coneção
    const cepbruto = document.querySelector('#cep').value
    const ceplimpo = cepbruto.replace('-', '')
    const cepLength = ceplimpo.length

    if (cepLength === 8) {
        const cep = ceplimpo
        const tabela = document.querySelector('#tabela')
        const cepsSalvos = JSON.parse(localStorage.getItem('cepsSalvos')) || {}

        if (cepsSalvos[cep]) {
            alert("CEP já inserido na tabela")
            return
        }
        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(resposta => resposta.json())
            .then(json => {
                if (json.erro) {
                    alert("CEP inexistente, verifique-o.")
                    return
                }
                const linha = document.createElement('tr')
                linha.innerHTML = `
                    <td>${json.cep}</td>
                    <td>${json.logradouro}</td>
                    <td>${json.bairro}</td>
                    <td>${json.localidade}</td>
                    <td>${json.uf}</td>
                    <td>${json.ibge}</td>
                    <td>${json.ddd}</td>
                    <td>${json.siafi}</td>
                    <td>
                        <button onclick="salvarCep('${cep}')" class="botão">Salvar CEP</button>
                        <br>
                        <button onclick="consultarClima('${json.localidade}')" class="botão">Consultar clima</button>
                    </td>
                `
                tabela.appendChild(linha)
            })
            .catch(error => {
                console.error("Erro de conexão:", error)
                alert("Erro de conexão, verifique sua conexão com a internet.")
            })
    } else {
        alert("CEP deve ser inserido sem espaços e deve conter exatamente 8 dígitos numéricos.")
    }
}

const salvarCep = (cep) => {
    //recebe um cep no parametro pelo botão, cria uma variavel com endereço ao localstorage que aramazena os todos os cepssalvos, 
    //transforma cep parametro em json e aramazena ele no localstorage dentro dessa variavel, e depois chama a função imprimircepsalvos 
    const cepsSalvos = JSON.parse(localStorage.getItem('cepsSalvos')) || {}
    if (cepsSalvos[cep]) {
        alert("CEP já está salvo.")
        return
    }
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(resposta => resposta.json())
        .then(json => {
            if (json.erro) {
                alert("CEP inexistente, verifique-o.")
                return
            }

            cepsSalvos[cep] = json
            localStorage.setItem('cepsSalvos', JSON.stringify(cepsSalvos))
            alert(`CEP ${cep} salvo com sucesso.`)
            imprimirCepsSalvos()
        })
        .catch(error => {
            console.error("Erro de conexão:", error)
            alert("Erro de conexão, verifique sua conexão com a internet.")
        })
}

const imprimirCepsSalvos = () => {
    //imprime ceps salvos.
    const tabela = document.querySelector('#tabela')
    tabela.innerHTML = ''
    const cepsSalvos = JSON.parse(localStorage.getItem('cepsSalvos')) || {}
    for (const cep in cepsSalvos) {
        const json = cepsSalvos[cep]
        const linha = document.createElement('tr')
        linha.innerHTML = `
            <td>${json.cep}</td>
            <td>${json.logradouro}</td>
            <td>${json.bairro}</td>
            <td>${json.localidade}</td>
            <td>${json.uf}</td>
            <td>${json.ibge}</td>
            <td>${json.ddd}</td>
            <td>${json.siafi}</td>
            <td>
                <button onclick="removerCep('${cep}')" class="botão">Remover CEP</button>
                <br>
                <button onclick="consultarClima('${json.localidade}')" class="botão">Consultar clima</button>
            </td>
        `
        tabela.appendChild(linha)
    }
}

const removerCep = (cep) => {
    //recebe cep que sera removido como parametro, recebe a mesma variavel com todos os cepssalvos, verifica se o cep parametro esta 
    //na lista de cepssalvos, se tiver, o programa deleta depois atualiza os ceps salvos e depois imprime os cepssalvos novamente,
    //por fim deletando unitariamente o cep.
    const cepsSalvos = JSON.parse(localStorage.getItem('cepsSalvos')) || {}
    if (!cepsSalvos[cep]) {
        alert("CEP não encontrado.")
        return
    } else {
        delete cepsSalvos[cep]
        localStorage.setItem('cepsSalvos', JSON.stringify(cepsSalvos))
        imprimirCepsSalvos()
    }
}

const apagartodoscep = () => {
    //apaga todos os ceps, dando um clear no  localstorage
    localStorage.clear()
    imprimirCepsSalvos()
}

const consultarClima = async (localidade) => {
    const modal = document.getElementById("climateModal");
    const climateInfo = document.getElementById("climateInfo");

    try {
        // Primeiro, converter cidade para latitude e longitude usando Nominatim (gratuito)
        const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?city=${localidade}&country=Brazil&format=json`);
        const geoData = await geoResponse.json();

        if (!geoData.length) {
            climateInfo.innerHTML = `<p>Localidade "${localidade}" não encontrada.</p>`;
            modal.style.display = "block";
            return;
        }

        const { lat, lon, display_name } = geoData[0];

        // Agora buscar dados climáticos com Open-Meteo
        const climaResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m&timezone=auto`);
        const climaData = await climaResponse.json();

        // Pegar o primeiro dado disponível do dia atual
        const agora = new Date();
        const horaAtual = agora.getHours();
        const indiceHora = climaData.hourly.time.findIndex(t => t.startsWith(agora.toISOString().slice(0, 10)) && parseInt(t.split("T")[1]) === horaAtual);

        if (indiceHora === -1) {
            climateInfo.innerHTML = `<p>Dados climáticos indisponíveis para ${localidade}.</p>`;
        } else {
            const temperatura = climaData.hourly.temperature_2m[indiceHora];
            const umidade = climaData.hourly.relative_humidity_2m[indiceHora];
            const dataFormatada = agora.toLocaleDateString('pt-BR');

            climateInfo.innerHTML = `
                <h1>${display_name}</h1>
                <p>Data: ${dataFormatada}</p>
                <p>Temperatura: ${temperatura}°C</p>
                <p>Umidade: ${umidade}%</p>
                <h3 class="h3">*dados estimados para a hora atual</h3>
            `;
        }

        modal.style.display = "block";
    } catch (error) {
        console.error("Erro ao buscar dados do clima:", error);
        alert("Erro ao buscar dados do clima, tente novamente mais tarde.");
    }

    // Botão para fechar o modal
    const closeBtn = document.getElementsByClassName("close")[0];
    closeBtn.onclick = function () {
        modal.style.display = "none";
    };

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
};

const traduzirClima = (fraseEmIngles) => {
    //traduz clima entregue pela api. ja que a api é ingles
    const traducoes = {
        "Partly Cloudy": "Parcialmente Nublado",
        "Cloudy": "Nublado",
        "Rain": "Chuva",
        "Sunny": "Ensolarado",
        "Clear": "Claro",
        "Rain Showers": "Pancadas de chuvas",
    };
    return traducoes[fraseEmIngles] || fraseEmIngles;
}

//toda vez que a pagina é recarregada ou aberta, a função imprimircepssalvos é chamada
window.addEventListener('load', imprimirCepsSalvos)
