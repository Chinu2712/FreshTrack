window.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('welcome-screen');
  const enterBtn = document.getElementById('close-popup');
  initializeTheme();
  initializeProfileControls();
  loadProfiles();

  function showThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.classList.remove('theme-toggle--hidden');
    }
  }

  function hidePopup() {
    if (!popup || popup.classList.contains('popup-hidden')) {
      showThemeToggle();
      return;
    }

    showThemeToggle();
    popup.classList.add('popup-hidden');

    setTimeout(() => {
      popup.style.display = 'none';
    }, 500);
  }

  if (popup) {
    if (enterBtn) {
      enterBtn.addEventListener('click', hidePopup);
    }
    setTimeout(hidePopup, 4000);
  } else {
    showThemeToggle();
  }
});

let chart;
let lastExpenseValues = null;
const STORAGE_KEY = 'freshTrackProfiles';
const LEGACY_STORAGE_KEY = 'freshTrackDashboard';
const THEME_STORAGE_KEY = 'freshTrackTheme';
const MAX_PROFILES = 6;
let profiles = [];
let activeProfileId = null;
let savedData = createEmptyData();

function getStoredTheme() {
    try {
        const theme = localStorage.getItem(THEME_STORAGE_KEY);
        return theme === 'light' || theme === 'dark' ? theme : 'dark';
    } catch (error) {
        return 'dark';
    }
}

function applyChartTheme(theme) {
    if (typeof Chart === 'undefined') {
        return;
    }

    const textColor = theme === 'light' ? '#17212b' : '#ffffff';
    Chart.defaults.color = textColor;
    if (Chart.defaults.plugins && Chart.defaults.plugins.legend && Chart.defaults.plugins.legend.labels) {
        Chart.defaults.plugins.legend.labels.color = textColor;
    }
}

function applyTheme(theme, shouldPersist = true) {
    const resolvedTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', resolvedTheme);

    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        const isDark = resolvedTheme === 'dark';
        toggle.setAttribute('aria-checked', isDark ? 'true' : 'false');
        toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        toggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    }

    applyChartTheme(resolvedTheme);

    if (chart && lastExpenseValues) {
        createChart(lastExpenseValues.food, lastExpenseValues.travel, lastExpenseValues.entertainment);
    }

    if (shouldPersist) {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
        } catch (error) {
            // Theme can still apply for this session when storage is unavailable.
        }
    }
}

function initializeTheme() {
    const initialTheme = getStoredTheme();
    applyTheme(initialTheme, false);

    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
            applyTheme(currentTheme === 'light' ? 'dark' : 'light');
        });
    }
}

function createEmptyData() {
    return {
        attendance: null,
        cgpa: null,
        budget: null
    };
}

function showStorageStatus(message, isError = false) {
    const status = document.getElementById('storageStatus');
    if (status) {
        status.innerText = message;
        status.style.color = isError ? '#ff8a80' : '';
    }
}

function createProfile(name, data = createEmptyData()) {
    return {
        id: 'profile-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        name,
        data
    };
}

