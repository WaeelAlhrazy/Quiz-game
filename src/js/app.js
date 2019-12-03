
// initials varaibles that contains html ids
let nameDiv = document.getElementById('name')
let startbtn = document.querySelector('#startbtn')
let name = document.querySelector('#name input')
let inputText = document.querySelector('#inputText')
let altOptions = document.querySelector('#alternatives')
let timer = document.getElementById('timer')
let rules = document.getElementById('intro')
let displayText = document.querySelector('#text')
let highScore = document.querySelector('#high-score')
let restartButton = document.querySelector('#restart')
var reqUrl = 'http://vhost3.lnu.se:20080/question/1'
var username
var interval = 0
var timeleft = 20
var countdown = timeleft
var timeUsed = 0

startTheGame() // runs the program

function startTheGame () {
  // display game rules and starts by choosing a player nickname
  rules.classList.remove('hide')
  startbtn.classList.remove('hide')
  startbtn.addEventListener('click', function (event) {
    event.preventDefault()
    setUsername(name.value)

    if (setUsername === 0) return
    // begin with calling the first question
    nameDiv.style.display = 'none'
    rules.classList.add('hide')
    inputText.classList.remove('hide')
    getQuestion(reqUrl)
  })
}
/* player nickname */
function setUsername (text) { username = text }

/* firts we setup the ajax call to share the JSON data */

function requests (call) {
/*
    check if the request to the Rest API
    returns a promise
*/
  return new Promise((resolve, reject) => {
    let req = new XMLHttpRequest()
    req.onload = function () {
      if (req.status === 400) {
        reject(req.responseText)
        gameOver('Incorrect Answer')
      }
      resolve(req.responseText)
    }

    if (call.data === undefined) {
      req.open(call.method, call.url)
      req.send()
    }
    else {
      req.open(call.method, call.url)
      req.setRequestHeader("Content-type", "application/json")
      req.send(JSON.stringify({ 'answer': call.data }))
    }
  })
}

/* then we request the question from url to our program, if its a question with options show the alternatives
   otherwise wait for text input */
function getQuestion (url) {
  requests({ method: 'GET', url: url })
  .then(data => {
      var data = JSON.parse(data)
      startTimer()
      displayText.innerText = data.question
      // no options get the input text
      if (data.alternatives === undefined) {
        inputText.classList.remove('hide')
        inputText.innerHTML = `
        <input type="text"/>
        <button>Submit</button> `
        let button = document.querySelector('#inputText button')
        let input = document.querySelector('#inputText input')
        button.addEventListener('click', function (event) {
          let answer = input.value
          if (answer.length === 0) return
          inputText.classList.add('hide')
          submitAnswer(data.nextURL, answer)
          stopTimer()
        })
      }
      else {
        inputText.classList.add('hide')
        altOptions.classList.remove('hide')
        altOptions.innerHTML = `
        <form></form>
             <button>Submit!</button>
             `
        let form = document.querySelector('#alternatives form')
        let submitButton = document.querySelector('#alternatives button')
        let choiceArr = Object.values(data.alternatives)
        let multichoices = Object.keys(data.alternatives).length

        // insert the alternatives from url to our program
        // codes from: https://www.geeksforgeeks.org/how-to-get-value-of-selected-radio-button-using-javascript/
        for (let i = 1; i <= multichoices; i++) {
          let alt = 'alt' + i
          let input = document.createElement('input')
          input.setAttribute('type', 'radio')
          input.setAttribute('name', 'choice')
          input.setAttribute('value', alt)
          let label = document.createElement('lable')
          let viewAlt = document.createTextNode(choiceArr[i - 1])
          label.appendChild(viewAlt)
          let space = document.createElement('span')
          space.setAttribute('innerHTML', ' &nbsp')
          form.appendChild(input)
          form.appendChild(label)
          form.appendChild(space)
        }

        // check which option is choosed and send to url
        submitButton.addEventListener('click', function (event) {
          var choices = document.getElementsByName('choice')
          var choiceValue
          for (var i = 0; i < choices.length; i++) {
            if (choices[i].checked) {
              choiceValue = choices[i].value
            }
          }
          altOptions.classList.add('hide')
          stopTimer()
          submitAnswer(data.nextURL, choiceValue)
        })
      }
    }) .catch(error => { console.log(error) })
}

/* reset timer , ancd check if the input asnwer is correct and get the next question,
    otherwise end the game */
function submitAnswer (url, answer) {
  stopTimer()
  requests({ method: 'post', url: url, data: answer })
    .then(data => {
      var data = JSON.parse(data)
      if (data.nextURL) {
        getQuestion(data.nextURL)
      }
      else if (!data.nextURL) {
        gameOver('**wohoo, you won, ' + username + '**')
        document.querySelector('#score').textContent = 'Score: ' + timeUsed + ' sec'
      }
      else {
        gameOver('Incorrect Answer!!!')
      }
    })
    .catch(error => { alert(JSON.parse(error).message) })
}

/* control the end of the game, if the player completed the game it hides items
and the score board with point results */
function gameOver (text) {
  stopTimer()
  timer.style.display = 'none'
  highScore.classList.remove('hide')
  restartButton.classList.remove('hide')
  altOptions.classList.add('hide')
  inputText.classList.add('hide')
  displayText.innerText = text
  topScore()

  // restart button to play again incase of win or lose
  let button = document.querySelector('#restart button')
  button.addEventListener('click', function (event) {
    location.reload()
  })
}

// Display high score of the best 5 scores
function topScore () {
  startbtn.classList.add('hide')
  name.classList.add('hide')
  inputText.classList.add('hide')
  altOptions.classList.add('hide')
  // code from https://www.taniarascia.com/how-to-use-local-storage-with-javascript/
  let players = JSON.parse(window.localStorage.getItem('players')) === null ? [] : JSON.parse(window.localStorage.getItem('players'))
  players.push({ name: username, score: timeUsed })
  players.sort((p1, p2) => {
    return p1.score - p2.score
  })
  players.splice(5, 1)

  let elements = document.querySelectorAll('#high-score ol li')
  players.forEach((player, index) => {
    elements[index].textContent = player.name + ': ' + player.score + ' sec'
  })
  document.querySelector('#high-score').classList.remove('hide')
  window.localStorage.setItem('players', JSON.stringify(players))
}

// start timer to count time and calcuate the time for best score
function startTimer () {
  timer.textContent = 'Time : ' + (countdown = timeleft)
  interval = setInterval(() => {
    timer.textContent = 'Time : ' + --countdown
    // if time is out - user can try again
    if (countdown <= 0) {
      gameOver('Time Over')
    }
  }, 1000)
}

// stops the timer and reset to null
function stopTimer () {
  clearInterval(interval)
  timeUsed += timeleft - countdown
}
