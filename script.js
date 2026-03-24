const STORAGE_KEY = "habit-tracker-data-v2";

const habitInput = document.getElementById("habitInput");
const habitColor = document.getElementById("habitColor");
const addHabitBtn = document.getElementById("addHabitBtn");
const habitList = document.getElementById("habitList");
const emptyState = document.getElementById("emptyState");

const trendSummary = document.getElementById("trendSummary");
const trendGrid = document.getElementById("trendGrid");
const periodLabel = document.getElementById("periodLabel");
const prevPeriodBtn = document.getElementById("prevPeriodBtn");
const nextPeriodBtn = document.getElementById("nextPeriodBtn");
const viewButtons = document.querySelectorAll(".view-btn");

const editModal = document.getElementById("editModal");
const editHabitName = document.getElementById("editHabitName");
const editHabitColor = document.getElementById("editHabitColor");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveEditBtn = document.getElementById("saveEditBtn");

let habits = loadHabits();
let currentView = "week";
let currentDate = new Date();
let editingHabitId = null;

function loadHabits() {
  const data = localStorage.getItem(STORAGE_KEY);
  const parsed = data ? JSON.parse(data) : [];

  return parsed.map((habit, index) => ({
    id: habit.id ?? Date.now() + index,
    name: habit.name ?? "Untitled Habit",
    color: habit.color ?? getDefaultColor(index),
    logs: Array.isArray(habit.logs) ? habit.logs : []
  }));
}

function saveHabits() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function getDefaultColor(index) {
  const colors = [
    "#e85d75",
    "#5b7cfa",
    "#f0b429",
    "#c678dd",
    "#10b981",
    "#f97316",
    "#ef4444",
    "#14b8a6"
  ];
  return colors[index % colors.length];
}

