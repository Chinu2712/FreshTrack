window.addEventListener('DOMContentLoaded', () => {
    const popup = document.getElementById('welcome-screen');
    const enterButton = document.getElementById('close-popup');

    initializeProfileControls();
    initializeBudgetControls();
    initializeTrackerButtons();
    loadProfiles();

    function hidePopup() {
        if (!popup || popup.classList.contains('popup-hidden')) {
            showThemeToggle();
            return;
        }

        popup.classList.add('popup-hidden');

        setTimeout(() => {
            popup.style.display = 'none';
            showThemeToggle();
        }, 500);
    }

    if (popup) {
        if (enterButton) {
            enterButton.addEventListener('click', hidePopup);
        }
        setTimeout(hidePopup, 4000);
    } else {
        showThemeToggle();
    }
});

function showThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.classList.remove('theme-toggle--hidden');
    }
}

let chart;
let lastExpenseValues = null;
const STORAGE_KEY = 'freshTrackProfiles';
const LEGACY_STORAGE_KEY = 'freshTrackDashboard';
const MAX_PROFILES = 6;
let profiles = [];
let activeProfileId = null;
let savedData = createEmptyData();

document.addEventListener('themechange', (event) => {
    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = event.detail.theme === 'light' ? '#17212b' : '#ffffff';
    }

    if (chart && lastExpenseValues) {
        createChart(lastExpenseValues);
    }
});

