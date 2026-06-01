async function loadCalallooLogo() {
    const parts = ['aa', 'ab', 'ac', 'ad', 'ae', 'af', 'ag', 'ah', 'ai', 'aj', 'ak', 'al', 'am', 'an', 'ao', 'ap', 'aq', 'ar', 'as', 'at', 'au', 'av', 'aw', 'ax'];
    let fullBase64 = '';
    try {
        for (const p of parts) {
            const response = await fetch(`/assets/logo_parts/logo_part_${p}.txt`);
            const text = await response.text();
            fullBase64 += text;
        }
        const logoImg = document.getElementById('calalloo-logo');
        if (logoImg) {
            logoImg.src = 'data:image/png;base64,' + fullBase64;
        }
    } catch (e) {
        console.error('Error loading logo:', e);
    }
}
window.addEventListener('DOMContentLoaded', loadCalallooLogo);
