
let obrasChartInstance = null;
const CHAVE_DE_AGRUPAMENTO = 'artista'; 
async function carregarGraficoPorCategoria(categoria) {
    
    const COLECAO_ENDPOINT = `http://localhost:3000/${categoria}`;
    
    try {
        const response = await fetch(COLECAO_ENDPOINT);
        if (!response.ok) {
            throw new Error(`Erro HTTP! Status: ${response.status} ao buscar ${categoria}`);
        }
        const data = await response.json();
        const contagemPorArtista = data.reduce((acc, item) => {
            const artista = item[CHAVE_DE_AGRUPAMENTO] || 'Artista Desconhecido';
            acc[artista] = (acc[artista] || 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(contagemPorArtista);
        const chartData = Object.values(contagemPorArtista);
        renderizarGrafico(labels, chartData, categoria);

    } catch (error) {
        console.error("Erro ao carregar dados para o gráfico:", error);
        const chartContainer = document.getElementById('obrasPorArtistaChart').closest('div');
        if (chartContainer) {
             chartContainer.innerHTML = `<p class="alert alert-danger mt-3">Erro ao carregar dados da categoria **${categoria}**.</p>`;
        }
    }
}
function renderizarGrafico(labels, data, categoria) {
    const ctx = document.getElementById('obrasPorArtistaChart');
    if (obrasChartInstance) {
        obrasChartInstance.destroy();
    }
    const tituloMapa = categoria.charAt(0).toUpperCase() + categoria.slice(1);
    obrasChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Total de Itens Publicados (${tituloMapa})`,
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Quantidade de Itens' },
                    ticks: {
                        callback: function(value) {if (value % 1 === 0) {return value;}}
                    }
                },
                x: {
                    title: { display: true, text: 'Artista/Autor' }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Contagem por Artista na Categoria: ${tituloMapa}`
                }
            }
        }
    });
}
document.addEventListener('DOMContentLoaded', () => {
    carregarHome();
    configurarFormularioPublicacao();
    configurarFormularioEdicao();
    const filtro = document.getElementById('filtroCategoria');
    if (filtro) {
        carregarGraficoPorCategoria(filtro.value); 
        filtro.addEventListener('change', (e) => {
            carregarGraficoPorCategoria(e.target.value);
        });
    }
});
const atualizarGraficoObras = () => carregarGraficoPorCategoria('obras');
function configurarFormularioPublicacao() {
    const btnPublicarCabecalho = document.querySelector('.header-actions .btn-primary');
    const secaoFormulario = document.getElementById('publicar-obra-form');
    const btnCancelar = document.getElementById('cancelar-publicacao');
    const formNovaObra = document.getElementById('form-nova-obra');
    if (btnPublicarCabecalho && secaoFormulario && btnCancelar && formNovaObra) {
        btnPublicarCabecalho.addEventListener('click', () => {
            secaoFormulario.style.display = 'block';
            secaoFormulario.scrollIntoView({ behavior: 'smooth' });
        });
        btnCancelar.addEventListener('click', () => {
            secaoFormulario.style.display = 'none';
            formNovaObra.reset();
        });
        formNovaObra.addEventListener('submit', (evento) => {
            evento.preventDefault();
            publicarNovaObra();
        });
    }
}
function configurarFormularioEdicao() {
    const formEditarObra = document.getElementById('form-editar-obra');
    const btnCancelarEdicao = document.getElementById('cancelar-edicao');
    const secaoEdicao = document.getElementById('editar-obra-form');

    if (formEditarObra && btnCancelarEdicao && secaoEdicao) {
        btnCancelarEdicao.addEventListener('click', () => {
            secaoEdicao.style.display = 'none';
            formEditarObra.reset();
        });
        formEditarObra.addEventListener('submit', (evento) => {
            evento.preventDefault();
            salvarAlteracoes();
        });
    }
};
async function salvarAlteracoes() {
    const id = document.getElementById('edicao-item-id').value;
    const entidade = document.getElementById('edicao-entidade').value;
    const titulo = document.getElementById('edicao-titulo').value;
    const artista = document.getElementById('edicao-artista').value;
    const imagem = document.getElementById('edicao-imagem').value;
    const descricao = document.getElementById('edicao-descricao').value;

    const registroAtualizado = {
        id: id, 
        titulo: titulo,
        artista: artista,
        imagem: imagem,
        descricao: descricao 
    };

    const endpoint = `http://localhost:3000/${entidade}/${id}`;

    try {
        const response = await fetch(endpoint, {
            method: 'PUT', 
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(registroAtualizado) 
        });

        if (response.ok) {
            alert(`Item ID ${id} alterado com sucesso na coleção ${entidade}!`);
            document.getElementById('editar-obra-form').style.display = 'none';
            carregarHome(); 
        } else {
            alert(`Falha ao salvar alterações. Status: ${response.status}. Verifique o servidor.`);
            console.error('Erro de API PUT:', await response.text());
        }

    } catch (error) {
        console.error('Erro de rede ao tentar salvar alterações:', error);
        alert('Erro de conexão com o servidor. Verifique se o JSONServer está rodando.');
    }
}
async function abrirFormularioEdicao(id, entidade) {
    console.log(`Função abrirFormularioEdicao iniciada para ID: ${id}`);
    document.getElementById('publicar-obra-form').style.display = 'none';
    const formEdicao = document.getElementById('editar-obra-form');
    formEdicao.style.display = 'block';
    formEdicao.scrollIntoView({ behavior: 'smooth' });
    const endpoint = `http://localhost:3000/${entidade}/${id}`;
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            alert(`Erro ao carregar item para edição. Status: ${response.status}`);
            return;
        }
        const item = await response.json();
        document.getElementById('edicao-item-id').value = item.id;
        document.getElementById('edicao-entidade').value = entidade;
        document.getElementById('edicao-titulo').value = item.titulo;
        document.getElementById('edicao-artista').value = item.artista;
        document.getElementById('edicao-imagem').value = item.imagem;
        document.getElementById('edicao-descricao').value = item.descricao || '';

    } catch (error) {
        console.error('Falha ao carregar item para edição:', error);
        alert('Erro de conexão ao tentar carregar dados para edição.');
    }
}
async function publicarNovaObra() {
    const entidade = document.getElementById('obra-entidade').value;
    const titulo = document.getElementById('obra-titulo').value;
    const artista = document.getElementById('obra-artista').value;
    const imagem = document.getElementById('obra-imagem').value;
    const descricao = document.getElementById('obra-descricao').value;
    if (!entidade || !titulo || !artista) {
        alert("Por favor, selecione o Tipo de Item e preencha Título e Artista.");
        return;
    }

    const novoRegistro = {
        titulo: titulo,
        artista: artista,
        imagem: imagem,
        descricao: descricao
    };
    const endpoint = `http://localhost:3000/${entidade}`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(novoRegistro)
        });

        if (response.ok) {
            const itemCriado = await response.json();
            alert(`Item "${itemCriado.titulo}" criado com sucesso na coleção "${entidade}"! ID: ${itemCriado.id}`);

            document.getElementById('form-nova-obra').reset();
            document.getElementById('publicar-obra-form').style.display = 'none';
            carregarHome(); 
            const filtroAtual = document.getElementById('filtroCategoria').value;
            carregarGraficoPorCategoria(filtroAtual); 

        } else {
            alert(`Falha ao publicar item. Status: ${response.status}. Verifique a API.`);
            console.error('Erro de API:', await response.text());
        }

    } catch (error) {
        console.error('Erro de rede ao tentar publicar:', error);
        alert('Erro de conexão com o servidor. Verifique se o JSONServer está rodando.');
    }
}
async function deletarObra(id, entidade) {
    const itemId = id;
    if (!confirm(`Tem certeza que deseja excluir o item ID ${id} da coleção ${entidade}?`)) {
        return;
    }
    const endpoint = `http://localhost:3000/${entidade}/${itemId}`;
    try {
        const response = await fetch(endpoint, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert(`Item ID ${id} excluído com sucesso!`);
            carregarHome();
        } else {
            alert(`Falha ao excluir item. Status: ${response.status}. Verifique se o ID existe.`);
            console.error('Erro de API DELETE:', await response.text());
        }

    } catch (error) {
        console.error('Erro de rede ao tentar excluir:', error);
        alert('Erro de conexão com o servidor. Verifique se o JSONServer está rodando.');
    }
}
async function carregarDetalhes() {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    const detalhesContainer = document.getElementById('detalhes-container');

    if (!itemId) {
        detalhesContainer.innerHTML = '<p>Erro: ID do item faltando na URL.</p>';
        return;
    }
    const entidades = ['obras', 'albuns', 'pinturas'];
    let item = null;
    for (const entidade of entidades) {
        try {
            const endpoint = `http://localhost:3000/${entidade}/${itemId}`;
            const response = await fetch(endpoint);

            if (response.ok) {
                item = await response.json();
                break;
            }
        } catch (error) {
            console.warn(`Tentativa falhou para /${entidade}. Tentando a próxima...`);
        }
    }
    if (!item) {
        detalhesContainer.innerHTML = '<p>Item não encontrado em nenhuma das coleções da API.</p>';
        return;
    }
    detalhesContainer.innerHTML = `
        <div class="detalhes-obra">
            <img src="${item.imagem}" alt="${item.titulo}" class="imagem-detalhes">
            <div class="info-detalhes">
                <h1>${item.titulo}</h1>
                <p class="artista">${item.artista}</p>
                ${item.descricao ? `<p class="descricao">${item.descricao}</p>` : ''}
                <a href="index.html" class="btn-voltar">← Voltar para Home</a>
            </div>
        </div>
    `;
}
document.addEventListener('DOMContentLoaded', carregarDetalhes);
async function carregarHome() {
    const entidades = {
        obras: 'obras-grid',
        albuns: 'albuns-grid',
        pinturas: 'pinturas-grid'
    };
    for (const [entidade, containerId] of Object.entries(entidades)) {
        const container = document.getElementById(containerId);
        if (!container) continue;
        try {
            const endpoint = `http://localhost:3000/${entidade}`;
            const response = await fetch(endpoint);
            if (response.ok) {
                const itens = await response.json();
                container.innerHTML = '';
                itens.forEach(item => {
                    const cardHTML = `
    <div class="card-pequeno">
        <img src="${item.imagem}" class="card-img-top" alt="${item.titulo}">
        <div class="item-info">
            <h3 class="card-title">${item.titulo}</h3>
            <p class="card-artista">Artista: ${item.artista}</p>
            <a href="detalhes.html?id=${item.id}" class="btn-detalhes">Ver Detalhes</a>
            <div class="crud-actions d-flex justify-content-between mt-2">
                <button class="btn btn-warning btn-sm" 
                        onclick="abrirFormularioEdicao('${item.id}', '${entidade}')">
                    Editar
                </button>
                <button class="btn btn-danger btn-sm" 
                        onclick="deletarObra('${item.id}', '${entidade}')">
                    Excluir
                </button>
            </div>
            
        </div>
    </div>
`;
                    container.innerHTML += cardHTML;
                });
            } else {
                container.innerHTML = `<p>Erro (${response.status}) ao carregar itens de /${entidade}.</p>`;
            }
        } catch (error) {
            console.error(`Falha de conexão ou JSON inválido ao carregar /${entidade}:`, error);
            container.innerHTML = '<p>Erro: Não foi possível conectar ao servidor da API.</p>';
        }
    }
}
document.addEventListener('DOMContentLoaded', carregarHome);