function normalizeProfileData(data) {
    const normalized = createEmptyData();
    let hasInvalidSection = false;

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return { data: normalized, hasInvalidSection: true };
    }

    const attendance = data.attendance;
    if (attendance !== undefined && attendance !== null) {
        const target = attendance.target === undefined ? 75 : attendance.target;
        if (typeof attendance !== 'object' || Array.isArray(attendance) ||
            !Number.isInteger(attendance.total) || !Number.isInteger(attendance.attended) ||
            attendance.total < 1 || attendance.attended < 0 ||
            attendance.attended > attendance.total || !Number.isFinite(target) ||
            target < 0 || target > 100) {
            hasInvalidSection = true;
        } else {
            normalized.attendance = {
                total: attendance.total,
                attended: attendance.attended,
                target
            };
        }
    }

    const cgpa = data.cgpa;
    if (cgpa !== undefined && cgpa !== null) {
        const credits1 = cgpa.sgpa1Credits;
        const credits2 = cgpa.sgpa2Credits;
        if (typeof cgpa !== 'object' || Array.isArray(cgpa) ||
            !Number.isFinite(cgpa.sgpa1) || !Number.isFinite(cgpa.sgpa2) ||
            cgpa.sgpa1 < 0 || cgpa.sgpa1 > 10 || cgpa.sgpa2 < 0 || cgpa.sgpa2 > 10 ||
            (credits1 != null && (!Number.isFinite(credits1) || credits1 <= 0)) ||
            (credits2 != null && (!Number.isFinite(credits2) || credits2 <= 0)) ||
            ((credits1 == null) !== (credits2 == null))) {
            hasInvalidSection = true;
        } else {
            normalized.cgpa = {
                sgpa1: cgpa.sgpa1,
                sgpa2: cgpa.sgpa2,
                sgpa1Credits: credits1 ?? null,
                sgpa2Credits: credits2 ?? null
            };
        }
    }

    const budget = data.budget;
    if (budget !== undefined && budget !== null) {
        const budgetFields = ['amount', 'food', 'travel', 'entertainment'];
        if (typeof budget !== 'object' || Array.isArray(budget) ||
            budgetFields.some((field) => !Number.isFinite(budget[field]) || budget[field] < 0)) {
            hasInvalidSection = true;
        } else {
            normalized.budget = {
                amount: budget.amount,
                food: budget.food,
                travel: budget.travel,
                entertainment: budget.entertainment
            };
        }
    }

    return { data: normalized, hasInvalidSection };
}

function loadProfiles() {
    let rawData;

    try {
        rawData = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        profiles = [createProfile('My Profile')];
        activeProfileId = profiles[0].id;
        renderProfiles();
        loadActiveProfile();
        showStorageStatus('Browser storage is unavailable. Profiles will not persist after closing this page.', true);
        return;
    }

    let hasInvalidData = false;
    if (rawData) {
        try {
            const stored = JSON.parse(rawData);
            if (stored && Array.isArray(stored.profiles)) {
                stored.profiles.slice(0, MAX_PROFILES).forEach((profile) => {
                    const profileName = typeof profile?.name === 'string'
                        ? profile.name.trim().slice(0, 40)
                        : '';
                    if (!profile || typeof profile.id !== 'string' ||
                        !profileName ||
                        profiles.some((existing) => existing.id === profile.id ||
                            existing.name.toLowerCase() === profileName.toLowerCase())) {
                        hasInvalidData = true;
                        return;
                    }

                    const normalized = normalizeProfileData(profile.data);
                    hasInvalidData = hasInvalidData || normalized.hasInvalidSection;
                    profiles.push({
                        id: profile.id,
                        name: profileName,
                        data: normalized.data
                    });
                });
                if (stored.profiles.length > MAX_PROFILES) hasInvalidData = true;
                activeProfileId = profiles.some((profile) => profile.id === stored.activeProfileId)
                    ? stored.activeProfileId
                    : profiles[0]?.id;
            } else {
                hasInvalidData = true;
            }
        } catch (error) {
            hasInvalidData = true;
        }
    } else {
        try {
            const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
            if (legacyData) {
                const normalized = normalizeProfileData(JSON.parse(legacyData));
                profiles.push(createProfile('My Profile', normalized.data));
                hasInvalidData = normalized.hasInvalidSection;
            }
        } catch (error) {
            hasInvalidData = true;
        }
    }

    if (profiles.length === 0) profiles.push(createProfile('My Profile'));
    if (!activeProfileId) activeProfileId = profiles[0].id;

    renderProfiles();
    loadActiveProfile();
    if (hasInvalidData) {
        showStorageStatus('Some saved profile data could not be restored. Check the affected profile and recalculate its values.', true);
    } else if (rawData) {
        showStorageStatus('Profiles and saved entries restored from this browser.');
    } else {
        if (saveProfiles()) {
            showStorageStatus('Your profile and entries are saved in this browser.');
        } else {
            showStorageStatus('Your profile is available for this session, but could not be saved in this browser.', true);
        }
    }
}

