/* Document Elements */
let console = document.getElementById('console');
let insert_example_button = document.getElementById('insert-example-button');
let insert_example_count_box = document.getElementById('insert-example-count-box');
let numbers_box = document.getElementById('numbers-box');
let percent_tolerance_box = document.getElementById('percent-tolerance-box');
let start_button = document.getElementById('start-button');
let status_box = document.getElementById('status-box');
let stop_button = document.getElementById('stop-button');
let target_sum_box = document.getElementById('target-sum-box');

/* Global Variables */
var randomSeed = 66865418;
var search = null;

/* Setup */
let setEnabledness = running => {
  insert_example_button.disabled = running;
  start_button.disabled = running;
  stop_button.disabled = !running;
  numbers_box.disabled = running;
  percent_tolerance_box.disabled = running;
  target_sum_box.disabled = running;
};

/* Console */
let clearConsole = () => {
  while (console.firstChild) {
    console.removeChild(console.firstChild);
  }
};

let writeError = message => {
  let div = document.createElement('div');
  div.classList.add('text-danger');
  div.textContent = message;
  console.appendChild(div);
};

let writeMessage = message => {
  let div = document.createElement('div');
  div.textContent = message;
  console.appendChild(div);
};

/* Search */
let spawnThread = (work, onKill) => {
  var killed = false;
  let start = Date.now();
  var pctComplete = 0;
  
  let kill = () => {
    killed = true;
    
    status_box.textContent = makeStatusString();
    
    if (onKill != null) {
      onKill();
    }
  };
  
  let makeStatusString = () => {
    var ret = killed ? "Done" : "Running";
    ret += " (" + Math.floor(pctComplete*100) + "% in " + makeTimeString((Date.now() - start)) + ")";
    ret += killed ? "." : "...";
    return ret;
  };
  
  let iteration = () => {
    if (killed) {
      return;
    }
    
    pctComplete = work();
    
    if (pctComplete < 1) {
      setTimeout(iteration, 0);
    }
    else {
      kill();
    }
  };
  
  let timer = () => {
    if (killed) { 
      return;
    }

    status_box.textContent = makeStatusString();
    setTimeout(timer, 1000);
  };
  
  iteration();
  timer();
  
  return kill;
}

let makeSearchWorker = (numbers, sumMin, sumMax) => {
  let bits = Array.from({ length: numbers.length }, () => false);
  var i = 0;
  var bitsValue = 0;
  
  let increment = () => {
    while (i < bits.length) {
      if (bits[i])
      {
        sum -= numbers[i];
        bits[i] = false;
        i = i + 1;
      }
      else
      {
        sum += numbers[i];
        bits[i] = true;
        i = 0;
        break;
      }
      
      bitsValue++;
    }
  };
  
  var iteration = 0;
  var sum = 0;
  var max =  Math.pow(2, bits.length)  - 1;
  
  return () => {   
    for (var x = 0; x < 200000; x++) {  
      increment();
    }
    return bitsValue / max;
  };
};

let makeTimeString = ms => {
  return Math.floor(ms / 1000) + " seconds";
};

/* Buttons */
insert_example_button.onclick = () => {
  let numberCount = parseFloat(insert_example_count_box.value);
  
  clearConsole();
  if (isNaN(numberCount) || numberCount == 0) {
    writeError('The number of examples to insert must be an integer greater than 0.');
  }
  
  let numberMin = 0;
  let numberMax = 10000;
  let numberRange = numberMax - numberMin;
  let targetSum = numberRange * numberCount;
  let percentTolerence = 5;
  let rng = new MersenneTwister(randomSeed++);
  let randomNumber = () => Math.floor(numberMin + (rng.genrand_real1() * numberRange));
  
  let numbers = Array.from({ length: numberCount }, randomNumber).sort((a, b) => a - b);
  
  numbers_box.value = numbers.join(', ');
  percent_tolerence_button = '' + percentTolerence;
  target_sum_box.value = targetSum;
};

start_button.onclick = () => {
  let percentTolerence = parseFloat(percent_tolerance_box.value);
  let targetSum = parseFloat(target_sum_box.value);
  let numbers = numbers_box.value.split(',').map(n => parseFloat(n));
  
  clearConsole();
  
  // Input error-checking.
  var errors = 0;
  if (numbers.some(isNaN)) {
    errors++;
    writeError('Numbers must be a comma-separated list of numbers.'); 
  }
  if (isNaN(targetSum)) {
    errors++;
    writeError('Target Sum must be a number.');
  }
  if (!Number.isInteger(percentTolerence) || percentTolerence < 0 || percentTolerence > 100) {
    errors++;
    writeError('Percent Tolerance must be a value between 0% and 100%.');
  }
  if (errors > 0) {
    return;
  }
  
  let sumMin = targetSum - ((percentTolerence * targetSum) / 100);
  let sumMax = targetSum + ((percentTolerence * targetSum) / 100);
  let worker = makeSearchWorker(numbers, sumMin, sumMax);
  stopSearch = spawnThread(worker, () => {
    setEnabledness(false);
  });
  
  setEnabledness(true)
};

stop_button.onclick = () => {
  if (stopSearch != null) {
    stopSearch();
  }
};
