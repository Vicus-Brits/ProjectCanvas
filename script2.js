// DOM ELEMENTS
document
  .getElementById("input-excel")
  .addEventListener("change", readFile, false);

// SYSTEM VARIABLES
let exceldata;
let rawData;
let timelineStart;
let timelineEnd;
let defaultDate;
const canvas = document.getElementById("canvasBar");
const ctx = canvas.getContext("2d");

// HELPER FUNCTIONS
function excelSerialDateToDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);

  return new Date(
    date_info.getFullYear(),
    date_info.getMonth(),
    date_info.getDate()
  );
}

function daysBetweenDates(startDate, endDate) {
  var start = Date.UTC(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );
  var end = Date.UTC(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );
  var dayDiff = (end - start) / (1000 * 60 * 60 * 24);
  return dayDiff;
}

function weekDaysBetweenDates(startDate, endDate) {
  let count = 0;
  let currentDate = new Date(startDate.getTime());

  while (currentDate <= endDate) {
    // Get the day of the week: 0 is Sunday, 6 is Saturday
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Weekday
      count++;
    }
    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
}

function isSameDate(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatDate(date) {
  return (
    date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate()
  );
}

function populateIndicator1Dropdown(data) {
  let indicator1Values = new Set(data.map((row) => row.Indicator1));
  let dropdown = document.getElementById("indicator1Dropdown");
  indicator1Values.forEach((value) => {
    let option = document.createElement("option");
    option.value = value;
    option.text = value;
    option.selected = true;
    dropdown.appendChild(option);
  });
}

function filterDataByIndicator1(data) {
  let selectedIndicators = new Set(
    Array.from(
      document.getElementById("indicator1Dropdown").selectedOptions
    ).map((option) => option.value)
  );
  return data.filter((row) => selectedIndicators.has(row.Indicator1));
}

function renderTable(data, elementId) {
  var html = '<table class="table table-bordered table-striped">';

  // Add table headers
  html += "<thead><tr>";
  columnsOrder.forEach(function (key) {
    html += "<th>" + key + "</th>";
  });
  html += "</tr></thead>";

  // Add table body
  html += "<tbody>";
  data.forEach(function (row) {
    html += "<tr>";
    columnsOrder.forEach(function (key) {
      var value = row[key];
      // Check if the value is null, undefined, an empty string, or a Date object
      if (value instanceof Date && isSameDate(value, defaultDate)) {
        html += "<td>-</td>";
      } else if (value === null || value === undefined || value === "") {
        html += "<td>-</td>";
      } else if (value instanceof Date) {
        var formattedDate =
          value.getFullYear() +
          "/" +
          ("0" + (value.getMonth() + 1)).slice(-2) +
          "/" +
          ("0" + value.getDate()).slice(-2);
        html += "<td>" + formattedDate + "</td>";
      } else {
        html += "<td>" + value + "</td>";
      }
    });
    html += "</tr>";
  });
  html += "</tbody></table>";

  document.getElementById(elementId).innerHTML = html;
}

// EXCEL FILE READER
function readFile(event) {
  exceldata = null;
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const data = event.target.result;
    const workbook = XLSX.read(data, { type: "binary" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    exceldata = XLSX.utils.sheet_to_json(worksheet);

    exceldata.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (
          key.startsWith("P") &&
          (key.endsWith("_Start") || key.endsWith("_End"))
        ) {
          row[key] = excelSerialDateToDate(row[key]);
        }
      });
    });
    rawData = exceldata;
    processTimeVariables(exceldata);
    populateIndicator1Dropdown(rawData);
  };
  reader.readAsBinaryString(file);
  event.target.value = "";
}
// SYSTEM TIME VARIABLES
function timevariables() {
  // calculate time variables
  timelineStart = new Date("2023-11-01");
  timelineEnd = new Date("2024-30-31");
  timeLineSpan = daysBetweenDates(
    new Date(timelineStart.getTime()),
    new Date(timelineEnd.getTime() + 1000 * 60 * 60 * 24)
  );
  defaultDate = timelineStart;
  defaultDate.setDate(defaultDate.getDate() - 1);
}

// EXCEL FILE READER
function readFile(event) {
  // Clear the previous data
  exceldata = null;

  const file = event.target.files[0];
  if (!file) {
    return; // Exit if no file is selected
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    const data = event.target.result;
    const workbook = XLSX.read(data, {
      type: "binary",
    });

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert worksheet to JSON
    exceldata = XLSX.utils.sheet_to_json(worksheet);

    // Convert Excel dates to dates
    exceldata.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (
          key.startsWith("P") &&
          (key.endsWith("_Start") || key.endsWith("_End"))
        ) {
          row[key] = excelSerialDateToDate(row[key]);
        }
      });
    });
    rawData = exceldata;
    // Process time variables next
    processTimeVariables(exceldata);
  };
  reader.readAsBinaryString(file);
  // After data is processed
  populateIndicator1Dropdown(rawData); // Populate the dropdown

  // Clear the file input to trigger change event next time even for the same file
  event.target.value = "";
}

