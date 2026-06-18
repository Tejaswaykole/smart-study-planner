/**
 * StudyFlow Dashboard Application Logic
 * Integrates: Subjects, Exams, Tasks, Goals, Streaks, Pomodoro, Analytics, 
 * Smart Reminders, Achievements, Color Therapy, and Admin reporting.
 */

// --- GLOBAL STATE ---
let state = {
  subjects: [],
  exams: [],
  tasks: [],
  goals: [],
  focusLogs: [],
  streak: {
    current: 0,
    longest: 0,
    lastStudyDate: null,
    weeklyHistory: [false, false, false, false, false, false, false] // Sun-Sat active days
  },
  achievements: [],
  activeTab: 'dashboard',
  theme: 'dark',
  therapyMode: 'focus'
};

let achievementsLoaded = false;

// Default structures if empty
const DEFAULT_ACHIEVEMENTS = [
  { id: 'focus_rookie', title: 'Focus Rookie', desc: 'Complete your first Pomodoro focus session.', icon: '🎓', unlocked: false, date: null },
  { id: 'focus_mastery', title: 'Focus Mastery', desc: 'Accumulate 10 total study hours.', icon: '👑', unlocked: false, date: null },
  { id: 'focus_marathon', title: 'Focus Marathon', desc: 'Study for 25 total hours.', icon: '🏃', unlocked: false, date: null },
  { id: 'task_solver', title: 'Task Solver', desc: 'Complete your first study task.', icon: '🎯', unlocked: false, date: null },
  { id: 'task_crusher', title: 'Task Crusher', desc: 'Complete 10 total tasks.', icon: '⚔️', unlocked: false, date: null },
  { id: 'productivity_pro', title: 'Productivity Pro', desc: 'Maintain 80% task completion rate.', icon: '📈', unlocked: false, date: null },
  { id: 'streak_builder', title: 'Streak Builder', desc: 'Reach a 3-day daily study streak.', icon: '🔥', unlocked: false, date: null },
  { id: 'streak_legend', title: 'Streak Legend', desc: 'Reach a 7-day daily study streak.', icon: '⚡', unlocked: false, date: null },
  { id: 'exam_slayer', title: 'Exam Slayer', desc: 'Have at least one scheduled exam in your dashboard.', icon: '🛡️', unlocked: false, date: null },
  { id: 'goal_starter', title: 'Goal Starter', desc: 'Complete your first goal.', icon: '🏁', unlocked: false, date: null },
  { id: 'goal_conqueror', title: 'Goal Conqueror', desc: 'Complete 5 goals.', icon: '🏆', unlocked: false, date: null }
];

const MOTIVATIONAL_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
  { text: "There are no shortcuts to any place worth going.", author: "Beverly Sills" }
];

const STUDY_TIPS = [
  "Try studying in 25-minute Pomodoro block intervals to maximize focus and minimize fatigue.",
  "Organize your tasks by priority to tackle the most demanding subjects first.",
  "Take active recall breaks: explain what you just read out loud from memory.",
  "Keep your study space clean. Less physical clutter equals less mental clutter.",
  "Drink water and get natural light during break intervals to replenish cognitive energy.",
  "Study hardest topics first when your energy levels are highest."
];

// Chart Instances
let weeklyHoursChart = null;
let subjectHoursChart = null;
let taskCompletionChart = null;
let adminActivityChart = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  loadDataFromStorage();

  loadAchievementsFromDatabase();
  loadTasksFromDatabase();
  loadSubjectsFromDatabase();
  loadExamsFromDatabase();
  loadGoalsFromDatabase();
  loadFocusSessionsFromDatabase();

  initThemeAndTherapy();
  setupEventListeners();
  handleHashNavigation();
  startExamCountdownTimer();
  updateDashboardUI();
});

// Dynamic Year in footer/etc
const dateText = document.getElementById('current-date-str');
if (dateText) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateText.textContent = new Date().toLocaleDateString(undefined, options);
}

// --- DATA LOGIC ---
function loadDataFromStorage() {
  state.subjects = JSON.parse(localStorage.getItem('sf_subjects')) || [];
  state.exams = JSON.parse(localStorage.getItem('sf_exams')) || [];
  state.tasks = JSON.parse(localStorage.getItem('sf_tasks')) || [];
  state.goals = JSON.parse(localStorage.getItem('sf_goals')) || [];
  state.focusLogs = JSON.parse(localStorage.getItem('sf_focus_logs')) || [];
  state.streak = JSON.parse(localStorage.getItem('sf_streak')) || {
    current: 0,
    longest: 0,
    lastStudyDate: null,
    weeklyHistory: [false, false, false, false, false, false, false]
  };
  state.achievements = JSON.parse(localStorage.getItem('sf_achievements')) || DEFAULT_ACHIEVEMENTS;

  // Synchronize achievements structure if upgraded/different
  if (state.achievements.length !== DEFAULT_ACHIEVEMENTS.length) {
    DEFAULT_ACHIEVEMENTS.forEach(defaultAch => {
      const exists = state.achievements.find(a => a.id === defaultAch.id);
      if (!exists) state.achievements.push(defaultAch);
    });
  }
}

function loadTasksFromDatabase() {
  fetch('http://localhost:5000/tasks')
    .then(res => res.json())
    .then(data => {

      state.tasks = data.map(task => ({
        id: task.id,
        title: task.title,
        subjectId: '',
        dueDate: task.due_date,
        priority: task.priority,
        completed: !!task.completed,
        completedAt: null
      }));

      renderTasksList();
    })
    .catch(err => console.error(err));
}
function loadSubjectsFromDatabase() {

  fetch('http://localhost:5000/subjects')
    .then(res => res.json())
    .then(data => {

      state.subjects = data.map(subject => ({
        id: subject.id,
        name: subject.name,
        priority: subject.priority,
        difficulty: subject.difficulty,
        color: subject.color
      }));

      renderSubjectsList();
      populateDropdownSelectors();

    })
    .catch(err => console.error(err));
}
function loadExamsFromDatabase() {

  fetch('http://localhost:5000/exams')
    .then(res => res.json())
    .then(data => {

      state.exams = data.map(exam => ({
        id: exam.id,
        name: exam.title,
        subjectId: exam.subject_id,
        dateTime: exam.exam_date,
        examType: exam.exam_type
      }));

      updateDashboardUI();

    })
    .catch(err => console.error(err));
}
function loadGoalsFromDatabase() {

  fetch('http://localhost:5000/goals')
    .then(res => res.json())
    .then(data => {

      state.goals = data.map(g => ({
        id: g.id,
        title: g.title,
        targetDate: g.target_date,
        progress: g.progress || 0,
        completed: !!g.completed
      }));

      updateDashboardUI();

    })
    .catch(err => console.error(err));
}
function loadFocusSessionsFromDatabase() {

  fetch('http://localhost:5000/focus-sessions')
    .then(res => res.json())
    .then(data => {

      state.focusLogs = data.map(log => ({
        id: log.id,
        duration: log.duration,
        subjectId: log.subject_id,
        timestamp: log.session_date
      }));

      renderFocusSessionsList();
      updateDashboardUI();

    })
    .catch(err => console.error(err));

}
function loadAchievementsFromDatabase() {

  fetch('http://localhost:5000/achievements')
    .then(res => res.json())
    .then(data => {

      data.forEach(dbAchievement => {

        const localAchievement =
          state.achievements.find(
            a => a.id === dbAchievement.id
          );

        if (localAchievement) {

          localAchievement.unlocked =
            !!dbAchievement.unlocked;

          localAchievement.date =
            dbAchievement.unlocked_date;

        }

      });

      renderAchievements();
      achievementsLoaded = true;

    })
    .catch(err => console.error(err));

}
// --- SETUP THEME & THERAPY ---
function initThemeAndTherapy() {
  state.theme = localStorage.getItem('sf_theme') || 'dark';
  state.therapyMode = localStorage.getItem('sf_therapy') || 'focus';

  document.documentElement.setAttribute('data-theme', state.theme);
  document.documentElement.setAttribute('data-therapy', state.therapyMode);

  // Update toggle emoji
  const modeToggleBtn = document.getElementById('dark-mode-toggle');
  if (modeToggleBtn) {
    modeToggleBtn.textContent = state.theme === 'dark' ? '🌙' : '☀️';
  }

  // Set active theme picker buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-theme-mode') === state.therapyMode) {
      btn.classList.add('active');
    }
  });
}

