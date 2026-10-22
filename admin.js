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


// Fungsi untuk tambah soalan baharu dari Admin
const formTambah = document.getElementById('formTambahSoalan');
if (formTambah) {
    formTambah.addEventListener('submit', async (e) => {
        e.preventDefault();
        const kategori = document.getElementById('kategoriBaru').value;
        const kod = document.getElementById('kodBaru').value;
        const soalan = document.getElementById('soalanBaru').value;

        const { error } = await supabase
            .from('senarai_soalan')
            .insert([{ kategori: kategori, kod_soalan: kod, soalan: soalan }]);

        if (error) {
            alert("Ralat menambah soalan!");
            console.error(error);
        } else {
            alert("Soalan berjaya ditambah!");
            formTambah.reset(); // Kosongkan borang
            paparSenaraiSoalan();
        }
    });
}
// --- FUNGSI UNTUK PAPAR, EDIT & PADAM SOALAN ---
async function paparSenaraiSoalan() {
    const tbody = document.getElementById('senaraiSoalanBody');
    if (!tbody) return;

    // Tarik data dari database
    const { data, error } = await supabase
        .from('senarai_soalan')
        .select('*')
        .order('kategori')
        .order('kod_soalan');

    if (error) {
        console.error("Ralat ambil soalan:", error);
        tbody.innerHTML = '<tr><td colspan="4" style="padding:10px; text-align:center;">Gagal memuatkan data.</td></tr>';
        return;
    }

    tbody.innerHTML = ''; 

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="padding:10px; text-align:center;">Tiada soalan direkodkan.</td></tr>';
        return;
    }

    // Bina baris jadual untuk setiap soalan beserta ikon Edit dan Delete
    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 8px; border: 1px solid #ddd;">${item.kategori}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.kod_soalan}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.soalan}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center; white-space: nowrap;">
                <button class="btn-edit" data-id="${item.id}" data-kategori="${item.kategori}" data-kod="${item.kod_soalan}" data-soalan="${item.soalan}" style="background: #ffc107; color: #000; border: none; padding: 6px 10px; cursor: pointer; border-radius: 4px; margin-right: 5px;" title="Edit Soalan">✏️</button>
                <button class="btn-padam" data-id="${item.id}" style="background: #dc3545; color: white; border: none; padding: 6px 10px; cursor: pointer; border-radius: 4px;" title="Padam Soalan">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Fungsi Click pada butang Edit (Pensel)
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const btnElement = e.currentTarget;
            const id = btnElement.getAttribute('data-id');
            
            // Paparkan popup (prompt) untuk admin kemaskini data
            const newKategori = prompt("Kemaskini Kategori:", btnElement.getAttribute('data-kategori'));
            if (newKategori === null) return; // Terbatal jika admin tekan Cancel
            
            const newKod = prompt("Kemaskini Kod Soalan:", btnElement.getAttribute('data-kod'));
            if (newKod === null) return; 
            
            const newSoalan = prompt("Kemaskini Soalan Penuh:", btnElement.getAttribute('data-soalan'));
            if (newSoalan === null) return;

            // Hantar data kemaskini ke Supabase
            const { error: updateErr } = await supabase
                .from('senarai_soalan')
                .update({ kategori: newKategori, kod_soalan: newKod, soalan: newSoalan })
                .eq('id', id);

            if (updateErr) {
                alert("Ralat mengemaskini soalan.");
                console.error(updateErr);
            } else {
                alert("Soalan berjaya dikemaskini!");
                paparSenaraiSoalan(); // Refresh jadual secara automatik
            }
        });
    });

    // Fungsi Click pada butang Padam (Tong Sampah)
    document.querySelectorAll('.btn-padam').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            if (confirm("Adakah anda pasti mahu memadam soalan ini?")) {
                const { error: delErr } = await supabase.from('senarai_soalan').delete().eq('id', id);
                if (delErr) {
                    alert("Ralat memadam soalan.");
                    console.error(delErr);
                } else {
                    alert("Soalan berjaya dipadam!");
                    paparSenaraiSoalan(); 
                }
            }
        });
    });
}

// Panggil fungsi ini supaya jadual dimuatkan terus bila admin buka page
paparSenaraiSoalan();