function initializeTrackerButtons() {
    document.getElementById('attendanceBtn').addEventListener('click', () => calculateAttendance());
    document.getElementById('cgpaBtn').addEventListener('click', () => calculateCGPA());
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
        let expenses;
        if (Array.isArray(budget.expenses)) {
            expenses = budget.expenses;
        } else {
            expenses = [
                { name: 'Food', amount: budget.food },
                { name: 'Travel', amount: budget.travel },
                { name: 'Entertainment', amount: budget.entertainment }
            ];
        }

        if (typeof budget !== 'object' || Array.isArray(budget) ||
            !Number.isFinite(budget.amount) || budget.amount < 0 ||
            !Array.isArray(expenses) ||
            expenses.some((expense) => !expense || typeof expense.name !== 'string' ||
                !expense.name.trim() || expense.name.trim().length > 40 ||
                !Number.isFinite(expense.amount) || expense.amount < 0)) {
            hasInvalidSection = true;
        } else {
            normalized.budget = {
                amount: budget.amount,
                expenses: expenses.map((expense) => ({
                    name: expense.name.trim(),
                    amount: expense.amount
                }))
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

function initializeBudgetControls() {
    document.getElementById('addExpenseBtn').addEventListener('click', () => {
        const row = addExpenseEntry('', '');
        row.querySelector('.expense-name').focus();
    });
    document.getElementById('generateBudgetBtn').addEventListener('click', () => calculateBudget());
}

function addExpenseEntry(name, amount) {
    const row = document.createElement('div');
    row.className = 'expense-entry';

    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Expense name';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'expense-name';
    nameInput.placeholder = 'e.g. Books';
    nameInput.maxLength = 40;
    nameInput.value = name;
    nameLabel.appendChild(nameInput);

    const amountLabel = document.createElement('label');
    amountLabel.textContent = 'Amount (₹)';
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.className = 'expense-amount';
    amountInput.placeholder = 'Expense amount';
    amountInput.min = '0';
    amountInput.step = '0.01';
    amountInput.value = amount;
    amountLabel.appendChild(amountInput);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-expense-btn';
    removeButton.textContent = 'Remove';
    removeButton.setAttribute('aria-label', 'Remove this expense entry');
    removeButton.addEventListener('click', () => row.remove());

    row.append(nameLabel, amountLabel, removeButton);
    document.getElementById('expenseEntries').appendChild(row);
    return row;
}

function renderExpenseEntries(expenses) {
    const container = document.getElementById('expenseEntries');
    container.replaceChildren();
    expenses.forEach((expense) => addExpenseEntry(expense.name, expense.amount));
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
        'sgpa2Credits', 'budget'
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
    renderExpenseEntries([
        { name: 'Food', amount: '' },
        { name: 'Travel', amount: '' },
        { name: 'Entertainment', amount: '' }
    ]);
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
        renderExpenseEntries(savedData.budget.expenses);
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

function calculateAttendance(shouldSave = true) {
    const totalInput = document.getElementById('totalClasses');
    const attendedInput = document.getElementById('attendedClasses');
    const targetInput = document.getElementById('attendanceTarget');
    const total = Number(totalInput.value);
    const attended = Number(attendedInput.value);
    const target = Number(targetInput.value);
    const result = document.getElementById('attendanceResult');
    const targetResult = document.getElementById('attendanceTargetResult');
    const warning = document.getElementById('warning');

    const invalidInput =
        !totalInput.value ||
        !attendedInput.value ||
        !targetInput.value ||
        !Number.isInteger(total) || !Number.isInteger(attended) ||
        !Number.isFinite(target) || target < 0 || target > 100 ||
        total < 1 || attended < 0 || attended > total;

    if (invalidInput) {
        result.innerText = 'Enter whole-number class counts with total classes above 0, attended classes between 0 and total, and a target from 0 to 100%.';
        targetResult.innerText = "";
        warning.innerText = "";
        return;
    }

    const percentage = (attended / total) * 100;
    const targetMet = attended * 100 >= target * total;
    let targetMessage = 'Attendance target met. No extra classes needed.';

    if (!targetMet && target === 100) {
        targetMessage = 'A 100% attendance target cannot be reached after missing a class.';
    } else if (!targetMet) {
        const requiredClasses = Math.ceil((target * total - 100 * attended) / (100 - target));
        targetMessage = 'Attend the next ' + requiredClasses + ' classes to reach ' + target + '%.';
    }

    result.innerText = 'Attendance: ' + percentage.toFixed(2) + '%';
    targetResult.innerText = targetMessage;

    document.getElementById('attendanceCard').innerText = percentage.toFixed(1) + '%';

    warning.innerText = !targetMet
        ? '⚠ Warning: Attendance below ' + target + '%'
        : '✅ Attendance Safe';
    if (shouldSave) saveSection('attendance', { total, attended, target });
}

function calculateCGPA(shouldSave = true) {
    const sgpa1Input = document.getElementById('sgpa1');
    const sgpa2Input = document.getElementById('sgpa2');
    const credits1Input = document.getElementById('sgpa1Credits');
    const credits2Input = document.getElementById('sgpa2Credits');
    const sgpa1 = Number(sgpa1Input.value);
    const sgpa2 = Number(sgpa2Input.value);
    const credits1 = credits1Input.value === '' ? null : Number(credits1Input.value);
    const credits2 = credits2Input.value === '' ? null : Number(credits2Input.value);
    const hasCreditsForBoth = credits1 !== null && credits2 !== null;
    const hasNoCredits = credits1 === null && credits2 === null;
    const validCredits = hasNoCredits ||
        (hasCreditsForBoth && Number.isFinite(credits1) && credits1 > 0 &&
            Number.isFinite(credits2) && credits2 > 0);

    if (!sgpa1Input.value || !sgpa2Input.value ||
        !Number.isFinite(sgpa1) || !Number.isFinite(sgpa2) ||
        sgpa1 < 0 || sgpa1 > 10 || sgpa2 < 0 || sgpa2 > 10 ||
        !validCredits) {
        document.getElementById('cgpaResult').innerText =
            'Enter both SGPAs from 0 to 10 and either both credit values above 0 or leave both credits blank.';
        return;
    }

    const cgpa = hasNoCredits
        ? (sgpa1 + sgpa2) / 2
        : ((sgpa1 * credits1) + (sgpa2 * credits2)) / (credits1 + credits2);

    document.getElementById('cgpaResult').innerText = 'Estimated CGPA: ' + cgpa.toFixed(2) +
        (hasNoCredits ? ' (simple average)' : ' (credit-weighted)');
    document.getElementById('cgpaCard').innerText = cgpa.toFixed(2);
    if (shouldSave) saveSection('cgpa', { sgpa1, sgpa2, sgpa1Credits: credits1, sgpa2Credits: credits2 });
}

function calculateBudget(shouldSave = true) {
    const budgetInput = document.getElementById('budget').value;
    const budget = Number(budgetInput);
    const expenseRows = document.querySelectorAll('#expenseEntries .expense-entry');
    const expenses = [];

    for (const row of expenseRows) {
        const name = row.querySelector('.expense-name').value.trim();
        const amountInput = row.querySelector('.expense-amount').value;
        const amount = Number(amountInput);

        if (!name || name.length > 40 || amountInput === '' ||
            !Number.isFinite(amount) || amount < 0) {
            document.getElementById('budgetResult').innerText =
                'Enter a budget, an expense name, and a non-negative amount for every entry.';
            return;
        }

        expenses.push({ name, amount });
    }

    if (budgetInput === '' || !Number.isFinite(budget) || budget < 0) {
        document.getElementById('budgetResult').innerText =
            'Enter a budget, an expense name, and a non-negative amount for every entry.';
        return;
    }

    const totalExpense = expenses.reduce((total, expense) => total + expense.amount, 0);
    const remaining = budget - totalExpense;
    const expenseSummary = expenses.length
        ? expenses.map((expense) => expense.name + ': ₹' + expense.amount.toFixed(2)).join(' | ')
        : 'No expense entries';
    const budgetMessage = expenseSummary + ' | Total expenses: ₹' + totalExpense.toFixed(2) + ' | ' +
        (remaining < 0
            ? 'Over budget by: ₹' + Math.abs(remaining).toFixed(2)
            : 'Remaining Budget: ₹' + remaining.toFixed(2));

    document.getElementById('budgetResult').innerText = budgetMessage;
    document.getElementById('budgetCard').innerText = '₹' + remaining.toFixed(2);

    createChart(expenses);
    if (shouldSave) saveSection('budget', { amount: budget, expenses });
}

function createChart(expenses) {
    lastExpenseValues = expenses.map((expense) => ({ ...expense }));
    const canvas = document.getElementById('expenseChart');
    if (!canvas || typeof Chart === 'undefined') {
        return;
    }

    if (chart) {
        chart.destroy();
    }

    const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const textColor = theme === 'light' ? '#17212b' : '#ffffff';
    const chartColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

    chart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: expenses.map((expense) => expense.name),
            datasets: [{
                data: expenses.map((expense) => expense.amount),
                backgroundColor: expenses.map((_, index) => chartColors[index % chartColors.length]),
                borderColor: theme === 'light' ? '#ffffff' : '#1e1e1e',
                borderWidth: 2
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: { color: textColor }
                }
            }
        }
    });
}