function setupEventListeners() {
  // Navigation tabs
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Color therapy buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-theme-mode');
      state.therapyMode = mode;
      localStorage.setItem('sf_therapy', mode);
      document.documentElement.setAttribute('data-therapy', mode);

      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update charts for theme color contrast
      if (state.activeTab === 'analytics') {
        renderAnalyticsCharts();
      }
      if (state.activeTab === 'admin') {
        renderAdminTrendsChart();
      }
    });
  });

  // Dark/Light toggle
  const toggleBtn = document.getElementById('dark-mode-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('sf_theme', state.theme);
      document.documentElement.setAttribute('data-theme', state.theme);
      toggleBtn.textContent = state.theme === 'dark' ? '🌙' : '☀️';

      // Update charts for theme contrast
      if (state.activeTab === 'analytics') {
        renderAnalyticsCharts();
      }
      if (state.activeTab === 'admin') {
        renderAdminTrendsChart();
      }
    });
  }

  // Bell Dropdown
  const bellBtn = document.getElementById('notification-bell');
  const bellDropdown = document.getElementById('notification-dropdown');
  if (bellBtn && bellDropdown) {
    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      bellDropdown.classList.toggle('hide');
    });

    document.addEventListener('click', () => {
      bellDropdown.classList.add('hide');
    });

    bellDropdown.addEventListener('click', (e) => e.stopPropagation());
  }

  // Dismiss Notifications
  const dismissAllBtn = document.getElementById('mark-all-read-btn');
  if (dismissAllBtn) {
    dismissAllBtn.addEventListener('click', () => {
      const badge = document.getElementById('notification-badge');
      if (badge) {
        badge.classList.add('hide');
        badge.textContent = '0';
      }
      const notifyList = document.getElementById('notifications-list');
      if (notifyList) {
        notifyList.innerHTML = '<div class="no-notifications">No urgent alerts. Looking good!</div>';
      }
    });
  }

  // Task filter clicks
  document.querySelectorAll('[data-task-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-task-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTasksList(btn.getAttribute('data-task-filter'));
    });
  });

  // Task sorting selection
  const sortSelect = document.getElementById('task-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const activeFilter = document.querySelector('[data-task-filter].active').getAttribute('data-task-filter');
      renderTasksList(activeFilter);
    });
  }

  // Pomodoro inputs listener to update main text representation
  const pomodoroStudy = document.getElementById('study-duration-input');
  const pomodoroBreak = document.getElementById('break-duration-input');
  if (pomodoroStudy) {
    pomodoroStudy.addEventListener('change', () => {
      if (!timerInterval) {
        resetPomodoroTimer();
      }
    });
  }
}

// Handle Direct Routing from Landing Page Feature Cards
function handleHashNavigation() {
  const hash = window.location.hash;
  if (hash) {
    const tabName = hash.replace('#', '');
    switchTab(tabName);
  }
}

// Switch Sidebar Tabs
function switchTab(tabId) {
  // Check valid tab
  const panel = document.getElementById(`${tabId}-tab`);
  if (!panel) return;

  state.activeTab = tabId;
  window.location.hash = tabId;

  // Update nav buttons
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    }
  });

  // Update panels
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  panel.classList.add('active');

  // Trigger sub-render processes
  if (tabId === 'analytics') {
    renderAnalyticsCharts();
  } else if (tabId === 'admin') {
    renderAdminTrendsChart();
    renderAdminLogs();
  }
}

// Modal open/close helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hide');

    // Clear forms on add
    if (modalId === 'add-subject-modal' && !document.getElementById('edit-subject-id').value) {
      document.getElementById('add-subject-form').reset();
      document.getElementById('subject-modal-title').textContent = "Create New Subject";
    }
    if (modalId === 'add-exam-modal' && !document.getElementById('edit-exam-id').value) {
      document.getElementById('add-exam-form').reset();
      document.getElementById('exam-modal-title').textContent = "Schedule New Exam";
    }
    if (modalId === 'add-task-modal' && !document.getElementById('edit-task-id').value) {
      document.getElementById('add-task-form').reset();
      document.getElementById('task-modal-title').textContent = "Create New Task";
    }
    if (modalId === 'add-goal-modal' && !document.getElementById('edit-goal-id').value) {
      document.getElementById('add-goal-form').reset();
      document.getElementById('goal-modal-title').textContent = "Set Study Goal";
      const progressInput = document.getElementById('goal-progress');
      if (progressInput) {
        progressInput.value = 0;
        progressInput.style.setProperty('--progress', '0%');
      }
      const valSpan = document.getElementById('goal-progress-val');
      if (valSpan) valSpan.textContent = '0';
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hide');
    // Clear edit values
    if (modalId === 'add-subject-modal') document.getElementById('edit-subject-id').value = '';
    if (modalId === 'add-exam-modal') document.getElementById('edit-exam-id').value = '';
    if (modalId === 'add-task-modal') document.getElementById('edit-task-id').value = '';
    if (modalId === 'add-goal-modal') document.getElementById('edit-goal-id').value = '';
  }
}

// --- RENDERING WIDGETS ---
function updateDashboardUI() {
  renderStatsOverview();
  renderUpcomingSchedule();
  renderSubjectsList();
  renderExamsList();
  renderTasksList();
  renderGoalsList();
  renderAchievements();
  renderRemindersPanel();
  populateDropdownSelectors();
  updateEncouragementMessage();
  renderFocusSessionsList();
}

// Rotate quotes and tips
function rotateMotivation() {
  const quoteText = document.getElementById('quote-text');
  const quoteAuthor = document.getElementById('quote-author');
  const tipText = document.getElementById('study-tip-text');

  if (quoteText && quoteAuthor) {
    const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    quoteText.textContent = `"${quote.text}"`;
    quoteAuthor.textContent = `— ${quote.author}`;
  }

  if (tipText) {
    tipText.textContent = STUDY_TIPS[Math.floor(Math.random() * STUDY_TIPS.length)];
  }
}

// Stats top grid
function renderStatsOverview() {
  // Streak
  const streakText = document.getElementById('streak-val');
  const streakWeeklyText = document.getElementById('streak-weekly-val');
  if (streakText && streakWeeklyText) {
    streakText.textContent = `${state.streak.current} Day${state.streak.current !== 1 ? 's' : ''}`;
    const activeDaysCount = state.streak.weeklyHistory.filter(Boolean).length;
    streakWeeklyText.textContent = `Weekly active: ${activeDaysCount}/7 days`;
  }

  // Study Hours
  const totalHoursText = document.getElementById('total-hours-val');
  const totalSessionsText = document.getElementById('total-sessions-val');
  if (totalHoursText && totalSessionsText) {
    const totalMinutes = state.focusLogs.reduce((acc, log) => acc + log.duration, 0);
    totalHoursText.textContent = `${(totalMinutes / 60).toFixed(1)}h`;
    totalSessionsText.textContent = `${state.focusLogs.length} focus session${state.focusLogs.length !== 1 ? 's' : ''} logged`;
  }

  // Tasks Completion
  const tasksCountText = document.getElementById('tasks-count-val');
  const tasksPctText = document.getElementById('tasks-pct-val');
  if (tasksCountText && tasksPctText) {
    const completedTasks = state.tasks.filter(t => t.completed).length;
    const totalTasks = state.tasks.length;
    tasksCountText.textContent = `${completedTasks} / ${totalTasks}`;
    const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    tasksPctText.textContent = `${pct}% completion rate`;
  }

  // Active Goals
  const goalsCountText = document.getElementById('goals-count-val');
  const goalsCompletedText = document.getElementById('goals-completed-val');
  if (goalsCountText && goalsCompletedText) {
    const completedGoals = state.goals.filter(g => g.completed).length;
    goalsCountText.textContent = `${state.goals.length} Goal${state.goals.length !== 1 ? 's' : ''}`;
    goalsCompletedText.textContent = `${completedGoals} completed goal${completedGoals !== 1 ? 's' : ''}`;
  }
}

