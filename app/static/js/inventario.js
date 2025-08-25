// Physical Inventory functionality
document.addEventListener('DOMContentLoaded', function() {
    let produtos = [];
    let inventarioAtivo = false;
    let produtoAtual = null;
    let contagens = new Map(); // productId -> {sistema, fisica, diferenca, status}
    let inventoryBarcodeScanner = null;
    let inventoryBarcodeStream = null;

    // Load initial data
    loadProdutos();

    // Event listeners
    document.getElementById('btnIniciarInventario').addEventListener('click', iniciarInventario);
    document.getElementById('btnFinalizarInventario').addEventListener('click', () => openModal('modalFinalizarInventario'));
    document.getElementById('codigoInput').addEventListener('input', buscarProdutoPorCodigo);
    document.getElementById('contagemFisica').addEventListener('input', calcularDiferenca);
    document.getElementById('filtroStatus').addEventListener('change', filtrarProdutos);
    document.getElementById('buscarProduto').addEventListener('input', debounce(filtrarProdutos, 300));

    // Load products
    async function loadProdutos() {
        try {
            const response = await apiRequest('/api/produtos');
            produtos = response.filter(p => p.ativo);
            
            // Initialize counting map
            produtos.forEach(produto => {
                contagens.set(produto.id, {
                    produto: produto,
                    sistema: produto.estoque,
                    fisica: null,
                    diferenca: null,
                    status: 'pendente'
                });
            });
            
            updateStatus();
            renderProdutos();
            
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            showNotification('Erro ao carregar produtos', 'error');
        }
    }

    // Start inventory
    function iniciarInventario() {
        inventarioAtivo = true;
        
        document.getElementById('btnIniciarInventario').style.display = 'none';
        document.getElementById('btnFinalizarInventario').style.display = 'inline-block';
        document.getElementById('inventarioScanner').style.display = 'block';
        
        // Focus on input
        document.getElementById('codigoInput').focus();
        
        updateStatus();
        showNotification('Inventário iniciado! Escaneie ou digite os códigos dos produtos.', 'success');
    }

    // Search product by code
    function buscarProdutoPorCodigo() {
        const codigo = document.getElementById('codigoInput').value.trim();
        
        if (codigo.length < 3) {
            produtoAtual = null;
            document.getElementById('produtoAtual').style.display = 'none';
            return;
        }
        
        // Find product by barcode or name
        const produto = produtos.find(p => 
            (p.codigo_barras && p.codigo_barras.includes(codigo)) ||
            p.nome.toLowerCase().includes(codigo.toLowerCase())
        );
        
        if (produto) {
            produtoAtual = produto;
            mostrarProdutoAtual(produto);
        } else {
            produtoAtual = null;
            document.getElementById('produtoAtual').style.display = 'none';
            showNotification('Produto não encontrado', 'warning');
        }
    }

    // Show current product
    function mostrarProdutoAtual(produto) {
        const contagem = contagens.get(produto.id);
        
        document.getElementById('produtoNome').textContent = produto.nome;
        document.getElementById('produtoCodigo').textContent = produto.codigo_barras || 'Sem código';
        document.getElementById('estoqueSistema').textContent = contagem.sistema;
        document.getElementById('contagemFisica').value = contagem.fisica || '';
        document.getElementById('contagemFisica').focus();
        
        calcularDiferenca();
        document.getElementById('produtoAtual').style.display = 'block';
    }

    // Calculate difference
    function calcularDiferenca() {
        if (!produtoAtual) return;
        
        const contagem = contagens.get(produtoAtual.id);
        const fisica = parseInt(document.getElementById('contagemFisica').value) || 0;
        const diferenca = fisica - contagem.sistema;
        
        const diferencaElement = document.getElementById('diferenca');
        diferencaElement.textContent = diferenca > 0 ? `+${diferenca}` : diferenca.toString();
        
        // Color coding
        diferencaElement.className = 'diferenca';
        if (diferenca > 0) {
            diferencaElement.classList.add('diferenca-positiva');
        } else if (diferenca < 0) {
            diferencaElement.classList.add('diferenca-negativa');
        } else {
            diferencaElement.classList.add('diferenca-zero');
        }
    }

    // Save count
    window.salvarContagem = function() {
        if (!produtoAtual) return;
        
        const fisica = parseInt(document.getElementById('contagemFisica').value);
        if (isNaN(fisica) || fisica < 0) {
            showNotification('Digite uma quantidade válida', 'error');
            return;
        }
        
        const contagem = contagens.get(produtoAtual.id);
        contagem.fisica = fisica;
        contagem.diferenca = fisica - contagem.sistema;
        contagem.status = contagem.diferenca === 0 ? 'contado' : 'diferenca';
        
        contagens.set(produtoAtual.id, contagem);
        
        showNotification(`Contagem salva: ${produtoAtual.nome}`, 'success');
        
        // Clear and continue
        limparScanner();
        updateStatus();
        renderProdutos();
        updateResumo();
    };

    // Skip product
    window.pularProduto = function() {
        limparScanner();
        showNotification('Produto pulado', 'info');
    };

    // Clear scanner
    window.limparScanner = function() {
        document.getElementById('codigoInput').value = '';
        document.getElementById('produtoAtual').style.display = 'none';
        document.getElementById('codigoInput').focus();
        produtoAtual = null;
    };

    // Update status
    function updateStatus() {
        const total = produtos.length;
        const contados = Array.from(contagens.values()).filter(c => c.status !== 'pendente').length;
        const pendentes = total - contados;
        const diferencas = Array.from(contagens.values()).filter(c => c.status === 'diferenca').length;
        
        document.getElementById('totalProdutos').textContent = total;
        document.getElementById('produtosContados').textContent = contados;
        document.getElementById('produtosPendentes').textContent = pendentes;
        document.getElementById('diferencasEncontradas').textContent = diferencas;
        
        const progressPercent = total > 0 ? Math.round((contados / total) * 100) : 0;
        document.getElementById('progressPercent').textContent = progressPercent;
        document.getElementById('progressBar').style.width = progressPercent + '%';
    }

    // Render products table
    function renderProdutos() {
        const tbody = document.querySelector('#tabelaInventario tbody');
        
        if (!inventarioAtivo) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">Aguardando início do inventário...</td></tr>';
            return;
        }
        
        const filtroStatus = document.getElementById('filtroStatus').value;
        const busca = document.getElementById('buscarProduto').value.toLowerCase();
        
        let produtosFiltrados = Array.from(contagens.values());
        
        if (filtroStatus) {
            produtosFiltrados = produtosFiltrados.filter(c => c.status === filtroStatus);
        }
        
        if (busca) {
            produtosFiltrados = produtosFiltrados.filter(c => 
                c.produto.nome.toLowerCase().includes(busca) ||
                (c.produto.codigo_barras && c.produto.codigo_barras.includes(busca))
            );
        }
        
        if (produtosFiltrados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty">Nenhum produto encontrado</td></tr>';
            return;
        }
        
        tbody.innerHTML = produtosFiltrados.map(contagem => {
            const statusClass = {
                'pendente': 'status-warning',
                'contado': 'status-success',
                'diferenca': 'status-error'
            }[contagem.status];
            
            const statusText = {
                'pendente': 'Pendente',
                'contado': 'Contado',
                'diferenca': 'Com Diferença'
            }[contagem.status];
            
            const diferencaText = contagem.diferenca !== null 
                ? (contagem.diferenca > 0 ? `+${contagem.diferenca}` : contagem.diferenca.toString())
                : '-';
            
            const diferencaClass = contagem.diferenca > 0 ? 'diferenca-positiva' : 
                                 contagem.diferenca < 0 ? 'diferenca-negativa' : 'diferenca-zero';
            
            return `
                <tr>
                    <td>
                        <div class="produto-info">
                            <strong>${contagem.produto.nome}</strong>
                            <small>${contagem.produto.categoria || 'Sem categoria'}</small>
                        </div>
                    </td>
                    <td>${contagem.produto.codigo_barras || 'S/C'}</td>
                    <td class="text-center">${contagem.sistema}</td>
                    <td class="text-center">${contagem.fisica !== null ? contagem.fisica : '-'}</td>
                    <td class="text-center"><span class="${diferencaClass}">${diferencaText}</span></td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td class="actions">
                        <button class="btn-mini btn-secondary" onclick="editarContagem(${contagem.produto.id})" title="Editar contagem">
                            ✏️
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Edit count
    window.editarContagem = function(produtoId) {
        const produto = produtos.find(p => p.id === produtoId);
        if (produto) {
            document.getElementById('codigoInput').value = produto.codigo_barras || produto.nome;
            buscarProdutoPorCodigo();
        }
    };

    // Filter products
    function filtrarProdutos() {
        renderProdutos();
    }

    // Update summary
    function updateResumo() {
        if (!inventarioAtivo) return;
        
        const contagensArray = Array.from(contagens.values()).filter(c => c.status !== 'pendente');
        
        if (contagensArray.length === 0) {
            document.getElementById('resumoDiferencas').style.display = 'none';
            return;
        }
        
        const sobras = contagensArray.filter(c => c.diferenca > 0);
        const faltas = contagensArray.filter(c => c.diferenca < 0);
        const ajustes = contagensArray.filter(c => c.diferenca !== 0);
        
        const sobrasQuantidade = sobras.reduce((acc, c) => acc + c.diferenca, 0);
        const faltasQuantidade = faltas.reduce((acc, c) => acc + Math.abs(c.diferenca), 0);
        
        document.getElementById('sobrasProdutos').textContent = `${sobras.length} produtos`;
        document.getElementById('sobrasQuantidade').textContent = `+${sobrasQuantidade} unidades`;
        document.getElementById('faltasProdutos').textContent = `${faltas.length} produtos`;
        document.getElementById('faltasQuantidade').textContent = `-${faltasQuantidade} unidades`;
        document.getElementById('totalAjustes').textContent = `${ajustes.length} produtos`;
        document.getElementById('totalMovimentacao').textContent = `${ajustes.length} movimentações`;
        
        document.getElementById('resumoDiferencas').style.display = 'block';
    }

    // Finalize inventory
    window.confirmarFinalizacao = async function() {
        const ajustesNecessarios = Array.from(contagens.values()).filter(c => c.diferenca !== 0);
        
        if (ajustesNecessarios.length === 0) {
            showNotification('Nenhum ajuste necessário', 'info');
            closeModal('modalFinalizarInventario');
            return;
        }
        
        const observacoes = document.getElementById('observacoesFinalizacao').value;
        
        try {
            for (const contagem of ajustesNecessarios) {
                await apiRequest('/api/estoque/ajuste', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        produto_id: contagem.produto.id,
                        quantidade_nova: contagem.fisica,
                        motivo: `Inventário físico - ${observacoes || 'Ajuste de inventário'}`
                    })
                });
            }
            
            showNotification(`Inventário finalizado! ${ajustesNecessarios.length} ajustes realizados.`, 'success');
            closeModal('modalFinalizarInventario');
            
            // Reset inventory
            setTimeout(() => {
                window.location.href = '/estoque';
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao finalizar inventário:', error);
            showNotification('Erro ao finalizar inventário', 'error');
        }
    };

    // Barcode scanner functions
    window.openInventoryBarcode = function() {
        const modal = document.getElementById('inventoryBarcodeModal');
        const video = document.getElementById('inventoryBarcodeVideo');
        const scanResult = document.getElementById('inventoryScanResult');
        
        if (modal) {
            modal.style.display = 'flex';
            scanResult.style.display = 'none';
            
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                })
                .then(function(stream) {
                    inventoryBarcodeStream = stream;
                    video.srcObject = stream;
                    
                    if (typeof ZXing !== 'undefined') {
                        initInventoryBarcodeScanner();
                    }
                })
                .catch(function(err) {
                    console.error('Camera access denied:', err);
                    alert('Erro ao acessar a câmera. Verifique as permissões.');
                    closeInventoryBarcode();
                });
            } else {
                alert('Scanner não suportado neste dispositivo');
                closeInventoryBarcode();
            }
        }
    };

    window.closeInventoryBarcode = function() {
        const modal = document.getElementById('inventoryBarcodeModal');
        
        if (inventoryBarcodeStream) {
            inventoryBarcodeStream.getTracks().forEach(track => track.stop());
            inventoryBarcodeStream = null;
        }
        
        if (inventoryBarcodeScanner) {
            inventoryBarcodeScanner = null;
        }
        
        modal.style.display = 'none';
    };

    function initInventoryBarcodeScanner() {
        try {
            const codeReader = new ZXing.BrowserMultiFormatReader();
            inventoryBarcodeScanner = codeReader;
            
            codeReader.decodeFromVideoDevice(null, 'inventoryBarcodeVideo', (result, err) => {
                if (result) {
                    const code = result.text;
                    document.getElementById('inventoryScanResult').textContent = `Código: ${code}`;
                    document.getElementById('inventoryScanResult').style.display = 'block';
                    
                    // Set the code in input and search
                    document.getElementById('codigoInput').value = code;
                    buscarProdutoPorCodigo();
                    
                    // Close scanner after successful scan
                    setTimeout(() => {
                        closeInventoryBarcode();
                    }, 1000);
                }
            });
        } catch (err) {
            console.error('Erro ao inicializar scanner:', err);
            alert('Erro ao inicializar o scanner');
            closeInventoryBarcode();
        }
    }

    // Modal functions
    window.openModal = function(modalId) {
        // Update final summary
        if (modalId === 'modalFinalizarInventario') {
            const contados = Array.from(contagens.values()).filter(c => c.status !== 'pendente').length;
            const diferencas = Array.from(contagens.values()).filter(c => c.status === 'diferenca').length;
            const ajustes = Array.from(contagens.values()).filter(c => c.diferenca !== 0).length;
            
            document.getElementById('finalContados').textContent = contados;
            document.getElementById('finalDiferencas').textContent = diferencas;
            document.getElementById('finalAjustes').textContent = ajustes;
        }
        
        document.getElementById(modalId).style.display = 'flex';
    };

    window.closeModal = function(modalId) {
        document.getElementById(modalId).style.display = 'none';
    };

    // Update status and resume initially
    setInterval(updateResumo, 5000); // Update every 5 seconds

    console.log('Physical inventory initialized');
});