// PROCESS TIME VARIABLES
function processTimeVariables(data) {
  // calculate time variables
  timevariables();
  // log time variables
  console.log("timelineStart: " + timelineStart);
  console.log("timelineEnd: " + timelineEnd);
  console.log("defaultDate: " + defaultDate);
  console.log("timeLineSpan: " + timeLineSpan);
  // Set empty dates to the default date
  data.forEach((row) => {
    for (let i = 1; i <= 7; i++) {
      var startnotnull = "P" + i + "_Start";
      // if start date is null, set it to defaultDate
      if (!row[startnotnull]) {
        row[startnotnull] = defaultDate;
      }
      // if end date is null, set it to defaultDate
      var endnotnull = "P" + i + "_End";
      if (!row[endnotnull]) {
        row[endnotnull] = defaultDate;
      }
    }
  });
  processCleanStart(data);
}

// PROCESS CLEAN START
function processCleanStart(data) {
  data.forEach((row) => {
    for (let start = 7; start >= 1; start--) {
      let startCleanDateKey = "P" + start + "_StartClean";
      let endDateKey = "P" + start + "_End";
      let startDateKey = "P" + start + "_Start";
      let startDateValue = new Date(row[startDateKey].getTime());
      let endDateValue = new Date(row[endDateKey].getTime());

      let cleanDateValue = startDateValue;
      // itterate from previous period backwards to find the latest end date
      for (let end = start - 1; end >= 1; end--) {
        let endDateKeyPi = "P" + end + "_End";
        let endDateValuePi = new Date(
          row[endDateKeyPi].getTime() + 1000 * 60 * 60 * 24
        );
        // if the end date is greater than the cleanDateValue, set cleanDateValue to the end date
        if (endDateValuePi > cleanDateValue) {
          cleanDateValue = endDateValuePi;
        }
      }
      // if startDateValue = defaultDate, set cleanDateValue to defaultDate
      if (isSameDate(startDateValue, defaultDate)) {
        cleanDateValue = defaultDate;
      }
      row[startCleanDateKey] = cleanDateValue;
    }
  });
  processDurations(data);
}
// PROCESS DURATIONS
function processDurations(data) {
  // calculate durations
  data.forEach((row) => {
    for (let start = 7; start >= 1; start--) {
      // KEYS and VALUES
      let startDateKey = "P" + start + "_Start";
      let startDateValue = new Date(row[startDateKey].getTime());
      let cleanStartDateKey = "P" + start + "_StartClean";
      let cleanStartDateValue = new Date(row[cleanStartDateKey].getTime());
      let endDateKey = "P" + start + "_End";
      let endDateValue = new Date(row[endDateKey].getTime());
      let prevI = start > 1 ? start - 1 : 1;
      let previousEndDateKey = "P" + prevI + "_End";
      let previousEndDateValue = new Date(row[previousEndDateKey].getTime());

      let durationKey = "P" + start + "_Duration";
      let cleanDurationKey = "P" + start + "_CleanDuration";

      let gapDurationKey = "P" + start + "_GapDuration";

      let firtStartDateKey = "P1_Start";
      let firtStartDateValue = new Date(row[firtStartDateKey].getTime());
      let startDurationvalue;

      //DURATION
      // if start date is defaultDate, set duration to 0
      let durationValue = daysBetweenDates(startDateValue, endDateValue);
      if (isSameDate(startDateValue, defaultDate)) {
        durationValue = 0;
      }
      if (durationValue < 0) {
        durationValue = 0;
      }
      row[durationKey] = durationValue;

      //CLEAN DURATION
      // if start date is defaultDate, set cleanDuration to 0
      let cleandDurationValue = daysBetweenDates(
        cleanStartDateValue,
        endDateValue
      );
      if (isSameDate(cleanStartDateValue, defaultDate)) {
        cleandDurationValue = 0;
      }
      if (cleandDurationValue < 0) {
        cleandDurationValue = 0;
      }
      row[cleanDurationKey] = cleandDurationValue;

      // defaultDate to P1_Start
      let beforeStartKey = "beforeStart";
      if (
        isSameDate(timelineStart, firtStartDateValue) ||
        firtStartDateValue == ""
      ) {
        startDurationvalue = 0;
      } else {
        startDurationvalue = daysBetweenDates(
          timelineStart,
          firtStartDateValue
        );
        startDurationvalue -= 1;
      }
      row[beforeStartKey] = startDurationvalue;
    }
  });

  processGapDuration(data);
}