// Overview page Upcoming lists
function renderUpcomingSchedule() {
  const todayTasksList = document.getElementById('today-tasks-list');
  const upcomingExamsList = document.getElementById('upcoming-exams-list');

  // Tasks due today
  if (todayTasksList) {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = state.tasks.filter(t => t.dueDate === todayStr && !t.completed);

    if (todayTasks.length === 0) {
      todayTasksList.innerHTML = '<div class="empty-state">No tasks due today. Hooray! 🎉</div>';
    } else {
      todayTasksList.innerHTML = todayTasks.map(t => {
        const subColor = getSubjectColor(t.subjectId);
        const subName = getSubjectName(t.subjectId);
        return `
          <div class="task-item glass-card" style="padding: 10px 14px;">
            <div class="task-item-left">
              <button class="task-checkbox" onclick="toggleTaskComplete('${t.id}')"></button>
              <div class="task-info-block">
                <span class="task-title-text">${escapeHtml(t.title)}</span>
                <span class="task-subject-tag" style="color: ${subColor}; font-size:10px;">${escapeHtml(subName)}</span>
              </div>
            </div>
            <span class="task-priority-badge ${t.priority}">${t.priority}</span>
          </div>
        `;
      }).join('');
    }
  }

  // Upcoming exams countdowns on dashboard
  if (upcomingExamsList) {
    const upcomingExams = state.exams
      .filter(e => new Date(e.dateTime) > new Date())
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
      .slice(0, 3);

    if (upcomingExams.length === 0) {
      upcomingExamsList.innerHTML = '<div class="empty-state">No upcoming exams. Breathe easy! 🧘</div>';
    } else {
      upcomingExamsList.innerHTML = upcomingExams.map(e => {
        const subColor = getSubjectColor(e.subjectId);
        const subName = getSubjectName(e.subjectId);
        const examDate = new Date(e.dateTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        return `
          <div class="session-log-item" style="padding: 10px 14px;">
            <span style="font-weight:bold; flex-grow:1;">${escapeHtml(e.name)}</span>
            <span style="color:${subColor}; font-size:11px; margin-right: 10px;">${escapeHtml(subName)}</span>
            <span class="session-log-time">${examDate}</span>
          </div>
        `;
      }).join('');
    }
  }
}

// Fill subject selectors in modals
function populateDropdownSelectors() {
  const timerSelect = document.getElementById('timer-subject-select');
  const taskSelect = document.getElementById('task-subject');
  const examSelect = document.getElementById('exam-subject');

  const optionsHtml = state.subjects.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');

  if (timerSelect) {
    timerSelect.innerHTML = '<option value="">-- No Subject Tag --</option>' + optionsHtml;
  }
  if (taskSelect) {
    taskSelect.innerHTML = '<option value="">-- No Subject --</option>' + optionsHtml;
  }
  if (examSelect) {
    examSelect.innerHTML = '<option value="">-- Choose Subject --</option>' + optionsHtml;
  }
}

// Generate encouragement texts based on user productivity
function updateEncouragementMessage() {
  const encourText = document.getElementById('encouragement-text');
  if (!encourText) return;

  const totalMinutes = state.focusLogs.reduce((acc, log) => acc + log.duration, 0);
  const completedTasks = state.tasks.filter(t => t.completed).length;

  if (totalMinutes === 0) {
    encourText.textContent = "You haven't studied yet today. Set up a subject, add a task, and start your Pomodoro timer to build your streak!";
  } else if (state.streak.current >= 3) {
    encourText.textContent = `You are on fire! 🔥 An amazing ${state.streak.current}-day streak. Keep pushing your limits!`;
  } else if (completedTasks > 0 && totalMinutes > 60) {
    encourText.textContent = "Outstanding work! You've logged over an hour of focus and checked off daily tasks. Study Flow > Netflix Flow!";
  } else {
    encourText.textContent = "Great start! Regular daily focus leads to massive long-term success. Take a look at your achievements panel next!";
  }
}

// --- 2. SUBJECTS CRUD ---
function renderSubjectsList() {
  const grid = document.getElementById('subjects-grid');
  if (!grid) return;

  if (state.subjects.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;">No subjects created yet. Click "+ Add Subject" to get started!</div>';
    document.getElementById('most-studied-sub-badge').textContent = "-";
    document.getElementById('least-studied-sub-badge').textContent = "-";
    return;
  }

  // Calculate subject details
  let mostStudied = { name: '-', time: 0 };
  let leastStudied = { name: '-', time: Infinity };

  const cardsHtml = state.subjects.map(s => {
    // Subject time studied (min)
    const logs = state.focusLogs.filter(l => l.subjectId === s.id);
    const totalMin = logs.reduce((acc, log) => acc + log.duration, 0);
    const hrsStr = (totalMin / 60).toFixed(1);

    if (totalMin > mostStudied.time) {
      mostStudied = { name: s.name, time: totalMin };
    }
    if (totalMin < leastStudied.time) {
      leastStudied = { name: s.name, time: totalMin };
    }

    // Completion rate of tasks for this subject
    const subTasks = state.tasks.filter(t => t.subjectId === s.id);
    const completedTasksCount = subTasks.filter(t => t.completed).length;
    const completionPct = subTasks.length > 0 ? Math.round((completedTasksCount / subTasks.length) * 100) : 0;

    return `
      <div class="subject-card glass-card" style="--sub-theme-color: ${s.color};">
        <div class="sub-title-row">
          <div>
            <h3>${escapeHtml(s.name)}</h3>
            <span class="muted-text">${hrsStr} hrs studied</span>
          </div>
          <div class="sub-badge-row">
            <span class="badge-tag priority-${s.priority.toLowerCase()}">${s.priority} Priority</span>
            <span class="badge-tag" style="background: rgba(255,255,255,0.06); color: var(--text-primary);">${s.difficulty}</span>
          </div>
        </div>
        
        <div class="sub-progress-area">
          <div class="progress-stats">
            <span>Task Completion</span>
            <span>${completionPct}% (${completedTasksCount}/${subTasks.length})</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${completionPct}%; --sub-theme-color: ${s.color};"></div>
          </div>
        </div>
        
        <div class="card-actions-menu">
          <button class="btn btn-outline btn-sm" onclick="editSubject('${s.id}')">✏️ Edit</button>
          <button class="btn btn-outline btn-sm" style="color:var(--danger); border-color:rgba(239,68,68,0.2);" onclick="deleteSubject('${s.id}')">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join('');

  grid.innerHTML = cardsHtml;

  // Update badges
  document.getElementById('most-studied-sub-badge').textContent = mostStudied.name !== '-' ? `${mostStudied.name} (${(mostStudied.time / 60).toFixed(1)}h)` : '-';
  document.getElementById('least-studied-sub-badge').textContent = leastStudied.name !== '-' && leastStudied.time !== Infinity ? `${leastStudied.name} (${(leastStudied.time / 60).toFixed(1)}h)` : '-';
}

function saveSubject(event) {
  event.preventDefault();
  const editId = document.getElementById('edit-subject-id').value;
  const name = document.getElementById('subject-name').value.trim();
  const priority = document.getElementById('subject-priority').value;
  const difficulty = document.getElementById('subject-difficulty').value;
  const color = document.querySelector('input[name="sub-color"]:checked').value;

  if (editId) {
    fetch(`http://localhost:5000/subjects/${editId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        priority,
        difficulty,
        color
      })
    })
      .then(res => res.json())
      .then(data => {
        alert('Subject updated successfully!');
        loadSubjectsFromDatabase();
        closeModal('add-subject-modal');
      })
      .catch(err => {
        console.error(err);
        alert('Failed to update subject');
      });

    return;
  } else {
    // Create Mode
    fetch('http://localhost:5000/subjects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        priority,
        difficulty,
        color
      })
    })
      .then(res => res.json())
      .then(data => {
        alert('Subject saved successfully!');
        loadSubjectsFromDatabase();
        closeModal('add-subject-modal');
      })
      .catch(err => {
        console.error(err);
        alert('Failed to save subject');
      });

    return;
  }
}

