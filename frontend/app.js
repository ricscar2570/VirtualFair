import { loadSponsoredStands } from './components/sponsored_stands.js';
import { loadRecommendations } from './components/recommendations.js';

document.addEventListener('DOMContentLoaded', () => {
    loadSponsoredStands();
    loadRecommendations('user123');
});
