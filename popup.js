    // Constants
    const TIMER_NAME = 'Pomodoro Timer';
    const ALARM_SOUND = new Audio('notification.mp3');

    // DOM Elements
    const timerDisplay = document.getElementById('timer');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const soundEnabled = document.getElementById('soundEnabled');
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    let timerState = {
      seconds: 1500,  // 25 minutes default
      isRunning: false
    };

    // Theme Management
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      body.classList.add('dark-theme');
      themeToggle.checked = true;
    }

    themeToggle.addEventListener('change', () => {
      body.classList.toggle('dark-theme');
      localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
    });

    // Initialize UI
    document.addEventListener('DOMContentLoaded', async () => {
      // Get current timer state from background
      const state = await chrome.storage.local.get(['timerState']);
      if (state.timerState) {
        timerState = state.timerState;
        updateUI();
      }

      // Restore sound preference
      const soundPref = await chrome.storage.local.get(['soundEnabled']);
      if (soundPref.soundEnabled !== undefined) {
        soundEnabled.checked = soundPref.soundEnabled;
      }
    });

    // Update display with animation
    function updateUI() {
      const minutes = Math.floor(timerState.seconds / 60);
      const seconds = timerState.seconds % 60;
      timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      startBtn.textContent = timerState.isRunning ? 'Pause' : 'Start';
      
      // Add/remove pulsing animation
      if (timerState.isRunning) {
        timerDisplay.classList.add('timer-running');
      } else {
        timerDisplay.classList.remove('timer-running');
      }
    }

    // Timer controls
    startBtn.addEventListener('click', async () => {
      timerState.isRunning = !timerState.isRunning;
      
      if (timerState.isRunning) {
        chrome.runtime.sendMessage({ command: 'startTimer', seconds: timerState.seconds });
        startBtn.style.transform = 'scale(0.95)';
      } else {
        chrome.runtime.sendMessage({ command: 'pauseTimer' });
        startBtn.style.transform = 'scale(1)';
      }
      
      updateUI();
      await chrome.storage.local.set({ timerState });
    });

    resetBtn.addEventListener('click', async () => {
      timerState.seconds = 1500; // 25 minutes
      timerState.isRunning = false;
      chrome.runtime.sendMessage({ command: 'resetTimer' });
      updateUI();
      await chrome.storage.local.set({ timerState });

      // Add reset animation
      timerDisplay.style.transform = 'scale(0.95)';
      setTimeout(() => {
        timerDisplay.style.transform = 'scale(1)';
      }, 150);
    });

    // Preset time buttons with animation
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        timerState.seconds = parseInt(btn.dataset.time);
        timerState.isRunning = false;
        chrome.runtime.sendMessage({ command: 'resetTimer', seconds: timerState.seconds });
        updateUI();
        await chrome.storage.local.set({ timerState });

        // Add click animation
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          btn.style.transform = 'scale(1)';
        }, 150);
      });

      // Add hover effect
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'scale(1.02)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'scale(1)';
      });
    });

    // Sound preference
    soundEnabled.addEventListener('change', async () => {
      await chrome.storage.local.set({ soundEnabled: soundEnabled.checked });
    });

    // Listen for timer updates from background
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'timerUpdate') {
        timerState.seconds = message.seconds;
        updateUI();

        // Play sound when timer reaches 0
        if (message.seconds === 0 && soundEnabled.checked) {
          ALARM_SOUND.play();
        }
      }
    });

    // Add hover effects to main buttons
    [startBtn, resetBtn].forEach(button => {
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.02)';
      });
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
      });
    });