function editSubject(id) {

  console.log("Edit Subject Clicked:", id);

  const s = state.subjects.find(sub => sub.id == id);

  console.log("Subject Found:", s);

  if (!s) return;

  document.getElementById('edit-subject-id').value = s.id;
  document.getElementById('subject-name').value = s.name;
  document.getElementById('subject-priority').value = s.priority;
  document.getElementById('subject-difficulty').value = s.difficulty;

  const colorRadio = document.querySelector(`input[name="sub-color"][value="${s.color}"]`);
  if (colorRadio) colorRadio.checked = true;

  document.getElementById('subject-modal-title').textContent = "Edit Subject Details";
  openModal('add-subject-modal');
}

function deleteSubject(id) {

  if (!confirm("Are you sure you want to delete this subject?")) {
    return;
  }

  fetch(`http://localhost:5000/subjects/${id}`, {
    method: 'DELETE'
  })
    .then(res => res.json())
    .then(data => {

      alert('Subject deleted successfully!');

      loadSubjectsFromDatabase();
      loadTasksFromDatabase();

    })
    .catch(err => {
      console.error(err);
      alert('Failed to delete subject');
    });

}

// --- 3. EXAMS CRUD & countdown ticking ---
function renderExamsList() {
  const grid = document.getElementById('exams-grid');
  if (!grid) return;

  if (state.exams.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">No exams scheduled yet. Click "+ Schedule Exam" to add one!</div>';
    return;
  }

  grid.innerHTML = state.exams.map(e => {
    const sub = state.subjects.find(s => s.id === e.subjectId);
    const subColor = sub ? sub.color : 'var(--primary-color)';
    const subName = sub ? sub.name : 'Unknown';
    const examDate = new Date(e.dateTime);
    const dateFormatted = examDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeFormatted = examDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    return `
      <div class="exam-card glass-card" id="exam-card-${e.id}" data-datetime="${e.dateTime}">
        <div class="sub-title-row">
          <div>
            <span class="exam-subject-marker" style="--sub-color: ${subColor};">${escapeHtml(subName)}</span>
            <h3 style="margin: 4px 0 0 0;">${escapeHtml(e.name)}</h3>
          </div>
          <button class="card-options-btn" onclick="editExam('${e.id}')">✏️</button>
        </div>
        
        <div class="exam-time-countdown">
          <div class="exam-countdown-digits" id="countdown-${e.id}">
            Calculating...
          </div>
        </div>
        
        <div class="exam-details">
          <div>📅 ${dateFormatted}</div>
          <div>🕒 ${timeFormatted}</div>
        </div>

        <div style="margin-top:auto; display:flex; justify-content:flex-end;">
          <button class="btn btn-outline btn-sm" style="color:var(--danger); border-color:rgba(239,68,68,0.2);" onclick="deleteExam('${e.id}')">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function startExamCountdownTimer() {
  setInterval(() => {
    state.exams.forEach(e => {
      const display = document.getElementById(`countdown-${e.id}`);
      if (!display) return;

      const target = new Date(e.dateTime).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference < 0) {
        display.innerHTML = '<span style="color:var(--success);">Completed / Passed</span>';
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      display.innerHTML = `
        <div class="countdown-segment"><span>${days}</span><span class="countdown-label">Days</span></div>
        <div class="countdown-segment"><span>${hours}</span><span class="countdown-label">Hrs</span></div>
        <div class="countdown-segment"><span>${minutes}</span><span class="countdown-label">Min</span></div>
        <div class="countdown-segment"><span>${seconds}</span><span class="countdown-label">Sec</span></div>
      `;
    });
  }, 1000);
}

function saveExam(event) {
  event.preventDefault();
  const editId = document.getElementById('edit-exam-id').value;
  const name = document.getElementById('exam-name').value.trim();
  const subjectId = document.getElementById('exam-subject').value;
  const dateTime = document.getElementById('exam-datetime').value;

  if (editId) {
    fetch(`http://localhost:5000/exams/${editId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: name,
        subject_id: subjectId,
        exam_date: dateTime,
        exam_type: 'Exam'
      })
    })
      .then(res => res.json())
      .then(data => {
        alert('Exam updated successfully!');
        loadExamsFromDatabase();
        closeModal('add-exam-modal');
      })
      .catch(err => {
        console.error(err);
        alert('Failed to update exam');
      });

    return;
  } else {
    fetch('http://localhost:5000/exams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: name,
        subject_id: subjectId,
        exam_date: dateTime,
        exam_type: 'Exam'
      })
    })
      .then(res => res.json())
      .then(data => {
        alert('Exam saved successfully!');
        loadExamsFromDatabase();
        closeModal('add-exam-modal');
      })
      .catch(err => {
        console.error(err);
        alert('Failed to save exam');
      });

    return;
  }
}

function editExam(id) {

  console.log("Edit Exam:", id);

  const e = state.exams.find(ex => ex.id == id);

  console.log("Found Exam:", e);

  if (!e) return;

  document.getElementById('edit-exam-id').value = e.id;
  document.getElementById('exam-name').value = e.name;
  document.getElementById('exam-subject').value = e.subjectId;
  document.getElementById('exam-datetime').value = e.dateTime;

  document.getElementById('exam-modal-title').textContent = "Modify Exam Parameters";
  openModal('add-exam-modal');
}

function deleteExam(id) {

  if (!confirm("Delete this scheduled exam from calendar?")) {
    return;
  }

  fetch(`http://localhost:5000/exams/${id}`, {
    method: 'DELETE'
  })
    .then(res => res.json())
    .then(data => {

      alert('Exam deleted successfully!');

      loadExamsFromDatabase();

    })
    .catch(err => {
      console.error(err);
      alert('Failed to delete exam');
    });

}

// --- 4. TASKS CRUD ---
function renderTasksList(filter = 'all') {
  const listContainer = document.getElementById('tasks-list');
  if (!listContainer) return;

  let filteredTasks = [...state.tasks];

  // 1. Filtering
  if (filter === 'completed') {
    filteredTasks = filteredTasks.filter(t => t.completed);
  } else if (filter === 'pending') {
    filteredTasks = filteredTasks.filter(t => !t.completed);
  }

  // 2. Sorting
  const sortBy = document.getElementById('task-sort')?.value || 'dueDate';
  filteredTasks.sort((a, b) => {
    if (sortBy === 'dueDate') {
      return new Date(a.dueDate) - new Date(b.dueDate);
    } else if (sortBy === 'priority') {
      const priorityMap = { High: 3, Medium: 2, Low: 1 };
      return priorityMap[b.priority] - priorityMap[a.priority];
    } else if (sortBy === 'subject') {
      const subA = getSubjectName(a.subjectId);
      const subB = getSubjectName(b.subjectId);
      return subA.localeCompare(subB);
    }
    return 0;
  });

  if (filteredTasks.length === 0) {
    listContainer.innerHTML = `<div class="empty-state">No tasks to display in this list view. Click "+ Create Task" to add one!</div>`;
    return;
  }

  listContainer.innerHTML = filteredTasks.map(t => {
    const sub = state.subjects.find(s => s.id === t.subjectId);
    const subColor = sub ? sub.color : '#ccc';
    const subName = sub ? sub.name : 'No subject';

    // Check if task is overdue
    const isOverdue = !t.completed && new Date(t.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

    return `
      <div class="task-item glass-card ${t.completed ? 'completed' : ''}" style="background: ${t.completed ? 'rgba(0,0,0,0.1)' : 'var(--card-bg)'};">
        <div class="task-item-left">
          <button class="task-checkbox ${t.completed ? 'checked' : ''}" aria-label="Toggle task ${t.title}" onclick="toggleTaskComplete('${t.id}')"></button>
          
          <div class="task-info-block">
            <span class="task-title-text">${escapeHtml(t.title)}</span>
            <div class="task-metadata-tags">
              <span class="task-subject-tag" style="--sub-color: ${subColor};">${escapeHtml(subName)}</span>
              <span class="task-duedate-tag ${isOverdue ? 'overdue' : ''}">
                ${isOverdue ? '⚠️ Overdue: ' : '📅 '} ${new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
        
        <div class="task-item-right">
          <span class="task-priority-badge ${t.priority}">${t.priority}</span>
          <button class="card-options-btn" onclick="editTask('${t.id}')">✏️</button>
          <button class="card-options-btn" style="color:var(--danger);" onclick="deleteTask('${t.id}')">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function saveTask(event) {
  event.preventDefault();
  const editId = document.getElementById('edit-task-id').value;
  const title = document.getElementById('task-title').value.trim();
  const subjectId = document.getElementById('task-subject').value;
  const dueDate = document.getElementById('task-duedate').value;
  const priority = document.getElementById('task-priority').value;

  if (editId) {
    fetch(`http://localhost:5000/tasks/${editId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        priority,
        due_date: dueDate,
        subject_id: subjectId
      })
    })
      .then(res => res.json())
      .then(data => {
        alert('Task updated successfully!');
        loadTasksFromDatabase();
        closeModal('add-task-modal');
      })
      .catch(err => {
        console.error(err);
        alert('Failed to update task');
      });

    return;
  } else {
    fetch('http://localhost:5000/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        priority,
        due_date: dueDate,
        subject_id: subjectId
      })
    })
      .then(res => res.json())
      .then(data => {
        alert('Task saved successfully!');
        loadTasksFromDatabase();
        closeModal('add-task-modal');
      })
      .catch(err => {
        console.error(err);
        alert('Failed to save task');
      });

    return;
  }
}

