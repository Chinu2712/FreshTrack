window.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('welcome-screen');
  const enterBtn = document.getElementById('close-popup');
  loadSavedData();

  function hidePopup() {
    if (!popup || popup.classList.contains('popup-hidden')) {
      return;
    }

    popup.classList.add('popup-hidden');

    setTimeout(() => {
      popup.style.display = 'none';
    }, 500);
  }

  if (popup && enterBtn) {
    enterBtn.addEventListener('click', hidePopup);

    setTimeout(hidePopup, 4000);
  }
});

let chart;
const STORAGE_KEY = 'freshTrackDashboard';
const savedData = {
    attendance: null,
    cgpa: null,
    budget: null
};

function showStorageStatus(message, isError = false) {
    const status = document.getElementById('storageStatus');
    if (status) {
        status.innerText = message;
        status.style.color = isError ? '#ff8a80' : '';
    }
}

function loadSavedData() {
    let rawData;

    try {
        rawData = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        showStorageStatus('Could not access saved data in this browser.', true);
        return;
    }

    if (!rawData) {
        showStorageStatus('Your entries will be saved in this browser.');
        return;
    }

    let data;
    try {
        data = JSON.parse(rawData);
    } catch (error) {
        showStorageStatus('Saved data could not be read. Enter values and calculate to replace it.', true);
        return;
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        showStorageStatus('Saved data has an invalid format. Enter values and calculate to replace it.', true);
        return;
    }

    let hasInvalidSection = false;

    const attendance = data.attendance;
    if (attendance) {
        const target = attendance.target === undefined ? 75 : attendance.target;
        if (typeof attendance !== 'object' || !Number.isInteger(attendance.total) ||
            !Number.isInteger(attendance.attended) || attendance.total < 1 ||
            attendance.attended < 0 || attendance.attended > attendance.total ||
            !Number.isFinite(target) || target < 0 || target > 100) {
            hasInvalidSection = true;
        } else {
            savedData.attendance = { total: attendance.total, attended: attendance.attended, target };
            document.getElementById('totalClasses').value = attendance.total;
            document.getElementById('attendedClasses').value = attendance.attended;
            document.getElementById('attendanceTarget').value = target;
        }
    }

    const cgpa = data.cgpa;
    if (cgpa) {
        const credits1 = cgpa.sgpa1Credits;
        const credits2 = cgpa.sgpa2Credits;
        if (typeof cgpa !== 'object' || !Number.isFinite(cgpa.sgpa1) ||
            !Number.isFinite(cgpa.sgpa2) || cgpa.sgpa1 < 0 || cgpa.sgpa1 > 10 ||
            cgpa.sgpa2 < 0 || cgpa.sgpa2 > 10 ||
            (credits1 !== undefined && credits1 !== null &&
                (!Number.isFinite(credits1) || credits1 <= 0)) ||
            (credits2 !== undefined && credits2 !== null &&
                (!Number.isFinite(credits2) || credits2 <= 0)) ||
            ((credits1 == null) !== (credits2 == null))) {
            hasInvalidSection = true;
        } else {
            savedData.cgpa = { sgpa1: cgpa.sgpa1, sgpa2: cgpa.sgpa2, sgpa1Credits: credits1 ?? null, sgpa2Credits: credits2 ?? null };
            document.getElementById('sgpa1').value = cgpa.sgpa1;
            document.getElementById('sgpa2').value = cgpa.sgpa2;
            document.getElementById('sgpa1Credits').value = credits1 ?? '';
            document.getElementById('sgpa2Credits').value = credits2 ?? '';
        }
    }

    const budget = data.budget;
    if (budget) {
        const budgetFields = ['amount', 'food', 'travel', 'entertainment'];
        if (typeof budget !== 'object' ||
            budgetFields.some((field) => !Number.isFinite(budget[field]) || budget[field] < 0)) {
            hasInvalidSection = true;
        } else {
            savedData.budget = budget;
            document.getElementById('budget').value = budget.amount;
            document.getElementById('foodExpense').value = budget.food;
            document.getElementById('travelExpense').value = budget.travel;
            document.getElementById('entExpense').value = budget.entertainment;
        }
    }

    if (savedData.attendance) calculateAttendance();
    if (savedData.cgpa) calculateCGPA();
    if (savedData.budget) calculateBudget();

    if (hasInvalidSection) {
        showStorageStatus('Some saved entries were invalid and were not restored.', true);
    } else {
        showStorageStatus('Saved entries restored from this browser.');
    }
}

function saveSection(section, values) {
    savedData[section] = values;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
        showStorageStatus('Entries saved in this browser.');
    } catch (error) {
        showStorageStatus('Could not save entries. Check browser storage settings.', true);
    }
}

function calculateAttendance(){

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
    saveSection('attendance', { total, attended, target });
}

function calculateCGPA(){

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
    saveSection('cgpa', { sgpa1, sgpa2, sgpa1Credits: credits1, sgpa2Credits: credits2 });
}

function calculateBudget(){

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
    saveSection('budget', values);
}

/* Chart */

function createChart(food, travel, entertainment){

    let ctx =
        document.getElementById("expenseChart");

    if(chart){
        chart.destroy();
    }

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
                ]
            }]
        }

    });
}