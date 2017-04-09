var messages = [];
var __DEV__ = false;

var logElement = document.createElement('span');
logElement.id = 'median-grade-log';
logElement.style.display = 'none';
logElement.innerHTML = JSON.stringify([]);
document.body.appendChild(logElement);

function log(msg) {
  if (__DEV__) {
    console.log.call(console, 'VSTU MID GRADE : ' + msg);
  }
  var currentMessages = JSON.parse(logElement.innerHTML);
  currentMessages.push(msg);
  logElement.innerHTML = JSON.stringify(currentMessages);
}

var toInject = function () {
  window.$reportMidGrade = function () {
    var logElem = document.getElementById('median-grade-log');
    var logs = logElem.innerHTML;
    var formatted = JSON.parse(logs).join('<br>');
    document.write(formatted);
  };
};

var script = document.createElement("script");
script.setAttribute("type", "text/javascript");
script.innerHTML = ';('+toInject+')();';
document.getElementsByTagName("head")[0].appendChild(script);


log('Initiation');
var form = document.getElementById("rating-student-form");

var mutationObserver = new MutationObserver(
  function callback(record, mutationObserver) {
    log('Executing main on mutation');
    executeMain(form);
  }
);

mutationObserver.observe(form, {
  attributes: true,
  attributeFilter: [
    'action'
  ]
});

var bugIcon = '<img src="/sites/all/modules/custom/rating/images/bug.png" width="16" height="16" alt="Нет средней" title="Нет средней" style="float: left; transform: translateX(-50%); left: 50%; position: relative;">';

function executeMain(form) {
  var ratingData = form.querySelector('#rating-data');
  if (!ratingData) {
    log('No rating data found. Stop now.');
    return;
  }
  
  log('Finding tables');
  
  var personalTable = ratingData.querySelector('h4 ~ table');
  var groupTable = ratingData.querySelector('table.rating-group-data');
  
  if (personalTable) {
    log('Personal table rating found');
    var grades = Array.prototype.map.call(personalTable.querySelectorAll('tbody tr'), function (tr) {
      var gradeTd = tr.querySelector('td:last-child');
      var grade = parseInt(gradeTd.innerText, 10);
      
      if (!grade) {
        console.error("Can't get grade for personalTable tr following");
        console.error(tr);
        grade = null;
      } else {
        log('Got grade <'+grade+'>');
      }
      
      return grade;
    });
    
    
    var areGradeObtained = grades.every(function (grade) { return Number.isFinite(grade); });
    
    var latestRow = personalTable.querySelector('tbody tr:last-child');
    var cellsTotal = latestRow.querySelectorAll('td').length;
    
    var strElem = '<td colspan="'+(cellsTotal - 2) +'"></td>';
    
    if (areGradeObtained) {
      log('Grades are obtained, echoing result');
      var medianGradeDecorated = calculateGrades(grades).medianGradeDecorated;
      
      strElem += '<td style="text-align:center; font-size: 0.85em;">Средний</td>';
      strElem += '<td style="text-align:center">'+medianGradeDecorated+'</td>';
    } else {
      log('Failed to accure grades, echo fallback');
      strElem += '<td style="text-align:center; font-size: 0.85em; opacity: 0.4;">Средний</td>';
      strElem += '<td style="text-align:center">'+bugIcon+'</td>';
    }
    
    latestRow.insertAdjacentHTML('afterend', strElem);
    log('Personal table done');
    
  } else if (groupTable) {
    log('Group table found');
    var studentRows = groupTable.querySelectorAll('tbody > tr');
    var studentRowsCount = studentRows.length;
    log('Found <'+studentRowsCount+'> student rows');
    var studentRowsFailed = 0;
    Array.prototype.forEach.call(studentRows, function (studentRow, index) {
      strElem = '';
      log('Parsing row at index <'+index+'>');
      try {
        var gradeCells = studentRow.querySelectorAll('td.rating-subject-last');
        var grades = Array.prototype.map.call(gradeCells, function (gradeCell) {
          var grade = parseInt(gradeCell.innerText, 10);
          if (!grade) {
            log('FAIL Parsing row at index <'+index+'>');
            console.error("Can't get grade groupTable for tr following");
            console.error(tr);
            throw new Error("Can't get grade, see console log");
          } else {
            log('Parsed row at index <'+index+'>, grade <'+grade+'>');
          }
          return grade;
        });
        log('Formatting grade for groud table row at <'+index+'> index');
        var calculatedGrade = calculateGrades(grades);
        strElem = '<td colspan="2" style="text-align:center; line-height: 16px; font-size: 12px;">'+calculatedGrade.medianGradeDecorated+'</td>';
      } catch(e) {
        log('Echo bug icon for <'+index+'> index at group rating');
        console.error('Error while calculating grade for rows');
        console.error(e);
        strElem = '<td colspan="2" style="text-align:center; line-height: 16px; font-size: 12px;">'+bugIcon+'</td>';
      }
      var latestCell = studentRow.querySelector('td:last-child');
      latestCell.insertAdjacentHTML('afterend', strElem);
      log('Group table row at <'+index+'> done');
    });
    
    var hasCalculatedSome = studentRowsFailed < studentRowsCount;
    log('Group table calculated grades <'+studentRowsCount+'> of <'+studentRowsCount+'>');
    
    if (hasCalculatedSome) {
      log('Group table echo result');
      groupTable.querySelector('thead > tr:first-child').insertAdjacentHTML('beforeend', '<th colspan="2" style="font-size: 0.8em;">Средний</th>');
      groupTable.querySelector('thead > tr:last-child').insertAdjacentHTML('beforeend', '<th colspan="2" style="font-size: 0.8em;">балл</th>');
    } else {
      log('Group table echo fallback result');
      groupTable.querySelector('thead > tr:first-child').insertAdjacentHTML('beforeend', '<th colspan="2" style="font-size: 0.8em; opacity: 0.5;">Средний</th>');
      groupTable.querySelector('thead > tr:last-child').insertAdjacentHTML('beforeend', '<th colspan="2" style="font-size: 0.8em; opacity: 0.5;">балл</th>');
    }
    
    log('Group table done');
    
  } else {
    console.log('СРЕДНЯЯ ОЦЕНКА не может быть определена, так как нужно обновить механизм работы с вёрсткой');
  }
  
  log('Script END');
}

function calculateGrades(grades/*[99, 100, 94]*/) {
  var medianGrade = grades.reduce(function(sum, grade) { return sum + grade; }, 0) / grades.length;
  var medianGradeDecorated = '<span style="font-weight: bolder;">'+Math.floor(medianGrade)+'</span>';
  if (medianGrade.toFixed(1).indexOf('.') !== -1) {
    medianGradeDecorated += '<span style="opacity: 0.5">.'+medianGrade.toFixed(1).split('.')[1]+'</span>';
  }
  
  return {
    medianGrade: medianGrade,
    medianGradeDecorated: medianGradeDecorated
  };
}