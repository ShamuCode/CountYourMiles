console.log('Hello there, what are you doing here? 🤨');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('./serviceWorker.js')
            .then(function (registration) {
                console.log('ServiceWorker registration successful');
            }, function (err) {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

document.getElementById('logo').onclick = () => {
    document.getElementById('about').style.display = 'flex';
}

document.getElementById('closeAboutBtn').onclick = () => {
    document.getElementById('about').style.display = 'none';
}

document.getElementById('addToHomeScreenTuto').onclick = () => {
    document.getElementById('addToHomeScreenMessage').style.display = 'flex';
};

document.getElementById('closeAddToHomeScreenMessage').onclick = () => {
    document.getElementById('addToHomeScreenMessage').style.display = 'none';
    document.getElementById('addToHomeScreenOverlay').style.display = 'none';
};

document.getElementById('pinGuideBtn').onclick = () => {
    document.getElementById('pinGuideOverlay').style.display = 'flex';
}

document.getElementById('closePinGuideBtn').onclick = () => {
    document.getElementById('pinGuideOverlay').style.display = 'none';
};

document.getElementById('openiosGuideBtn').onclick = () => {
    if (document.getElementById('iosGuide').style.display === 'flex') {
        document.getElementById('iosGuide').style.display = 'none';
    } else {
        document.getElementById('iosGuide').style.display = 'flex';
    }
    document.getElementById('androidGuide').style.display = 'none';
}

document.getElementById('openAndroidGuideBtn').onclick = () => {
    if (document.getElementById('androidGuide').style.display === 'flex') {
        document.getElementById('androidGuide').style.display = 'none';
    } else {
        document.getElementById('androidGuide').style.display = 'flex';
    }
    document.getElementById('iosGuide').style.display = 'none';
}

document.getElementById('closeErrorBtn').onclick = () => {
    document.getElementById('errorOverlay').style.display = 'none';
}


window.addEventListener('load', () => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    if (!isPWA && isMobile) {
        document.getElementById('addToHomeScreenOverlay').style.display = 'flex';
    }

    document.getElementById('closeAddToHomeScreenMessage').onclick = () => {
        document.getElementById('addToHomeScreenMessage').style.display = 'none';
    };
});

let map, polyline, watchId, startTime, timerInterval;
let positions = [];
let unit = "km";
let totalDistance = 0;
let totalDuration = 0;
let tripData
let startMarker, endMarker;
let currentLanguage = 'fr';
const durationForAlert = 1000;
let confirmDeleteMessage = "⚠ Warning, your previous trip will be reset. Are you sure you want to continue?"

const customIcon = L.divIcon({
    className: 'custom-pin',
    html: '<div class="pin-circle"></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

function formatTime(ms) {
    const sec = Math.floor(ms / 1000) % 60;
    const min = Math.floor(ms / 60000) % 60;
    const hr = Math.floor(ms / 3600000);
    return `${hr.toString().padStart(2, '0')} h ${min.toString().padStart(2, '0')} min ${sec.toString().padStart(2, '0')} s`;
}

function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lat2 - lat1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function updateStats() {
    const distance = unit === 'miles' ? totalDistance * 0.621371 : totalDistance;
    const unitLabel = unit === 'miles' ? 'mi' : 'km';
    document.getElementById('distance').textContent = `🛞 ${distance.toFixed(2).replace('.', ',')} ${unitLabel}`;

    if (startTime) {
        const currentDuration = Date.now() - startTime;
        const totalElapsed = totalDuration + currentDuration;
        document.getElementById('duration').textContent = `⏰ ${formatTime(totalElapsed)}`;
    } else {
        document.getElementById('duration').textContent = `⏰ 00 h 00 min 00 s`;
    }
}

function startRecording() {
    document.getElementById('loadTripBtn').style.display = 'none';
    positions = [];
    totalDistance = 0;
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = '';
    document.getElementById('recap').style.display = 'none';
    document.getElementById('beforeWeStart').style.display = 'none';
    document.getElementById('startBtn2').style.display = 'none';
    startTime = Date.now();
    timerInterval = setInterval(updateStats, 1000);

    watchId = navigator.geolocation.watchPosition(pos => {
        const { latitude, longitude } = pos.coords;
        positions.push([latitude, longitude]);
        if (positions.length === 1) {
            if (startMarker) map.removeLayer(startMarker);
            startMarker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
        }
        if (positions.length > 1) {
            const prev = positions[positions.length - 2];
            totalDistance += haversine(prev[0], prev[1], latitude, longitude);
            polyline.setLatLngs(positions);
        }
    }, err => console.error('Error:' + err.message), {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
    });
}

function resumeRecording() {
    document.getElementById('loadTripBtn').style.display = 'none'
    document.getElementById('resumeBtn').style.display = 'none';
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = '';
    document.getElementById('recap').style.display = 'none';
    document.getElementById('beforeWeStart').style.display = 'none';
    document.getElementById('startBtn2').style.display = 'none';

    if (timerInterval) clearInterval(timerInterval);

    startTime = Date.now();
    timerInterval = setInterval(() => {
        const currentDuration = Date.now() - startTime;
        const totalElapsed = totalDuration + currentDuration;
        document.getElementById('duration').textContent = `⏰ ${formatTime(totalElapsed)}`;
    }, 1000);

    watchId = navigator.geolocation.watchPosition(pos => {
        const { latitude, longitude } = pos.coords;
        positions.push([latitude, longitude]);
        if (positions.length === 1) {
            if (startMarker) map.removeLayer(startMarker);
            startMarker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
        }
        if (positions.length > 1) {
            const prev = positions[positions.length - 2];
            totalDistance += haversine(prev[0], prev[1], latitude, longitude);
            polyline.setLatLngs(positions);
            map.panTo([latitude, longitude]);
        }
        updateStats();
    }, err => console.error('Error:' + err.message), {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
    });
}

function stopRecording() {
    document.getElementById('loadTripBtn').style.display = '';
    clearInterval(timerInterval);
    pauseTimer();
    navigator.geolocation.clearWatch(watchId);

    document.getElementById('stopBtn').style.display = 'none';
    document.getElementById('recap').style.display = 'flex';
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('resumeBtn').style.display = 'block';

    totalDuration += Date.now() - startTime;

    const distance = totalDistance.toFixed(2).replace('.', ',') + ' km';
    const duration = formatTime(totalDuration);
    const startTimeFormatted = new Date(startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const endTimeFormatted = new Date(Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    document.getElementById('recapDistance').textContent = distance;
    document.getElementById('recapDuration').textContent = duration;
    document.getElementById('recapStartTime').textContent = startTimeFormatted;
    document.getElementById('recapEndTime').textContent = endTimeFormatted;

    if (endMarker) map.removeLayer(endMarker);
    if (positions.length > 1) {
        endMarker = L.marker(positions[positions.length - 1], { icon: customIcon }).addTo(map);
    }

    if (positions.length > 0) {
        const bounds = L.latLngBounds(positions);
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resumeTimer() {
    if (!timerInterval && startTime) {
        const pausedDuration = Date.now() - startTime;
        totalDuration += pausedDuration;
        startTime = Date.now();

        timerInterval = setInterval(() => {
            const currentDuration = Date.now() - startTime;
            const totalElapsed = totalDuration + currentDuration;
            document.getElementById('duration').textContent = `⏰ ${formatTime(totalElapsed)}`;
        }, 1000);
    }
}

function saveTrip() {
    if (document.getElementById('fromJson1').style.display == 'flex') {
        const confirmReset = confirm(confirmDeleteMessage);
        if (!confirmReset) return;
    }

    const tripData = {
        positions: positions,
        totalDistance: totalDistance,
        totalDuration: totalDuration,
        unit: unit,
        startTime: document.getElementById('recapStartTime').textContent || null,
        stopTime: document.getElementById('recapEndTime').textContent || null
    };

    const jsonData = JSON.stringify(tripData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'trip.json';
    downloadLink.click();

    URL.revokeObjectURL(url);
}

function loadTrip(event) {
    pauseTimer();
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        tripData = JSON.parse(e.target.result);

        positions = tripData.positions || [];
        totalDistance = tripData.totalDistance || 0;
        totalDuration = tripData.totalDuration || 0;
        unit = tripData.unit || 'km';

        polyline.setLatLngs(positions);
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions);
            map.fitBounds(bounds, { padding: [50, 50] });
        }

        const distance = totalDistance.toFixed(2).replace('.', ',') + (unit === 'km' ? ' km' : ' miles');
        const duration = formatTime(totalDuration);
        document.getElementById('recapDistance').textContent = distance;
        document.getElementById('recapDuration').textContent = duration;

        document.getElementById('recapStartTime').textContent = '--:--';
        document.getElementById('recapEndTime').textContent = '--:--';

        document.getElementById('resumeBtn').style.display = 'block';
        document.getElementById('startBtn2').style.display = 'none';
        document.getElementById('recap').style.display = 'flex';

        document.getElementById('startTime').textContent = "";
        document.getElementById('stopTime').textContent = "";

        document.getElementById('fromJsonTitle').style.display = 'flex';
        document.getElementById('fromJson1').style.display = 'flex';
        document.getElementById('fromJson2').style.display = 'flex';
        document.getElementById('recapStartTimefromJson').textContent = tripData.startTime;
        document.getElementById('recapStopTimefromJson').textContent = tripData.stopTime;

        updateStats();
        pauseTimer();

    };
    reader.readAsText(file);
}

window.onload = function () {
    loadLanguage(currentLanguage);

    const lightTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    const darkTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', { // or https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16
    });


    map = L.map('map', { zoomControl: false, attributionControl: false }).setView([44, 4], 13);
    lightTileLayer.addTo(map);
    polyline = L.polyline([], { color: '#007aff', weight: 5 }).addTo(map);

    initializeSettings(lightTileLayer, darkTileLayer);
    document.getElementById('startBtn2').onclick = () => {
        document.getElementById('beforeWeStart').style.display = 'flex'
    };
    document.getElementById('startBtn').onclick = startRecording;
    document.getElementById('stopBtn').onclick = stopRecording;
    document.getElementById('saveTripBtn').onclick = () => {
        document.getElementById('saveTripGuideOverlay').style.display = 'flex';
    }
    document.getElementById('resumeBtn').onclick = resumeRecording;
    document.getElementById('cancelBtnBWS').onclick = () => {
        document.getElementById('beforeWeStart').style.display = 'none';
    }


    document.getElementById('closeSaveTripGuideBtn').onclick = () => {
        document.getElementById('saveTripGuideOverlay').style.display = 'none';
        saveTrip();
    }


    let currentPositionMarker;

    navigator.geolocation.watchPosition(pos => {
        const { latitude, longitude } = pos.coords;

        map.setView([latitude, longitude], 15);

        if (currentPositionMarker) {
            currentPositionMarker.setLatLng([latitude, longitude]);
        } else {
            currentPositionMarker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
        }
    }, err => {
        console.error('Error:', err);
        if (err.code = 1) {

        }
    }, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
    });

    const toggleDarkModeBtn = document.getElementById('toggleDarkMode');
    toggleDarkModeBtn.onclick = () => {
        document.body.classList.toggle('dark-mode');
        toggleDarkModeBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';

        if (document.body.classList.contains('dark-mode')) {
            map.removeLayer(lightTileLayer);
            darkTileLayer.addTo(map);
        } else {
            map.removeLayer(darkTileLayer);
            lightTileLayer.addTo(map);
        }
    };

    const errorOverlay = document.getElementById('errorOverlay');

    if (errorOverlay) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                resumeTimer();
            },
            err => {
                pauseTimer();
                if (err.code === 1) {
                    errorOverlay.style.display = 'flex';
                } else {
                    console.error('Error:', err.message);
                }
                resumeTimer();
            }
        );
    }

    document.getElementById('unitKm').onchange = () => {
        unit = 'km';
        updateStats();
    };

    document.getElementById('unitMiles').onchange = () => {
        unit = 'miles';
        updateStats();
    };

    document.getElementById('languageSelector').onchange = (event) => {
        currentLanguage = event.target.value;
        loadLanguage(currentLanguage);
    };

    document.getElementById('photoModeBtn').onclick = () => {
        document.getElementById('button-container').style.display = 'none';
        document.getElementById('recap').style.display = 'none';
        document.getElementById('photoModeOverlay').style.display = 'block';
        document.getElementById('photoModeBtn').style.display = 'none';
        document.getElementById('saveTripBtn').style.display = 'none';
        document.getElementById('restartBtn').style.display = 'none';
        document.getElementById('addToHomeScreenOverlay').style.display = 'none';
        document.getElementById('startTime').style.display = 'flex';
        document.getElementById('stopTime').style.display = 'flex';

        const importedStartTime = tripData.startTime || Date.now();
        const importedEndTime = tripData.stopTime || Date.now();

        let startTimeFormatted = new Date(importedStartTime).toLocaleTimeString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
        let endTimeFormatted = new Date(importedEndTime).toLocaleTimeString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' });

        if (startTimeFormatted === 'Invalid Date') { startTimeFormatted = importedStartTime }
        if (endTimeFormatted === 'Invalid Date') { endTimeFormatted = importedEndTime }

        document.getElementById('startTime').textContent = `🕘 ${startTimeFormatted}`;
        document.getElementById('stopTime').textContent = `🕒 ${endTimeFormatted}`;
    };

    document.getElementById('photoModeOverlay').onclick = () => {
        document.getElementById('button-container').style.display = 'flex';
        document.getElementById('recap').style.display = 'flex';
        document.getElementById('photoModeOverlay').style.display = 'none';
        document.getElementById('photoModeBtn').style.display = 'flex';
        document.getElementById('saveTripBtn').style.display = '';
        document.getElementById('restartBtn').style.display = '';
        document.getElementById('startTime').style.display = 'none';
        document.getElementById('stopTime').style.display = 'none';
    }

    document.getElementById('loadTripBtn').onclick = () => {
        if (positions.length > 0 || totalDuration > durationForAlert || document.getElementById('fromJson1').style.display == 'flex') {
            const confirmReset = confirm(confirmDeleteMessage);
            if (!confirmReset) return;
        }
        pauseTimer();
        document.getElementById('loadTripInput').click();
    };

    document.getElementById('loadTripInput').onchange = (event) => {
        loadTrip(event);

        if (tripData && tripData.positions && tripData.positions.length > 1) {
            totalDistance = tripData.positions.reduce((acc, pos, index) => {
                if (index === 0) return acc;
                const prev = tripData.positions[index - 1];
                return acc + haversine(prev[0], prev[1], pos[0], pos[1]);
            }, 0);
        } else {
            totalDistance = 0;
        }

        updateStats();
        resumeTimer();
    };

    document.getElementById('restartBtn').onclick = () => {
        if (positions.length > 0 || totalDuration > durationForAlert || document.getElementById('fromJson1').style.display == 'flex') {
            const confirmRestart = confirm(confirmDeleteMessage);
            if (!confirmRestart) return;
        }
        location.reload();
    };

    updateStats()
};

