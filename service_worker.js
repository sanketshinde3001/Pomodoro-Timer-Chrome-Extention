let seconds = 1 * 60;
let timerIsRunning = false;

function createAlarm(name) {
  chrome.alarms.create(name, {
    periodInMinutes: 1 / 60,
  });
}

function clearAlarm(name) {
  chrome.alarms.clear(name, (wasCleared) => {
    console.log(wasCleared);
  });
}

chrome.contextMenus.create({
  id: "start_timer",
  title: "Start Timer",
  contexts: ["all"],
});

chrome.contextMenus.create({
  id: "reset_timer",
  title: "Reset Timer",
  contexts: ["all"],
});

function createNotification(message) {
  const opt = {
    type: "list",
    title: "Pomodoro Timer",
    message,
    items: [{ title: "Pomodoro Timer", message: message }],
    iconUrl: "icons/48.png",
  };
  chrome.notifications.create(opt);
}

chrome.alarms.onAlarm.addListener((alarm) => {
  seconds--;

  let minutesremaining = Math.floor(seconds / 60) + " M";

  if (seconds < 600) {
    minutesremaining = Math.floor(seconds / 60) + " : " + Math.floor(seconds % 60).toString().padStart(2, "0");
  }

  let color = "green";
  if (seconds <= 300) {
    color = "red";
  } else if (seconds <= 900) {
    color = "orange";
  }

  chrome.action.setBadgeBackgroundColor({ color });

  chrome.action.setBadgeText({
    text: minutesremaining,
  });
  console.log(seconds);
  if (seconds <= 0) {
    timerIsRunning = false;
    createNotification("Time's up!");
    clearAlarm("Pomodoro Timer");
    chrome.contextMenus.update("start_timer", {
      title: "Start Timer",
      contexts: ["all"],
    });
    chrome.action.setBadgeText({
      text: "--",
    });
  }
});


chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "start_timer":
      if (timerIsRunning) {
        clearAlarm("Pomodoro Timer");
        chrome.action.setBadgeText({
          text: "▶",
        });
        chrome.contextMenus.update("start_timer", { title: "Start Timer" });
        timerIsRunning = false;
        createNotification("Timer stopped");
      } else {
        timerIsRunning = true;
        chrome.contextMenus.update("start_timer", { title: "Stop Timer" });
        createAlarm("Pomodoro Timer");
        createNotification("Timer started");
      }
      break;

    case "reset_timer":
      seconds = 25*60;
      timerIsRunning = false;
      chrome.action.setBadgeText({
        text: "—",
      });
      chrome.action.setBadgeBackgroundColor({color:"green" });
      chrome.contextMenus.update("start_timer", { title: "Start Timer" });
      clearAlarm("Pomodoro Timer");
      createNotification("Timer reset");
      break;

    default:
      break;
  }
});