function initializeProfileControls() {
    document.getElementById('profileSelect').addEventListener('change', (event) => {
        switchProfile(event.target.value);
    });
    document.getElementById('addProfileBtn').addEventListener('click', createNewProfile);
    document.getElementById('removeProfileBtn').addEventListener('click', removeCurrentProfile);
}

function getActiveProfile() {
    return profiles.find((profile) => profile.id === activeProfileId);
}

function renderProfiles() {
    const select = document.getElementById('profileSelect');
    select.innerHTML = '';
    profiles.forEach((profile) => {
        const option = document.createElement('option');
        option.value = profile.id;
        option.textContent = profile.name;
        select.appendChild(option);
    });
    select.value = activeProfileId;
    document.getElementById('addProfileBtn').disabled = profiles.length >= MAX_PROFILES;
    document.getElementById('removeProfileBtn').disabled = profiles.length <= 1;
    document.getElementById('profileCount').innerText = profiles.length + ' / ' + MAX_PROFILES + ' profiles';
}

function loadActiveProfile() {
    const profile = getActiveProfile();
    if (!profile) return;

    savedData = profile.data;
    const inputIds = [
        'totalClasses', 'attendedClasses', 'sgpa1', 'sgpa2', 'sgpa1Credits',
        'sgpa2Credits', 'budget', 'foodExpense', 'travelExpense', 'entExpense'
    ];
    inputIds.forEach((id) => {
        document.getElementById(id).value = '';
    });
    document.getElementById('attendanceTarget').value = '75';
    document.getElementById('attendanceResult').innerText = '';
    document.getElementById('attendanceTargetResult').innerText = '';
    document.getElementById('warning').innerText = '';
    document.getElementById('cgpaResult').innerText = '';
    document.getElementById('budgetResult').innerText = '';
    document.getElementById('attendanceCard').innerText = '0%';
    document.getElementById('cgpaCard').innerText = '0.0';
    document.getElementById('budgetCard').innerText = '₹0';
    if (chart) {
        chart.destroy();
        chart = null;
    }
    lastExpenseValues = null;

    if (savedData.attendance) {
        document.getElementById('totalClasses').value = savedData.attendance.total;
        document.getElementById('attendedClasses').value = savedData.attendance.attended;
        document.getElementById('attendanceTarget').value = savedData.attendance.target;
        calculateAttendance(false);
    }
    if (savedData.cgpa) {
        document.getElementById('sgpa1').value = savedData.cgpa.sgpa1;
        document.getElementById('sgpa2').value = savedData.cgpa.sgpa2;
        document.getElementById('sgpa1Credits').value = savedData.cgpa.sgpa1Credits ?? '';
        document.getElementById('sgpa2Credits').value = savedData.cgpa.sgpa2Credits ?? '';
        calculateCGPA(false);
    }
    if (savedData.budget) {
        document.getElementById('budget').value = savedData.budget.amount;
        document.getElementById('foodExpense').value = savedData.budget.food;
        document.getElementById('travelExpense').value = savedData.budget.travel;
        document.getElementById('entExpense').value = savedData.budget.entertainment;
        calculateBudget(false);
    }
    document.getElementById('activeProfileName').innerText = profile.name;
}

function switchProfile(profileId) {
    if (!profiles.some((profile) => profile.id === profileId)) return;
    activeProfileId = profileId;
    renderProfiles();
    loadActiveProfile();
    if (saveProfiles()) {
        showStorageStatus('Switched to profile "' + getActiveProfile().name + '".');
    }
}

