// Global function for inline onclick
window.showNewProductForm = function() {
    console.log('showNewProductForm called!');
    const produtoForm = document.getElementById('produtoForm');
    const formTitle = document.getElementById('formTitle');
    
    if (produtoForm && formTitle) {
        produtoForm.style.display = 'block';
        formTitle.textContent = 'Novo Produto';
        
        // Clear form
        const form = document.getElementById('formProduto');
        if (form) form.reset();
        
        // Clear photo preview
        const fotoPreview = document.getElementById('fotoPreview');
        const fotoPlaceholder = document.getElementById('fotoPlaceholder');
        const btnRemoverFoto = document.getElementById('btnRemoverFoto');
        
        if (fotoPreview) {
            fotoPreview.style.display = 'none';
            fotoPreview.src = '';
        }
        if (fotoPlaceholder) {
            fotoPlaceholder.style.display = 'flex';
        }
        if (btnRemoverFoto) {
            btnRemoverFoto.style.display = 'none';
        }
        
        // Focus on name field
        setTimeout(() => {
            const nomeInput = document.getElementById('nome');
            if (nomeInput) nomeInput.focus();
        }, 100);
        
        console.log('Form shown successfully!');
    } else {
        console.error('Form elements not found');
    }
};

window.hideProductForm = function() {
    console.log('hideProductForm called!');
    const produtoForm = document.getElementById('produtoForm');
    
    if (produtoForm) {
        produtoForm.style.display = 'none';
        
        // Clear form
        const form = document.getElementById('formProduto');
        if (form) form.reset();
        
        console.log('Form hidden successfully!');
    } else {
        console.error('Form element not found');
    }
};

// Global photo functions
window.selectFromGallery = function() {
    console.log('selectFromGallery called!');
    const fotoInputGaleria = document.getElementById('fotoInputGaleria');
    if (fotoInputGaleria) {
        fotoInputGaleria.click();
        console.log('Gallery input clicked');
    } else {
        console.error('Gallery input not found');
    }
};

window.selectFromCamera = function() {
    console.log('selectFromCamera called!');
    
    // Check if device likely has camera (mobile/tablet)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Mobile: use native camera capture
        const fotoInputCamera = document.getElementById('fotoInputCamera');
        if (fotoInputCamera) {
            fotoInputCamera.click();
            console.log('Mobile camera input clicked');
        } else {
            console.error('Camera input not found');
        }
    } else {
        // Desktop: try advanced camera first, fallback to file selector
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            openCameraModal();
        } else {
            // No camera support, open file selector
            selectFromGallery();
            alert('Webcam não detectada. Selecionando arquivo...');
        }
    }
};

window.showPhotoOptions = function() {
    console.log('showPhotoOptions called!');
    
    // Check if device likely has camera (mobile/tablet)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Show all options for mobile
        const choice = prompt('Escolha uma opção:\n\n1 - Câmera Básica\n2 - Câmera Avançada\n3 - Galeria\n4 - Cancelar', '1');
        
        switch(choice) {
            case '1':
                selectFromCamera();
                break;
            case '2':
                openCameraModal();
                break;
            case '3':
                selectFromGallery();
                break;
            default:
                break;
        }
    } else {
        // Desktop - prioritize advanced camera if available
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const choice = confirm('Escolha como adicionar foto:\n\nOK = Usar Webcam/Câmera\nCancelar = Selecionar Arquivo');
            if (choice) {
                openCameraModal();
            } else {
                selectFromGallery();
            }
        } else {
            // No camera support, just open file selector
            selectFromGallery();
        }
    }
};

window.removePhoto = function() {
    console.log('removePhoto called!');
    const fotoPreview = document.getElementById('fotoPreview');
    const fotoPlaceholder = document.getElementById('fotoPlaceholder');
    const btnRemoverFoto = document.getElementById('btnRemoverFoto');
    const fotoInput = document.getElementById('fotoInput');
    
    if (fotoPreview) {
        fotoPreview.style.display = 'none';
        fotoPreview.src = '';
    }
    if (fotoPlaceholder) {
        fotoPlaceholder.style.display = 'flex';
    }
    if (btnRemoverFoto) {
        btnRemoverFoto.style.display = 'none';
    }
    // Clear both inputs
    const fotoInputGaleria = document.getElementById('fotoInputGaleria');
    const fotoInputCamera = document.getElementById('fotoInputCamera');
    if (fotoInputGaleria) {
        fotoInputGaleria.value = '';
    }
    if (fotoInputCamera) {
        fotoInputCamera.value = '';
    }
    
    // Clear selected photo variable if it exists
    if (typeof selectedPhoto !== 'undefined') {
        selectedPhoto = null;
    }
    
    console.log('Photo removed successfully');
};

