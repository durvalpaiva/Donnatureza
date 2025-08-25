// Inventory control functionality
document.addEventListener('DOMContentLoaded', function() {
    let produtos = [];
    let produtosFiltrados = [];
    let movimentacoes = [];
    let currentAjusteProduto = null;

    // Load initial data
    loadAlertas();
    loadRelatorio();
    loadMovimentacoes();

    // Event listeners
    document.getElementById('btnNovaEntrada').addEventListener('click', () => openModal('modalNovaEntrada'));
    document.getElementById('btnInventario').addEventListener('click', () => openModal('modalInventario'));
    document.getElementById('buscaProduto').addEventListener('input', debounce(filtrarProdutos, 300));
    document.getElementById('filtroCategoria').addEventListener('change', filtrarProdutos);
    document.getElementById('filtroStatus').addEventListener('change', filtrarProdutos);

    // Load alerts
    async function loadAlertas() {
        try {
            const response = await apiRequest('/api/estoque/alertas');
            
            // Estoque baixo
            const alertaBaixo = document.getElementById('alertaEstoqueBaixo');
            const countBaixo = document.getElementById('countEstoqueBaixo');
            const listaBaixo = document.getElementById('produtosEstoqueBaixo');
            
            if (response.estoque_baixo.length > 0) {
                alertaBaixo.style.display = 'block';
                countBaixo.textContent = response.estoque_baixo.length;
                listaBaixo.innerHTML = response.estoque_baixo.map(p => `
                    <div class="alert-item">
                        <strong>${p.nome}</strong>
                        <span>Atual: ${p.estoque_atual} | Mín: ${p.estoque_minimo}</span>
                        <button class="btn-mini btn-primary" onclick="abrirAjuste(${p.id})">Ajustar</button>
                    </div>
                `).join('');
            }
            
            // Estoque alto
            const alertaAlto = document.getElementById('alertaEstoqueAlto');
            const countAlto = document.getElementById('countEstoqueAlto');
            const listaAlto = document.getElementById('produtosEstoqueAlto');
            
            if (response.estoque_alto.length > 0) {
                alertaAlto.style.display = 'block';
                countAlto.textContent = response.estoque_alto.length;
                listaAlto.innerHTML = response.estoque_alto.map(p => `
                    <div class="alert-item">
                        <strong>${p.nome}</strong>
                        <span>Atual: ${p.estoque_atual} | Máx: ${p.estoque_maximo}</span>
                    </div>
                `).join('');
            }
            
        } catch (error) {
            console.error('Erro ao carregar alertas:', error);
            showNotification('Erro ao carregar alertas de estoque', 'error');
        }
    }

    // Load inventory report
    async function loadRelatorio() {
        try {
            const response = await apiRequest('/api/estoque/relatorio');
            
            // Update summary
            document.getElementById('totalProdutos').textContent = response.resumo.total_produtos;
            document.getElementById('valorTotalEstoque').textContent = formatCurrency(response.resumo.total_valor_estoque);
            document.getElementById('produtosEstoqueBaixoCount').textContent = response.resumo.produtos_estoque_baixo;
            
            // Store products
            produtos = response.produtos;
            produtosFiltrados = [...produtos];
            
            // Populate category filter
            const categorias = [...new Set(produtos.map(p => p.categoria).filter(Boolean))];
            const filtroCategoria = document.getElementById('filtroCategoria');
            filtroCategoria.innerHTML = '<option value="">Todas as categorias</option>' +
                categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('');
            
            // Load products for entrada modal
            const entradaProduto = document.getElementById('entradaProduto');
            entradaProduto.innerHTML = '<option value="">Selecione um produto...</option>' +
                produtos.map(p => `<option value="${p.id}">${p.nome} (${p.codigo_barras || 'S/C'})</option>`).join('');
            
            renderProdutos();
            
        } catch (error) {
            console.error('Erro ao carregar relatório:', error);
            showNotification('Erro ao carregar dados do estoque', 'error');
        }
    }

    // Render products table
    function renderProdutos() {
        const tbody = document.querySelector('#tabelaEstoque tbody');
        
        if (produtosFiltrados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty">Nenhum produto encontrado</td></tr>';
            return;
        }
        
        tbody.innerHTML = produtosFiltrados.map(produto => {
            const statusClass = {
                'baixo': 'status-low',
                'alto': 'status-high',
                'normal': 'status-normal'
            }[produto.status];
            
            const statusText = {
                'baixo': 'Baixo',
                'alto': 'Alto',
                'normal': 'Normal'
            }[produto.status];
            
            return `
                <tr>
                    <td>
                        <div class="produto-info">
                            <strong>${produto.nome}</strong>
                            <small>${produto.codigo_barras || 'Sem código'}</small>
                        </div>
                    </td>
                    <td>${produto.categoria || 'Sem categoria'}</td>
                    <td class="text-center"><strong>${produto.estoque_atual}</strong></td>
                    <td class="text-center">${produto.estoque_minimo}/${produto.estoque_maximo}</td>
                    <td>${formatCurrency(produto.preco)}</td>
                    <td>${formatCurrency(produto.valor_total)}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td class="actions">
                        <button class="btn-mini btn-secondary" onclick="abrirAjuste(${produto.id})" title="Ajustar estoque">
                            ⚖️
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Filter products
    function filtrarProdutos() {
        const busca = document.getElementById('buscaProduto').value.toLowerCase();
        const categoria = document.getElementById('filtroCategoria').value;
        const status = document.getElementById('filtroStatus').value;
        
        produtosFiltrados = produtos.filter(produto => {
            const matchBusca = !busca || 
                produto.nome.toLowerCase().includes(busca) ||
                (produto.codigo_barras && produto.codigo_barras.includes(busca));
            
            const matchCategoria = !categoria || produto.categoria === categoria;
            const matchStatus = !status || produto.status === status;
            
            return matchBusca && matchCategoria && matchStatus;
        });
        
        renderProdutos();
    }

    // Load movements
    async function loadMovimentacoes() {
        try {
            const response = await apiRequest('/api/estoque/movimentos?limit=50');
            movimentacoes = response;
            renderMovimentacoes();
        } catch (error) {
            console.error('Erro ao carregar movimentações:', error);
        }
    }

    // Render movements table
    function renderMovimentacoes() {
        const tbody = document.querySelector('#tabelaMovimentacoes tbody');
        
        if (movimentacoes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty">Nenhuma movimentação encontrada</td></tr>';
            return;
        }
        
        tbody.innerHTML = movimentacoes.map(mov => {
            const tipoClass = {
                'entrada': 'tipo-entrada',
                'saida': 'tipo-saida',
                'venda': 'tipo-venda',
                'ajuste_positivo': 'tipo-ajuste-pos',
                'ajuste_negativo': 'tipo-ajuste-neg'
            }[mov.tipo_movimento] || '';
            
            return `
                <tr>
                    <td>${new Date(mov.created_at).toLocaleDateString('pt-BR')} ${new Date(mov.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</td>
                    <td>${mov.produto_nome}</td>
                    <td><span class="tipo-badge ${tipoClass}">${mov.tipo_movimento}</span></td>
                    <td class="text-center">${mov.tipo_movimento.includes('negativo') || mov.tipo_movimento === 'venda' || mov.tipo_movimento === 'saida' ? '-' : '+'}${mov.quantidade}</td>
                    <td class="text-center">${mov.quantidade_anterior} → ${mov.quantidade_nova}</td>
                    <td>${mov.motivo || '-'}</td>
                    <td>${mov.usuario}</td>
                </tr>
            `;
        }).join('');
    }

    // Global functions
    window.openModal = function(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    };

    window.closeModal = function(modalId) {
        document.getElementById(modalId).style.display = 'none';
        // Reset forms
        if (modalId === 'modalNovaEntrada') {
            document.getElementById('formNovaEntrada').reset();
        } else if (modalId === 'modalAjusteEstoque') {
            document.getElementById('formAjusteEstoque').reset();
            currentAjusteProduto = null;
        }
    };

    window.abrirAjuste = function(produtoId) {
        const produto = produtos.find(p => p.id === produtoId);
        if (!produto) return;
        
        currentAjusteProduto = produto;
        
        // Fill modal
        document.getElementById('ajusteProdutoInfo').innerHTML = `
            <div class="produto-card">
                <h4>${produto.nome}</h4>
                <p>Código: ${produto.codigo_barras || 'N/A'}</p>
                <p>Categoria: ${produto.categoria || 'Sem categoria'}</p>
            </div>
        `;
        
        document.getElementById('ajusteQuantidadeAtual').textContent = produto.estoque_atual;
        document.getElementById('ajusteQuantidadeNova').value = produto.estoque_atual;
        
        openModal('modalAjusteEstoque');
    };

    window.salvarEntrada = async function() {
        const form = document.getElementById('formNovaEntrada');
        const formData = new FormData(form);
        
        const data = {
            produto_id: parseInt(document.getElementById('entradaProduto').value),
            quantidade: parseInt(document.getElementById('entradaQuantidade').value),
            preco_unitario: parseFloat(document.getElementById('entradaPreco').value) || null,
            motivo: document.getElementById('entradaMotivo').value,
            documento: document.getElementById('entradaDocumento').value || null
        };
        
        if (!data.produto_id || !data.quantidade) {
            showNotification('Preencha todos os campos obrigatórios', 'error');
            return;
        }
        
        try {
            await apiRequest('/api/estoque/entrada', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            showNotification('Entrada registrada com sucesso!', 'success');
            closeModal('modalNovaEntrada');
            
            // Reload data
            loadAlertas();
            loadRelatorio();
            loadMovimentacoes();
            
        } catch (error) {
            console.error('Erro ao salvar entrada:', error);
            showNotification('Erro ao registrar entrada', 'error');
        }
    };

    window.salvarAjuste = async function() {
        if (!currentAjusteProduto) return;
        
        const quantidadeNova = parseInt(document.getElementById('ajusteQuantidadeNova').value);
        const motivo = document.getElementById('ajusteMotivo').value;
        
        if (quantidadeNova < 0) {
            showNotification('Quantidade não pode ser negativa', 'error');
            return;
        }
        
        try {
            await apiRequest('/api/estoque/ajuste', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    produto_id: currentAjusteProduto.id,
                    quantidade_nova: quantidadeNova,
                    motivo: motivo
                })
            });
            
            showNotification('Ajuste realizado com sucesso!', 'success');
            closeModal('modalAjusteEstoque');
            
            // Reload data
            loadAlertas();
            loadRelatorio();
            loadMovimentacoes();
            
        } catch (error) {
            console.error('Erro ao salvar ajuste:', error);
            showNotification('Erro ao realizar ajuste', 'error');
        }
    };

    window.iniciarInventario = function() {
        // Redirect to inventory audit page
        window.location.href = '/inventario';
    };

    console.log('Inventory control initialized');
});