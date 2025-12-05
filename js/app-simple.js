// TV Online Premium - JavaScript Simplificado
console.log('TV Online Premium iniciando...');

// Esperar DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, iniciando aplicação...');
    
    // Elementos básicos
    const splashScreen = document.getElementById('splash-screen');
    const videoPlayer = document.getElementById('video-player');
    const playBtn = document.getElementById('play-btn');
    const searchInput = document.getElementById('channel-search');
    const channelsGrid = document.getElementById('channels-grid');
    
    // Estado simples
    let isPlaying = false;
    let channels = [];
    
    // Inicializar
    init();
    
    function init() {
        console.log('Inicializando...');
        
        // Esconder splash screen após 2 segundos
        setTimeout(function() {
            if (splashScreen) {
                splashScreen.style.opacity = '0';
                setTimeout(function() {
                    splashScreen.style.display = 'none';
                    console.log('Splash screen escondida');
                    loadChannels();
                }, 500);
            } else {
                console.log('Splash screen não encontrada');
                loadChannels();
            }
        }, 2000);
        
        // Configurar controles básicos
        setupControls();
    }
    
    function setupControls() {
        // Play/Pause
        if (playBtn && videoPlayer) {
            playBtn.addEventListener('click', function() {
                if (videoPlayer.paused) {
                    videoPlayer.play();
                    playBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                } else {
                    videoPlayer.pause();
                    playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
                }
            });
        }
        
        // Busca
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                const query = e.target.value.toLowerCase();
                filterChannels(query);
            });
        }
        
        // Teclas de atalho
        document.addEventListener('keydown', function(e) {
            // Espaço para play/pause
            if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                if (playBtn) playBtn.click();
            }
            
            // F para tela cheia
            if (e.code === 'KeyF' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                if (videoPlayer.requestFullscreen) {
                    videoPlayer.requestFullscreen();
                }
            }
        });
    }
    
    function loadChannels() {
        console.log('Carregando canais...');
        
        // Canais de exemplo
        channels = [
            {
                id: 1,
                name: 'Canal Exemplo 1 - Filmes',
                category: 'Filmes',
                logo: '',
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
            },
            {
                id: 2,
                name: 'Canal Exemplo 2 - Esportes',
                category: 'Esportes',
                logo: '',
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
            },
            {
                id: 3,
                name: 'Canal Exemplo 3 - Notícias',
                category: 'Notícias',
                logo: '',
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
            },
            {
                id: 4,
                name: 'Canal Exemplo 4 - Documentários',
                category: 'Documentários',
                logo: '',
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
            }
        ];
        
        renderChannels(channels);
        showNotification('Canais carregados com sucesso!');
    }
    
    function renderChannels(channelList) {
        if (!channelsGrid) {
            console.error('Elemento channels-grid não encontrado');
            return;
        }
        
        channelsGrid.innerHTML = '';
        
        channelList.forEach(function(channel) {
            const channelCard = document.createElement('div');
            channelCard.className = 'channel-card';
            channelCard.innerHTML = `
                <div class="channel-logo">
                    <div class="placeholder">
                        <i class="fas fa-tv"></i>
                    </div>
                </div>
                <div class="channel-info">
                    <div class="channel-name">${channel.name}</div>
                    <div class="channel-category">
                        <i class="fas fa-tag"></i>
                        <span>${channel.category}</span>
                    </div>
                </div>
            `;
            
            channelCard.addEventListener('click', function() {
                playChannel(channel);
            });
            
            channelsGrid.appendChild(channelCard);
        });
        
        console.log(`${channelList.length} canais renderizados`);
    }
    
    function playChannel(channel) {
        console.log('Reproduzindo:', channel.name);
        
        // Atualizar título
        const title = document.getElementById('current-channel');
        if (title) {
            title.textContent = channel.name;
        }
        
        // Definir e reproduzir vídeo
        videoPlayer.src = channel.url;
        videoPlayer.play().then(function() {
            if (playBtn) {
                playBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            }
            showNotification(`Reproduzindo: ${channel.name}`);
        }).catch(function(error) {
            console.error('Erro ao reproduzir:', error);
            showNotification('Erro ao reproduzir vídeo. Verifique o console.');
        });
    }
    
    function filterChannels(query) {
        if (!query.trim()) {
            renderChannels(channels);
            return;
        }
        
        const filtered = channels.filter(function(channel) {
            return channel.name.toLowerCase().includes(query) ||
                   channel.category.toLowerCase().includes(query);
        });
        
        renderChannels(filtered);
        
        if (filtered.length === 0) {
            channelsGrid.innerHTML = `
                <div class="no-channels">
                    <i class="fas fa-search"></i>
                    <h3>Nenhum canal encontrado</h3>
                    <p>Tente outra busca ou limpe o campo de pesquisa.</p>
                </div>
            `;
        }
    }
    
    function showNotification(message, type) {
        console.log('Notificação:', message);
        
        // Criar notificação simples
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        if (type === 'error') {
            notification.classList.add('error');
        } else {
            notification.classList.add('success');
        }
        
        document.body.appendChild(notification);
        
        // Mostrar
        setTimeout(function() {
            notification.classList.add('show');
        }, 10);
        
        // Remover após 3 segundos
        setTimeout(function() {
            notification.classList.remove('show');
            setTimeout(function() {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    console.log('Aplicação inicializada com sucesso!');
});

// Fallback: garantir que algo apareça
setTimeout(function() {
    const splash = document.getElementById('splash-screen');
    if (splash && splash.style.display !== 'none') {
        console.log('Fallback: escondendo splash screen forçadamente');
        splash.style.display = 'none';
        
        // Mostrar conteúdo principal
        const main = document.querySelector('.app-container');
        if (main) {
            main.style.display = 'block';
            main.style.opacity = '1';
        }
    }
}, 5000); // 5 segundos máximo