const settingsBtn = document.getElementById('settingsBtn');
const settingsOverlay = document.getElementById('settingsOverlay');

if (settingsBtn && settingsOverlay) {
    settingsBtn.onclick = () => {
        settingsOverlay.style.display = 'flex';
    };
}
const closeSettingsBtn = document.getElementById('closeSettingsBtn');

if (closeSettingsBtn && settingsOverlay) {
    closeSettingsBtn.onclick = () => {
        settingsOverlay.style.display = 'none';
    };
}

function loadLanguage(lang) {
    fetch(`lang/${lang}.json`)
        .then(response => response.json())
        .then(data => {
            applyTranslations(data);
        })
        .catch(err => console.error('Error:', err));
}

function applyTranslations(translations) {
    confirmDeleteMessage = translations.confirmResetMess || confirmDeleteMessage;

    const aboutTitle = document.getElementById('aboutTitle');
    if (aboutTitle) aboutTitle.textContent = translations.aboutText.title;

    const aboutContent = document.getElementById('aboutContent');
    if (aboutContent) aboutContent.textContent = translations.aboutText.content;

    const aboutAuthor = document.getElementById('aboutAuthor');
    if (aboutAuthor) aboutAuthor.textContent = translations.aboutText.author;

    const aboutTextLinks = document.querySelector('#aboutTextLinks ul');
    if (aboutTextLinks) {
        aboutTextLinks.innerHTML = translations.aboutText.links.map(links => `<li>${links}</li>`).join('');
    }

    const closeAboutBtn = document.getElementById('closeAboutBtn');
    if (closeAboutBtn) closeAboutBtn.textContent = translations.closeButton;

    const closeAddToHomeScreenMessage = document.getElementById('closeAddToHomeScreenMessage');
    if (closeAddToHomeScreenMessage) closeAddToHomeScreenMessage.textContent = translations.closeButton;

    const closePinGuideBtn = document.getElementById('closePinGuideBtn');
    if (closePinGuideBtn) closePinGuideBtn.textContent = translations.closeButton;

    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    if (closeSettingsBtn) closeSettingsBtn.textContent = translations.closeButton;

    const startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.textContent = translations.startButton;

    const startBtn2 = document.getElementById('startBtn2');
    if (startBtn2) startBtn2.textContent = translations.startButton;

    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn) stopBtn.textContent = translations.stopButton;

    const resumeBtn = document.getElementById('resumeBtn');
    if (resumeBtn) resumeBtn.textContent = translations.resumeButton;

    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) restartBtn.textContent = translations.restartBtn;

    const settingsMenuTitle = document.getElementById('settingsMenuTitle');
    if (settingsMenuTitle) settingsMenuTitle.textContent = translations.settingsMenuTitle;

    const cancelBtnBWS = document.getElementById('cancelBtnBWS');
    if (cancelBtnBWS) cancelBtnBWS.textContent = translations.cancelButton;

    const photoModeBtn = document.getElementById('photoModeBtn');
    if (photoModeBtn) photoModeBtn.textContent = translations.photoModeBtn;

    const saveTripBtn = document.getElementById('saveTripBtn');
    if (saveTripBtn) saveTripBtn.textContent = translations.saveTripBtn;

    const saveTripGuideTitle = document.getElementById('saveTripGuideTitle');
    if (saveTripGuideTitle) saveTripGuideTitle.textContent = translations.saveTripGuideOverlay.title;

    const saveTripGuideOverlay = document.querySelector('#saveTripGuideOverlay ul');
    if (saveTripGuideOverlay) {
        saveTripGuideOverlay.innerHTML = translations.saveTripGuideOverlay.steps.map(step => `<li>${step}</li>`).join('');
    }

    const closeSaveTripGuideBtn = document.getElementById('closeSaveTripGuideBtn');
    if (closeSaveTripGuideBtn) closeSaveTripGuideBtn.textContent = translations.saveTripBtn;

    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) errorMessage.textContent = translations.errorMessage;


    const toggleDarkMode = document.getElementById('toggleDarkMode');
    if (toggleDarkMode && toggleDarkMode.nextSibling) {
        toggleDarkMode.nextSibling.textContent = translations.darkMode;
    }

    const unitKm = document.getElementById('unitKm');
    if (unitKm && unitKm.nextSibling) {
        unitKm.nextSibling.textContent = translations.unitKm;
    }

    const unitMiles = document.getElementById('unitMiles');
    if (unitMiles && unitMiles.nextSibling) {
        unitMiles.nextSibling.textContent = translations.unitMiles;
    }

    const languageLabel = document.getElementById('languageLabel');
    if (languageLabel) languageLabel.textContent = ` ` + translations.languageSelector;

    const recapText = document.getElementById('recapText');
    if (recapText) recapText.textContent = translations.recapText;

    const fromJsonTitle = document.getElementById('fromJsonTitle');
    if (fromJsonTitle) fromJsonTitle.textContent = translations.fromJsonTitle;

    const recapStartTimeLabelfromJson = document.getElementById('recapStartTimeLabelJson');
    if (recapStartTimeLabelfromJson) recapStartTimeLabelfromJson.textContent = translations.recapStartTime;

    const recapEndTimeLabelfromJson = document.getElementById('recapEndTimeLabelJson');
    if (recapEndTimeLabelfromJson) recapEndTimeLabelfromJson.textContent = translations.recapEndTime;

    const recapStartTimeLabel = document.getElementById('recapStartTimeLabel');
    if (recapStartTimeLabel) recapStartTimeLabel.textContent = translations.recapStartTime;

    const recapEndTimeLabel = document.getElementById('recapEndTimeLabel');
    if (recapEndTimeLabel) recapEndTimeLabel.textContent = translations.recapEndTime;

    const recapDistanceLabel = document.getElementById('recapDistanceLabel');
    if (recapDistanceLabel) recapDistanceLabel.textContent = translations.recapDistance;

    const recapDurationLabel = document.getElementById('recapDurationLabel');
    if (recapDurationLabel) recapDurationLabel.textContent = translations.recapDuration;

    const addToHomeScreenTuto = document.getElementById('addToHomeScreenTuto');
    if (addToHomeScreenTuto) addToHomeScreenTuto.textContent = translations.addToHomeScreenTuto;

    const addToHomeScreenMessageTitle = document.querySelector('#addToHomeScreenMessageContent h2');
    if (addToHomeScreenMessageTitle) addToHomeScreenMessageTitle.textContent = translations.addToHomeScreenMessageContent.title;

    const addToHomeScreenMessageContent = document.querySelector('#addToHomeScreenMessageContent ul');
    if (addToHomeScreenMessageContent) {
        addToHomeScreenMessageContent.innerHTML = translations.addToHomeScreenMessageContent.steps.map(step => `<li>${step}</li>`).join('');
    }

    const pinGuideBtn = document.getElementById('pinGuideBtn');
    if (pinGuideBtn) pinGuideBtn.textContent = translations.pinGuideBtn;

    const pinGuideOverlayTitle = document.querySelector('#pinGuideOverlay h2');
    if (pinGuideOverlayTitle) pinGuideOverlayTitle.textContent = translations.pinGuideOverlayTitle;

    const pinGuideOverlayContent = document.querySelector('#pinGuideOverlay p');
    if (pinGuideOverlayContent) pinGuideOverlayContent.textContent = translations.pinGuideOverlayContent;

    const beforeWeStartTitle = document.querySelector('#beforeWeStart h2');
    if (beforeWeStartTitle) beforeWeStartTitle.textContent = translations.beforeWeStartContent.title;

    const beforeWeStartContent = document.querySelector('#beforeWeStart ul');
    if (beforeWeStartContent) {
        beforeWeStartContent.innerHTML = translations.beforeWeStartContent.steps.map(step => `<li>${step}</li>`).join('');
    }

    const iosGuideTitle = document.querySelector('#iosGuide h3');
    if (iosGuideTitle) iosGuideTitle.textContent = translations.iosGuide.title;

    const iosGuideSteps = document.querySelector('#iosGuide ul');
    if (iosGuideSteps) {
        iosGuideSteps.innerHTML = translations.iosGuide.steps.map(step => `<li>${step}</li>`).join('');
    }

    const androidGuideTitle = document.querySelector('#androidGuide h3');
    if (androidGuideTitle) androidGuideTitle.textContent = translations.androidGuide.title;

    const androidGuideSteps = document.querySelector('#androidGuide ul');
    if (androidGuideSteps) {
        androidGuideSteps.innerHTML = translations.androidGuide.steps.map(step => `<li>${step}</li>`).join('');
    }

    const closeErrorBtn = document.getElementById('closeErrorBtn');
    if (closeErrorBtn) closeErrorBtn.textContent = translations.closeButton;
}

if (typeof leafletImage === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet-image/leaflet-image.js';
    document.head.appendChild(script);
}

function initializeSettings(lightTileLayer, darkTileLayer) {
    const browserLanguage = navigator.language.split('-')[0];
    const detectedLanguage = ['fr', 'en', 'es', 'de', 'it'].includes(browserLanguage) ? browserLanguage : 'en';
    document.getElementById('languageSelector').value = detectedLanguage;
    loadLanguage(detectedLanguage);
    console.log(`Detected language: ${detectedLanguage}`);

    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDarkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('toggleDarkMode').checked = true;
        map.removeLayer(lightTileLayer);
        darkTileLayer.addTo(map);
        console.log('Detected dark mode preference: enabled');
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('toggleDarkMode').checked = false;
        map.removeLayer(darkTileLayer);
        lightTileLayer.addTo(map);
        console.log('Detected dark mode preference: disabled');
    }

    const savedUnit = localStorage.getItem('unit') || 'km';
    unit = savedUnit;
    document.getElementById(savedUnit === 'km' ? 'unitKm' : 'unitMiles').checked = true;
    console.log(`Saved unit: ${savedUnit}`);
    updateStats();
}