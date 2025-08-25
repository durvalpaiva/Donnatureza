// Barcode Scanner for Sales
let salesBarcodeScanner = null;
let salesBarcodeStream = null;

window.openSalesBarcode = function() {
    console.log('Opening sales barcode scanner...');
    const modal = document.getElementById('salesBarcodeModal');
    const video = document.getElementById('salesBarcodeVideo');
    const scanResult = document.getElementById('salesScanResult');
    
    if (modal) {
        modal.style.display = 'flex';
        scanResult.style.display = 'none';
        
        // Request camera access
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })
            .then(function(stream) {
                salesBarcodeStream = stream;
                video.srcObject = stream;
                
                // Initialize barcode scanner
                if (typeof ZXing !== 'undefined') {
                    initSalesBarcodeScanner();
                } else {
                    initSalesSimpleScanner();
                }
                
                console.log('Sales barcode scanner started');
            })
            .catch(function(err) {
                console.error('Camera access denied:', err);
                alert('Erro ao acessar a câmera. Verifique as permissões.');
                closeSalesBarcode();
            });
        } else {
            alert('Scanner não suportado neste dispositivo');
            closeSalesBarcode();
        }
    }
};

function initSalesBarcodeScanner() {
    try {
        const codeReader = new ZXing.BrowserMultiFormatReader();
        const video = document.getElementById('salesBarcodeVideo');
        
        codeReader.decodeFromVideoDevice(null, video, (result, err) => {
            if (result) {
                const code = result.getText();
                console.log('Sales barcode detected:', code);
                handleSalesBarcodeResult(code);
            }
            if (err && !(err instanceof ZXing.NotFoundException)) {
                console.error('Sales barcode scan error:', err);
            }
        });
        
        salesBarcodeScanner = codeReader;
    } catch (error) {
        console.error('ZXing scanner error:', error);
        initSalesSimpleScanner();
    }
}

function initSalesSimpleScanner() {
    const scanResult = document.getElementById('salesScanResult');
    scanResult.innerHTML = `
        <div style="margin-top: 1rem;">
            <p>📱 Scanner automático não disponível</p>
            <input type="text" id="salesManualBarcode" placeholder="Digite o código do produto" style="width: 100%; padding: 0.5rem; margin: 0.5rem 0;">
            <button onclick="handleSalesManualBarcode()" class="btn-primary" style="width: 100%;">Buscar Produto</button>
        </div>
    `;
    scanResult.style.display = 'block';
}

window.handleSalesManualBarcode = function() {
    const input = document.getElementById('salesManualBarcode');
    if (input && input.value.trim()) {
        handleSalesBarcodeResult(input.value.trim());
    }
};

function handleSalesBarcodeResult(code) {
    console.log('Sales barcode result:', code);
    
    // Update search field and trigger search
    const buscaProduto = document.getElementById('buscaProduto');
    if (buscaProduto) {
        buscaProduto.value = code;
        
        // Visual feedback
        const scanResult = document.getElementById('salesScanResult');
        scanResult.innerHTML = `<span style="color: green;">✅ Buscando produto: ${code}</span>`;
        scanResult.style.display = 'block';
        
        // Trigger search
        setTimeout(() => {
            // Simulate input event to trigger search
            const event = new Event('input', { bubbles: true });
            buscaProduto.dispatchEvent(event);
            
            // Close scanner after delay
            setTimeout(() => {
                closeSalesBarcode();
            }, 1000);
        }, 500);
    }
}

window.closeSalesBarcode = function() {
    console.log('Closing sales barcode scanner...');
    const modal = document.getElementById('salesBarcodeModal');
    
    // Stop camera stream
    if (salesBarcodeStream) {
        salesBarcodeStream.getTracks().forEach(track => track.stop());
        salesBarcodeStream = null;
    }
    
    // Stop barcode scanner
    if (salesBarcodeScanner && typeof salesBarcodeScanner.reset === 'function') {
        salesBarcodeScanner.reset();
        salesBarcodeScanner = null;
    }
    
    if (modal) {
        modal.style.display = 'none';
    }
};