function getTodayDate() {
  return formatDate(new Date());
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function addHabit() {
  const name = habitInput.value.trim();
  const color = habitColor.value;

  if (!name) {
    alert("Please enter a habit name.");
    return;
  }

  const newHabit = {
    id: Date.now(),
    name,
    color,
    logs: []
  };

  habits.push(newHabit);
  saveHabits();
  renderAll();
  habitInput.value = "";
}

function checkInHabit(id) {
  const today = getTodayDate();
  const time = getCurrentTime();

  habits = habits.map((habit) => {
    if (habit.id === id) {
      return {
        ...habit,
        logs: [...habit.logs, { date: today, time }]
      };
    }
    return habit;
  });

  saveHabits();
  renderAll();
}

function undoLastCheckIn(id) {
  habits = habits.map((habit) => {
    if (habit.id === id && habit.logs.length > 0) {
      return {
        ...habit,
        logs: habit.logs.slice(0, -1)
      };
    }
    return habit;
  });

  saveHabits();
  renderAll();
}

function deleteHabit(id) {
  habits = habits.filter((habit) => habit.id !== id);
  saveHabits();
  renderAll();
}

function moveHabitUp(id) {
  const index = habits.findIndex((habit) => habit.id === id);
  if (index <= 0) return;

  [habits[index - 1], habits[index]] = [habits[index], habits[index - 1]];

  saveHabits();
  renderAll();
}

function moveHabitDown(id) {
  const index = habits.findIndex((habit) => habit.id === id);
  if (index === -1 || index >= habits.length - 1) return;

  [habits[index], habits[index + 1]] = [habits[index + 1], habits[index]];

  saveHabits();
  renderAll();
}

function openEditModal(id) {
  const targetHabit = habits.find((habit) => habit.id === id);
  if (!targetHabit) return;

  editingHabitId = id;
  editHabitName.value = targetHabit.name;
  editHabitColor.value = targetHabit.color;
  editModal.classList.remove("hidden");
}

function closeEditModal() {
  editingHabitId = null;
  editModal.classList.add("hidden");
}

function saveHabitEdit() {
  if (!editingHabitId) return;

  const newName = editHabitName.value.trim();
  const newColor = editHabitColor.value;

  if (!newName) {
    alert("Please enter a habit name.");
    return;
  }

  habits = habits.map((habit) => {
    if (habit.id === editingHabitId) {
      return {
        ...habit,
        name: newName,
        color: newColor
      };
    }
    return habit;
  });

  saveHabits();
  renderAll();
  closeEditModal();
}

function getTodayLogs(logs) {
  const today = getTodayDate();
  return logs.filter((log) => log.date === today);
}

function getLogCountByDate(logs, targetDate) {
  return logs.filter((log) => log.date === targetDate).length;
}

function getLogCountByMonth(logs, year, monthIndex) {
  return logs.filter((log) => {
    const logDate = new Date(log.date);
    return (
      logDate.getFullYear() === year &&
      logDate.getMonth() === monthIndex
    );
  }).length;
}

function renderHabits() {
  habitList.innerHTML = "";

  if (habits.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  habits.forEach((habit) => {
    const todayLogs = getTodayLogs(habit.logs);

    const habitItem = document.createElement("div");
    habitItem.className = "habit-item";

    habitItem.innerHTML = `
      <div class="habit-top">
        <div>
          <div class="habit-title-row">
            <span class="habit-color-dot" style="background:${habit.color}"></span>
            <div class="habit-name">${habit.name}</div>
          </div>
          <div class="habit-count">Today: ${todayLogs.length} check-in(s)</div>
        </div>

        <div class="icon-group">
          <button class="icon-btn" data-action="move-up" data-id="${habit.id}" title="Move up">↑
          </button>
          <button class="icon-btn" data-action="move-down" data-id="${habit.id}" title="Move down">↓
          </button>
          <button class="icon-btn edit" data-action="edit" data-id="${habit.id}" title="Edit">✎
          </button>
        </div>
      </div>

      <div class="habit-actions">
        <button data-action="checkin" data-id="${habit.id}">Check in</button>
        <button class="secondary-btn" data-action="undo" data-id="${habit.id}">Undo last</button>
        <button class="delete-btn" data-action="delete" data-id="${habit.id}">Delete</button>
      </div>

      <ul class="log-list">
        ${
          todayLogs.length > 0
            ? todayLogs.map((log) => `<li>${log.time}</li>`).join("")
            : "<li>No check-ins today</li>"
        }
      </ul>
    `;

    habitList.appendChild(habitItem);
  });
}

function getWeekDates(baseDate) {
  const date = new Date(baseDate);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function getMonthDates(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  const dates = [];
  for (let day = 1; day <= lastDay; day++) {
    dates.push(new Date(year, month, day));
  }
  return dates;
}

function getYearMonths(baseDate) {
  const year = baseDate.getFullYear();
  const months = [];
  for (let i = 0; i < 12; i++) {
    months.push({
      year,
      monthIndex: i,
      label: new Date(year, i, 1).toLocaleString("en", { month: "short" })
    });
  }
  return months;
}

function getPeriodData() {
  if (currentView === "week") {
    return {
      type: "day",
      items: getWeekDates(currentDate)
    };
  }

  if (currentView === "month") {
    return {
      type: "day",
      items: getMonthDates(currentDate)
    };
  }

  return {
    type: "month",
    items: getYearMonths(currentDate)
  };
}

function renderPeriodLabel() {
  if (currentView === "week") {
    const weekDates = getWeekDates(currentDate);
    const start = weekDates[0];
    const end = weekDates[6];
    periodLabel.textContent = `${start.toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })} - ${end.toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })}`;
    return;
  }

  if (currentView === "month") {
    periodLabel.textContent = currentDate.toLocaleDateString("en", {
      month: "long",
      year: "numeric"
    });
    return;
  }

  periodLabel.textContent = currentDate.getFullYear();
}

function renderSummary() {
  const totalHabits = habits.length;
  const totalTodayCheckins = habits.reduce(
    (sum, habit) => sum + getTodayLogs(habit.logs).length,
    0
  );
  const totalLogs = habits.reduce((sum, habit) => sum + habit.logs.length, 0);
  const activeHabitsToday = habits.filter(
    (habit) => getTodayLogs(habit.logs).length > 0
  ).length;

  trendSummary.innerHTML = `
    <div class="summary-box">
      <div class="summary-value">${totalHabits}</div>
      <div class="summary-label">Habits</div>
    </div>
    <div class="summary-box">
      <div class="summary-value">${totalTodayCheckins}</div>
      <div class="summary-label">Today Check-ins</div>
    </div>
    <div class="summary-box">
      <div class="summary-value">${totalLogs}</div>
      <div class="summary-label">Total Records</div>
    </div>
    <div class="summary-box">
      <div class="summary-value">${activeHabitsToday}</div>
      <div class="summary-label">Active Today</div>
    </div>
  `;
}

function renderTrendGrid() {
  const periodData = getPeriodData();
  const items = periodData.items;

  if (habits.length === 0) {
    trendGrid.innerHTML = `<p class="empty-state">No habits yet. Add one to see trends.</p>`;
    return;
  }

  const rowTemplate =
    currentView === "year"
      ? `180px repeat(${items.length}, 54px)`
      : `180px repeat(${items.length}, 38px)`;

  let headerCells = "";

  if (periodData.type === "day") {
    headerCells = items
      .map((date) => {
        if (currentView === "week") {
          return `<div class="header-label">${date.toLocaleDateString("en", {
            weekday: "short"
          })}<br>${date.getDate()}</div>`;
        }
        return `<div class="header-label">${date.getDate()}</div>`;
      })
      .join("");
  } else {
    headerCells = items
      .map((month) => `<div class="header-label">${month.label}</div>`)
      .join("");
  }

  const rows = habits
    .map((habit) => {
      const cells = items
        .map((item) => {
          let count = 0;

          if (periodData.type === "day") {
            count = getLogCountByDate(habit.logs, formatDate(item));
          } else {
            count = getLogCountByMonth(habit.logs, item.year, item.monthIndex);
          }

          const cellClass =
            currentView === "year"
              ? `cell year-cell ${count === 0 ? "empty" : ""}`
              : `cell ${count === 0 ? "empty" : ""}`;

          const background =
            count === 0 ? "" : `style="background:${habit.color}"`;

          return `<div class="${cellClass}" ${background}>${count > 0 ? count : ""}</div>`;
        })
        .join("");

      return `
        <div class="trend-row" style="grid-template-columns:${rowTemplate}">
          <div class="row-name">
            <span class="habit-color-dot" style="background:${habit.color}"></span>
            <span>${habit.name}</span>
          </div>
          ${cells}
        </div>
      `;
    })
    .join("");

  trendGrid.innerHTML = `
    <div class="trend-table">
      <div class="trend-header-row" style="grid-template-columns:${rowTemplate}">
        <div class="header-spacer"></div>
        ${headerCells}
      </div>
      ${rows}
    </div>
  `;
}

function renderAll() {
  renderHabits();
  renderSummary();
  renderPeriodLabel();
  renderTrendGrid();
}

addHabitBtn.addEventListener("click", addHabit);

habitInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    addHabit();
  }
});

