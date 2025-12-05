/**
 * M3U Parser - Analisador de listas M3U/M3U8
 * Suporta parsing de arquivos M3U locais e URLs remotas
 */
class M3UParser {
    constructor() {
        this.channels = [];
        this.categories = new Set();
    }

    /**
     * Analisa conteúdo M3U de um arquivo ou texto
     * @param {string} content - Conteúdo M3U
     * @returns {Array} Lista de canais parseados
     */
    parse(content) {
        this.channels = [];
        this.categories.clear();
        
        const lines = content.split('\n');
        let currentChannel = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('#EXTINF:')) {
                currentChannel = this.parseExtInf(line);
            } 
            else if (line && !line.startsWith('#') && currentChannel) {
                currentChannel.url = line;
                this.processChannel(currentChannel);
                currentChannel = null;
            }
            else if (line.startsWith('#EXTM3U')) {
                // Cabeçalho M3U, continuar
                continue;
            }
        }
        
        return {
            channels: this.channels,
            categories: Array.from(this.categories).sort()
        };
    }

    /**
     * Analisa linha #EXTINF para extrair metadados
     * @param {string} line - Linha #EXTINF
     * @returns {Object} Objeto de canal com metadados
     */
    parseExtInf(line) {
        const channel = {
            id: this.generateId(),
            name: 'Canal Sem Nome',
            logo: '',
            group: 'Geral',
            url: '',
            isFavorite: false
        };
        
        // Extrair duração e atributos
        const match = line.match(/#EXTINF:(-?\d+)(.*)/);
        if (!match) return channel;
        
        // Extrair atributos
        const attributes = match[2];
        const attrRegex = /([a-zA-Z]+)="([^"]*)"/g;
        let attrMatch;
        
        while ((attrMatch = attrRegex.exec(attributes)) !== null) {
            const [_, key, value] = attrMatch;
            
            switch (key.toLowerCase()) {
                case 'tvg-name':
                    channel.name = value || channel.name;
                    break;
                case 'tvg-logo':
                    channel.logo = value;
                    break;
                case 'group-title':
                    channel.group = value || channel.group;
                    break;
                case 'tvg-id':
                    channel.tvgId = value;
                    break;
            }
        }
        
        // Extrair nome se não encontrado nos atributos
        if (channel.name === 'Canal Sem Nome') {
            const nameMatch = attributes.match(/,(.*)$/);
            if (nameMatch) {
                channel.name = nameMatch[1].trim();
            }
        }
        
        // Adicionar categoria ao conjunto
        this.categories.add(channel.group);
        
        return channel;
    }

    /**
     * Processa e adiciona canal à lista
     * @param {Object} channel - Canal para processar
     */
    processChannel(channel) {
        // Validar URL
        if (!channel.url || !this.isValidUrl(channel.url)) {
            console.warn(`URL inválida para canal: ${channel.name}`);
            return;
        }
        
        // Verificar se o canal já existe (por nome)
        const exists = this.channels.some(c => 
            c.name === channel.name && c.url === channel.url
        );
        
        if (!exists) {
            this.channels.push(channel);
        }
    }

    /**
     * Gera ID único para canal
     * @returns {string} ID único
     */
    generateId() {
        return 'ch_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Valida se a URL é válida
     * @param {string} url - URL para validar
     * @returns {boolean} True se válida
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return /^(https?|rtmp|rtsp|mms):\/\//i.test(url) || url.startsWith('//');
        }
    }

    /**
     * Carrega e parseia arquivo M3U
     * @param {File} file - Arquivo M3U
     * @returns {Promise} Promise com os canais parseados
     */
    parseFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const content = event.target.result;
                    const result = this.parse(content);
                    resolve(result);
                } catch (error) {
                    reject(new Error('Erro ao analisar arquivo M3U: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Erro ao ler arquivo'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Carrega M3U de URL remota
     * @param {string} url - URL do arquivo M3U
     * @returns {Promise} Promise com os canais parseados
     */
    parseFromUrl(url) {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(url, {
                    headers: {
                        'Accept': 'application/x-mpegurl, application/vnd.apple.mpegurl, text/plain'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const content = await response.text();
                const result = this.parse(content);
                resolve(result);
            } catch (error) {
                reject(new Error('Erro ao carregar M3U da URL: ' + error.message));
            }
        });
    }

    /**
     * Filtra canais por categoria
     * @param {Array} channels - Lista de canais
     * @param {string} category - Categoria para filtrar
     * @returns {Array} Canais filtrados
     */
    filterByCategory(channels, category) {
        if (!category || category === 'Todas') return channels;
        return channels.filter(channel => channel.group === category);
    }

    /**
     * Busca canais por nome
     * @param {Array} channels - Lista de canais
     * @param {string} query - Termo de busca
     * @returns {Array} Canais encontrados
     */
    searchChannels(channels, query) {
        if (!query) return channels;
        
        const searchTerm = query.toLowerCase();
        return channels.filter(channel => 
            channel.name.toLowerCase().includes(searchTerm) ||
            channel.group.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Ordena canais por nome
     * @param {Array} channels - Lista de canais
     * @returns {Array} Canais ordenados
     */
    sortChannels(channels) {
        return [...channels].sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            
            // Primeiro, canais favoritos
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            
            // Depois, ordenação alfabética
            return nameA.localeCompare(nameB);
        });
    }
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = M3UParser;
}
