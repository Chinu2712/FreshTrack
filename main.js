window.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('welcome-screen');
  const enterBtn = document.getElementById('close-popup');

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

function calculateAttendance(){

    let total =
        Number(document.getElementById("totalClasses").value);

    let attended =
        Number(document.getElementById("attendedClasses").value);

    let percentage =
        (attended / total) * 100;

    document.getElementById("attendanceResult")
        .innerText =
        "Attendance: " +
        percentage.toFixed(2) + "%";

    document.getElementById("attendanceCard")
        .innerText =
        percentage.toFixed(1) + "%";

    if(percentage < 75){

        document.getElementById("warning")
        .innerText =
        "⚠ Warning: Attendance below 75%";

    }
    else{

        document.getElementById("warning")
        .innerText =
        "✅ Attendance Safe";

    }
}

function calculateCGPA(){

    let sgpa1 =
        Number(document.getElementById("sgpa1").value);

    let sgpa2 =
        Number(document.getElementById("sgpa2").value);

    let cgpa =
        (sgpa1 + sgpa2) / 2;

    document.getElementById("cgpaResult")
        .innerText =
        "Estimated CGPA: " +
        cgpa.toFixed(2);

    document.getElementById("cgpaCard")
        .innerText =
        cgpa.toFixed(2);
}

function calculateBudget(){

    let budget =
        Number(document.getElementById("budget").value);

    let food =
        Number(document.getElementById("foodExpense").value);

    let travel =
        Number(document.getElementById("travelExpense").value);

    let entertainment =
        Number(document.getElementById("entExpense").value);

    let totalExpense =
        food + travel + entertainment;

    let remaining =
        budget - totalExpense;

    document.getElementById("budgetResult")
        .innerText =
        "Remaining Budget: ₹" +
        remaining;

    document.getElementById("budgetCard")
        .innerText =
        "₹" + remaining;

    createChart(food, travel, entertainment,);
}

/* Chart */

function createChart(food, travel, entertainment,){

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