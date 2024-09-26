// Variables globales pour la configuration du timer
let workDuration;
let breakDuration;
let cycles;
let timeLeft;
let isWorking = true;
let cycleCount = 0;
let timer = null;
let isPaused = false;
let currentRabbitState = "work";

// Sélection des éléments du DOM
const timeDisplay = document.getElementById('time');
const timerTypeDisplay = document.getElementById('timer-type');
const startButton = document.getElementById('start');
const pauseButton = document.getElementById('pause');
const resetButton = document.getElementById('reset');
const rabbit = document.getElementById('rabbit');
const progressBar = document.getElementById('progress-bar');
const progressBarContainer = document.getElementById('progress-bar-container');

// Chargement des sons
const workSound = new Audio('sounds/work-sound.mp3'); // Son du temps de travail
const breakSound = new Audio('sounds/break-sound.mp3'); // Son du temps de repos

// Fonction pour formater le temps en MM:SS
function formatTime(seconds) {
    let minutes = Math.floor(seconds / 60);
    let secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Fonction pour convertir le format MM:SS en secondes
function convertToSeconds(timeString) {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return (minutes * 60) + (seconds || 0);
}

// Fonction pour mettre à jour les durées de travail et de repos
function updateDurations() {
    const workInput = document.getElementById('work-duration').value;
    const breakInput = document.getElementById('break-duration').value;

    workDuration = convertToSeconds(workInput);
    breakDuration = convertToSeconds(breakInput);
    cycles = parseInt(document.getElementById('cycles').value);
}

// Fonction pour démarrer le timer
function startTimer(duration) {
    timeLeft = duration;
    updateTimerType(); // Mettre à jour le type de timer affiché
    timer = setInterval(() => {
        timeLeft--;
        timeDisplay.textContent = formatTime(timeLeft);

        // Mettre à jour la barre de progression à chaque seconde
        updateProgressBar(timeLeft, isWorking ? workDuration : breakDuration, isWorking);

        if (timeLeft <= 0) {
            clearInterval(timer);
            if (isWorking) {
                isWorking = false;
                breakSound.play(); // Jouer le son du repos
                startTimer(breakDuration);
                document.body.classList.add('work-mode');
                document.body.classList.remove('rest-mode');
                timerTypeDisplay.textContent = 'Temps de travail';
            } else {
                isWorking = true;
                workSound.play(); // Jouer le son du travail
                cycleCount++;
                document.body.classList.add('rest-mode');
                document.body.classList.remove('work-mode');
                timerTypeDisplay.textContent = 'Temps de repos';

                if (cycleCount < cycles) {
                    startTimer(workDuration);
                } else {
                    alert('Pomodoro terminé!');
                    timerTypeDisplay.textContent = 'Pomodoro terminé!';
                    return;
                }
            }
            updateTimerType();
        }
    }, 1000);
}

// Fonction pour reprendre le timer
function resumeTimer() {
    if (timer === null && isPaused) {
        startTimer(timeLeft);
        isPaused = false;
        pauseButton.textContent = 'Pause';
    }
}

// Fonction pour mettre le timer en pause
function pauseTimer() {
    if (!isPaused) {
        clearInterval(timer);
        timer = null;
        isPaused = true;
        pauseButton.textContent = 'Reprendre';
    }
}

// Fonction pour réinitialiser le timer
function resetTimer() {
    clearInterval(timer);
    timer = null;
    isWorking = true;
    cycleCount = 0;
    updateDurations();
    timeLeft = workDuration;
    timeDisplay.textContent = formatTime(workDuration);
    updateTimerType();
    isPaused = false;
    pauseButton.textContent = 'Pause';
}

// Fonction pour mettre à jour le type de timer affiché
function updateTimerType() {
    timerTypeDisplay.textContent = isWorking ? 'Temps de travail' : 'Temps de repos';
}

// Fonction pour mettre à jour la position de la barre de progression et du lapin
function updateProgressBar(timeLeft, duration, isWorking) {
    const progress = ((duration - timeLeft) / duration) * 100;
    const containerWidth = progressBarContainer.clientWidth;

    if (isWorking) {
        if (currentRabbitState !== "work") {
            rabbit.src = "rabbit.gif"; // Image du lapin en mode travail
            currentRabbitState = "work";
            progressBar.classList.remove('rest-mode');
            progressBar.classList.add('wood-texture');
        }

        const rabbitPosition = (containerWidth * (progress / 100)) - (rabbit.offsetWidth / 2);
        rabbit.style.left = `${Math.min(rabbitPosition, containerWidth - rabbit.offsetWidth)}px`;
        progressBar.style.width = `${progress}%`;

        // Ajouter le rebond lorsque la barre est pleine
        if (progress >= 100) {
            rabbit.classList.add('bounce');
        } else {
            rabbit.classList.remove('bounce');
        }

    } else {
        if (currentRabbitState !== "rest") {
            rabbit.src = "rabbit-rest.gif"; // Image du lapin en mode repos
            currentRabbitState = "rest";
            progressBar.classList.add('rest-mode');
            progressBar.classList.remove('wood-texture');
        }

        const rabbitPosition = (containerWidth * ((100 - progress) / 100)) - (rabbit.offsetWidth / 2);
        rabbit.style.left = `${Math.max(rabbitPosition, 0)}px`;
        progressBar.style.width = `${100 - progress}%`;

        // Ajouter le rebond lorsque la barre est pleine en mode repos
        if (progress >= 100) {
            rabbit.classList.add('bounce');
        } else {
            rabbit.classList.remove('bounce');
        }
    }
}

// Gestion des événements des boutons
startButton.addEventListener('click', () => {
    clearInterval(timer);
    if (isPaused) {
        resumeTimer();
    } else {
        updateDurations();
        resetTimer();
        startTimer(workDuration);
    }
});

pauseButton.addEventListener('click', () => {
    if (isPaused) {
        resumeTimer();
    } else {
        pauseTimer();
    }
});

resetButton.addEventListener('click', resetTimer);

// Mode OBS avec ESC pour sortir
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        document.body.classList.remove('obs-mode');
    }
});

