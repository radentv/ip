// TV Online Premium - Aplicação Principal

class TVOnlineApp {
    constructor() {
        this.state = {
            channels: [],
            categories: [],
            currentCategory: 'all',
            favorites: [],
            history: [],
            savedLists: [],
            currentChannel: null,
            isPlaying: false,
            volume: 1,
            isMuted: false,
            searchQuery: '',
            viewMode: 'grid',
            theme: 'dark'
        };
        
        this.elements = {};
        this.init();
    }

    init() {
        console.log('Iniciando TV Online Premium...');
        this.cacheElements();
        this.loadSavedData();
        this.setupEventListeners();
        this.hideSplashScreen();
        
        // Testar com lista de exemplo
        setTimeout(() => this.testSampleList(), 1000);
    }

    cacheElements() {
        // Elementos principais
        this.elements.splashScreen = document.getElementById('splash-screen');
        this.elements.appContainer = document.querySelector('.app-container');
        
        // Modais
        this.elements.addListModal = document.getElementById('add-list-modal');
        this.elements.listsModal = document.getElementById('lists-modal');
        
        // Botões
        this.elements.menuToggle = document.getElementById('menu-toggle');
        this.elements.themeToggle = document.getElementById('theme-toggle');
        this.elements.addListBtn = document.getElementById('add-list-btn');
        this.elements.listsBtn = document.getElementById('lists-btn');
        this.elements.fullscreenBtn = document.getElementById('fullscreen-btn');
        this.elements.addListAction = document.getElementById('add-list-action');
        this.elements.addNewListBtn = document.getElementById('add-new-list-btn');
        
        // Player
        this.elements.videoPlayer = document.getElementById('video-player');
        this.elements.playPauseBtn = document.getElementById('play-pause');
        this.elements.currentChannel = document.getElementById('current-channel');
        
        // Busca
        this.elements.searchInput = document.getElementById('channel-search');
        
        // Containers
        this.elements.channelsGrid = document.getElementById('channels-grid');
        this.elements.categoryFilter = document.getElementById('category-filter');
        
        // Tabs e forms
        this.elements.tabBtns = document.querySelectorAll('.tab-btn');
        this.elements.tabContents = document.querySelectorAll('.tab-content');
        this.elements.m3uUrlInput = document.getElementById('m3u-url');
        this.elements.loadUrlBtn = document.getElementById('load-url-btn');
        this.elements.m3uFileInput = document.getElementById('m3u-file');
        this.elements.m3uTextInput = document.getElementById('m3u-text');
        this.elements.loadTextBtn = document.getElementById('load-text-btn');
        
        // Quick lists
        this.elements.quickListBtns = document.querySelectorAll('.quick-list-btn');
        
        // Listas salvas
        this.elements.savedListsContainer = document.getElementById('saved-lists-container');
    }

