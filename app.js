import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// KONFIGURASI SUPABASE (Masukkan URL dan Key anda)
const supabaseUrl = 'https://hohsvbbbtuwvcrmbfgjm.supabase.co';
const supabaseKey = 'sb_publishable_yDdaql6HnLx4akA6jyIWBA_V7Vs7nZU';
const supabase = createClient(supabaseUrl, supabaseKey);

// DOM Elements
const jabatanSelect = document.getElementById('jabatan');
const pengajarSelect = document.getElementById('pengajar');
const form = document.getElementById('feedbackForm');
const successMessage = document.getElementById('successMessage');
const ticketNoSpan = document.getElementById('ticketNo');

// 1. Muatkan senarai Jabatan apabila halaman dibuka
async function loadJabatan() {
    const { data, error } = await supabase.from('jabatan').select('*').order('nama');
    if (error) console.error("Ralat ambil jabatan:", error);
    
    data.forEach(j => {
        const option = document.createElement('option');
        option.value = j.id;
        option.textContent = j.nama;
        jabatanSelect.appendChild(option);
    });
}
loadJabatan();

const soalanContainer = document.getElementById('dynamic-soalan-container');

// --- CARI BAHAGIAN INI DALAM app.js ---
async function loadSoalan() {
    const { data, error } = await supabase
        .from('senarai_soalan')
        .select('*')
        .eq('status_aktif', true)
        .order('kategori') // Susunan pertama: Ikut Kategori
        .order('kod_soalan'); // <--- TAMBAH BARIS INI: Susunan kedua: Ikut Kod Soalan (A1, A2, F1, F2 dll)

    if (error) {
        console.error("Ralat ambil soalan:", error);
        return;
    }

    let htmlKandungan = '';
    let kategoriSemasa = '';

    data.forEach(item => {
        // Buat tajuk kategori jika ia kategori baharu
        if (item.kategori !== kategoriSemasa) {
            htmlKandungan += `<h3>Bahagian: ${item.kategori}</h3>`;
            kategoriSemasa = item.kategori;
        }

        // Bina kotak soalan (Menggunakan Radio Button)
        htmlKandungan += `
            <div class="form-group soalan-item" data-kod="${item.kod_soalan}" data-kategori="${item.kategori}" data-soalan="${item.soalan}">
                <label style="font-weight: bold;">${item.kod_soalan}: ${item.soalan}</label>
                <div style="display: flex; gap: 15px; margin-top: 10px; flex-wrap: wrap;">
                    <label style="cursor: pointer;"><input type="radio" name="skor_${item.kod_soalan}" value="1" required> 1 - Lemah</label>
                    <label style="cursor: pointer;"><input type="radio" name="skor_${item.kod_soalan}" value="2"> 2 - Sederhana</label>
                    <label style="cursor: pointer;"><input type="radio" name="skor_${item.kod_soalan}" value="3"> 3 - Memuaskan</label>
                    <label style="cursor: pointer;"><input type="radio" name="skor_${item.kod_soalan}" value="4"> 4 - Baik</label>
                    <label style="cursor: pointer;"><input type="radio" name="skor_${item.kod_soalan}" value="5"> 5 - Cemerlang</label>
                </div>
            </div>
        `;
    });

    soalanContainer.innerHTML = htmlKandungan;
}

// Panggil fungsi ini supaya soalan dimuatkan bila page dibuka
loadSoalan();

// 2. Kemaskini senarai Pengajar apabila Jabatan dipilih
jabatanSelect.addEventListener('change', async (e) => {
    const jabatanId = e.target.value;
    pengajarSelect.innerHTML = '<option value="">Sila Pilih Pengajar...</option>';
    pengajarSelect.disabled = true;

    if (!jabatanId) return;

    // Hanya ambil pengajar yang berstatus aktif
    const { data, error } = await supabase
        .from('pengajar')
        .select('*')
        .eq('jabatan_id', jabatanId)
        .eq('status_aktif', true);

    if (error) {
        console.error("Ralat ambil pengajar:", error);
        return;
    }

    data.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.nama;
        pengajarSelect.appendChild(option);
    });
    pengajarSelect.disabled = false;
});

// 3. Hantar Data apabila borang disubmit
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = 'Menghantar...';
    submitBtn.disabled = true;

    const email = document.getElementById('email').value;
    const jabatanId = jabatanSelect.value;
    const pengajarId = pengajarSelect.value;
    const skorT1 = document.getElementById('T1').value;
    const cadanganTeks = document.getElementById('cadangan').value;

    // Jana nombor tiket rawak (Contoh: TKT-123456)
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const noTiket = `TKT-${randomNum}`;

    try {
        // A. Masukkan data ke jadual tiket_maklumbalas
        const { data: tiketData, error: tiketError } = await supabase
            .from('tiket_maklumbalas')
            .insert([{ 
                no_tiket: noTiket, 
                email_pelajar: email, 
                jabatan_id: jabatanId, 
                pengajar_id: pengajarId 
            }])
            .select();
        if (tiketError) throw tiketError;

        const tiketId = tiketData[0].id;

        // B. Masukkan markah skala
        const { error: skalaError } = await supabase
            .from('jawapan_skala')
            .insert([{
                tiket_id: tiketId,
                kategori: 'Pengajaran',
                kod_soalan: 'T1',
                soalan: 'Pengajar bertugas menepati masa',
                skor: parseInt(skorT1)
            }]);
        if (skalaError) throw skalaError;

        // C. Masukkan teks cadangan
        const { error: cadanganError } = await supabase
            .from('jawapan_cadangan')
            .insert([{
                tiket_id: tiketId,
                teks_cadangan: cadanganTeks
            }]);
        if (cadanganError) throw cadanganError;

        // Paparkan mesej berjaya
        form.classList.add('hidden');
        successMessage.classList.remove('hidden');
        ticketNoSpan.textContent = noTiket;

    } catch (error) {
        alert("Terdapat ralat semasa menghantar maklumbalas. Sila cuba lagi.");
        console.error(error);
    } finally {
        submitBtn.textContent = 'Hantar Maklumbalas';
        submitBtn.disabled = false;
    }
});