// Vendas page functionality
document.addEventListener('DOMContentLoaded', function() {
    const buscaProduto = document.getElementById('buscaProduto');
    const resultadosBusca = document.getElementById('resultadosBusca');
    const itensCarrinho = document.getElementById('itensCarrinho');
    const subtotalEl = document.getElementById('subtotal');
    const descontoInput = document.getElementById('desconto');
    const totalEl = document.getElementById('total');
    const cpfCliente = document.getElementById('cpfCliente');
    const formaPagamento = document.getElementById('formaPagamento');
    const btnFinalizarVenda = document.getElementById('btnFinalizarVenda');
    const btnLimparVenda = document.getElementById('btnLimparVenda');
    const vendasRecentes = document.getElementById('vendasRecentes');

    let carrinho = [];
    let produtos = [];

    // Load initial data
    async function loadVendasRecentes() {
        try {
            const response = await apiRequest('/api/vendas?limit=10');
            renderVendasRecentes(response);
        } catch (error) {
            console.error('Erro ao carregar vendas recentes:', error);
            vendasRecentes.innerHTML = '<p class="text-center">Erro ao carregar vendas</p>';
        }
    }

    // Render recent sales
    function renderVendasRecentes(vendas) {
        if (vendas.length === 0) {
            vendasRecentes.innerHTML = '<p class="text-center">Nenhuma venda encontrada</p>';
            return;
        }

        vendasRecentes.innerHTML = vendas.map(venda => `
            <div class="venda-item">
                <div class="venda-info">
                    <strong>#${venda.id}</strong> - ${formatDate(venda.created_at)}
                    <br>
                    <small>${venda.forma_pagamento.replace('_', ' ').toUpperCase()}</small>
                </div>
                <div class="venda-total">
                    ${formatCurrency(venda.total)}
                </div>
                <button class="btn-cupom" onclick="gerarCupom(${venda.id})">📄</button>
            </div>
        `).join('');
    }

    // Search products
    const debouncedSearch = debounce(async function(term) {
        if (term.length < 2) {
            resultadosBusca.style.display = 'none';
            return;
        }

        try {
            const response = await apiRequest(`/api/produtos/buscar/${encodeURIComponent(term)}`);
            renderResultadosBusca(response);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            resultadosBusca.style.display = 'none';
        }
    }, 300);

    // Render search results
    function renderResultadosBusca(produtos) {
        if (produtos.length === 0) {
            resultadosBusca.innerHTML = '<div class="resultado-item">Nenhum produto encontrado</div>';
            resultadosBusca.style.display = 'block';
            return;
        }

        resultadosBusca.innerHTML = produtos.map(produto => `
            <div class="resultado-item" onclick="adicionarAoCarrinho(${produto.id}, '${produto.nome}', ${produto.preco}, ${produto.estoque})">
                <div>
                    <strong>${produto.nome}</strong>
                    <br>
                    <small>Estoque: ${produto.estoque} | ${formatCurrency(produto.preco)}</small>
                </div>
            </div>
        `).join('');
        
        resultadosBusca.style.display = 'block';
    }

    // Add to cart
    window.adicionarAoCarrinho = function(id, nome, preco, estoque) {
        const itemExistente = carrinho.find(item => item.id === id);
        
        if (itemExistente) {
            if (itemExistente.quantidade >= estoque) {
                showNotification('Estoque insuficiente!', 'warning');
                return;
            }
            itemExistente.quantidade++;
        } else {
            if (estoque <= 0) {
                showNotification('Produto sem estoque!', 'warning');
                return;
            }
            carrinho.push({
                id: id,
                nome: nome,
                preco: preco,
                quantidade: 1,
                estoque: estoque
            });
        }

        renderCarrinho();
        calcularTotais();
        buscaProduto.value = '';
        resultadosBusca.style.display = 'none';
        showNotification(`${nome} adicionado ao carrinho!`);
    };

    // Remove from cart
    function removerDoCarrinho(id) {
        carrinho = carrinho.filter(item => item.id !== id);
        renderCarrinho();
        calcularTotais();
    }

    // Update quantity
    function atualizarQuantidade(id, novaQuantidade) {
        const item = carrinho.find(item => item.id === id);
        if (!item) return;

        if (novaQuantidade <= 0) {
            removerDoCarrinho(id);
            return;
        }

        if (novaQuantidade > item.estoque) {
            showNotification('Quantidade maior que o estoque!', 'warning');
            return;
        }

        item.quantidade = novaQuantidade;
        renderCarrinho();
        calcularTotais();
    }

    // Render cart
    function renderCarrinho() {
        if (carrinho.length === 0) {
            itensCarrinho.innerHTML = '<p class="carrinho-vazio">Nenhum item adicionado</p>';
            return;
        }

        itensCarrinho.innerHTML = carrinho.map(item => `
            <div class="item-carrinho">
                <div class="item-info">
                    <strong>${item.nome}</strong>
                    <br>
                    <small>${formatCurrency(item.preco)} cada</small>
                </div>
                <div class="item-controls">
                    <button onclick="atualizarQuantidade(${item.id}, ${item.quantidade - 1})">-</button>
                    <input type="number" value="${item.quantidade}" min="1" max="${item.estoque}" 
                           onchange="atualizarQuantidade(${item.id}, parseInt(this.value))">
                    <button onclick="atualizarQuantidade(${item.id}, ${item.quantidade + 1})">+</button>
                </div>
                <div class="item-total">
                    ${formatCurrency(item.preco * item.quantidade)}
                </div>
                <button class="btn-remove" onclick="removerDoCarrinho(${item.id})">🗑️</button>
            </div>
        `).join('');
    }

    // Calculate totals
    function calcularTotais() {
        const subtotal = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
        const desconto = parseFloat(descontoInput.value) || 0;
        const total = Math.max(0, subtotal - desconto);

        subtotalEl.textContent = subtotal.toFixed(2).replace('.', ',');
        totalEl.textContent = total.toFixed(2).replace('.', ',');

        // Enable/disable finalize button
        btnFinalizarVenda.disabled = carrinho.length === 0 || !formaPagamento.value;
    }

    // Finalize sale
    async function finalizarVenda() {
        if (carrinho.length === 0) {
            showNotification('Adicione produtos ao carrinho!', 'warning');
            return;
        }

        if (!formaPagamento.value) {
            showNotification('Selecione a forma de pagamento!', 'warning');
            return;
        }

        const venda = {
            itens: carrinho.map(item => ({
                produto_id: item.id,
                quantidade: item.quantidade,
                preco_unitario: item.preco
            })),
            desconto: parseFloat(descontoInput.value) || 0,
            cpf_cliente: cpfCliente.value || null,
            forma_pagamento: formaPagamento.value
        };

        try {
            setLoading(btnFinalizarVenda, true);
            
            const response = await apiRequest('/api/vendas', {
                method: 'POST',
                body: JSON.stringify(venda)
            });

            showNotification(`Venda #${response.id} finalizada com sucesso!`);
            
            // Clear cart
            carrinho = [];
            renderCarrinho();
            calcularTotais();
            cpfCliente.value = '';
            formaPagamento.value = '';
            descontoInput.value = '0';
            
            // Reload recent sales
            loadVendasRecentes();
            
            // Ask if wants to print receipt
            if (confirm('Deseja imprimir o cupom?')) {
                await gerarCupom(response.id);
            }
            
        } catch (error) {
            console.error('Erro ao finalizar venda:', error);
        } finally {
            setLoading(btnFinalizarVenda, false);
        }
    }

    // Generate receipt
    window.gerarCupom = async function(vendaId) {
        try {
            const response = await apiRequest(`/api/vendas/${vendaId}/cupom`);
            
            // Open print window
            const printWindow = window.open('', '_blank');
            printWindow.document.write(response.cupom_html);
            printWindow.document.close();
            printWindow.print();
            
        } catch (error) {
            console.error('Erro ao gerar cupom:', error);
        }
    };

    // Clear sale
    function limparVenda() {
        if (carrinho.length === 0) return;
        
        if (confirm('Tem certeza que deseja limpar a venda?')) {
            carrinho = [];
            renderCarrinho();
            calcularTotais();
            cpfCliente.value = '';
            formaPagamento.value = '';
            descontoInput.value = '0';
            buscaProduto.focus();
        }
    }

    // Event listeners
    buscaProduto.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });

    buscaProduto.addEventListener('blur', () => {
        // Delay hiding results to allow click
        setTimeout(() => {
            resultadosBusca.style.display = 'none';
        }, 200);
    });

    descontoInput.addEventListener('input', calcularTotais);
    formaPagamento.addEventListener('change', calcularTotais);
    btnFinalizarVenda.addEventListener('click', finalizarVenda);
    btnLimparVenda.addEventListener('click', limparVenda);

    // Global functions
    window.removerDoCarrinho = removerDoCarrinho;
    window.atualizarQuantidade = atualizarQuantidade;

    // Load products from catalog if available
    function loadFromCatalog() {
        const catalogCart = localStorage.getItem('catalogSalesCart');
        if (catalogCart) {
            try {
                const products = JSON.parse(catalogCart);
                products.forEach(product => {
                    const existingItem = carrinho.find(item => item.id === product.id);
                    if (existingItem) {
                        existingItem.quantidade += product.quantidade;
                    } else {
                        carrinho.push(product);
                    }
                });
                
                if (products.length > 0) {
                    renderCarrinho();
                    calcularTotais();
                    showNotification(`${products.length} produto(s) adicionado(s) do catálogo!`, 'success');
                    
                    // Clear catalog cart
                    localStorage.removeItem('catalogSalesCart');
                }
            } catch (error) {
                console.error('Erro ao carregar produtos do catálogo:', error);
                localStorage.removeItem('catalogSalesCart');
            }
        }
    }

    // Initialize
    loadVendasRecentes();
    loadFromCatalog(); // Load products from catalog first
    calcularTotais();
    buscaProduto.focus();

    // Add CSS for vendas specific styles
    const vendasStyles = `
        .venda-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            border: 1px solid var(--border);
            border-radius: var(--border-radius);
            margin-bottom: 0.5rem;
            background: var(--surface);
        }
        
        .venda-total {
            font-weight: bold;
            color: var(--primary-color);
        }
        
        .btn-cupom {
            background: var(--secondary-color);
            color: white;
            border: none;
            padding: 0.5rem;
            border-radius: var(--border-radius);
            cursor: pointer;
        }
        
        .item-carrinho {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr auto;
            gap: 1rem;
            align-items: center;
            padding: 0.75rem;
            border: 1px solid var(--border);
            border-radius: var(--border-radius);
            margin-bottom: 0.5rem;
            background: var(--surface);
        }
        
        .item-controls {
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }
        
        .item-controls button {
            width: 30px;
            height: 30px;
            border: 1px solid var(--border);
            background: var(--background);
            border-radius: 4px;
            cursor: pointer;
        }
        
        .item-controls input {
            width: 60px;
            text-align: center;
            padding: 0.25rem;
            border: 1px solid var(--border);
            border-radius: 4px;
        }
        
        .item-total {
            text-align: right;
            font-weight: bold;
        }
        
        .btn-remove {
            background: var(--error);
            color: white;
            border: none;
            padding: 0.5rem;
            border-radius: var(--border-radius);
            cursor: pointer;
        }
        
        /* Sales Search Styles */
        .search-container {
            display: flex;
            gap: 0.5rem;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .search-container input {
            flex: 1;
            padding: 1rem;
            font-size: 1.1rem;
            border: 2px solid var(--border);
            border-radius: var(--border-radius);
        }
        
        .btn-scan {
            background: var(--accent-color);
            color: white;
            border: none;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
            transition: var(--transition);
            white-space: nowrap;
        }
        
        .btn-scan:hover {
            background: var(--accent-hover);
            transform: translateY(-1px);
            box-shadow: var(--shadow-hover);
        }
        
        .search-help {
            background: rgba(45, 110, 62, 0.1);
            padding: 0.75rem 1rem;
            border-radius: var(--border-radius);
            margin-bottom: 1rem;
            border-left: 4px solid var(--primary-color);
        }
        
        .search-help p {
            margin: 0;
            color: var(--primary-color);
            font-size: 0.9rem;
        }
        
        /* Scan line animation */
        .scan-line {
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, #ff0000, transparent);
            transform: translateY(-50%);
            animation: scanLine 2s ease-in-out infinite;
        }
        
        @keyframes scanLine {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }
        
        .scan-instructions {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            color: white;
            background: rgba(0, 0, 0, 0.7);
            padding: 1rem;
            border-radius: var(--border-radius);
            max-width: 90%;
        }
        
        .scan-instructions p {
            margin: 0.25rem 0;
        }
        
        .scan-result {
            font-weight: bold;
            padding: 0.5rem;
            border-radius: var(--border-radius);
            background: rgba(255, 255, 255, 0.9);
            color: var(--text-primary);
        }
        
        @media (max-width: 768px) {
            .item-carrinho {
                grid-template-columns: 1fr;
                gap: 0.5rem;
            }
            
            .search-container {
                flex-direction: column;
            }
            
            .btn-scan {
                width: 100%;
                justify-self: stretch;
            }
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = vendasStyles;
    document.head.appendChild(styleSheet);
});