window.handlePhotoSelection = function(input) {
    console.log('handlePhotoSelection called!');
    const file = input.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('Arquivo muito grande. Tamanho máximo: 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            showPhotoPreview(event.target.result);
        };
        reader.readAsDataURL(file);
        
        // Store selected photo globally
        window.selectedPhotoFile = file;
        
        console.log('File selected:', file.name);
    }
};

// WebRTC Camera functions
let cameraStream = null;

window.openCameraModal = function() {
    console.log('Opening camera modal...');
    const modal = document.getElementById('cameraModal');
    const video = document.getElementById('cameraVideo');
    
    if (modal) {
        modal.style.display = 'flex';
        
        // Request camera access
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment' // Use back camera on mobile
                }
            })
            .then(function(stream) {
                cameraStream = stream;
                video.srcObject = stream;
                console.log('Camera started successfully');
            })
            .catch(function(err) {
                console.error('Camera access denied:', err);
                alert('Erro ao acessar a câmera. Verifique as permissões.');
                closeCameraModal();
            });
        } else {
            alert('Câmera não suportada neste dispositivo/navegador');
            closeCameraModal();
        }
    }
};

window.closeCameraModal = function() {
    console.log('Closing camera modal...');
    const modal = document.getElementById('cameraModal');
    
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    if (modal) {
        modal.style.display = 'none';
    }
};

window.capturePhoto = function() {
    console.log('Capturing photo...');
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const ctx = canvas.getContext('2d');
    
    if (video && canvas) {
        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0);
        
        // Convert canvas to blob
        canvas.toBlob(function(blob) {
            if (blob) {
                // Create file from blob
                const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
                
                // Show preview
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                showPhotoPreview(dataUrl);
                
                // Store file
                window.selectedPhotoFile = file;
                
                console.log('Photo captured successfully');
                closeCameraModal();
            }
        }, 'image/jpeg', 0.8);
    }
};

// Helper function to show photo preview
function showPhotoPreview(src) {
    const fotoPreview = document.getElementById('fotoPreview');
    const fotoPlaceholder = document.getElementById('fotoPlaceholder');
    const btnRemoverFoto = document.getElementById('btnRemoverFoto');
    
    if (fotoPreview) {
        fotoPreview.src = src;
        fotoPreview.style.display = 'block';
    }
    if (fotoPlaceholder) {
        fotoPlaceholder.style.display = 'none';
    }
    if (btnRemoverFoto) {
        btnRemoverFoto.style.display = 'inline-block';
    }
    
    console.log('Photo preview updated');
}

// Barcode Scanner functions
let barcodeScanner = null;
let barcodeStream = null;

window.openBarcodeScanner = function() {
    console.log('Opening barcode scanner...');
    const modal = document.getElementById('barcodeModal');
    const video = document.getElementById('barcodeVideo');
    const scanResult = document.getElementById('scanResult');
    
    if (modal) {
        modal.style.display = 'flex';
        scanResult.style.display = 'none';
        
        // Request camera access
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })
            .then(function(stream) {
                barcodeStream = stream;
                video.srcObject = stream;
                
                // Initialize barcode scanner
                if (typeof ZXing !== 'undefined') {
                    initBarcodeScanner();
                } else {
                    // Simple fallback scanner
                    initSimpleScanner();
                }
                
                console.log('Barcode scanner started');
            })
            .catch(function(err) {
                console.error('Camera access denied:', err);
                alert('Erro ao acessar a câmera para scanner. Verifique as permissões.');
                closeBarcodeScanner();
            });
        } else {
            alert('Scanner não suportado neste dispositivo/navegador');
            closeBarcodeScanner();
        }
    }
};

