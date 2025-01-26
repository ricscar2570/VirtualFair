export async function loadRecommendations(userId) {
    const response = await fetch(`<API Gateway URL>/get-recommendations?user_id=${userId}`);
    if (!response.ok) {
        console.error('Error fetching recommendations:', response.statusText);
        return;
    }

    const recommendations = await response.json();
    const recommendationsList = document.getElementById('recommendationsList');
    recommendationsList.innerHTML = '';

    recommendations.forEach(({ itemId, name }) => {
        const recommendationDiv = document.createElement('div');
        recommendationDiv.className = 'recommendation';
        recommendationDiv.innerHTML = `
            <div class="card">
                <h3>Recommended Stand: ${name}</h3>
                <p>Stand ID: ${itemId}</p>
            </div>
        `;
        recommendationsList.appendChild(recommendationDiv);
    });
}

// Call this function with a valid user ID when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const userId = 'user123'; // Replace with dynamic user ID
    loadRecommendations(userId);
});