function editTask(id) {

  console.log("Edit clicked:", id);

  const t = state.tasks.find(tk => tk.id == id);

  console.log("Task found:", t);

  if (!t) return;

  document.getElementById('edit-task-id').value = t.id;
  document.getElementById('task-title').value = t.title;
  document.getElementById('task-subject').value = t.subjectId;
  document.getElementById('task-duedate').value = t.dueDate;
  document.getElementById('task-priority').value = t.priority;

  document.getElementById('task-modal-title').textContent = "Modify Task Parameters";
  openModal('add-task-modal');
}

function toggleTaskComplete(id) {

  fetch(`http://localhost:5000/tasks/${id}/complete`, {
    method: 'PUT'
  })
    .then(res => res.json())
    .then(data => {

      const task = state.tasks.find(t => t.id == id);

      if (task && !task.completed) {
        incrementStreak();
      }

      checkAchievements();

      loadTasksFromDatabase();

    })
    .catch(err => {
      console.error(err);
      alert('Failed to update task');
    });

}

function deleteTask(id) {

  if (!confirm("Delete this task?")) {
    return;
  }

  fetch(`http://localhost:5000/tasks/${id}`, {
    method: 'DELETE'
  })
    .then(res => res.json())
    .then(data => {

      alert('Task deleted successfully');

      loadTasksFromDatabase();

    })
    .catch(err => {
      console.error(err);
      alert('Failed to delete task');
    });

}

// --- 5. POMODORO TIMER PANEL ---
let timerInterval = null;
let timerTimeRemaining = 25 * 60; // default 25 min in sec
let isTimerPaused = false;
let isBreakSession = false;

// Audio Fallback Synthesizer using Web Audio API
function playSynthesizedSound(isBreak = false) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (isBreak) {
      // High-low chime for break starting
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } else {
      // Successful fanfare sound for session completion
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      oscillator.start();

      setTimeout(() => {
        oscillator.frequency.setValueAtTime(880.00, audioCtx.currentTime); // A5
      }, 150);
      oscillator.stop(audioCtx.currentTime + 0.45);
    }
  } catch (e) {
    console.warn("Audio Context synth sound failed to play", e);
  }
}

// HTML Audio selector triggers
const successSound = document.getElementById('success-sound');
const breakSound = document.getElementById('break-sound');

const timerStartBtn = document.getElementById('timer-start-btn');
const timerPauseBtn = document.getElementById('timer-pause-btn');
const timerResetBtn = document.getElementById('timer-reset-btn');
const timerRing = document.getElementById('timer-ring');
const timerStateLabel = document.getElementById('timer-state-label');
const timerDisplay = document.getElementById('timer-time');

if (timerStartBtn && timerPauseBtn && timerResetBtn) {
  timerStartBtn.addEventListener('click', startPomodoroTimer);
  timerPauseBtn.addEventListener('click', pausePomodoroTimer);
  timerResetBtn.addEventListener('click', resetPomodoroTimer);
}

function startPomodoroTimer() {
  if (timerInterval) return;

  isTimerPaused = false;
  timerStartBtn.disabled = true;
  timerPauseBtn.disabled = false;

  // Set duration initial values if beginning fresh
  if (!isTimerPaused && timerTimeRemaining === getTimerConfigSeconds()) {
    // FRESH START
  }

  const totalDuration = getTimerConfigSeconds();

  timerInterval = setInterval(() => {
    if (timerTimeRemaining > 0) {
      timerTimeRemaining--;
      updateTimerUI(totalDuration);
    } else {
      // Finished Interval
      handleTimerIntervalFinished();
    }
  }, 1000);
}

function pausePomodoroTimer() {
  if (!timerInterval) return;
  clearInterval(timerInterval);
  timerInterval = null;
  isTimerPaused = true;
  timerStartBtn.disabled = false;
  timerStartBtn.textContent = "Resume";
  timerPauseBtn.disabled = true;
}

function resetPomodoroTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isTimerPaused = false;
  isBreakSession = false;
  timerTimeRemaining = getTimerConfigSeconds();

  if (timerStartBtn) {
    timerStartBtn.disabled = false;
    timerStartBtn.textContent = "Start";
  }
  if (timerPauseBtn) timerPauseBtn.disabled = true;
  if (timerStateLabel) timerStateLabel.textContent = "Focus";

  document.title = "StudyFlow Dashboard";
  updateTimerUI(getTimerConfigSeconds());
}

function stopFocusSession() {
  const initialTime = getTimerConfigSeconds();

  // Only proceed if the timer has actually run a bit
  if (timerTimeRemaining >= initialTime) return;

  if (isBreakSession) {
    resetPomodoroTimer();
    return;
  }

  const studiedSeconds = initialTime - timerTimeRemaining;
  const studiedMinutes = Math.floor(studiedSeconds / 60);

  const saveIt = confirm(`Save this ${studiedMinutes}-minute session?`);

  if (saveIt && studiedMinutes > 0) {
    const selectedSubject = document.getElementById('timer-subject-select').value;
    logStudySession(studiedMinutes, selectedSubject);
  }

  resetPomodoroTimer();
}


function getTimerConfigSeconds() {
  const studyInput = document.getElementById('study-duration-input');
  const breakInput = document.getElementById('break-duration-input');

  if (isBreakSession) {
    const val = breakInput ? parseInt(breakInput.value) : 5;
    return val * 60;
  } else {
    const val = studyInput ? parseInt(studyInput.value) : 25;
    return val * 60;
  }
}

function updateTimerUI(totalDuration) {
  if (!timerDisplay) return;

  const min = Math.floor(timerTimeRemaining / 60);
  const sec = timerTimeRemaining % 60;
  const timeStr = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  timerDisplay.textContent = timeStr;

  // Update Tab Title
  document.title = `(${timeStr}) StudyFlow`;

  // SVG Ring Fill progress
  if (timerRing) {
    const circumference = 2 * Math.PI * 100; // 628
    const pct = totalDuration > 0 ? timerTimeRemaining / totalDuration : 0;
    timerRing.style.strokeDashoffset = circumference * (1 - pct);
  }
}

function handleTimerIntervalFinished() {
  clearInterval(timerInterval);
  timerInterval = null;

  if (!isBreakSession) {
    // SUCCESS STUDY SESSION COMPLETED!
    playSynthesizedSound(false);
    successSound?.play().catch(() => { });

    const duration = Math.round(getTimerConfigSeconds() / 60);
    const subjectId = document.getElementById('timer-subject-select').value;

    // Log the session details
    logStudySession(duration, subjectId);

    alert("Focus session complete! Time for a well-deserved break! 🎉");

    // Switch to Break Mode Automatically
    isBreakSession = true;
    if (timerStateLabel) timerStateLabel.textContent = "Break";
    timerTimeRemaining = getTimerConfigSeconds();
    startPomodoroTimer();
  } else {
    // BREAK OVER, START STUDY
    playSynthesizedSound(true);
    breakSound?.play().catch(() => { });

    alert("Break is over! Let's get back to studying! 💪");

    isBreakSession = false;
    if (timerStateLabel) timerStateLabel.textContent = "Focus";
    timerTimeRemaining = getTimerConfigSeconds();
    startPomodoroTimer();
  }

  updateTimerUI(getTimerConfigSeconds());
}

