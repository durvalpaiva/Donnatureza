// Relatórios page functionality
document.addEventListener('DOMContentLoaded', function() {
    const dataInicio = document.getElementById('dataInicio');
    const dataFim = document.getElementById('dataFim');
    const btnFiltrar = document.getElementById('btnFiltrar');
    const totalHoje = document.getElementById('totalHoje');
    const quantidadeHoje = document.getElementById('quantidadeHoje');
    const estoqueBaixo = document.getElementById('estoqueBaixo');
    const totalPeriodo = document.getElementById('totalPeriodo');
    const quantidadePeriodo = document.getElementById('quantidadePeriodo');
    const ticketMedio = document.getElementById('ticketMedio');
    const tabelaVendas = document.getElementById('tabelaVendas').querySelector('tbody');

    let chartProdutos = null;
    let chartPagamentos = null;

    // Set default dates
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    dataInicio.value = primeiroDiaMes.toISOString().split('T')[0];
    dataFim.value = hoje.toISOString().split('T')[0];

    // Load today's sales
    async function loadVendasHoje() {
        try {
            const response = await apiRequest('/api/relatorios/vendas-hoje');
            totalHoje.textContent = response.total_vendas.toFixed(2).replace('.', ',');
            quantidadeHoje.textContent = response.quantidade_vendas;
        } catch (error) {
            console.error('Erro ao carregar vendas de hoje:', error);
            totalHoje.textContent = '0,00';
            quantidadeHoje.textContent = '0';
        }
    }

    // Load low stock products
    async function loadEstoqueBaixo() {
        try {
            const response = await apiRequest('/api/estoque/alertas');
            const produtosBaixoEstoque = response.estoque_baixo || [];
            
            if (produtosBaixoEstoque.length === 0) {
                estoqueBaixo.innerHTML = '<p class="status-success">✓ Todos os produtos com estoque adequado</p>';
            } else {
                estoqueBaixo.innerHTML = produtosBaixoEstoque.map(produto => `
                    <div class="estoque-item ${produto.estoque_atual === 0 ? 'estoque-zero' : 'estoque-baixo'}">
                        <span>${produto.nome}</span>
                        <span class="badge ${produto.estoque_atual === 0 ? 'badge-error' : 'badge-warning'}">
                            ${produto.estoque_atual}
                        </span>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Erro ao carregar estoque baixo:', error);
            estoqueBaixo.innerHTML = '<p class="status-error">Erro ao carregar dados</p>';
        }
    }

    // Load period report
    async function loadRelatorioPeriodo() {
        const inicio = dataInicio.value;
        const fim = dataFim.value;
        
        if (!inicio || !fim) {
            showNotification('Selecione as datas de início e fim', 'warning');
            return;
        }

        try {
            setLoading(btnFiltrar, true);
            
            const params = new URLSearchParams({
                data_inicio: inicio,
                data_fim: fim
            });
            
            const response = await apiRequest(`/api/relatorios/vendas-periodo?${params}`);
            
            totalPeriodo.textContent = response.total_vendas.toFixed(2).replace('.', ',');
            quantidadePeriodo.textContent = response.quantidade_vendas;
            ticketMedio.textContent = response.ticket_medio.toFixed(2).replace('.', ',');
            
            renderTabelaVendas(response.vendas);
            
        } catch (error) {
            console.error('Erro ao carregar relatório do período:', error);
        } finally {
            setLoading(btnFiltrar, false);
        }
    }

    // Render sales table
    function renderTabelaVendas(vendas) {
        if (vendas.length === 0) {
            tabelaVendas.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma venda encontrada no período</td></tr>';
            return;
        }

        tabelaVendas.innerHTML = vendas.map(venda => `
            <tr>
                <td>#${venda.id}</td>
                <td>${formatDate(venda.created_at)}</td>
                <td>${formatCurrency(venda.total)}</td>
                <td>${venda.forma_pagamento.replace('_', ' ').toUpperCase()}</td>
                <td>${venda.cpf_cliente || '-'}</td>
                <td>
                    <button class="btn-cupom" onclick="gerarCupom(${venda.id})" title="Cupom">📄</button>
                </td>
            </tr>
        `).join('');
    }

    // Load most sold products chart
    async function loadChartProdutos() {
        try {
            const response = await apiRequest('/api/relatorios/produtos-mais-vendidos?limit=5');
            
            if (response.length === 0) {
                document.querySelector('#chartProdutos').parentElement.innerHTML = 
                    '<h3>Produtos Mais Vendidos</h3><p class="text-center">Nenhum dado disponível</p>';
                return;
            }

            const ctx = document.getElementById('chartProdutos').getContext('2d');
            
            if (chartProdutos) {
                chartProdutos.destroy();
            }
            
            chartProdutos = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: response.map(item => item.produto),
                    datasets: [{
                        label: 'Quantidade Vendida',
                        data: response.map(item => item.quantidade_vendida),
                        backgroundColor: 'rgba(45, 110, 62, 0.8)',
                        borderColor: 'rgba(45, 110, 62, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao carregar gráfico de produtos:', error);
        }
    }

    // Load payment methods chart
    async function loadChartPagamentos() {
        try {
            const response = await apiRequest('/api/relatorios/formas-pagamento');
            
            if (response.length === 0) {
                document.querySelector('#chartPagamentos').parentElement.innerHTML = 
                    '<h3>Formas de Pagamento</h3><p class="text-center">Nenhum dado disponível</p>';
                return;
            }

            const ctx = document.getElementById('chartPagamentos').getContext('2d');
            
            if (chartPagamentos) {
                chartPagamentos.destroy();
            }
            
            const colors = [
                'rgba(45, 110, 62, 0.8)',
                'rgba(127, 176, 105, 0.8)',
                'rgba(244, 162, 97, 0.8)',
                'rgba(231, 111, 81, 0.8)'
            ];
            
            chartPagamentos = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: response.map(item => item.forma_pagamento),
                    datasets: [{
                        data: response.map(item => item.total),
                        backgroundColor: colors.slice(0, response.length),
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao carregar gráfico de pagamentos:', error);
        }
    }

    // Generate receipt
    window.gerarCupom = async function(vendaId) {
        try {
            const response = await apiRequest(`/api/vendas/${vendaId}/cupom`);
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(response.cupom_html);
            printWindow.document.close();
            printWindow.print();
            
        } catch (error) {
            console.error('Erro ao gerar cupom:', error);
        }
    };

    // Event listeners
    btnFiltrar.addEventListener('click', loadRelatorioPeriodo);

    // Auto-load on date change
    dataInicio.addEventListener('change', () => {
        if (dataInicio.value && dataFim.value) {
            loadRelatorioPeriodo();
        }
    });

    dataFim.addEventListener('change', () => {
        if (dataInicio.value && dataFim.value) {
            loadRelatorioPeriodo();
        }
    });

    // Initialize all data
    async function initializeRelatorios() {
        await Promise.all([
            loadVendasHoje(),
            loadEstoqueBaixo(),
            loadRelatorioPeriodo(),
            loadChartProdutos(),
            loadChartPagamentos()
        ]);
    }

    initializeRelatorios();

    // Auto refresh every 5 minutes
    setInterval(() => {
        loadVendasHoje();
        loadEstoqueBaixo();
    }, 5 * 60 * 1000);

    // Add CSS for reports specific styles
    const relatoriosStyles = `
        .estoque-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem;
            margin-bottom: 0.25rem;
            border-radius: var(--border-radius);
            background: var(--background);
        }
        
        .estoque-zero {
            background: rgba(231, 76, 60, 0.1);
        }
        
        .estoque-baixo {
            background: rgba(243, 156, 18, 0.1);
        }
        
        .btn-cupom {
            background: var(--secondary-color);
            color: white;
            border: none;
            padding: 0.5rem;
            border-radius: var(--border-radius);
            cursor: pointer;
            transition: var(--transition);
        }
        
        .btn-cupom:hover {
            background: var(--primary-color);
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = relatoriosStyles;
    document.head.appendChild(styleSheet);
});