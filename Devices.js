document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. CONFIGURAÇÃO DO SUPABASE ---
    const SUPABASE_URL = "https://kjjjaznitcpterzunbox.supabase.co";
    // ATENÇÃO: Verifique se esta é a sua chave 'anon' pública mais recente e correta.
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqamphem5pdGNwdGVyenVuYm94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTk3MDMsImV4cCI6MjA3NDc3NTcwM30.3Kb0oc7pmAhufrRxA3w3b_gyP6O09vVXWm4pcAsF1-A";
    
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const DEVICES_TABLE = "DispositivosRede";

    // --- 2. SELETORES DO DOM ---
    const devicesTableBody = document.querySelector('.devices-table tbody');
    const deviceCountSpan = document.getElementById('device-count-span');

    // --- 3. FUNÇÕES ---

    /**
     * Busca todos os dispositivos da tabela DispositivosRede e os renderiza.
     */
    async function fetchAndRenderDevices() {
        const { data, error } = await supabaseClient
            .from(DEVICES_TABLE)
            .select('*');

        if (error) {
            console.error('Erro ao buscar dispositivos:', error);
            devicesTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Erro ao carregar dispositivos.</td></tr>`;
            deviceCountSpan.textContent = 'Erro';
            return;
        }
        
        // Atualiza a contagem no cabeçalho
        deviceCountSpan.textContent = `${data.length} conectados`;

        // Renderiza a tabela
        renderDevices(data);
    }

    /**
     * Renderiza a lista de dispositivos na tabela HTML.
     * @param {Array} devices - O array de dispositivos vindo do Supabase.
     */
    function renderDevices(devices) {
        devicesTableBody.innerHTML = ''; // Limpa a tabela
        if (devices.length === 0) {
            devicesTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Nenhum dispositivo conectado encontrado.</td></tr>`;
            return;
        }

        devices.forEach(device => {
            const row = document.createElement('tr');
            
            // CORREÇÃO: Mapeia os dados com os nomes de coluna corretos
            row.innerHTML = `
                <td class="device-icon"><i class="fas fa-network-wired"></i></td>
                <td>${device.NomeDispositivo || 'N/A'}</td>
                <td>${device.IP || 'N/A'}</td>
                <td>${device.MAC || 'N/A'}</td>
                <td><span class="tag-gateway">${device.RaspberryNome || 'N/A'}</span></td>
                <td><span class="tag-status ativo">Ativo</span></td>
                <td class="actions">
                    <button class="action-btn info-btn"><i class="fas fa-info-circle"></i></button>
                </td>
            `;
            devicesTableBody.appendChild(row);
        });
    }

    // --- 4. INICIALIZAÇÃO ---
    
    // Chama a função principal para carregar os dados quando a página abrir
    fetchAndRenderDevices();
});