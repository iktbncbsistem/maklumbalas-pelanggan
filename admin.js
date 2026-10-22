import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://hohsvbbbtuwvcrmbfgjm.supabase.co';
const supabaseKey = 'sb_publishable_yDdaql6HnLx4akA6jyIWBA_V7Vs7nZU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function loadDashboardData() {
    // 1. Ambil data skor dari jadual jawapan_skala
    const { data: dataSkala, error: errorSkala } = await supabase
        .from('jawapan_skala')
        .select('skor');

    if (errorSkala) {
        console.error("Ralat ambil data skala:", errorSkala);
        return;
    }

    // Kira jumlah setiap skor (1 hingga 5)
    let skorCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    dataSkala.forEach(item => {
        if(skorCounts[item.skor] !== undefined) {
            skorCounts[item.skor]++;
        }
    });

    // 2. Lukis Graf menggunakan Chart.js
    const ctx = document.getElementById('skorChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar', // Boleh tukar ke 'pie' atau 'line'
        data: {
            labels: ['1 (Lemah)', '2 (Sederhana)', '3 (Memuaskan)', '4 (Baik)', '5 (Cemerlang)'],
            datasets: [{
                label: 'Jumlah Undian',
                data: [skorCounts[1], skorCounts[2], skorCounts[3], skorCounts[4], skorCounts[5]],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(255, 205, 86, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(75, 192, 192, 0.6)'
                ],
                borderColor: [
                    'rgb(255, 99, 132)',
                    'rgb(255, 159, 64)',
                    'rgb(255, 205, 86)',
                    'rgb(54, 162, 235)',
                    'rgb(75, 192, 192)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 } // Pastikan paksi Y hanya nombor bulat
                }
            }
        }
    });

    // 3. Ambil dan paparkan senarai cadangan
    const { data: dataCadangan, error: errorCadangan } = await supabase
        .from('jawapan_cadangan')
        .select('teks_cadangan');
        
    const divCadangan = document.getElementById('senaraiCadangan');
    divCadangan.innerHTML = ''; // Kosongkan mesej "Memuatkan data..."

    if (errorCadangan || dataCadangan.length === 0) {
        divCadangan.innerHTML = '<p>Tiada cadangan setakat ini.</p>';
        return;
    }

    dataCadangan.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cadangan-box';
        div.textContent = item.teks_cadangan;
        divCadangan.appendChild(div);
    });
}

// Jalankan fungsi bila halaman dibuka
loadDashboardData();
