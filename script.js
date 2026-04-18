// GlowRoute Search - Real Data Version with Distance Sorting & Location Search
// Loads clinics from enriched-clinics.json and supports search, filters, sorting, glowscore

let allClinics = [];
let currentClinics = [];
let currentSort = 'recommended';
let clinicsList, template, resultsCount, searchInput, checkboxes, sortRadios;

// User location - will be set via browser geolocation or default
let userLocation = { lat: 25.7617, lng: -80.1918, name: 'Miami' }; // Default to Miami
let locationPermissionAsked = false;

// Mapping of common location search terms to coordinates
const LOCATION_MAP = {
    // Miami area
    'miami': { lat: 25.7617, lng: -80.1918, name: 'Miami' },
    'south beach': { lat: 25.7617, lng: -80.1918, name: 'South Beach' },
    'miami beach': { lat: 25.7907, lng: -80.1300, name: 'Miami Beach' },
    'miami dade': { lat: 25.7617, lng: -80.1918, name: 'Miami-Dade' },
    'downtown miami': { lat: 25.7617, lng: -80.1918, name: 'Downtown Miami' },
    'brickell': { lat: 25.7617, lng: -80.1918, name: 'Brickell' },
    
    // Other Florida cities
    'tampa': { lat: 27.9506, lng: -82.4572, name: 'Tampa' },
    'orlando': { lat: 28.5383, lng: -81.3792, name: 'Orlando' },
    'fort lauderdale': { lat: 26.1224, lng: -80.1373, name: 'Fort Lauderdale' },
    'west palm beach': { lat: 26.7153, lng: -80.0534, name: 'West Palm Beach' },
    'boca raton': { lat: 26.3683, lng: -80.1289, name: 'Boca Raton' },
    'naples': { lat: 26.1420, lng: -81.7948, name: 'Naples' },
    'sarasota': { lat: 27.3364, lng: -82.5307, name: 'Sarasota' },
    'jacksonville': { lat: 30.3322, lng: -81.6557, name: 'Jacksonville' },
    'clearwater': { lat: 27.9659, lng: -82.8001, name: 'Clearwater' },
    'st petersburg': { lat: 27.7676, lng: -82.6403, name: 'St. Petersburg' },
    
    // Regions
    'south florida': { lat: 26.1224, lng: -80.1373, name: 'South Florida' },
    'central florida': { lat: 28.5383, lng: -81.3792, name: 'Central Florida' },
    'florida': { lat: 27.9944, lng: -81.7603, name: 'Florida' },
};

// Haversine formula to calculate distance between two lat/lng points in miles
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Compute glowscore if not already present (tuned formula)
function computeGlowscore(clinic) {
    // Rating component (0-60)
    const rating = clinic.rating || 0;
    const ratingScore = rating * 12; // max 60
    
    // Review component with log scaling
    const reviewCount = clinic.reviewCount || 0;
    const reviewScore = Math.log10(reviewCount + 1) * 8; // max ~24 for 1000 reviews
    
    // Price tier component
    const priceTierScore = { '$': 0, '$$': 2, '$$$': 5, '$$$$': 10 };
    const priceTier = clinic.price_tier || '$$';
    const priceScore = priceTierScore[priceTier] || 0;
    
    // Service diversity component (max 15)
    const services = clinic.services || [];
    const diversityScore = Math.min(services.length, 10) * 1.5; // max 15
    
    // Sum and cap at 100
    let score = ratingScore + reviewScore + priceScore + diversityScore;
    score = Math.min(score, 100);
    score = Math.max(score, 0);
    
    return Math.round(score * 10) / 10;
}

// Get user location via browser geolocation API
function getUserLocation() {
    if (!navigator.geolocation) {
        console.log('Geolocation not supported by browser');
        return Promise.resolve(userLocation); // Return default
    }
    
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    name: 'Your Location'
                };
                console.log('Got user location:', newLocation);
                userLocation = newLocation;
                resolve(userLocation);
            },
            (error) => {
                console.log('Geolocation error:', error.message);
                // Keep default location
                resolve(userLocation);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    });
}

// Check if search term contains a known location
function extractLocationFromSearch(searchTerm) {
    const lowerTerm = searchTerm.toLowerCase().trim();
    
    // Check for exact matches first, then partial matches
    for (const [locationName, locationData] of Object.entries(LOCATION_MAP)) {
        if (lowerTerm === locationName || lowerTerm.includes(locationName)) {
            return locationData;
        }
    }
    
    return null;
}