habitList.addEventListener("click", (e) => {
  const action = e.target.dataset.action;
  const id = Number(e.target.dataset.id);

  if (!action || !id) return;

  if (action === "checkin") {
    checkInHabit(id);
  } else if (action === "undo") {
    undoLastCheckIn(id);
  } else if (action === "delete") {
    deleteHabit(id);
  } else if (action === "edit") {
    openEditModal(id);
  } else if (action === "move-up") {
    moveHabitUp(id);
  } else if (action === "move-down") {
    moveHabitDown(id);
  }
});

saveEditBtn.addEventListener("click", saveHabitEdit);
cancelEditBtn.addEventListener("click", closeEditModal);

editModal.addEventListener("click", (e) => {
  if (e.target === editModal) {
    closeEditModal();
  }
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentView = button.dataset.view;
    viewButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    renderAll();
  });
});

prevPeriodBtn.addEventListener("click", () => {
  if (currentView === "week") {
    currentDate.setDate(currentDate.getDate() - 7);
  } else if (currentView === "month") {
    currentDate.setMonth(currentDate.getMonth() - 1);
  } else {
    currentDate.setFullYear(currentDate.getFullYear() - 1);
  }

  currentDate = new Date(currentDate);
  renderAll();
});

nextPeriodBtn.addEventListener("click", () => {
  if (currentView === "week") {
    currentDate.setDate(currentDate.getDate() + 7);
  } else if (currentView === "month") {
    currentDate.setMonth(currentDate.getMonth() + 1);
  } else {
    currentDate.setFullYear(currentDate.getFullYear() + 1);
  }

  currentDate = new Date(currentDate);
  renderAll();
});

renderAll();