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

    const fieldsBySection = {
        attendance: ['total', 'attended'],
        cgpa: ['sgpa1', 'sgpa2'],
        budget: ['amount', 'food', 'travel', 'entertainment']
    };
    let hasInvalidSection = false;

    Object.entries(fieldsBySection).forEach(([section, fields]) => {
        const values = data[section];
        if (!values) {
            return;
        }

        if (typeof values !== 'object' ||
            fields.some((field) => !Number.isFinite(values[field]))) {
            hasInvalidSection = true;
            return;
        }

        savedData[section] = values;
        const inputIds = {
            attendance: { total: 'totalClasses', attended: 'attendedClasses' },
            cgpa: { sgpa1: 'sgpa1', sgpa2: 'sgpa2' },
            budget: {
                amount: 'budget',
                food: 'foodExpense',
                travel: 'travelExpense',
                entertainment: 'entExpense'
            }
        };

        fields.forEach((field) => {
            document.getElementById(inputIds[section][field]).value = values[field];
        });
    });

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
    const total = Number(totalInput.value);
    const attended = Number(attendedInput.value);
    const result = document.getElementById("attendanceResult");
    const warning = document.getElementById("warning");

    if (!totalInput.value || !attendedInput.value ||
        !Number.isInteger(total) || !Number.isInteger(attended) ||
        total < 1 || attended < 0 || attended > total) {
        result.innerText = "Enter whole numbers with total classes above 0 and attended classes between 0 and total.";
        warning.innerText = "";
        return;
    }

    const percentage = (attended / total) * 100;

    result.innerText = "Attendance: " + percentage.toFixed(2) + "%";

    document.getElementById("attendanceCard").innerText = percentage.toFixed(1) + "%";

    warning.innerText = percentage < 75
        ? "⚠ Warning: Attendance below 75%"
        : "✅ Attendance Safe";
    saveSection('attendance', { total, attended });
}

function calculateCGPA(){

    const sgpa1Input = document.getElementById("sgpa1");
    const sgpa2Input = document.getElementById("sgpa2");
    const sgpa1 = Number(sgpa1Input.value);
    const sgpa2 = Number(sgpa2Input.value);

    if (!sgpa1Input.value || !sgpa2Input.value ||
        !Number.isFinite(sgpa1) || !Number.isFinite(sgpa2) ||
        sgpa1 < 0 || sgpa1 > 10 || sgpa2 < 0 || sgpa2 > 10) {
        document.getElementById("cgpaResult").innerText =
            "Enter both semester SGPAs as numbers from 0 to 10.";
        return;
    }

    const cgpa = (sgpa1 + sgpa2) / 2;

    document.getElementById("cgpaResult").innerText = "Estimated CGPA: " + cgpa.toFixed(2);
    document.getElementById("cgpaCard").innerText = cgpa.toFixed(2);
    saveSection('cgpa', { sgpa1, sgpa2 });
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