// Load real clinic data
async function loadClinics() {
    try {
        const response = await fetch('./output/enriched-clinics.json');
        if (!response.ok) {
            throw new Error(`Failed to load clinic data: ${response.status}`);
        }
        
        const rawClinics = await response.json();
        
        // Transform raw clinic data to match expected structure
        allClinics = rawClinics.map((clinic, index) => ({
            id: index + 1,
            name: clinic.name || 'Unnamed Clinic',
            image: clinic.imageUrl || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1000',
            rating: clinic.rating || 0,
            reviews: clinic.reviewCount || 0,
            location: `${clinic.city || ''}, ${clinic.state || ''}`.trim(),
            description: clinic.description || 'Premium aesthetic clinic offering specialized treatments.',
            services: clinic.services || [],
            verified: true, // All clinics in enriched data are considered verified
            specialties: clinic.specialties || [],
            price_tier: clinic.price_tier || '$$',
            glowscore: clinic.glowscore || computeGlowscore(clinic),
            address: clinic.address || '',
            city: clinic.city || '',
            state: clinic.state || '',
            lat: clinic.lat || null,
            lng: clinic.lng || null
        }));
        
        console.log(`Loaded ${allClinics.length} clinics`);
        
        // Remove clinics without coordinates (they can't be sorted by distance)
        const clinicsWithCoords = allClinics.filter(c => c.lat && c.lng);
        const clinicsWithoutCoords = allClinics.filter(c => !c.lat || !c.lng);
        console.log(`${clinicsWithCoords.length} clinics have coordinates, ${clinicsWithoutCoords.length} missing coordinates`);
        
        // Initial render
        currentClinics = [...allClinics];
        renderClinics(currentClinics);
        
    } catch (error) {
        console.error('Error loading clinic data:', error);
        console.error('Error details:', error.message, error.stack);
        document.getElementById('clinicsList').innerHTML = 
            '<p style="color: var(--color-stone); font-size: 18px; margin-top: 2rem;">Unable to load clinic data: ' + error.message + '. Please try again later.</p>';
    }
}

function filterAndRender() {
    const searchTerm = searchInput.value.toLowerCase();
    
    const activeCheckboxes = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    // Check if search term contains a location
    const searchLocation = extractLocationFromSearch(searchTerm);
    let referenceLocation = userLocation;
    let locationSearchName = null;
    
    if (searchLocation) {
        referenceLocation = searchLocation;
        locationSearchName = searchLocation.name;
        console.log(`Location search detected: "${searchTerm}" -> ${locationSearchName}`);
    }

    const filtered = allClinics.filter(clinic => {
        // Search matches name, location, city, state, address, OR services
        const matchesSearch = clinic.name.toLowerCase().includes(searchTerm) || 
                              clinic.location.toLowerCase().includes(searchTerm) ||
                              clinic.city.toLowerCase().includes(searchTerm) ||
                              clinic.state.toLowerCase().includes(searchTerm) ||
                              clinic.address.toLowerCase().includes(searchTerm) ||
                              clinic.services.some(service => service.toLowerCase().includes(searchTerm));
        
        const matchesFilter = activeCheckboxes.length === 0 || 
                              activeCheckboxes.some(s => clinic.specialties.includes(s));

        return matchesSearch && matchesFilter;
    });

    currentClinics = filtered;
    
    // If location search detected, automatically sort by distance from that location
    if (searchLocation && currentSort !== 'distance') {
        // Temporarily switch to distance sort for this search
        sortByLocation(referenceLocation, locationSearchName);
    } else {
        sortAndRender();
    }
}

function sortAndRender() {
    let sorted = [...currentClinics];
    
    switch (currentSort) {
        case 'rating':
            sorted.sort((a, b) => b.rating - a.rating);
            break;
        case 'glowscore':
            sorted.sort((a, b) => b.glowscore - a.glowscore);
            break;
        case 'distance':
            // Sort by distance from user location
            sorted = sortByDistance(sorted, userLocation);
            break;
        case 'recommended':
        default:
            // Keep original order (maybe sort by glowscore as default)
            sorted.sort((a, b) => b.glowscore - a.glowscore);
            break;
    }
    
    renderClinics(sorted);
}