function logStudySession(durationMin, subjectId) {

  fetch('http://localhost:5000/focus-sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subject_id: subjectId || null,
      duration: durationMin
    })
  })
    .then(res => res.json())
    .then(data => {

      const newLog = {
        id: data.id,
        duration: durationMin,
        subjectId: subjectId || null,
        timestamp: new Date().toISOString()
      };

      state.focusLogs.push(newLog);

      incrementStreak();

      checkAchievements();

      updateDashboardUI();

      logAdminActivity(
        "STU-101 (You)",
        `Completed a ${durationMin}m study session`,
        subjectId ? getSubjectName(subjectId) : 'N/A',
        `${durationMin} mins`
      );

      renderFocusSessionsList();

    })
    .catch(err => {
      console.error(err);
      alert('Failed to save focus session');
    });

}

function renderFocusSessionsList() {
  const logsList = document.getElementById('focus-sessions-list');
  if (!logsList) return;

  // Get logs for today
  const todayStr = new Date().toDateString();
  const todayLogs = state.focusLogs.filter(log => new Date(log.timestamp).toDateString() === todayStr);

  if (todayLogs.length === 0) {
    logsList.innerHTML = '<div class="empty-state">No focus sessions logged today. Ready to start?</div>';
    return;
  }

  logsList.innerHTML = todayLogs.map(log => {
    const subName = getSubjectName(log.subjectId);
    const subColor = getSubjectColor(log.subjectId);
    const time = new Date(log.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return `
      <div class="session-log-item">
        <span class="session-log-subject" style="--sub-color: ${subColor};">${escapeHtml(subName)}</span>
        <span class="session-log-time">${time} — ⏱️ ${log.duration} mins</span>
      </div>
    `;
  }).reverse().join('');
}

// --- 6. GOALS CRUD ---
function renderGoalsList() {
  const grid = document.getElementById('goals-grid');
  if (!grid) return;

  if (state.goals.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;">No study goals defined yet. Click "+ Create Goal" to outline one!</div>';
    return;
  }

  grid.innerHTML = state.goals.map(g => {
    const isCompleted = g.completed || g.progress === 100;
    const targetDate = new Date(g.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    return `
      <div class="goal-card glass-card">
        <div class="sub-title-row">
          <div>
            <span class="goal-status-badge ${isCompleted ? 'completed' : 'pending'}">${isCompleted ? 'Completed' : 'Active'}</span>
            <h3 style="margin: 8px 0 0 0;">${escapeHtml(g.title)}</h3>
          </div>
          <button class="card-options-btn" onclick="editGoal('${g.id}')">✏️</button>
        </div>
        
        <div class="sub-progress-area" style="margin: 14px 0;">
          <div class="progress-stats">
            <span>Goal Progress</span>
            <span>${g.progress}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${g.progress}%; --sub-theme-color: var(--primary-color);"></div>
          </div>
        </div>
        
        <div class="exam-details">
          <div>🎯 Target Date: ${targetDate}</div>
        </div>
        
        <div style="margin-top:auto; display:flex; justify-content:space-between; align-items:center; border-top: 1px solid rgba(255,255,255,0.05); padding-top:12px;">
          <button class="btn-text" onclick="toggleGoalStatus('${g.id}')">
            ${isCompleted ? '↩️ Mark Active' : '✓ Mark Complete'}
          </button>
          <button class="btn btn-outline btn-sm" style="color:var(--danger); border-color:rgba(239,68,68,0.2);" onclick="deleteGoal('${g.id}')">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function saveGoal(event) {
  event.preventDefault();
  const editId = document.getElementById('edit-goal-id').value;
  const title = document.getElementById('goal-title').value.trim();
  const targetDate = document.getElementById('goal-targetdate').value;
  const progress = parseInt(document.getElementById('goal-progress').value) || 0;

  if (editId) {
    fetch(`http://localhost:5000/goals/${editId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        target_date: targetDate.split('T')[0],
        progress,
        completed: progress === 100
      })
    })
      .then(res => res.json())
      .then(data => {
        alert('Goal updated successfully!');
        loadGoalsFromDatabase();
        closeModal('add-goal-modal');
      })
      .catch(err => {
        console.error(err);
        alert('Failed to update goal');
      });

    return;
  } else {
    fetch('http://localhost:5000/goals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        target_date: targetDate,
        progress
      })
    })
      .then(res => res.json())
      .then(data => {
        alert('Goal saved successfully!');
        loadGoalsFromDatabase();
        closeModal('add-goal-modal');
      })
      .catch(err => {
        console.error(err);
        alert('Failed to save goal');
      });

    return;
  }
}

function editGoal(id) {
  const g = state.goals.find(goal => goal.id == id);
  if (!g) return;

  document.getElementById('edit-goal-id').value = g.id;
  document.getElementById('goal-title').value = g.title;
  document.getElementById('goal-targetdate').value = g.targetDate;

  const progressInput = document.getElementById('goal-progress');
  if (progressInput) {
    progressInput.value = g.progress;
    progressInput.style.setProperty('--progress', g.progress + '%');
  }
  const valSpan = document.getElementById('goal-progress-val');
  if (valSpan) valSpan.textContent = g.progress;

  document.getElementById('goal-modal-title').textContent = "Modify Target Objective";
  openModal('add-goal-modal');
}

function updateGoalProgress(id, value) {
  const progress = parseInt(value);
  const completed = progress === 100;

  const g = state.goals.find(goal => goal.id == id);
  if (!g) return;

  fetch(`http://localhost:5000/goals/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: g.title,
      target_date: g.targetDate,
      progress: progress,
      completed: completed
    })
  })
    .then(res => res.json())
    .then(data => {
      checkAchievements();
      loadGoalsFromDatabase();
    })
    .catch(err => {
      console.error(err);
      alert('Failed to update goal progress');
    });
}

function toggleGoalStatus(id) {
  const g = state.goals.find(goal => goal.id == id);
  if (!g) return;

  const nextCompleted = !g.completed;
  const nextProgress = nextCompleted ? 100 : 0;

  fetch(`http://localhost:5000/goals/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: g.title,
      target_date: g.targetDate,
      progress: nextProgress,
      completed: nextCompleted
    })
  })
    .then(res => res.json())
    .then(data => {
      checkAchievements();
      loadGoalsFromDatabase();
    })
    .catch(err => {
      console.error(err);
      alert('Failed to toggle goal status');
    });
}

function deleteGoal(id) {
  if (!confirm("Delete this study objective?")) {
    return;
  }

  fetch(`http://localhost:5000/goals/${id}`, {
    method: 'DELETE'
  })
    .then(res => res.json())
    .then(data => {
      alert('Goal deleted successfully!');
      loadGoalsFromDatabase();
    })
    .catch(err => {
      console.error(err);
      alert('Failed to delete goal');
    });
}

// --- 7. STREAKS SYSTEM ---
function incrementStreak() {
  const todayStr = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const lastDate = state.streak.lastStudyDate ? new Date(state.streak.lastStudyDate).toDateString() : null;

  const currentDayOfWeekIndex = new Date().getDay(); // 0 is Sunday, 6 is Saturday

  if (lastDate === todayStr) {
    // Already studied today, streak is valid. Just make sure day of week index is true
    state.streak.weeklyHistory[currentDayOfWeekIndex] = true;
    // saveDataToStorage();
    return;
  }

  if (lastDate === yesterdayStr || lastDate === null) {
    // Increments streak
    state.streak.current += 1;
    if (state.streak.current > state.streak.longest) {
      state.streak.longest = state.streak.current;
    }
  } else {
    // Broke streak, reset
    state.streak.current = 1;
  }

  state.streak.lastStudyDate = new Date().toISOString();
  state.streak.weeklyHistory[currentDayOfWeekIndex] = true;

  // saveDataToStorage();
  checkAchievements();
}

// Check and validate weekly streak logic reset on Sundays
function checkStreakWeeklyReset() {
  const lastDateStr = state.streak.lastStudyDate;
  if (!lastDateStr) return;

  const lastDate = new Date(lastDateStr);
  const now = new Date();

  // Calculate if a sunday passed since last date
  const lastDateSunday = new Date(lastDate);
  lastDateSunday.setDate(lastDate.getDate() - lastDate.getDay());

  const nowSunday = new Date(now);
  nowSunday.setDate(now.getDate() - now.getDay());

  if (nowSunday.toDateString() !== lastDateSunday.toDateString()) {
    // Clear history for the new week
    state.streak.weeklyHistory = [false, false, false, false, false, false, false];
    saveDataToStorage();
  }
}