    setupEventListeners() {
        // Menu toggle
        this.elements.menuToggle?.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });

        // Toggle de tema
        this.elements.themeToggle?.addEventListener('click', () => this.toggleTheme());

        // Botões de modais
        this.elements.addListBtn?.addEventListener('click', () => this.showModal('add-list'));
        this.elements.listsBtn?.addEventListener('click', () => this.showModal('lists'));
        this.elements.addListAction?.addEventListener('click', () => this.showModal('add-list'));
        this.elements.addNewListBtn?.addEventListener('click', () => this.showModal('add-list'));

        // Fechar modais
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.hideAllModals());
        });

        // Tabs
        this.elements.tabBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Carregar lista via URL
        this.elements.loadUrlBtn?.addEventListener('click', () => this.loadListFromUrl());

        // Carregar lista via texto
        this.elements.loadTextBtn?.addEventListener('click', () => this.loadListFromText());

        // Upload de arquivo
        this.elements.m3uFileInput?.addEventListener('change', (e) => {
            this.loadListFromFile(e.target.files[0]);
        });

        // Quick lists
        this.elements.quickListBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.closest('.quick-list-btn').dataset.url;
                this.loadListFromUrl(url);
            });
        });

        // Botão de exemplo
        document.querySelector('.try-sample-btn')?.addEventListener('click', () => {
            this.testSampleList();
        });

        // Busca
        this.elements.searchInput?.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Player
        this.elements.playPauseBtn?.addEventListener('click', () => this.togglePlayPause());
        this.elements.videoPlayer?.addEventListener('play', () => this.updatePlayState(true));
        this.elements.videoPlayer?.addEventListener('pause', () => this.updatePlayState(false));

        // Tela cheia
        this.elements.fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());

        // Teclas de atalho
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                this.togglePlayPause();
            }
            if (e.code === 'KeyF' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                this.toggleFullscreen();
            }
        });
    }

    hideSplashScreen() {
        setTimeout(() => {
            if (this.elements.splashScreen) {
                this.elements.splashScreen.style.opacity = '0';
                setTimeout(() => {
                    this.elements.splashScreen.style.display = 'none';
                    this.showNotification('TV Online Premium carregado!', 'success');
                }, 500);
            }
        }, 1500);
    }

    showModal(modalName) {
        this.hideAllModals();
        if (modalName === 'add-list') {
            this.elements.addListModal?.classList.add('active');
        } else if (modalName === 'lists') {
            this.renderSavedLists();
            this.elements.listsModal?.classList.add('active');
        }
    }

    hideAllModals() {
        this.elements.addListModal?.classList.remove('active');
        this.elements.listsModal?.classList.remove('active');
    }

    switchTab(tabId) {
        // Atualizar botões
        this.elements.tabBtns?.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        // Atualizar conteúdos
        this.elements.tabContents?.forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });
    }

    async loadListFromUrl(customUrl = null) {
        const url = customUrl || this.elements.m3uUrlInput?.value;
        const listName = document.getElementById('list-name')?.value || `Lista ${new Date().toLocaleDateString()}`;
        
        if (!url) {
            this.showNotification('Por favor, insira uma URL válida', 'error');
            return;
        }
        
        this.showNotification('Carregando lista...', 'info');
        
        try {
            const response = await fetch(`https://cors-anywhere.herokuapp.com/${url}`, {
                headers: {
                    'Accept': 'text/plain, application/x-mpegurl'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const m3uContent = await response.text();
            this.parseM3UContent(m3uContent, listName, url);
            
        } catch (error) {
            console.error('Erro ao carregar lista:', error);
            this.showNotification(`Erro ao carregar lista: ${error.message}`, 'error');
            
            // Tentar sem proxy CORS (pode funcionar se o servidor permitir)
            try {
                const directResponse = await fetch(url);
                if (directResponse.ok) {
                    const m3uContent = await directResponse.text();
                    this.parseM3UContent(m3uContent, listName, url);
                }
            } catch (directError) {
                this.showNotification('Erro de CORS. Tente outra lista ou use o modo texto.', 'error');
            }
        }
    }

    loadListFromText() {
        const m3uText = this.elements.m3uTextInput?.value;
        const listName = document.getElementById('list-name')?.value || `Lista ${new Date().toLocaleDateString()}`;
        
        if (!m3uText) {
            this.showNotification('Por favor, cole o conteúdo M3U', 'error');
            return;
        }
        
        this.parseM3UContent(m3uText, listName, 'texto');
    }

    loadListFromFile(file) {
        if (!file) return;
        
        const reader = new FileReader();
        const listName = document.getElementById('list-name')?.value || file.name;
        
        reader.onload = (e) => {
            this.parseM3UContent(e.target.result, listName, 'arquivo');
        };
        
        reader.onerror = () => {
            this.showNotification('Erro ao ler arquivo', 'error');
        };
        
        reader.readAsText(file);
    }

    parseM3UContent(content, listName, source) {
        try {
            const channels = this.parseM3U(content);
            
            if (channels.length === 0) {
                this.showNotification('Nenhum canal válido encontrado na lista', 'warning');
                return;
            }
            
            // Adicionar canais ao estado
            this.state.channels = [...this.state.channels, ...channels];
            
            // Atualizar categorias
            this.updateCategories();
            
            // Salvar lista
            this.saveList(listName, channels, source);
            
            // Renderizar canais
            this.renderChannels();
            this.renderCategoryFilters();
            
            // Fechar modal
            this.hideAllModals();
            
            this.showNotification(`${channels.length} canais carregados de "${listName}"`, 'success');
            
        } catch (error) {
            console.error('Erro ao analisar M3U:', error);
            this.showNotification('Erro ao processar lista M3U', 'error');
        }
    }

    parseM3U(content) {
        const channels = [];
        const lines = content.split('\n');
        let currentChannel = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('#EXTINF:')) {
                currentChannel = this.parseExtInf(line);
            } 
            else if (line && !line.startsWith('#') && currentChannel) {
                currentChannel.url = line;
                currentChannel.id = this.generateId();
                channels.push(currentChannel);
                currentChannel = null;
            }
        }
        
        return channels;
    }

    parseExtInf(line) {
        const channel = {
            name: 'Canal Sem Nome',
            logo: '',
            group: 'Geral',
            url: ''
        };
        
        // Extrair nome
        const nameMatch = line.match(/,(.+)$/);
        if (nameMatch) {
            channel.name = nameMatch[1].trim();
        }
        
        // Extrair logo
        const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
        if (logoMatch) {
            channel.logo = logoMatch[1];
        }
        
        // Extrair categoria
        const groupMatch = line.match(/group-title="([^"]*)"/i);
        if (groupMatch) {
            channel.group = groupMatch[1];
        }
        
        return channel;
    }

    generateId() {
        return 'ch_' + Math.random().toString(36).substr(2, 9);
    }

    updateCategories() {
        const categories = new Set();
        this.state.channels.forEach(channel => {
            categories.add(channel.group);
        });
        this.state.categories = Array.from(categories).sort();
    }

    renderChannels() {
        if (!this.elements.channelsGrid) return;
        
        // Filtrar canais
        let filteredChannels = [...this.state.channels];
        
        // Aplicar filtro de categoria
        if (this.state.currentCategory !== 'all') {
            filteredChannels = filteredChannels.filter(ch => ch.group === this.state.currentCategory);
        }
        
        // Aplicar busca
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            filteredChannels = filteredChannels.filter(ch => 
                ch.name.toLowerCase().includes(query) ||
                ch.group.toLowerCase().includes(query)
            );
        }
        
        // Limpar grid
        this.elements.channelsGrid.innerHTML = '';
        
        // Verificar se há canais
        if (filteredChannels.length === 0) {
            this.elements.channelsGrid.innerHTML = `
                <div class="no-channels">
                    <i class="fas fa-search"></i>
                    <h3>Nenhum canal encontrado</h3>
                    <p>${this.state.searchQuery ? 'Tente outra busca' : 'Adicione uma lista M3U para começar'}</p>
                </div>
            `;
            return;
        }
        
        // Renderizar canais
        filteredChannels.forEach(channel => {
            const channelCard = this.createChannelCard(channel);
            this.elements.channelsGrid.appendChild(channelCard);
        });
        
        // Atualizar contador
        this.updateChannelsCount();
    }

    createChannelCard(channel) {
        const card = document.createElement('div');
        card.className = 'channel-card grid';
        card.innerHTML = `
            <div class="channel-logo">
                ${channel.logo ? 
                    `<img src="${channel.logo}" alt="${channel.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\"placeholder\"><i class=\"fas fa-tv\"></i></div>';">` : 
                    '<div class="placeholder"><i class="fas fa-tv"></i></div>'
                }
            </div>
            <div class="channel-info">
                <div class="channel-name">${this.escapeHtml(channel.name)}</div>
                <div class="channel-category">
                    <i class="fas fa-tag"></i>
                    <span>${this.escapeHtml(channel.group)}</span>
                </div>
            </div>
            <button class="favorite-btn">
                <i class="far fa-star"></i>
            </button>
        `;
        
        // Event listeners
        card.addEventListener('click', () => {
            this.playChannel(channel);
        });
        
        const favBtn = card.querySelector('.favorite-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(channel.id);
        });
        
        return card;
    }

    renderCategoryFilters() {
        if (!this.elements.categoryFilter) return;
        
        this.elements.categoryFilter.innerHTML = `
            <button class="category-filter ${this.state.currentCategory === 'all' ? 'active' : ''}" 
                    data-category="all">
                Todos (${this.state.channels.length})
            </button>
        `;
        
        this.state.categories.forEach(category => {
            const count = this.state.channels.filter(ch => ch.group === category).length;
            const btn = document.createElement('button');
            btn.className = `category-filter ${this.state.currentCategory === category ? 'active' : ''}`;
            btn.dataset.category = category;
            btn.textContent = `${category} (${count})`;
            
            btn.addEventListener('click', () => {
                this.state.currentCategory = category;
                this.renderCategoryFilters();
                this.renderChannels();
            });
            
            this.elements.categoryFilter.appendChild(btn);
        });
    }

    updateChannelsCount() {
        const count = this.state.channels.length;
        const countElement = document.getElementById('channels-count');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    playChannel(channel) {
        if (!channel || !channel.url) {
            this.showNotification('URL do canal inválida', 'error');
            return;
        }
        
        this.state.currentChannel = channel;
        
        // Atualizar título
        if (this.elements.currentChannel) {
            this.elements.currentChannel.textContent = channel.name;
        }
        
        // Definir e reproduzir vídeo
        const videoPlayer = this.elements.videoPlayer;
        if (videoPlayer) {
            videoPlayer.src = channel.url;
            videoPlayer.play().catch(error => {
                console.error('Erro ao reproduzir:', error);
                this.showNotification('Erro ao reproduzir canal', 'error');
            });
        }
        
        // Adicionar ao histórico
        this.addToHistory(channel.id);
        
        this.showNotification(`Reproduzindo: ${channel.name}`, 'info');
    }

    togglePlayPause() {
        const videoPlayer = this.elements.videoPlayer;
        if (!videoPlayer) return;
        
        if (videoPlayer.paused) {
            videoPlayer.play();
        } else {
            videoPlayer.pause();
        }
    }

    updatePlayState(isPlaying) {
        this.state.isPlaying = isPlaying;
        if (this.elements.playPauseBtn) {
            const icon = isPlaying ? 'fa-pause' : 'fa-play';
            this.elements.playPauseBtn.innerHTML = `<i class="fas ${icon}"></i>`;
        }
    }

    toggleFavorite(channelId) {
        const index = this.state.favorites.indexOf(channelId);
        if (index === -1) {
            this.state.favorites.push(channelId);
            this.showNotification('Canal adicionado aos favoritos', 'success');
        } else {
            this.state.favorites.splice(index, 1);
            this.showNotification('Canal removido dos favoritos', 'info');
        }
        this.saveData();
        this.renderChannels();
    }

    addToHistory(channelId) {
        // Remover se já existir
        const index = this.state.history.indexOf(channelId);
        if (index !== -1) {
            this.state.history.splice(index, 1);
        }
        
        // Adicionar no início
        this.state.history.unshift(channelId);
        
        // Manter apenas os últimos 20
        if (this.state.history.length > 20) {
            this.state.history.pop();
        }
        
        this.saveData();
    }

    saveList(name, channels, source) {
        const list = {
            id: 'list_' + Date.now(),
            name,
            channels: channels.map(ch => ({
                ...ch,
                id: ch.id || this.generateId()
            })),
            source,
            date: new Date().toISOString(),
            count: channels.length
        };
        
        this.state.savedLists.push(list);
        this.saveData();
    }

    renderSavedLists() {
        if (!this.elements.savedListsContainer) return;
        
        if (this.state.savedLists.length === 0) {
            this.elements.savedListsContainer.innerHTML = `
                <div class="no-lists">
                    <i class="fas fa-inbox"></i>
                    <h3>Nenhuma lista salva</h3>
                    <p>Adicione listas M3U para vê-las aqui.</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        this.state.savedLists.forEach(list => {
            html += `
                <div class="saved-list-item" data-list-id="${list.id}">
                    <div class="list-info">
                        <div class="list-name">${this.escapeHtml(list.name)}</div>
                        <div class="list-stats">
                            ${list.count} canais • ${new Date(list.date).toLocaleDateString()}
                        </div>
                    </div>
                    <div class="list-actions">
                        <button class="list-action-btn load-list-btn" title="Carregar lista">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="list-action-btn delete-list-btn" title="Remover lista">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        this.elements.savedListsContainer.innerHTML = html;
        
        // Event listeners para os botões
        this.elements.savedListsContainer.querySelectorAll('.load-list-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const listId = e.target.closest('.saved-list-item').dataset.listId;
                this.loadSavedList(listId);
            });
        });
        
        this.elements.savedListsContainer.querySelectorAll('.delete-list-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const listId = e.target.closest('.saved-list-item').dataset.listId;
                this.deleteSavedList(listId);
            });
        });
    }

    loadSavedList(listId) {
        const list = this.state.savedLists.find(l => l.id === listId);
        if (!list) return;
        
        this.state.channels = list.channels;
        this.updateCategories();
        this.renderChannels();
        this.renderCategoryFilters();
        this.hideAllModals();
        
        this.showNotification(`Lista "${list.name}" carregada com ${list.count} canais`, 'success');
    }

    deleteSavedList(listId) {
        if (!confirm('Tem certeza que deseja remover esta lista?')) return;
        
        const index = this.state.savedLists.findIndex(l => l.id === listId);
        if (index !== -1) {
            this.state.savedLists.splice(index, 1);
            this.saveData();
            this.renderSavedLists();
            this.showNotification('Lista removida', 'info');
        }
    }

    handleSearch(query) {
        this.state.searchQuery = query;
        this.renderChannels();
    }

    toggleTheme() {
        const isLight = document.body.classList.toggle('light-theme');
        this.state.theme = isLight ? 'light' : 'dark';
        
        const icon = isLight ? 'fa-sun' : 'fa-moon';
        if (this.elements.themeToggle) {
            this.elements.themeToggle.innerHTML = `<i class="fas ${icon}"></i>`;
        }
        
        this.saveData();
        this.showNotification(`Tema ${isLight ? 'claro' : 'escuro'} ativado`, 'info');
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('Erro ao entrar em tela cheia:', err);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    saveData() {
        try {
            const data = {
                favorites: this.state.favorites,
                history: this.state.history,
                savedLists: this.state.savedLists,
                theme: this.state.theme,
                volume: this.state.volume
            };
            localStorage.setItem('tvonline_data', JSON.stringify(data));
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
        }
    }

    loadSavedData() {
        try {
            const saved = localStorage.getItem('tvonline_data');
            if (saved) {
                const data = JSON.parse(saved);
                
                if (data.favorites) this.state.favorites = data.favorites;
                if (data.history) this.state.history = data.history;
                if (data.savedLists) this.state.savedLists = data.savedLists;
                if (data.theme) {
                    this.state.theme = data.theme;
                    if (data.theme === 'light') {
                        document.body.classList.add('light-theme');
                        if (this.elements.themeToggle) {
                            this.elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                        }
                    }
                }
                if (data.volume) {
                    this.state.volume = data.volume;
                    if (this.elements.videoPlayer) {
                        this.elements.videoPlayer.volume = data.volume;
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    }

    testSampleList() {
        // Lista de exemplo com alguns canais públicos de teste
        const sampleM3U = `#EXTM3U
#EXTINF:-1 tvg-id="" tvg-name="Big Buck Bunny" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/300px-Big_buck_bunny_poster_big.jpg" group-title="Filmes",Big Buck Bunny
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
#EXTINF:-1 tvg-id="" tvg-name="Elephant Dream" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Elephants_Dream_%282006%29.jpg/300px-Elephants_Dream_%282006%29.jpg" group-title="Documentários",Elephant Dream
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4
#EXTINF:-1 tvg-id="" tvg-name="For Bigger Blazes" tvg-logo="https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=300" group-title="Música",For Bigger Blazes
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4
#EXTINF:-1 tvg-id="" tvg-name="For Bigger Escape" tvg-logo="https://images.unsplash.com/photo-1519681393784-d120267933ba?w-300" group-title="Aventura",For Bigger Escape
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4`;

        // Verificar se já existem canais
        if (this.state.channels.length === 0) {
            this.parseM3UContent(sampleM3U, 'Lista de Exemplo', 'exemplo');
            this.showNotification('Lista de exemplo carregada! Experimente adicionar suas próprias listas.', 'info');
        }
    }

    showNotification(message, type = 'info') {
        // Criar notificação
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Mostrar
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remover após 4 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 4000);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se estamos em um servidor (evitar problemas de CORS locais)
    const isLocalFile = window.location.protocol === 'file:';
    if (isLocalFile) {
        console.warn('Aviso: Executando como arquivo local. Algumas funcionalidades podem não funcionar devido a políticas de CORS.');
        
        // Adicionar aviso
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ffc107;
            color: #856404;
            padding: 10px;
            text-align: center;
            z-index: 9999;
            font-size: 14px;
        `;
        warning.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            Executando localmente. Para melhor experiência, sirva este arquivo através de um servidor HTTP.
            <button onclick="this.parentElement.style.display='none'" style="background:none; border:none; color:inherit; margin-left:10px; cursor:pointer;">
                <i class="fas fa-times"></i>
            </button>
        `;
        document.body.appendChild(warning);
    }
    
    // Iniciar aplicação
    window.app = new TVOnlineApp();
});
