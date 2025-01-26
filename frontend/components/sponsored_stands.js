export async function loadSponsoredStands() {
    const response = await fetch('<API Gateway URL>/get-sponsored-stands');
    if (!response.ok) {
        console.error('Error fetching sponsored stands:', response.statusText);
        return;
    }

    const stands = await response.json();
    const sponsoredList = document.getElementById('sponsoredList');
    sponsoredList.innerHTML = '';

    stands.forEach(({ stand_id, name, description }) => {
        const standDiv = document.createElement('div');
        standDiv.className = 'sponsored-stand';
        standDiv.innerHTML = `
            <div class="card">
                <h3>${name}</h3>
                <p>${description}</p>
            </div>
        `;
        sponsoredList.appendChild(standDiv);
    });
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadSponsoredStands();
});