// --- 8. SMART REMINDERS & ALERTS ---
function renderRemindersPanel() {
  const notifyDropdownList = document.getElementById('notifications-list');
  const notifyBadge = document.getElementById('notification-badge');
  const dashRemindersList = document.getElementById('dashboard-reminders-list');

  const reminders = generateSmartReminders();

  // Update Badge Count
  if (notifyBadge) {
    if (reminders.length > 0) {
      notifyBadge.textContent = reminders.length;
      notifyBadge.classList.remove('hide');
    } else {
      notifyBadge.classList.add('hide');
    }
  }

  // Update Header Bell Dropdown
  if (notifyDropdownList) {
    if (reminders.length === 0) {
      notifyDropdownList.innerHTML = '<div class="no-notifications">No urgent alerts. Looking good!</div>';
    } else {
      notifyDropdownList.innerHTML = reminders.map(r => `
        <div class="alert-item ${r.type}">
          <div class="alert-icon">${r.icon}</div>
          <div class="alert-content">
            <div class="alert-title">${escapeHtml(r.title)}</div>
            <div>${escapeHtml(r.desc)}</div>
          </div>
        </div>
      `).join('');
    }
  }

  // Update Dashboard Tab list
  if (dashRemindersList) {
    if (reminders.length === 0) {
      dashRemindersList.innerHTML = `
        <div class="alert-item info">
          <div class="alert-icon">✨</div>
          <div class="alert-content">
            <div class="alert-title">All schedules clear!</div>
            <div>No upcoming exams or overdue tasks. Keep doing great work.</div>
          </div>
        </div>
      `;
    } else {
      dashRemindersList.innerHTML = reminders.map(r => `
        <div class="alert-item ${r.type}">
          <div class="alert-icon">${r.icon}</div>
          <div class="alert-content">
            <div class="alert-title">${escapeHtml(r.title)}</div>
            <div>${escapeHtml(r.desc)}</div>
          </div>
        </div>
      `).join('');
    }
  }
}

function generateSmartReminders() {
  const alerts = [];
  const now = new Date();

  // 1. Overdue Tasks
  const overdueTasks = state.tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)));
  overdueTasks.forEach(t => {
    alerts.push({
      type: 'urgent',
      icon: '🚨',
      title: 'Overdue task',
      desc: `"${t.title}" was due on ${new Date(t.dueDate).toLocaleDateString()}`
    });
  });

  // 2. Urgent Exams (< 3 days)
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  const urgentExams = state.exams.filter(e => {
    const examDate = new Date(e.dateTime);
    return examDate > now && examDate <= threeDaysFromNow;
  });

  urgentExams.forEach(e => {
    const daysLeft = Math.round((new Date(e.dateTime) - now) / (1000 * 60 * 60 * 24));
    alerts.push({
      type: 'warning',
      icon: '📅',
      title: 'Urgent Exam approaching',
      desc: `"${e.name}" is scheduled in ${daysLeft === 0 ? 'less than a day' : daysLeft + ' days'}`
    });
  });

  // 3. No focus log study today check
  const todayStr = new Date().toDateString();
  const studiedToday = state.focusLogs.some(log => new Date(log.timestamp).toDateString() === todayStr);
  if (!studiedToday && state.subjects.length > 0) {
    alerts.push({
      type: 'info',
      icon: '⏱️',
      title: 'Daily study check',
      desc: 'You haven\'t logged any focus session today. Kickstart your day now!'
    });
  }

  return alerts;
}

// --- 9. ANALYTICS & CHARTS PANEL ---
function renderAnalyticsCharts() {
  // Chart Colors based on theme/therapy mode
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const labelColor = isDark ? '#94a3b8' : '#64748b';

  let accentColor = '#4f46e5';
  let gradientEnd = '#3b82f6';

  const therapy = document.documentElement.getAttribute('data-therapy');
  if (therapy === 'calm') {
    accentColor = '#059669';
    gradientEnd = '#10b981';
  } else if (therapy === 'creative') {
    accentColor = '#7c3aed';
    gradientEnd = '#db2777';
  }

  // 1. Weekly hours Chart
  const weeklyCanvas = document.getElementById('weekly-hours-chart');
  if (weeklyCanvas) {
    // Generate data for past 7 days
    const days = [];
    const studyHoursData = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push(d.toLocaleDateString(undefined, { weekday: 'short' }));

      const dStr = d.toDateString();
      const logsForDay = state.focusLogs.filter(log => new Date(log.timestamp).toDateString() === dStr);
      const hours = logsForDay.reduce((sum, l) => sum + l.duration, 0) / 60;
      studyHoursData.push(hours);
    }

    if (weeklyHoursChart) weeklyHoursChart.destroy();

    weeklyHoursChart = new Chart(weeklyCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: days,
        datasets: [{
          label: 'Hours Studied',
          data: studyHoursData,
          borderColor: accentColor,
          backgroundColor: 'rgba(79, 70, 229, 0.05)',
          fill: true,
          tension: 0.35,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: gridColor }, ticks: { color: labelColor } },
          x: { grid: { display: false }, ticks: { color: labelColor } }
        }
      }
    });
  }

  // 2. Subject Distribution Doughnut
  const subjectCanvas = document.getElementById('subject-hours-chart');
  if (subjectCanvas) {
    const subNames = [];
    const subHours = [];
    const subColors = [];

    state.subjects.forEach(s => {
      const logs = state.focusLogs.filter(l => l.subjectId === s.id);
      const hrs = logs.reduce((sum, l) => sum + l.duration, 0) / 60;
      if (hrs > 0) {
        subNames.push(s.name);
        subHours.push(hrs);
        subColors.push(s.color);
      }
    });

    // Fallback if empty
    if (subNames.length === 0) {
      subNames.push("No data");
      subHours.push(1);
      subColors.push('#64748b');
    }

    if (subjectHoursChart) subjectHoursChart.destroy();

    subjectHoursChart = new Chart(subjectCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: subNames,
        datasets: [{
          data: subHours,
          backgroundColor: subColors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: labelColor, boxWidth: 12 } }
        },
        cutout: '65%'
      }
    });
  }

  // 3. Task Completion Trend
  const taskCanvas = document.getElementById('task-completion-chart');
  if (taskCanvas) {
    const days = [];
    const compData = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push(d.toLocaleDateString(undefined, { weekday: 'short' }));

      const dStr = d.toDateString();
      const count = state.tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt).toDateString() === dStr).length;
      compData.push(count);
    }

    if (taskCompletionChart) taskCompletionChart.destroy();

    taskCompletionChart = new Chart(taskCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{
          label: 'Completed Tasks',
          data: compData,
          backgroundColor: gradientEnd,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: gridColor }, ticks: { color: labelColor, stepSize: 1 } },
          x: { grid: { display: false }, ticks: { color: labelColor } }
        }
      }
    });
  }

  // Render KPI Metrics
  const avgFocusLabel = document.getElementById('kpi-avg-session');
  const avgCompLabel = document.getElementById('kpi-avg-completion');
  const targetLabel = document.getElementById('kpi-target-progress');

  if (avgFocusLabel) {
    const studySettings = document.getElementById('study-duration-input');
    const minVal = studySettings ? studySettings.value : 25;
    avgFocusLabel.textContent = `${minVal}.0 min`;
  }
  if (avgCompLabel) {
    const completed = state.tasks.filter(t => t.completed).length;
    const rate = state.tasks.length > 0 ? Math.round((completed / state.tasks.length) * 100) : 0;
    avgCompLabel.textContent = `${rate}%`;
  }
  if (targetLabel) {
    const totalMinutes = state.focusLogs.reduce((acc, log) => acc + log.duration, 0);
    const hrs = (totalMinutes / 60).toFixed(1);
    targetLabel.textContent = `${hrs}h / 40.0h`;
  }

  // Most Productive Subject
  const prodSubjectLabel = document.getElementById('kpi-prod-subject');
  if (prodSubjectLabel) {
    const subjectTotals = {};
    state.focusLogs.forEach(log => {
      const subjectName = getSubjectName(log.subjectId);
      if (!subjectTotals[subjectName]) {
        subjectTotals[subjectName] = 0;
      }
      subjectTotals[subjectName] += log.duration;
    });

    let bestSubject = '--';
    let maxMinutes = 0;
    Object.entries(subjectTotals).forEach(([name, mins]) => {
      if (mins > maxMinutes) {
        maxMinutes = mins;
        bestSubject = name;
      }
    });
    prodSubjectLabel.textContent = bestSubject;
  }

  // Most Productive Day
  const prodDayLabel = document.getElementById('kpi-prod-day');
  if (prodDayLabel) {
    const dayTotals = {};
    state.focusLogs.forEach(log => {
      const day = new Date(log.timestamp).toLocaleDateString(undefined, { weekday: 'long' });
      if (!dayTotals[day]) {
        dayTotals[day] = 0;
      }
      dayTotals[day] += log.duration;
    });

    let bestDay = '--';
    let maxMinutes = 0;
    Object.entries(dayTotals).forEach(([day, mins]) => {
      if (mins > maxMinutes) {
        maxMinutes = mins;
        bestDay = day;
      }
    });
    prodDayLabel.textContent = bestDay;
  }
}