function processGapDuration(data) {
  data.forEach((row) => {
    console.log("row: ", row);
    for (let start = 7; start >= 2; start--) {
      let cleanStartKey = "P" + start + "_StartClean";
      let CleanStartDateValue = new Date(row[cleanStartKey].getTime());
      let maxEndDate = defaultDate;
      for (let i = start - 1; i >= 1; i--) {
        let endDateKey = "P" + i + "_End";
        let endDateValue = new Date(row[endDateKey].getTime());
        if (endDateValue > maxEndDate) {
          maxEndDate = endDateValue;
        }
      }
      let gap = daysBetweenDates(maxEndDate, CleanStartDateValue) - 1;
      if (gap < 0) {
        gap = 0;
      }
      let gapDurationKey = "P" + start + "_GapDuration";
      row[gapDurationKey] = gap;
    }
    // P1 gap duration = beforeStart
    let gapDurationKey = "P1_GapDuration";
    row[gapDurationKey] = row["beforeStart"];
  });
  processPresentData(data);
}

function processPresentData(data) {
  renderTable(data, "processedDataTable", columnsOrder);
  graphCreateData(data);
  console.log("DATA: ", data);
}

function graphCreateData(data) {
  const DATA = data;
  const createDataStructure = (data) => {
    return data.map((row) => {
      return {
        label: row.Description,
        values: [
          row.P1_GapDuration,
          row.P1_CleanDuration,
          row.P2_GapDuration,
          row.P2_CleanDuration,
          row.P3_GapDuration,
          row.P3_CleanDuration,
          row.P4_GapDuration,
          row.P4_CleanDuration,
          row.P5_GapDuration,
          row.P5_CleanDuration,
          row.P6_GapDuration,
          row.P6_CleanDuration,
          row.P7_GapDuration,
          row.P7_CleanDuration,
        ].map((value) => value || 0), // Replace null/undefined with 0
      };
    });
  };

  structuredData = createDataStructure(DATA);
  console.log("structuredData: ");
  console.log(structuredData);
  graphDraw(structuredData);
}

function graphDraw(data) {
  // Filter data based on selected Indicator1 values
  const filteredData = getFilteredData(data);

  // draw parameters
  const barHeight = 20;
  const gap = 10;
  const totalHeight = data.length * (barHeight + gap);

  // Set canvas dimensions based on container size
  const containerWidth = document.getElementById("canvasContainer").offsetWidth;
  canvas.width = containerWidth; // Adjust the actual width of the canvas
  canvas.height = totalHeight + 100; // Adjust the actual height of the canvas

  const colors = [
    "white",
    "#f2f2f2",
    "white",
    "#a5a5a5",
    "white",
    "#bdd7ee",
    "white",
    "#2e75b5",
    "white",
    "#c5e0b3",
    "white",
    "#538135",
    "white",
    "#375623",
  ]; // Colors for each segment

  const maxVal = Math.max(
    ...data.map((d) => d.values.reduce((a, b) => a + b, 0))
  );
  // Ensure the scaling of canvas elements
  const xScale = canvas.width / maxVal;
  ctx.font = "12px Arial"; // Set font size and family for clarity
  ctx.textAlign = "left"; // Align text correctly

  // Redraw the graph with filteredData
  const structuredData = createDataStructure(filteredData);
  console.log("structuredData: ", structuredData);

  // Draw the bars
  data.forEach((item, index) => {
    let x = 0;
    let y = index * (barHeight + gap);
    item.values.forEach((val, valIndex) => {
      ctx.fillStyle = colors[valIndex];
      let barWidth = val * xScale;
      ctx.fillRect(x, y, barWidth, barHeight);
      x += barWidth; // Move x-coordinate for next segment
    });
  });

  // Drawing labels with adjusted font settings
  ctx.fillStyle = "black";
  data.forEach((item, index) => {
    ctx.fillText(item.label, 10, index * (barHeight + gap) + barHeight / 2 + 5);
  });

  // Set the font for the canvas text
  ctx.font = "16px Arial";

  // Text for the top left corner - timelineStart
  ctx.textAlign = "left";
  ctx.fillText(formatDate(timelineStart), 10, 20); // Adjust position as needed

  // Text for the top right corner - timelineEnd
  ctx.textAlign = "right";
  ctx.fillText(formatDate(timelineEnd), canvas.width - 10, 20); // Adjust position as needed
}

// Event listener for the dropdown
document.getElementById("indicator1Dropdown").addEventListener("change", () => {
  const filteredData = filterDataByIndicator1(rawData);
  renderTable(filteredData, "processedDataTable");
  graphDraw(filteredData);
});
