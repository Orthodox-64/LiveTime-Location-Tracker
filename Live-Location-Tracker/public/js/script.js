const socket = io();

// Initialize map with a fallback location (for the initial view)
const map = L.map("map").setView([0, 0], 10);

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Orthodox's-Map"
}).addTo(map);

// Create a marker for the current position (this will update)
let currentLocationMarker;

// Store markers for all users
const markers = {};

// Function to set the map's view and add a marker for the user's location
function updateMapView(latitude, longitude) {
    map.setView([latitude, longitude], 10); // Adjust zoom level as needed

    // If the marker already exists, update its position
    if (currentLocationMarker) {
        currentLocationMarker.setLatLng([latitude, longitude]);
    } else {
        // If marker does not exist, create it
        currentLocationMarker = L.marker([latitude, longitude]).addTo(map);
    }
}

// Watch position for updates
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("send-location", { latitude, longitude });
            updateMapView(latitude, longitude); // Update map with the current location
        },
        (error) => {
            console.error(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 3000,
            maximumAge: 0,
        }
    );
}

// Handle location updates from other clients
socket.on("all-users-location", (users) => {
    // Iterate through all users and create a marker for each one
    Object.keys(users).forEach((id) => {
        const { latitude, longitude } = users[id];
        if (latitude && longitude) {
            const marker = L.marker([latitude, longitude]).addTo(map);
            markers[id] = marker; // Store marker by user ID
        }
    });
});

socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;

    // Add or update the marker for the received location
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        const marker = L.marker([latitude, longitude]).addTo(map);
        markers[id] = marker;
    }
});

socket.on("user-disconnected", (id) => {
    // Remove the marker when a user disconnects
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});