// --- 10. ACHIEVEMENTS SYSTEM ---
function renderAchievements() {
  const container = document.getElementById('achievements-grid');
  if (!container) return;

  container.innerHTML = state.achievements.map(a => `
    <div class="badge-card ${a.unlocked ? 'unlocked' : 'locked'}">
      <div class="badge-visual">${a.icon}</div>
      <div class="badge-title">${escapeHtml(a.title)}</div>
      <div class="badge-desc">${escapeHtml(a.desc)}</div>
      ${a.unlocked ? `<div class="badge-unlock-date">Unlocked ${new Date(a.date).toLocaleDateString()}</div>` : '<div class="badge-unlock-date" style="color:var(--text-muted);">Locked</div>'}
    </div>
  `).join('');
}

function checkAchievements() {
  if (!achievementsLoaded) {
    return;
  }
  let updated = false;

  const totalHours = state.focusLogs.reduce((acc, log) => acc + log.duration, 0) / 60;
  const completedTasks = state.tasks.filter(t => t.completed).length;
  const completedGoals = state.goals.filter(g => g.completed).length;
  const totalTasks = state.tasks.length;

  state.achievements.forEach(a => {
    if (a.unlocked) return; // already achieved

    if (a.id === 'focus_rookie' && state.focusLogs.length >= 1) {
      unlockBadge(a);
      updated = true;
    }
    if (a.id === 'focus_mastery' && totalHours >= 10.0) {
      unlockBadge(a);
      updated = true;
    }
    if (a.id === 'focus_marathon' && totalHours >= 25.0) {
      unlockBadge(a);
      updated = true;
    }
    if (a.id === 'task_solver' && completedTasks >= 1) {
      unlockBadge(a);
      updated = true;
    }
    if (a.id === 'task_crusher' && completedTasks >= 10) {
      unlockBadge(a);
      updated = true;
    }
    if (a.id === 'streak_builder' && state.streak.current >= 3) {
      unlockBadge(a);
      updated = true;
    }
    if (a.id === 'streak_legend' && state.streak.current >= 7) {
      unlockBadge(a);
      updated = true;
    }
    if (a.id === 'exam_slayer' && state.exams.length >= 1) {
      unlockBadge(a);
      updated = true;
    }
    if (a.id === 'goal_starter' && completedGoals >= 1) {
      unlockBadge(a);
      updated = true;
    }
    if (a.id === 'goal_conqueror' && completedGoals >= 5) {
      unlockBadge(a);
      updated = true;
    }
    if (a.id === 'productivity_pro' && totalTasks >= 10 && (completedTasks / totalTasks) >= 0.8) {
      unlockBadge(a);
      updated = true;
    }
  });

  if (updated) {
    // saveDataToStorage();
    renderAchievements();
  }
}

function unlockBadge(achievement) {

  if (achievement.unlocked) {
    return;
  }

  achievement.unlocked = true;
  achievement.date = new Date().toISOString();

  fetch(`http://localhost:5000/achievements/${achievement.id}`, {
    method: 'PUT'
  })
    .catch(err => console.error(err));

  showToast(
    `🏆 ${achievement.title}`,
    achievement.desc
  );

  renderAchievements();

}

// --- 11. ADMIN INSTITUTIONAL PORTAL ---
const auditLogsData = [
  { user: "STU-298", action: "Completed 25m focus session", tag: "Biology", info: "25 mins", time: "Just now" },
  { user: "STU-882", action: "Scheduled midterm exam", tag: "Calculus", info: "July 24, 2026", time: "5 mins ago" },
  { user: "STU-105", action: "Completed milestone target", tag: "Physics", info: "Goal Accomplished", time: "12 mins ago" },
  { user: "STU-554", action: "Completed 50m study session", tag: "Literature", info: "50 mins", time: "18 mins ago" },
  { user: "STU-990", action: "Broke personal streak record", tag: "Streak", info: "9-day streak", time: "32 mins ago" }
];

function logAdminActivity(user, action, tag, info) {
  auditLogsData.unshift({
    user,
    action,
    tag,
    info,
    time: "Just now"
  });
  if (auditLogsData.length > 8) auditLogsData.pop();
  renderAdminLogs();
}

function renderAdminLogs() {
  const tableBody = document.querySelector('#admin-audit-log-table tbody');
  if (!tableBody) return;

  tableBody.innerHTML = auditLogsData.map(log => `
    <tr>
      <td><strong>${escapeHtml(log.user)}</strong></td>
      <td>${escapeHtml(log.action)}</td>
      <td><span class="badge-tag" style="background:rgba(255,255,255,0.06);">${escapeHtml(log.tag)}</span></td>
      <td>${escapeHtml(log.info)}</td>
      <td class="muted-text">${log.time}</td>
    </tr>
  `).join('');
}

function renderAdminTrendsChart() {
  const canvas = document.getElementById('admin-activity-chart');
  if (!canvas) return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const labelColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  let primaryAccent = '#8b5cf6'; // Default creative purple/blue line style

  const therapy = document.documentElement.getAttribute('data-therapy');
  if (therapy === 'focus') primaryAccent = '#4f46e5';
  else if (therapy === 'calm') primaryAccent = '#059669';

  if (adminActivityChart) adminActivityChart.destroy();

  adminActivityChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Active Students Today',
          data: [3200, 3900, 4280, 3800, 3100, 1800, 2400],
          borderColor: primaryAccent,
          tension: 0.3,
          borderWidth: 3,
          fill: false
        },
        {
          label: 'Focus Sessions Started',
          data: [8200, 9500, 11000, 9200, 7900, 4100, 5200],
          borderColor: '#e11d48',
          tension: 0.3,
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: labelColor } }
      },
      scales: {
        y: { grid: { color: gridColor }, ticks: { color: labelColor } },
        x: { grid: { display: false }, ticks: { color: labelColor } }
      }
    }
  });
}

// Export Reports Functions (CSV & mock PDF printout download)
function exportReports(format) {
  if (format === 'csv') {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "User ID,Activity,Subject Tag,Duration Info,Timestamp\r\n";

    auditLogsData.forEach(row => {
      const line = `"${row.user}","${row.action}","${row.tag}","${row.info}","${row.time}"`;
      csvContent += line + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "studyflow_institutional_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert("CSV Institutional audit report downloaded successfully!");
  } else if (format === 'pdf') {
    // Premium Simulated PDF print window
    window.print();
  }
}

// --- UTILITY HELPERS ---
function getSubjectColor(subjectId) {
  const sub = state.subjects.find(s => s.id === subjectId);
  return sub ? sub.color : '#94a3b8';
}

function getSubjectName(subjectId) {
  const sub = state.subjects.find(s => s.id === subjectId);
  return sub ? sub.name : 'Unassigned';
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(title, message) {

  const container =
    document.getElementById('toast-container');

  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';

  toast.innerHTML = `
    <div class="toast-title">${title}</div>
    <div class="toast-desc">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';

    setTimeout(() => {
      toast.remove();
    }, 300);

  }, 4000);
}
