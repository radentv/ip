/**
 * Xtream Codes API Client
 * Gerencia autenticação e requisições para servidores Xtream Codes
 */
class XtreamAPI {
    constructor() {
        this.baseUrl = '';
        this.username = '';
        this.password = '';
        this.authenticated = false;
        this.session = {
            username: '',
            password: '',
            server_url: ''
        };
        this.categories = [];
        this.channels = [];
        this.userInfo = null;
    }

    /**
     * Configura conexão com servidor Xtream
     * @param {string} serverUrl - URL do servidor
     * @param {string} username - Nome de usuário
     * @param {string} password - Senha
     * @returns {Promise} Promise com resultado da autenticação
     */
    async connect(serverUrl, username, password) {
        try {
            // Validar URL do servidor
            const url = this.normalizeServerUrl(serverUrl);
            
            // Testar conexão e autenticação
            const authResult = await this.authenticate(url, username, password);
            
            if (authResult.success) {
                this.baseUrl = url;
                this.username = username;
                this.password = password;
                this.authenticated = true;
                this.session = {
                    username: username,
                    password: password,
                    server_url: url
                };
                
                // Salvar credenciais no localStorage
                this.saveCredentials();
                
                return {
                    success: true,
                    message: 'Conectado com sucesso!',
                    user_info: authResult.user_info
                };
            } else {
                throw new Error(authResult.message || 'Falha na autenticação');
            }
        } catch (error) {
            console.error('Erro na conexão Xtream:', error);
            return {
                success: false,
                message: error.message || 'Erro ao conectar ao servidor'
            };
        }
    }

    /**
     * Normaliza URL do servidor
     * @param {string} serverUrl - URL do servidor
     * @returns {string} URL normalizada
     */
    normalizeServerUrl(serverUrl) {
        let url = serverUrl.trim();
        
        // Remover barras finais
        url = url.replace(/\/$/, '');
        
        // Adicionar protocolo se não existir
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'http://' + url;
        }
        