function createNewProfile() {
    const nameInput = document.getElementById('newProfileName');
    const name = nameInput.value.trim();

    if (!name) {
        document.getElementById('profileStatus').innerText = 'Enter a profile name first.';
        return;
    }
    if (name.length > 40) {
        document.getElementById('profileStatus').innerText = 'Profile names must be 40 characters or fewer.';
        return;
    }
    if (profiles.length >= MAX_PROFILES) {
        document.getElementById('profileStatus').innerText = 'You can create up to ' + MAX_PROFILES + ' profiles.';
        return;
    }
    if (profiles.some((profile) => profile.name.toLowerCase() === name.toLowerCase())) {
        document.getElementById('profileStatus').innerText = 'A profile with that name already exists.';
        return;
    }

    const profile = createProfile(name);
    profiles.push(profile);
    activeProfileId = profile.id;
    nameInput.value = '';
    renderProfiles();
    loadActiveProfile();
    document.getElementById('profileStatus').innerText = saveProfiles()
        ? 'Profile "' + name + '" created and saved.'
        : 'Profile "' + name + '" is available for this session but could not be saved.';
}

function removeCurrentProfile() {
    if (profiles.length <= 1) {
        document.getElementById('profileStatus').innerText = 'Keep at least one profile.';
        return;
    }

    const profile = getActiveProfile();
    if (!window.confirm('Remove profile "' + profile.name + '" and its saved data?')) return;

    profiles = profiles.filter((item) => item.id !== activeProfileId);
    activeProfileId = profiles[0].id;
    renderProfiles();
    loadActiveProfile();
    document.getElementById('profileStatus').innerText = saveProfiles()
        ? 'Profile "' + profile.name + '" removed.'
        : 'Profile "' + profile.name + '" removed for this session, but the change could not be saved.';
}

function saveProfiles() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            activeProfileId,
            profiles
        }));
        return true;
    } catch (error) {
        showStorageStatus('Could not save profiles. Check browser storage settings.', true);
        return false;
    }
}

function saveSection(section, values) {
    savedData[section] = values;
    const profile = getActiveProfile();
    if (profile) {
        profile.data = savedData;
        if (saveProfiles()) {
            showStorageStatus('Entries saved to profile "' + profile.name + '" in this browser.');
        }
    }
}

function calculateAttendance(shouldSave = true){

    const totalInput = document.getElementById("totalClasses");
    const attendedInput = document.getElementById("attendedClasses");
    const targetInput = document.getElementById("attendanceTarget");
    const total = Number(totalInput.value);
    const attended = Number(attendedInput.value);
    const target = Number(targetInput.value);
    const result = document.getElementById("attendanceResult");
    const targetResult = document.getElementById("attendanceTargetResult");
    const warning = document.getElementById("warning");

    if (!totalInput.value || !attendedInput.value || !targetInput.value ||
        !Number.isInteger(total) || !Number.isInteger(attended) ||
        !Number.isFinite(target) || target < 0 || target > 100 ||
        total < 1 || attended < 0 || attended > total) {
        result.innerText = "Enter whole-number class counts with total classes above 0, attended classes between 0 and total, and a target from 0 to 100%.";
        targetResult.innerText = "";
        warning.innerText = "";
        return;
    }

    const percentage = (attended / total) * 100;
    let targetMessage;
    if (percentage >= target) {
        targetMessage = "Attendance target met. No extra classes needed.";
    } else if (target === 100) {
        targetMessage = "A 100% attendance target cannot be reached after missing a class.";
    } else {
        const requiredClasses = Math.ceil(((target / 100) * total - attended) / (1 - target / 100));
        targetMessage = "Attend the next " + requiredClasses + " classes to reach " + target + "%.";
    }

    result.innerText = "Attendance: " + percentage.toFixed(2) + "%";
    targetResult.innerText = targetMessage;

    document.getElementById("attendanceCard").innerText = percentage.toFixed(1) + "%";

    warning.innerText = percentage < target
        ? "⚠ Warning: Attendance below " + target + "%"
        : "✅ Attendance Safe";
    if (shouldSave) saveSection('attendance', { total, attended, target });
}

