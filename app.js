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

async function loadSoalan() {
    const { data, error } = await supabase
        .from('senarai_soalan')
        .select('*')
        .eq('status_aktif', true)
        .order('kategori')
        .order('kod_soalan');

    if (error) {
        console.error("Ralat ambil soalan:", error);
        return;
    }

    // 1. Letak arahan skala penilaian di bahagian atas sekali
    let htmlKandungan = `
        <div style="background: #e9ecef; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; border: 1px solid #ccc;">
            <strong style="font-size: 16px;">Panduan Skala Penilaian:</strong><br>
            <span style="display: inline-block; margin-top: 8px;">
                <strong>1</strong> - Lemah &nbsp;&nbsp;|&nbsp;&nbsp; 
                <strong>2</strong> - Sederhana &nbsp;&nbsp;|&nbsp;&nbsp; 
                <strong>3</strong> - Memuaskan &nbsp;&nbsp;|&nbsp;&nbsp; 
                <strong>4</strong> - Baik &nbsp;&nbsp;|&nbsp;&nbsp; 
                <strong>5</strong> - Cemerlang
            </span>
        </div>
    `;
    let kategoriSemasa = '';

    data.forEach(item => {
        // Buat tajuk kategori
        if (item.kategori !== kategoriSemasa) {
            htmlKandungan += `<h3 style="margin-top: 30px; border-bottom: 2px solid #007bff; padding-bottom: 5px;">${item.kategori}</h3>`;
            kategoriSemasa = item.kategori;
        }

        // 2. Bina kotak soalan (Radio Button dengan angka sahaja)
        htmlKandungan += `
            <div class="form-group soalan-item" data-kod="${item.kod_soalan}" data-kategori="${item.kategori}" data-soalan="${item.soalan}" style="margin-bottom: 20px; padding: 15px; background: #fff; border: 1px solid #eee; border-radius: 5px;">
                <label style="font-weight: bold; margin-bottom: 15px; display: block; font-size: 15px;">${item.kod_soalan}: ${item.soalan}</label>
                <div style="display: flex; gap: 30px; flex-wrap: wrap;">
                    <label style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold; font-size: 16px;"><input type="radio" name="skor_${item.kod_soalan}" value="1" style="transform: scale(1.3);" required> 1</label>
                    <label style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold; font-size: 16px;"><input type="radio" name="skor_${item.kod_soalan}" value="2" style="transform: scale(1.3);"> 2</label>
                    <label style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold; font-size: 16px;"><input type="radio" name="skor_${item.kod_soalan}" value="3" style="transform: scale(1.3);"> 3</label>
                    <label style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold; font-size: 16px;"><input type="radio" name="skor_${item.kod_soalan}" value="4" style="transform: scale(1.3);"> 4</label>
                    <label style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold; font-size: 16px;"><input type="radio" name="skor_${item.kod_soalan}" value="5" style="transform: scale(1.3);"> 5</label>
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

    try {
        // Ambil data asas dengan semakan selamat (elak ralat null)
        const emailInput = document.getElementById('email');
        const jabatanInput = document.getElementById('jabatan');
        const pengajarInput = document.getElementById('pengajar');
        const cadanganInput = document.getElementById('cadangan');

        const email = emailInput ? emailInput.value : '';
        const jabatanId = jabatanInput ? jabatanInput.value : '';
        const pengajarId = pengajarInput ? pengajarInput.value : null;
        const cadanganTeks = cadanganInput ? cadanganInput.value : '';

        const randomNum = Math.floor(100000 + Math.random() * 900000);
        const noTiket = `TKT-${randomNum}`;

       // A. Masukkan data ke jadual tiket_maklumbalas
        const { data: tiketData, error: tiketError } = await supabase
            .from('tiket_maklumbalas')
            .insert([{ 
                no_tiket: noTiket, 
                email_pelajar: email, 
                jabatan_id: jabatanId, 
                pengajar_id: pengajarId,
                subjek: subjekTeks // <--- TAMBAH INI SUPAYA MASUK DATABASE
            }])
            .select();
        
        if (tiketError) throw tiketError;
        const tiketId = tiketData[0].id;

        // B. Kutip SEMUA jawapan dari Radio Button secara automatik
        const semuaSoalan = document.querySelectorAll('.soalan-item');
        const senaraiJawapan = [];

        semuaSoalan.forEach(item => {
            const kod = item.getAttribute('data-kod');
            // Cari butang radio mana yang ditanda (checked)
            const jawapanDipilih = item.querySelector(`input[name="skor_${kod}"]:checked`);
            
            // PASTIKAN ada jawapan dipilih sebelum baca .value
            if (jawapanDipilih) {
                senaraiJawapan.push({
                    tiket_id: tiketId,
                    kategori: item.getAttribute('data-kategori'),
                    kod_soalan: kod,
                    soalan: item.getAttribute('data-soalan'),
                    skor: parseInt(jawapanDipilih.value)
                });
            }
        });

        // Masukkan semua jawapan ke database (Bulk Insert) jika ada
        if (senaraiJawapan.length > 0) {
            const { error: skalaError } = await supabase.from('jawapan_skala').insert(senaraiJawapan);
            if (skalaError) throw skalaError;
        }

        // C. Masukkan teks cadangan
        if (cadanganTeks.trim() !== '') {
            const { error: cadanganError } = await supabase.from('jawapan_cadangan').insert([{ tiket_id: tiketId, teks_cadangan: cadanganTeks }]);
            if (cadanganError) throw cadanganError;
        }

        // D. Papar mesej berjaya
        form.classList.add('hidden');
        const successMessage = document.getElementById('successMessage');
        const ticketNoSpan = document.getElementById('ticketNo');
        
        if(successMessage) successMessage.classList.remove('hidden');
        if(ticketNoSpan) ticketNoSpan.textContent = noTiket;

    } catch (error) {
        alert("Terdapat ralat semasa menghantar maklumbalas.");
        console.error(error);
    } finally {
        submitBtn.textContent = 'Hantar Maklumbalas';
        submitBtn.disabled = false;
    }
});
