document.addEventListener('DOMContentLoaded', async function () {
    // --- 1. CONFIGURAÇÃO DO SUPABASE ---
    const SUPABASE_URL = "https://kjjjaznitcpterzunbox.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqamphem5pdGNwdGVyenVuYm94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxOTk3MDMsImV4cCI6MjA3NDc3NTcwM30.3Kb0oc7pmAhufrRxA3w3b_gyP6O09vVXWm4pcAsF1-A";

    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const RASPBERRY_DATA_TABLE = "DadosRaspberry";
    const DEVICES_TABLE = "DispositivosRede";
    const RPI_NAMES = ["RaspberryPrincipal", "RaspberrySecundario"];

    // Variáveis globais para os gráficos
    let ramChart, cpuChart, storageChart, temperatureChart;

    // Elemento do DOM para contagem
    const deviceCountElement = document.getElementById('device-count');

    // --- 2. FUNÇÕES PARA BUSCAR DADOS DO SUPABASE ---

    async function updateDeviceCount() {
        const { count, error } = await supabaseClient
            .from(DEVICES_TABLE)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Erro ao buscar contagem de dispositivos:', error);
            deviceCountElement.textContent = 'N/A';
        } else {
            deviceCountElement.textContent = count;
        }
    }

    async function fetchAllDevicesHistory() {
        const { data, error } = await supabaseClient
            .from(RASPBERRY_DATA_TABLE)
            .select('DataHora, RaspberryNome, ram_usage, cpu_usage, temperature, storage_usage')
            .in('RaspberryNome', RPI_NAMES)
            .order('DataHora', { ascending: false })
            .limit(50);

        if (error) {
            console.error(`Erro ao buscar histórico geral:`, error);
            return { labels: [], datasets: {} };
        }

        // Processar dados para o gráfico (inverte para ficar cronológico)
        const history = data.reverse();
        const labels = [...new Set(history.map(h => new Date(h.DataHora).toLocaleTimeString('pt-BR')))];

        const datasets = { ram: [], cpu: [], storage: [], temperature: [] };

        RPI_NAMES.forEach((name, index) => {
            const color1 = '#3498db'; // Azul
            const color2 = '#2ecc71'; // Verde (mudei para diferenciar melhor)
            const bgColor1 = 'rgba(52, 152, 219, 0.1)';
            const bgColor2 = 'rgba(46, 204, 113, 0.1)';

            const currentColor = index === 0 ? color1 : color2;
            const currentBgColor = index === 0 ? bgColor1 : bgColor2;

            const deviceHistory = history.filter(h => h.RaspberryNome === name);

            datasets.ram.push({
                label: name,
                data: deviceHistory.map(h => h.ram_usage),
                borderColor: currentColor, backgroundColor: currentBgColor, fill: true, tension: 0.4
            });
            datasets.cpu.push({
                label: name,
                data: deviceHistory.map(h => h.cpu_usage),
                borderColor: currentColor, backgroundColor: currentBgColor, fill: true, tension: 0.4
            });
            datasets.storage.push({
                label: name,
                data: deviceHistory.map(h => h.storage_usage),
                borderColor: currentColor, backgroundColor: currentBgColor, fill: true, tension: 0.4
            });
            datasets.temperature.push({
                label: name,
                data: deviceHistory.map(h => h.temperature),
                borderColor: currentColor, backgroundColor: currentBgColor, fill: true, tension: 0.4
            });
        });

        return { labels, datasets };
    }

    // --- 3. FUNÇÕES PARA RENDERIZAR E ATUALIZAR O DASHBOARD ---

    function initializeCharts() {
        // Gráfico de RAM
        ramChart = new Chart(document.getElementById('ramChart').getContext('2d'), {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { min: 0, max: 8.0, title: { display: true, text: 'GB %' } }
                }
            }
        });

        // Gráfico de CPU
        cpuChart = new Chart(document.getElementById('cpuChart').getContext('2d'), {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100, title: { display: true, text: '%' } }
                }
            }
        });

        // Gráfico de Storage
        storageChart = new Chart(document.getElementById('rpiTrafficChart').getContext('2d'), {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100, // Mude de 32 para 100
                        title: {
                            display: true,
                            text: '%' // Mude de 'GB' para '%'
                        }
                    }
                }
            }
        });

        // Gráfico de Temperatura
        temperatureChart = new Chart(document.getElementById('energyChart').getContext('2d'), {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: false, title: { display: true, text: '°C' } }
                }
            }
        });
    }

    async function updateDashboard() {
        // Atualiza contador de dispositivos
        updateDeviceCount();

        // Atualiza Gráficos
        const { labels, datasets } = await fetchAllDevicesHistory();

        ramChart.data.labels = labels;
        ramChart.data.datasets = datasets.ram;
        ramChart.update();

        cpuChart.data.labels = labels;
        cpuChart.data.datasets = datasets.cpu;
        cpuChart.update();

        storageChart.data.labels = labels;
        storageChart.data.datasets = datasets.storage;
        storageChart.update();

        temperatureChart.data.labels = labels;
        temperatureChart.data.datasets = datasets.temperature;
        temperatureChart.update();
    }

    // --- 4. INICIALIZAÇÃO ---

    initializeCharts();
    await updateDashboard();

    // Atualiza o dashboard a cada 30 segundos
    setInterval(() => {
        console.log('Atualizando dashboard...');
        updateDashboard();
    }, 30000);

});