function initBarcodeScanner() {
    try {
        const codeReader = new ZXing.BrowserMultiFormatReader();
        const video = document.getElementById('barcodeVideo');
        
        codeReader.decodeFromVideoDevice(null, video, (result, err) => {
            if (result) {
                const code = result.getText();
                console.log('Barcode detected:', code);
                handleBarcodeResult(code);
            }
            if (err && !(err instanceof ZXing.NotFoundException)) {
                console.error('Barcode scan error:', err);
            }
        });
        
        barcodeScanner = codeReader;
    } catch (error) {
        console.error('ZXing scanner error:', error);
        initSimpleScanner();
    }
}

function initSimpleScanner() {
    // Simple scanner using manual input
    console.log('Using simple scanner mode');
    const scanResult = document.getElementById('scanResult');
    scanResult.innerHTML = `
        <div style="margin-top: 1rem;">
            <p>📱 Scanner automático não disponível</p>
            <input type="text" id="manualBarcode" placeholder="Digite o código manualmente" style="width: 100%; padding: 0.5rem; margin: 0.5rem 0;">
            <button onclick="handleManualBarcode()" class="btn-primary" style="width: 100%;">Confirmar Código</button>
        </div>
    `;
    scanResult.style.display = 'block';
}

window.handleManualBarcode = function() {
    const input = document.getElementById('manualBarcode');
    if (input && input.value.trim()) {
        handleBarcodeResult(input.value.trim());
    }
};

function handleBarcodeResult(code) {
    console.log('Barcode result:', code);
    
    // Update the barcode input field
    const barcodeInput = document.getElementById('codigo_barras');
    if (barcodeInput) {
        barcodeInput.value = code;
        
        // Visual feedback
        const scanResult = document.getElementById('scanResult');
        scanResult.innerHTML = `<span style="color: green;">✅ Código detectado: ${code}</span>`;
        scanResult.style.display = 'block';
        
        // Auto close after 1.5 seconds
        setTimeout(() => {
            closeBarcodeScanner();
        }, 1500);
    }
}

window.closeBarcodeScanner = function() {
    console.log('Closing barcode scanner...');
    const modal = document.getElementById('barcodeModal');
    
    // Stop camera stream
    if (barcodeStream) {
        barcodeStream.getTracks().forEach(track => track.stop());
        barcodeStream = null;
    }
    
    // Stop barcode scanner
    if (barcodeScanner && typeof barcodeScanner.reset === 'function') {
        barcodeScanner.reset();
        barcodeScanner = null;
    }
    
    if (modal) {
        modal.style.display = 'none';
    }
};

// Produtos page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit more for all elements to be ready
    setTimeout(() => {
        initProdutos();
    }, 100);
});

