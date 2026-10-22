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