        return url;
    }

    /**
     * Autentica no servidor Xtream
     * @param {string} serverUrl - URL do servidor
     * @param {string} username - Nome de usuário
     * @param {string} password - Senha
     * @returns {Promise} Promise com resultado da autenticação
     */
    async authenticate(serverUrl, username, password) {
        const apiUrl = `${serverUrl}/player_api.php?username=${username}&password=${password}`;
        
        try {
            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.user_info && data.user_info.auth === 1) {
                this.userInfo = data.user_info;
                return {
                    success: true,
                    user_info: data.user_info,
                    server_info: data.server_info
                };
            } else {
                return {
                    success: false,
                    message: 'Credenciais inválidas ou conta expirada'
                };
            }
        } catch (error) {
            console.error('Erro na autenticação:', error);
            throw new Error('Não foi possível conectar ao servidor. Verifique a URL e suas credenciais.');
        }
    }

    /**
     * Obtém lista de canais ao vivo
     * @returns {Promise} Promise com lista de canais
     */
    async getLiveChannels() {
        if (!this.authenticated) {
            throw new Error('Não autenticado. Conecte-se primeiro.');
        }
        
        const apiUrl = `${this.baseUrl}/player_api.php?username=${this.username}&password=${this.password}&action=get_live_streams`;
        
        try {
            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const streams = await response.json();
            this.channels = this.processStreams(streams);
            return this.channels;
        } catch (error) {
            console.error('Erro ao obter canais:', error);
            throw error;
        }
    }

    /**
     * Obtém categorias de canais ao vivo
     * @returns {Promise} Promise com lista de categorias
     */
    async getLiveCategories() {
        if (!this.authenticated) {
            throw new Error('Não autenticado. Conecte-se primeiro.');
        }
        
        const apiUrl = `${this.baseUrl}/player_api.php?username=${this.username}&password=${this.password}&action=get_live_categories`;
        
        try {
            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const categories = await response.json();
            this.categories = categories.map(cat => cat.category_name);
            return this.categories;
        } catch (error) {
            console.error('Erro ao obter categorias:', error);
            throw error;
        }
    }

    /**
     * Processa streams da API para formato padrão
     * @param {Array} streams - Streams da API
     * @returns {Array} Canais processados
     */
    processStreams(streams) {
        return streams.map(stream => ({
            id: `xtream_${stream.stream_id}`,
            name: stream.name || `Canal ${stream.stream_id}`,
            logo: stream.stream_icon || '',
            group: stream.category_name || 'Geral',
            url: this.buildStreamUrl(stream.stream_id),
            tvgId: stream.epg_channel_id || '',
            isFavorite: false,
            type: 'live',
            streamId: stream.stream_id,
            num: stream.num || 0
        }));
    }

    /**
     * Constrói URL de stream
     * @param {number} streamId - ID do stream
     * @returns {string} URL do stream
     */
    buildStreamUrl(streamId) {
        return `${this.baseUrl}/live/${this.username}/${this.password}/${streamId}.m3u8`;
    }

    /**
     * Obtém guia eletrônica (EPG) para um canal
     * @param {string} channelId - ID do canal
     * @returns {Promise} Promise com dados do EPG
     */
    async getEpgForChannel(channelId) {
        if (!this.authenticated) {
            throw new Error('Não autenticado. Conecte-se primeiro.');
        }
        
        // Extrair stream_id do channelId
        const streamId = channelId.replace('xtream_', '');
        const apiUrl = `${this.baseUrl}/player_api.php?username=${this.username}&password=${this.password}&action=get_short_epg&stream_id=${streamId}&limit=5`;
        
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                return null;
            }
            
            const epgData = await response.json();
            return epgData;
        } catch (error) {
            console.error('Erro ao obter EPG:', error);
            return null;
        }
    }

    /**
     * Salva credenciais no localStorage
     */
    saveCredentials() {
        try {
            const credentials = {
                server_url: this.baseUrl,
                username: this.username,
                password: this.password,
                timestamp: Date.now()
            };
            localStorage.setItem('xtream_credentials', JSON.stringify(credentials));
        } catch (error) {
            console.error('Erro ao salvar credenciais:', error);
        }
    }

    /**
     * Carrega credenciais do localStorage
     * @returns {Object|null} Credenciais salvas ou null
     */
    loadCredentials() {
        try {
            const saved = localStorage.getItem('xtream_credentials');
            if (saved) {
                const credentials = JSON.parse(saved);
                
                // Verificar se as credenciais não são muito antigas (30 dias)
                const thirtyDays = 30 * 24 * 60 * 60 * 1000;
                if (Date.now() - credentials.timestamp < thirtyDays) {
                    return credentials;
                } else {
                    this.clearCredentials();
                }
            }
        } catch (error) {
            console.error('Erro ao carregar credenciais:', error);
        }
        
        return null;
    }

    /**
     * Limpa credenciais salvas
     */
    clearCredentials() {
        localStorage.removeItem('xtream_credentials');
        this.authenticated = false;
        this.session = {};
    }

    /**
     * Testa se a conexão está ativa
     * @returns {Promise} Promise com resultado do teste
     */
    async testConnection() {
        if (!this.authenticated) {
            return { success: false, message: 'Não autenticado' };
        }
        
        try {
            const apiUrl = `${this.baseUrl}/player_api.php?username=${this.username}&password=${this.password}`;
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                return { success: true, message: 'Conexão ativa' };
            } else {
                return { success: false, message: `HTTP ${response.status}` };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Obtém informações do servidor
     * @returns {Promise} Promise com informações do servidor
     */
    async getServerInfo() {
        if (!this.authenticated) {
            throw new Error('Não autenticado. Conecte-se primeiro.');
        }
        
        const apiUrl = `${this.baseUrl}/player_api.php?username=${this.username}&password=${this.password}&action=get_simple_data_table`;
        
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao obter informações do servidor:', error);
            throw error;
        }
    }
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = XtreamAPI;
}