function initProdutos() {
    const btnNovoProduto = document.getElementById('btnNovoProduto');
    const produtoForm = document.getElementById('produtoForm');
    const formProduto = document.getElementById('formProduto');
    const btnCancelar = document.getElementById('btnCancelar');
    const searchProduto = document.getElementById('searchProduto');
    const tabelaProdutos = document.getElementById('tabelaProdutos')?.querySelector('tbody');
    const formTitle = document.getElementById('formTitle');
    const fotoInput = document.getElementById('fotoInput');
    const btnSelecionarFoto = document.getElementById('btnSelecionarFoto');
    const btnRemoverFoto = document.getElementById('btnRemoverFoto');
    const fotoPreview = document.getElementById('fotoPreview');
    const fotoPlaceholder = document.getElementById('fotoPlaceholder');

    // Check if all required elements exist
    if (!btnNovoProduto || !produtoForm || !formProduto || !tabelaProdutos) {
        console.error('Required elements not found:', {
            btnNovoProduto: !!btnNovoProduto,
            produtoForm: !!produtoForm,
            formProduto: !!formProduto,
            tabelaProdutos: !!tabelaProdutos
        });
        return;
    }

    let produtos = [];
    let editingId = null;
    let selectedPhoto = null;

    console.log('Produtos.js initialized successfully!');

    // Load products
    async function loadProdutos() {
        try {
            setLoading(tabelaProdutos, true);
            const response = await apiRequest('/api/produtos');
            produtos = response;
            renderProdutos(produtos);
            console.log('Produtos carregados:', produtos.length);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            // Don't break the initialization if products fail to load
            produtos = [];
            renderProdutos(produtos);
        } finally {
            setLoading(tabelaProdutos, false);
        }
    }

    // Render products table
    function renderProdutos(produtosList) {
        tabelaProdutos.innerHTML = '';
        
        if (produtosList.length === 0) {
            tabelaProdutos.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum produto encontrado</td></tr>';
            return;
        }

        produtosList.forEach(produto => {
            const row = document.createElement('tr');
            row.className = 'fade-in';
            row.innerHTML = `
                <td class="foto-cell">
                    ${produto.foto_url ? 
                        `<img src="${produto.foto_url}" alt="${produto.nome}" class="produto-thumb">` : 
                        '<div class="no-foto">📷</div>'
                    }
                </td>
                <td>${produto.nome}</td>
                <td>${produto.codigo_barras || '-'}</td>
                <td>${formatCurrency(produto.preco)}</td>
                <td>
                    <span class="badge ${produto.estoque <= 10 ? 'badge-warning' : 'badge-success'}">
                        ${produto.estoque}
                    </span>
                </td>
                <td>${produto.categoria || '-'}</td>
                <td>
                    <button class="btn-edit" onclick="editProduto(${produto.id})" title="Editar">✏️</button>
                    <button class="btn-delete" onclick="deleteProduto(${produto.id})" title="Excluir">🗑️</button>
                </td>
            `;
            tabelaProdutos.appendChild(row);
        });
    }

    // Show/hide form
    function toggleForm(show = true, editing = false) {
        produtoForm.style.display = show ? 'block' : 'none';
        formTitle.textContent = editing ? 'Editar Produto' : 'Novo Produto';
        
        if (!show) {
            formProduto.reset();
            editingId = null;
            clearPhotoPreview();
        }
    }

    // Photo preview functions
    function clearPhotoPreview() {
        fotoPreview.style.display = 'none';
        fotoPreview.src = '';
        fotoPlaceholder.style.display = 'flex';
        btnRemoverFoto.style.display = 'none';
        selectedPhoto = null;
    }

    function showPhotoPreview(src) {
        fotoPreview.src = src;
        fotoPreview.style.display = 'block';
        fotoPlaceholder.style.display = 'none';
        btnRemoverFoto.style.display = 'inline-block';
    }

    // Upload photo function
    async function uploadPhoto(produtoId, file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`/api/produtos/upload-foto/${produtoId}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Erro ao enviar foto');
            }

            const result = await response.json();
            showNotification(result.message);
            return result.foto_url;
        } catch (error) {
            showNotification(error.message, 'error');
            throw error;
        }
    }

    // Search products
    const debouncedSearch = debounce(function(term) {
        if (!term) {
            renderProdutos(produtos);
            return;
        }

        const filtered = produtos.filter(produto =>
            produto.nome.toLowerCase().includes(term.toLowerCase()) ||
            (produto.codigo_barras && produto.codigo_barras.includes(term)) ||
            (produto.categoria && produto.categoria.toLowerCase().includes(term.toLowerCase()))
        );
        renderProdutos(filtered);
    }, 300);

    // Event listeners
    btnNovoProduto.addEventListener('click', () => {
        console.log('Novo Produto clicked!');
        toggleForm(true, false);
        setTimeout(() => {
            const nomeInput = document.getElementById('nome');
            if (nomeInput) {
                nomeInput.focus();
            }
        }, 100);
    });

    btnCancelar.addEventListener('click', () => {
        toggleForm(false);
    });

    searchProduto.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });

    // Form submission
    formProduto.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(formProduto);
        const produto = {
            nome: formData.get('nome'),
            codigo_barras: formData.get('codigo_barras') || null,
            preco: parseFloat(formData.get('preco')),
            estoque: parseInt(formData.get('estoque')),
            categoria: formData.get('categoria') || null,
            descricao: formData.get('descricao') || null,
            
            // Campos fiscais
            ncm: formData.get('ncm') || "00000000",
            cfop: formData.get('cfop') || "5102",
            unidade_medida: formData.get('unidade_medida') || "UN",
            origem: formData.get('origem') || "0",
            cst_icms: formData.get('cst_icms') || "102",
            aliquota_icms: parseFloat(formData.get('aliquota_icms')) || 0.00,
            cst_pis: formData.get('cst_pis') || "07",
            aliquota_pis: parseFloat(formData.get('aliquota_pis')) || 0.0000,
            cst_cofins: formData.get('cst_cofins') || "07",
            aliquota_cofins: parseFloat(formData.get('aliquota_cofins')) || 0.0000,
            cst_ipi: formData.get('cst_ipi') || null,
            aliquota_ipi: parseFloat(formData.get('aliquota_ipi')) || 0.00
        };

        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            setLoading(submitBtn, true);

            let produtoId;
            
            if (editingId) {
                await apiRequest(`/api/produtos/${editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify(produto)
                });
                produtoId = editingId;
                showNotification('Produto atualizado com sucesso!');
            } else {
                const response = await apiRequest('/api/produtos', {
                    method: 'POST',
                    body: JSON.stringify(produto)
                });
                produtoId = response.id;
                showNotification('Produto criado com sucesso!');
            }

            // Upload photo if selected
            const photoFile = window.selectedPhotoFile || selectedPhoto;
            if (photoFile && produtoId) {
                try {
                    await uploadPhoto(produtoId, photoFile);
                } catch (photoError) {
                    console.error('Erro ao enviar foto:', photoError);
                    // Don't break the flow, product was saved successfully
                }
            }

            toggleForm(false);
            loadProdutos();
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
        } finally {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            setLoading(submitBtn, false);
        }
    });

    // Photo event listeners
    if (btnSelecionarFoto) {
        btnSelecionarFoto.addEventListener('click', () => {
            console.log('Botão selecionar foto clicado');
            fotoInput.click();
        });
    }

    if (fotoPlaceholder) {
        fotoPlaceholder.addEventListener('click', () => {
            console.log('Placeholder clicado');
            fotoInput.click();
        });
    }

    if (fotoInput) {
        fotoInput.addEventListener('change', (e) => {
            console.log('Arquivo selecionado');
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    showNotification('Arquivo muito grande. Tamanho máximo: 5MB', 'warning');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    showPhotoPreview(event.target.result);
                };
                reader.readAsDataURL(file);
                selectedPhoto = file;
            }
        });
    }

    if (btnRemoverFoto) {
        btnRemoverFoto.addEventListener('click', () => {
            clearPhotoPreview();
            if (fotoInput) fotoInput.value = '';
        });
    }

    // Global functions for table actions
    window.editProduto = async function(id) {
        try {
            const produto = await apiRequest(`/api/produtos/${id}`);
            
            document.getElementById('produtoId').value = produto.id;
            document.getElementById('nome').value = produto.nome;
            document.getElementById('codigo_barras').value = produto.codigo_barras || '';
            document.getElementById('preco').value = produto.preco;
            document.getElementById('estoque').value = produto.estoque;
            document.getElementById('categoria').value = produto.categoria || '';
            document.getElementById('descricao').value = produto.descricao || '';
            
            // Campos fiscais
            document.getElementById('ncm').value = produto.ncm || "00000000";
            document.getElementById('cfop').value = produto.cfop || "5102";
            document.getElementById('unidade_medida').value = produto.unidade_medida || "UN";
            document.getElementById('origem').value = produto.origem || "0";
            document.getElementById('cst_icms').value = produto.cst_icms || "102";
            document.getElementById('aliquota_icms').value = produto.aliquota_icms || 0.00;
            document.getElementById('cst_pis').value = produto.cst_pis || "07";
            document.getElementById('aliquota_pis').value = produto.aliquota_pis || 0.0000;
            document.getElementById('cst_cofins').value = produto.cst_cofins || "07";
            document.getElementById('aliquota_cofins').value = produto.aliquota_cofins || 0.0000;
            document.getElementById('cst_ipi').value = produto.cst_ipi || "";
            document.getElementById('aliquota_ipi').value = produto.aliquota_ipi || 0.00;
            
            // Show existing photo if available
            if (produto.foto_url) {
                showPhotoPreview(produto.foto_url);
            } else {
                clearPhotoPreview();
            }
            
            editingId = id;
            toggleForm(true, true);
        } catch (error) {
            console.error('Erro ao carregar produto:', error);
        }
    };

    window.deleteProduto = async function(id) {
        if (!confirm('Tem certeza que deseja excluir este produto?')) {
            return;
        }

        try {
            await apiRequest(`/api/produtos/${id}`, {
                method: 'DELETE'
            });
            showNotification('Produto excluído com sucesso!');
            loadProdutos();
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
        }
    };

    // Initialize
    loadProdutos();

    // Add CSS for produtos specific styles
    const produtosStyles = `
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        @media (max-width: 768px) {
            .form-row {
                grid-template-columns: 1fr;
            }
        }
        
        .foto-section {
            display: grid;
            grid-template-columns: 200px 1fr;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .foto-preview {
            position: relative;
            width: 200px;
            height: 200px;
            border: 2px dashed var(--border);
            border-radius: var(--border-radius);
            overflow: hidden;
        }
        
        .foto-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .foto-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--text-secondary);
            cursor: pointer;
            transition: var(--transition);
        }
        
        .foto-placeholder:hover {
            background: var(--background);
            border-color: var(--primary-color);
        }
        
        .foto-placeholder span {
            font-size: 3rem;
            margin-bottom: 0.5rem;
        }
        
        .foto-controls {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            align-self: start;
        }
        
        .photo-buttons {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        
        .photo-buttons button {
            flex: 1;
            min-width: 120px;
            font-size: 0.9rem;
            padding: 0.5rem 0.75rem;
        }
        
        .produto-thumb {
            width: 50px;
            height: 50px;
            object-fit: cover;
            border-radius: 4px;
        }
        
        .no-foto {
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: 4px;
            color: var(--text-secondary);
            font-size: 1.5rem;
        }
        
        .foto-cell {
            text-align: center;
            padding: 0.5rem;
        }
        
        .btn-edit, .btn-delete {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 0.25rem;
            margin: 0 0.25rem;
            border-radius: 4px;
            transition: background-color 0.2s;
        }
        
        .btn-edit:hover {
            background: rgba(39, 174, 96, 0.1);
        }
        
        .btn-delete:hover {
            background: rgba(231, 76, 60, 0.1);
        }
        
        .text-center {
            text-align: center;
            color: var(--text-secondary);
            padding: 2rem;
        }
        
        /* Camera Modal Styles */
        .camera-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .camera-modal-content {
            background: var(--surface);
            border-radius: var(--border-radius);
            padding: 1rem;
            max-width: 90vw;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
        }
        
        .camera-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .camera-header h3 {
            margin: 0;
            color: var(--primary-color);
        }
        
        .camera-close {
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: var(--text-secondary);
            padding: 0;
            width: 40px;
            height: 40px;
            border-radius: 50%;
        }
        
        .camera-close:hover {
            background: var(--background);
        }
        
        .camera-body {
            margin-bottom: 1rem;
        }
        
        #cameraVideo {
            width: 100%;
            max-width: 480px;
            height: auto;
            border-radius: var(--border-radius);
        }
        
        .camera-controls {
            display: flex;
            gap: 1rem;
            justify-content: center;
        }
        
        /* Barcode Scanner Styles */
        .barcode-input-group {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }
        
        .barcode-input-group input {
            flex: 1;
        }
        
        .btn-barcode {
            background: var(--accent-color);
            color: white;
            border: none;
            padding: 0.75rem 1rem;
            border-radius: var(--border-radius);
            cursor: pointer;
            font-size: 0.9rem;
            transition: var(--transition);
            white-space: nowrap;
        }
        
        .btn-barcode:hover {
            background: var(--accent-hover);
            transform: translateY(-1px);
        }
        
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
            .foto-section {
                grid-template-columns: 1fr;
            }
            
            .foto-preview {
                width: 150px;
                height: 150px;
                margin: 0 auto;
            }
            
            .camera-modal-content {
                margin: 1rem;
                max-width: calc(100vw - 2rem);
            }
            
            .photo-buttons {
                flex-direction: column;
            }
            
            .photo-buttons button {
                min-width: 100%;
            }
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = produtosStyles;
    document.head.appendChild(styleSheet);
}