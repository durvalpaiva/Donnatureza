// Catalog page functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Catalog DOM loaded, initializing...');
    
    const catalogGrid = document.getElementById('catalogGrid');
    const filterProducts = document.getElementById('filterProducts');
    const categoryFilter = document.getElementById('categoryFilter');
    const totalProducts = document.getElementById('totalProducts');
    const visibleProducts = document.getElementById('visibleProducts');
    const salesModeIndicator = document.getElementById('salesModeIndicator');
    const salesInstructions = document.getElementById('salesInstructions');
    
    console.log('📋 DOM elements found:', {
        catalogGrid: !!catalogGrid,
        filterProducts: !!filterProducts,
        categoryFilter: !!categoryFilter,
        totalProducts: !!totalProducts,
        visibleProducts: !!visibleProducts,
        salesModeIndicator: !!salesModeIndicator,
        salesInstructions: !!salesInstructions
    });

    let products = [];
    let filteredProducts = [];
    let salesMode = false;
    let viewMode = 'grid'; // 'grid' or 'touch'
    let selectedProducts = [];

    // Load products
    async function loadProducts() {
        try {
            console.log('📦 Starting to load products...');
            showLoading();
            
            console.log('🌐 Making API request to /api/simple-produtos...');
            const response = await fetch('/api/simple-produtos');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('✅ API response received:', data);
            
            products = data.filter(p => p.ativo);
            filteredProducts = [...products];
            
            console.log('🎯 Filtered products:', products.length, 'active products');
            
            console.log('🎨 Calling renderProducts...');
            renderProducts();
            
            console.log('📊 Calling updateStats...');
            updateStats();
            
            console.log('📋 Calling populateCategories...');
            populateCategories();
            
            console.log(`✨ Successfully loaded ${products.length} products`);
        } catch (error) {
            console.error('❌ Erro ao carregar produtos:', error);
            showError('Erro ao carregar produtos do catálogo');
        }
    }

    // Render products grid
    function renderProducts() {
        console.log('🎨 renderProducts called with', filteredProducts.length, 'products');
        console.log('📋 catalogGrid element:', catalogGrid);
        
        if (filteredProducts.length === 0) {
            console.log('⚠️ No products to display');
            catalogGrid.innerHTML = `
                <div class="empty-catalog">
                    <p>📦 Nenhum produto encontrado</p>
                    <p>Adicione produtos no sistema ou ajuste os filtros</p>
                </div>
            `;
            return;
        }

        console.log('✨ Generating HTML for', filteredProducts.length, 'products');
        
        // Simple version for testing
        const simpleHTML = filteredProducts.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-info">
                    <h3>${product.nome}</h3>
                    <p>R$ ${product.preco.toFixed(2)}</p>
                    <p>Estoque: ${product.estoque}</p>
                    <p>Categoria: ${product.categoria || 'N/A'}</p>
                </div>
            </div>
        `).join('');
        
        console.log('🎯 Setting catalogGrid innerHTML...');
        catalogGrid.innerHTML = simpleHTML;
        console.log('✅ catalogGrid updated successfully');
    }

    // Show loading state
    function showLoading() {
        catalogGrid.innerHTML = `
            <div class="loading-message">
                <div class="spinner"></div>
                <p>📦 Carregando produtos...</p>
            </div>
        `;
    }

    // Show error state
    function showError(message) {
        catalogGrid.innerHTML = `
            <div class="error-message">
                <p>❌ ${message}</p>
                <button onclick="loadProducts()" class="btn-primary">Tentar novamente</button>
            </div>
        `;
    }

    // Update statistics
    function updateStats() {
        totalProducts.textContent = products.length;
        visibleProducts.textContent = filteredProducts.length;
    }

    // Populate category filter
    function populateCategories() {
        const categories = [...new Set(products.filter(p => p.categoria).map(p => p.categoria))];
        
        categoryFilter.innerHTML = '<option value="">Todas as categorias</option>' +
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }

    // Filter products
    function filterProductsList() {
        const searchTerm = filterProducts.value.toLowerCase();
        const selectedCategory = categoryFilter.value;

        filteredProducts = products.filter(product => {
            const matchesSearch = !searchTerm || 
                product.nome.toLowerCase().includes(searchTerm) ||
                (product.codigo_barras && product.codigo_barras.includes(searchTerm)) ||
                (product.categoria && product.categoria.toLowerCase().includes(searchTerm));
                
            const matchesCategory = !selectedCategory || product.categoria === selectedCategory;
            
            return matchesSearch && matchesCategory;
        });

        renderProducts();
        updateStats();
    }

    // Product detail modal
    let currentProduct = null;

    window.showProductDetails = function(productId) {
        if (salesMode) return; // Don't show modal in sales mode
        
        currentProduct = products.find(p => p.id === productId);
        if (!currentProduct) return;

        const modal = document.getElementById('productModal');
        
        document.getElementById('modalProductName').textContent = currentProduct.nome;
        document.getElementById('modalProductCode').textContent = currentProduct.codigo_barras || 'N/A';
        document.getElementById('modalProductCategory').textContent = currentProduct.categoria || 'Sem categoria';
        document.getElementById('modalProductPrice').textContent = formatCurrency(currentProduct.preco);
        document.getElementById('modalProductStock').textContent = currentProduct.estoque;
        document.getElementById('modalProductDescription').textContent = currentProduct.descricao || 'Sem descrição';
        
        const modalImage = document.getElementById('modalProductImage');
        if (currentProduct.foto_url) {
            modalImage.src = currentProduct.foto_url;
            modalImage.style.display = 'block';
        } else {
            modalImage.style.display = 'none';
        }

        modal.style.display = 'flex';
    };

    window.closeProductModal = function() {
        const modal = document.getElementById('productModal');
        modal.style.display = 'none';
        currentProduct = null;
    };

    // Sales mode functions
    window.toggleView = function() {
        salesMode = !salesMode;
        
        const btn = document.getElementById('btnToggleView');
        
        if (salesMode) {
            btn.textContent = '📖 Modo Catálogo';
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary');
            salesModeIndicator.style.display = 'block';
            salesInstructions.style.display = 'block';
            viewMode = 'touch';
        } else {
            btn.textContent = '📱 Modo Touch';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
            salesModeIndicator.style.display = 'none';
            salesInstructions.style.display = 'none';
            viewMode = 'grid';
            selectedProducts = [];
        }
        
        renderProducts();
    };

    window.selectProduct = function(productId) {
        if (!salesMode) return;
        
        if (selectedProducts.includes(productId)) {
            selectedProducts = selectedProducts.filter(id => id !== productId);
        } else {
            selectedProducts.push(productId);
        }
        
        renderProducts();
        showNotification(`${selectedProducts.length} produto(s) selecionado(s)`);
    };

    window.addToSale = function(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        // Store in localStorage to pass to sales page
        let salesCart = JSON.parse(localStorage.getItem('catalogSalesCart') || '[]');
        
        const existingItem = salesCart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantidade++;
        } else {
            salesCart.push({
                id: product.id,
                nome: product.nome,
                preco: product.preco,
                quantidade: 1,
                estoque: product.estoque
            });
        }
        
        localStorage.setItem('catalogSalesCart', JSON.stringify(salesCart));
        
        showNotification(`${product.nome} adicionado à venda!`, 'success');
        
        // Add to selected if in sales mode
        if (!selectedProducts.includes(productId)) {
            selectedProducts.push(productId);
            renderProducts();
        }
    };

    window.addToSaleFromModal = function() {
        if (currentProduct) {
            addToSale(currentProduct.id);
            closeProductModal();
        }
    };

    window.goToSales = function() {
        if (selectedProducts.length > 0) {
            showNotification(`Redirecionando para vendas com ${selectedProducts.length} produto(s)`);
        }
        window.location.href = '/vendas';
    };

    window.exitSalesMode = function() {
        salesMode = false;
        selectedProducts = [];
        localStorage.removeItem('catalogSalesCart');
        
        const btn = document.getElementById('btnToggleView');
        btn.textContent = '📱 Modo Touch';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
        
        salesModeIndicator.style.display = 'none';
        salesInstructions.style.display = 'none';
        viewMode = 'grid';
        
        renderProducts();
        showNotification('Modo venda desativado');
    };

    // Print functionality
    window.printCatalog = function() {
        // Show print header
        document.querySelector('.print-header').style.display = 'block';
        document.getElementById('printDate').textContent = new Date().toLocaleDateString('pt-BR');
        
        // Hide non-print elements
        const elementsToHide = ['.catalog-actions', '.catalog-info', '.sales-instructions'];
        elementsToHide.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.style.display = 'none');
        });
        
        window.print();
        
        // Restore elements after print
        setTimeout(() => {
            document.querySelector('.print-header').style.display = 'none';
            elementsToHide.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => el.style.display = '');
            });
        }, 1000);
    };

    // PDF download functionality
    window.downloadPDF = async function() {
        const btn = document.getElementById('btnDownloadPDF');
        const originalText = btn.textContent;
        btn.textContent = '⏳ Gerando PDF...';
        btn.disabled = true;
        
        try {
            // Show print header for PDF
            document.querySelector('.print-header').style.display = 'block';
            document.getElementById('printDate').textContent = new Date().toLocaleDateString('pt-BR');
            
            // Hide non-PDF elements
            const elementsToHide = ['.catalog-actions', '.catalog-info', '.sales-instructions'];
            elementsToHide.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => el.style.display = 'none');
            });
            
            // Generate PDF using html2canvas + jsPDF
            const element = document.querySelector('main');
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF.jsPDF('p', 'mm', 'a4');
            
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            
            let position = 0;
            
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            const fileName = `catalogo-donnatureza-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
            pdf.save(fileName);
            
            showNotification('PDF gerado com sucesso!', 'success');
            
            // Restore elements
            document.querySelector('.print-header').style.display = 'none';
            elementsToHide.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => el.style.display = '');
            });
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            showNotification('Erro ao gerar PDF', 'error');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    };

    // Event listeners
    filterProducts.addEventListener('input', debounce(filterProductsList, 300));
    categoryFilter.addEventListener('change', filterProductsList);

    // Close modal on click outside
    document.getElementById('productModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeProductModal();
        }
    });

    // Test basic functionality first
    console.log('🧪 Testing basic functions...');
    
    // Test if fetch works directly
    setTimeout(async () => {
        try {
            console.log('🌐 Testing direct fetch...');
            const response = await fetch('/api/simple-produtos');
            const data = await response.json();
            console.log('✅ Direct fetch works:', data.length, 'produtos');
            
            if (data.length > 0) {
                console.log('🎯 Data is valid, updating catalogGrid directly...');
                catalogGrid.innerHTML = `
                    <div class="direct-test">
                        <h2>✅ Teste Direto Funcionou!</h2>
                        <p>Encontrados ${data.length} produtos:</p>
                        <ul>
                            ${data.map(p => `<li>${p.nome} - R$ ${p.preco.toFixed(2)}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ Direct fetch failed:', error);
            catalogGrid.innerHTML = `
                <div class="error-test">
                    <h2>❌ Erro no Teste Direto</h2>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }, 1000);
    
    // Initialize
    loadProducts();

    console.log('Catalog initialized');
});