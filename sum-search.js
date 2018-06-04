/* Document Elements */
let console = document.getElementById('console');
let insert_example_button = document.getElementById('insert-example-button');
let insert_example_count_box = document.getElementById('insert-example-count-box');
let numbers_box = document.getElementById('numbers-box');
let tolerance_box = document.getElementById('tolerance-box');
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
  insert_example_count_box.disabled = running;
  start_button.disabled = running;
  stop_button.disabled = !running;
  numbers_box.disabled = running;
  target_sum_box.disabled = running;
  tolerance_box.disabled = running;
};

/* Console */
let clearConsole = () => {
  while (console.firstChild) {
    console.removeChild(console.firstChild);
  }
};

let writeError = message => {
  let e = document.createElement('div');
  e.classList.add('text-danger');
  e.textContent = message;
  console.appendChild(e);
};

let writeMessage = message => {
  let e = document.createElement('div');
  e.textContent = message;
  console.appendChild(e);
};

let writeEmpty = message => {
  let e = document.createElement('br');
  console.appendChild(e);
}

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
    var ret = killed ? "Stopped" : "Running";
    ret += " (" + Math.floor(pctComplete*100) + "% of possibilities checked in " + makeTimeString((Date.now() - start)) + ")";
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
  
  var sum = 0;
  var max =  Math.pow(2, bits.length)  - 1;
  
  return () => {   
    for (var x = 0; x < 1000000 && bitsValue < max; x++) {
      // Increment by one
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
      }
      bitsValue++;
      
      // Check for sums
      if (sum >= sumMin && sum <= sumMax)
      {
        var subset = [];
        for (var j = 0; j < bits.length; j++)
        {
          if (bits[j])
          {
            subset.push(numbers[j]);
          }
        }

        writeMessage("* { " + subset.join(', ') + " } sums to " + sum);
      }
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
  
  status_box.textContent = "";
  clearConsole();
  if (isNaN(numberCount) || numberCount == 0) {
    writeError('The number of examples to insert must be an integer greater than 0.');
  }
  
  let rng = new MersenneTwister(randomSeed++);
  let rand = () => rng.genrand_real1();
  let numberMin = 0;
  let numberMax = 10000;
  let numberRange = numberMax - numberMin;
  let targetSum = Math.floor(numberRange/3) * numberCount + .33;
  let tolerance = 0.05;
  let randomNumber = () => Math.floor(numberMin + (rand() * numberRange)) + Math.floor(rand() * 100) / 100;
  
  let numbers = Array.from({ length: numberCount }, randomNumber).sort((a, b) => a - b);
  
  numbers_box.value = numbers.join(', ');
  tolerance_box.value = tolerance;
  target_sum_box.value = targetSum;
};

start_button.onclick = () => {
  let tolerance = parseFloat(tolerance_box.value);
  let targetSum = parseFloat(target_sum_box.value);
  let numbers = numbers_box.value.split(',').map(n => parseFloat(n)).sort((a, b) => b - a);
  
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
  
  if (isNaN(tolerance)) {
    errors++;
    writeError('tolerance must be a number.');
  }
  
  let sumMin = targetSum - tolerance;
  let sumMax = targetSum + tolerance;
  let sumOfAllNumbers = numbers.reduce((total, n) => total + n);
  
  if (sumOfAllNumbers < sumMin) {
    errors++;
    writeError(`The sum of all numbers is ${sumOfAllNumbers} which is too small to reach sums in the range ${sumMin} to ${sumMax}`);
  };
  
  if (errors > 0) {
    return;
  }

  var what = tolerance == 0 ? `with a sum of ${targetSum}` : `with a sum in the range ${sumMin} to ${sumMax}`;
  var nums = '{ ' + numbers.join(', ') + ' }';
  writeEmpty();
  writeMessage(`Subsets of ${nums} ${what}:`);
  writeEmpty();
  
  setEnabledness(true);
  let worker = makeSearchWorker(numbers, sumMin, sumMax);
  stopSearch = spawnThread(worker, () => {
    setEnabledness(false);
  });
};

stop_button.onclick = () => {
  if (stopSearch != null) {
    stopSearch();
  }
};
