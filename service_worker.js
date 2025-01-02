const TIMER_NAME = 'Pomodoro Timer';
const DEFAULT_DURATION = 1500; // 25 minutes

let timerState = {
  seconds: DEFAULT_DURATION,
  isRunning: false,
};

// Initialize state from storage
chrome.storage.local.get(['timerState'], (result) => {
  timerState = result.timerState || { seconds: DEFAULT_DURATION, isRunning: false };
  updateBadge();
});

// Startup and Install Event - Refresh Badge
chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

chrome.runtime.onInstalled.addListener(() => {
  updateBadge();
});

// Create Pomodoro Alarm
function createAlarm() {
  chrome.alarms.create(TIMER_NAME, {
    periodInMinutes: 1 / 60,
  });
}

// Clear Pomodoro Alarm
function clearAlarm() {
  chrome.alarms.clear(TIMER_NAME);
}

// Update Badge with Timer State
function updateBadge() {
  const minutes = Math.floor(timerState.seconds / 60);
  const seconds = timerState.seconds % 60;
  const text = `${minutes}:${String(seconds).padStart(2, '0')}`;

  let color = 'green';
  if (timerState.seconds <= 300) color = 'red';
  else if (timerState.seconds <= 900) color = 'orange';

  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

// Create Notification When Timer Ends
function createNotification() {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/48.png',
    title: 'Pomodoro Timer',
    message: "Time's up! Take a break.",
    priority: 2,
    silent: false,
  });
}

// Alarm Listener - Decrement Timer
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== TIMER_NAME) return;

  timerState.seconds--;
  updateBadge();

  // Broadcast update to popup if open
  chrome.runtime.sendMessage({
    type: 'timerUpdate',
    seconds: timerState.seconds,
  }).catch(() => {
    // Suppress No SW Error if no receiver exists
  });

  // When time reaches zero
  if (timerState.seconds <= 0) {
    timerState.isRunning = false;
    clearAlarm();
    createNotification();
    chrome.storage.local.set({ timerState });
  }
});

// Listen for Popup Commands (Start, Pause, Reset)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.command) {
    case 'startTimer':
      timerState.seconds = message.seconds || timerState.seconds;
      timerState.isRunning = true;
      createAlarm();
      break;

    case 'pauseTimer':
      timerState.isRunning = false;
      clearAlarm();
      break;

    case 'resetTimer':
      timerState.seconds = message.seconds || DEFAULT_DURATION;
      timerState.isRunning = false;
      clearAlarm();
      updateBadge();
      break;
  }

  chrome.storage.local.set({ timerState });
  sendResponse({ success: true });
});