function calculateCGPA(shouldSave = true){

    const sgpa1Input = document.getElementById("sgpa1");
    const sgpa2Input = document.getElementById("sgpa2");
    const credits1Input = document.getElementById("sgpa1Credits");
    const credits2Input = document.getElementById("sgpa2Credits");
    const sgpa1 = Number(sgpa1Input.value);
    const sgpa2 = Number(sgpa2Input.value);
    const credits1 = credits1Input.value === '' ? null : Number(credits1Input.value);
    const credits2 = credits2Input.value === '' ? null : Number(credits2Input.value);

    if (!sgpa1Input.value || !sgpa2Input.value ||
        !Number.isFinite(sgpa1) || !Number.isFinite(sgpa2) ||
        sgpa1 < 0 || sgpa1 > 10 || sgpa2 < 0 || sgpa2 > 10 ||
        (credits1 === null) !== (credits2 === null) ||
        (credits1 !== null && (!Number.isFinite(credits1) || credits1 <= 0)) ||
        (credits2 !== null && (!Number.isFinite(credits2) || credits2 <= 0))) {
        document.getElementById("cgpaResult").innerText =
            "Enter both SGPAs from 0 to 10 and either both credit values above 0 or leave both credits blank.";
        return;
    }

    const cgpa = credits1 === null
        ? (sgpa1 + sgpa2) / 2
        : ((sgpa1 * credits1) + (sgpa2 * credits2)) / (credits1 + credits2);

    document.getElementById("cgpaResult").innerText = "Estimated CGPA: " + cgpa.toFixed(2) +
        (credits1 === null ? " (simple average)" : " (credit-weighted)");
    document.getElementById("cgpaCard").innerText = cgpa.toFixed(2);
    if (shouldSave) saveSection('cgpa', { sgpa1, sgpa2, sgpa1Credits: credits1, sgpa2Credits: credits2 });
}

function calculateBudget(shouldSave = true){

    const inputValues = {
        amount: document.getElementById("budget").value,
        food: document.getElementById("foodExpense").value,
        travel: document.getElementById("travelExpense").value,
        entertainment: document.getElementById("entExpense").value
    };
    const values = Object.fromEntries(
        Object.entries(inputValues).map(([key, value]) => [key, Number(value)])
    );

    if (Object.values(inputValues).some((value) => value === '') ||
        Object.values(values).some((value) => !Number.isFinite(value) || value < 0)) {
        document.getElementById("budgetResult").innerText =
            "Enter a budget and non-negative amounts for all expense categories.";
        return;
    }

    const { amount: budget, food, travel, entertainment } = values;
    const totalExpense = food + travel + entertainment;

    const remaining = budget - totalExpense;

    document.getElementById("budgetResult").innerText =
        "Remaining Budget: ₹" + remaining.toFixed(2);

    document.getElementById("budgetCard").innerText = "₹" + remaining.toFixed(2);

    createChart(food, travel, entertainment);
    if (shouldSave) saveSection('budget', values);
}

/* Chart */

function createChart(food, travel, entertainment){

    let ctx =
        document.getElementById("expenseChart");

    if (!ctx || typeof Chart === 'undefined') {
        return;
    }

    lastExpenseValues = { food, travel, entertainment };

    if(chart){
        chart.destroy();
    }

    const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const textColor = theme === 'light' ? '#17212b' : '#ffffff';

    chart = new Chart(ctx, {

        type: 'pie',

        data: {

            labels: [
                'Food',
                'Travel',
                'Entertainment'
            ],

            datasets: [{
                data: [
                    food,
                    travel,
                    entertainment
                ],

                backgroundColor:[
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56'
                ],
                borderColor: theme === 'light' ? '#ffffff' : '#1e1e1e',
                borderWidth: 2
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            }
        }

    });
}