document.getElementById('obs-button').addEventListener('click', () => {
    document.body.classList.add('obs-mode');
});

function sendNotification(message) {
    if (Notification.permission === 'granted') {
        new Notification(message);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(message);
            }
        });
    }
}

function handleEndOfCycle() {
    if (timeLeft <= 0) {
        if (isWorking) {
            sendNotification("Temps de repos !");
            isWorking = false;
            breakSound.play();
            startTimer(breakDuration);
        } else {
            sendNotification("Retour au travail !");
            isWorking = true;
            workSound.play();
            cycleCount++;
            
            if (cycleCount < cycles) {
                startTimer(workDuration);
            } else {
                alert('Pomodoro terminé!');
                timerTypeDisplay.textContent = 'Pomodoro terminé!';
                return;
            }
        }
        updateTimerType();
    }
}

// Variables pour la to-do list
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

// Événement pour ajouter une nouvelle tâche
todoForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Empêche la soumission par défaut du formulaire

    const newTaskText = todoInput.value.trim(); // Récupérer la valeur de l'input
    if (newTaskText === '') return; // Ne pas ajouter de tâches vides

    // Créer un nouvel élément de tâche
    const newTask = document.createElement('li');
    newTask.innerHTML = `
        <span>${newTaskText}</span>
        <button class="todo-delete">X</button>
    `;

    // Ajouter la tâche à la liste
    todoList.appendChild(newTask);

    // Réinitialiser le champ de saisie
    todoInput.value = '';

    // Ajouter un événement pour marquer la tâche comme complète
    newTask.addEventListener('click', function() {
        newTask.classList.toggle('todo-complete');
    });

    // Ajouter un événement pour supprimer la tâche
    newTask.querySelector('.todo-delete').addEventListener('click', function() {
        newTask.remove();
    });
});
