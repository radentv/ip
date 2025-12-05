// Script de correção para inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Forçar esconder o splash screen após 3 segundos (fallback)
    setTimeout(function() {
        const splashScreen = document.getElementById('splash-screen');
        const appContainer = document.querySelector('.app-container');
        
        if (splashScreen) {
            splashScreen.style.opacity = '0';
            splashScreen.style.visibility = 'hidden';
            
            setTimeout(function() {
                splashScreen.style.display = 'none';
            }, 500);
        }
        
        if (appContainer) {
            appContainer.style.opacity = '1';
        }
        
        // Mostrar mensagem de boas-vindas
        console.log('TV Online Premium carregado!');
    }, 3000);
    
    // Inicializar aplicação mesmo com erros
    try {
        if (typeof app !== 'undefined') {
            console.log('Aplicação inicializada com sucesso');
        }
    } catch (error) {
        console.warn('Erro na inicialização da aplicação:', error);
        
        // Carregar interface básica mesmo com erro
        loadBasicInterface();
    }
});

function loadBasicInterface() {
    // Carregar interface mínima funcional
    const noChannels = document.getElementById('no-channels');
    if (noChannels) {
        noChannels.style.display = 'block';
    }
    
    // Habilitar botões básicos
    const buttons = ['upload-btn', 'xtream-login-btn', 'upload-action', 'login-action'];
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = function() {
                alert('Funcionalidade básica ativada. Para recursos completos, verifique o console (F12) para erros.');
            };
        }
    });
}