// Special sort for location search
function sortByLocation(referenceLocation, locationName) {
    let sorted = sortByDistance(currentClinics, referenceLocation);
    
    // Update results count to show location info
    const originalText = `${sorted.length} verified provider${sorted.length !== 1 ? 's' : ''}`;
    resultsCount.textContent = `${originalText} near ${locationName}`;
    
    renderClinics(sorted);
}

// Sort clinics by distance from reference location
function sortByDistance(clinics, referenceLocation) {
    if (!referenceLocation) return clinics;
    
    // Create a copy with distances
    const clinicsWithDistances = clinics.map(clinic => {
        let distance = null;
        if (clinic.lat && clinic.lng) {
            distance = calculateDistance(
                referenceLocation.lat, referenceLocation.lng,
                clinic.lat, clinic.lng
            );
        }
        return { ...clinic, distance };
    });
    
    // Sort: clinics with distance first, then those without
    return clinicsWithDistances.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1; // b comes first
        if (b.distance === null) return -1; // a comes first
        return a.distance - b.distance;
    });
}

function renderClinics(clinics) {
    clinicsList.innerHTML = '';
    
    // Reset results count if not already set by location search
    if (!resultsCount.textContent.includes('near')) {
        resultsCount.textContent = `${clinics.length} verified provider${clinics.length !== 1 ? 's' : ''}`;
    }

    if (clinics.length === 0) {
        clinicsList.innerHTML = '<p style="color: var(--color-stone); font-size: 18px; margin-top: 2rem;">No providers found matching your criteria. Try adjusting your filters.</p>';
        return;
    }

    clinics.forEach(clinic => {
        const clone = template.content.cloneNode(true);
        
        clone.querySelector('.clinic-name').textContent = clinic.name;
        clone.querySelector('.clinic-image').src = clinic.image;
        clone.querySelector('.clinic-image').alt = clinic.name;
        clone.querySelector('.review-count').textContent = `(${clinic.reviews} reviews)`;
        clone.querySelector('.clinic-location').textContent = clinic.location;
        clone.querySelector('.clinic-description').textContent = clinic.description;
        
        // Services tags
        const servicesList = clone.querySelector('.services-list');
        servicesList.innerHTML = ''; // Clear any default content
        clinic.services.forEach(service => {
            const span = document.createElement('span');
            span.className = 'service-tag';
            span.textContent = service;
            servicesList.appendChild(span);
        });

        // Adjust stars based on rating
        const starsContainer = clone.querySelector('.stars');
        const starsHTML = getStarsHTML(clinic.rating);
        starsContainer.innerHTML = starsHTML;
        
        // Add distance display if available
        if (clinic.distance !== undefined && clinic.distance !== null) {
            const locationElement = clone.querySelector('.clinic-location');
            const distanceText = document.createElement('span');
            distanceText.className = 'distance-badge';
            distanceText.textContent = `${clinic.distance.toFixed(1)} miles away`;
            locationElement.appendChild(distanceText);
        }

        clinicsList.appendChild(clone);
    });
}

function getStarsHTML(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            // Full star
            html += '<svg class="star-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
        } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
            // Half star (simulated by full star for now)
            html += '<svg class="star-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
        } else {
            // Empty star
            html += '<svg class="star-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
        }
    }
    return html;
}

document.addEventListener('DOMContentLoaded', () => {
    clinicsList = document.getElementById('clinicsList');
    template = document.getElementById('clinicCardTemplate');
    resultsCount = document.getElementById('resultsCount');
    searchInput = document.getElementById('searchInput');
    checkboxes = document.querySelectorAll('input[name="specialty"]');
    sortRadios = document.querySelectorAll('input[name="sort"]');
    
    // Load real data
    loadClinics();

    // Search Logic
    searchInput.addEventListener('input', (e) => {
        filterAndRender();
    });

    // Filter Logic
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            filterAndRender();
        });
    });

    // Sort Logic
    sortRadios.forEach(radio => {
        radio.addEventListener('change', async (e) => {
            currentSort = e.target.value;
            
            // If distance sort selected, try to get user location
            if (currentSort === 'distance' && !locationPermissionAsked) {
                locationPermissionAsked = true;
                try {
                    await getUserLocation();
                    console.log('Updated user location for distance sorting:', userLocation);
                } catch (err) {
                    console.log('Could not get user location:', err);
                }
            }
            
            sortAndRender();
        });
    });
});