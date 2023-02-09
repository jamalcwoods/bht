import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBRFY-A0uvyGp6nYP9HnkYGS9V5ySgqo6I",
    authDomain: "bhmt-7e900.firebaseapp.com",
    databaseURL: "https://bhmt-7e900-default-rtdb.firebaseio.com",
    projectId: "bhmt-7e900",
    storageBucket: "bhmt-7e900.appspot.com",
    messagingSenderId: "25928268111",
    appId: "1:25928268111:web:f305d13d2831c662af2d3a"
};

const app = initializeApp(firebaseConfig)
const db = getDatabase(app);

let urlParams = new URLSearchParams(window.location.search)
let preloadedQuestions;
if(urlParams.get("q") != undefined){
    preloadedQuestions = urlParams.get("q").split(",")
}

let cachedQuestions;
let finished = false;
let finalTime = 0
let pauseTimer = 0
let pauseTime = 0 
let guesses = 0;
let firstGuessTime = 0;
let currentQuestions = []
let answerkey = {}
window.answerbuttonpressed = answerbuttonpressed;
window.shareButtonPressed = shareButtonPressed;
window.resetButtonPressed = resetButtonPressed;
window.howToPlayPressed = howToPlayPressed;
window.hideOverlayDivs = hideOverlayDivs;

let answerButtons = document.getElementsByClassName("answerButton");
for(let i = 0; i < answerButtons.length; i++){
    answerButtons[i].addEventListener("click", answerbuttonpressed);
}

pullQuestions(function(questions){
    cachedQuestions = questions
    if(preloadedQuestions && preloadedQuestions[4] != undefined){
        let list = []
        for(let i = 0; i < preloadedQuestions.length; i++){
            list.push(questions[preloadedQuestions[i]])
        }
        resetQuestions(5,list) 
    } else {
        resetQuestions(5,questions) 
    }
})

function triggerPause(){
    if(firstGuessTime != 0){
        pauseTimer = new Date().getTime();
    }
}

function howToPlayPressed(){
    triggerPause()
    document.getElementById("howtoPlayPopup").classList = ["popupDiv"];
    document.getElementById("overlayDivHidden").id = "overlayDiv"
}

function shareButtonPressed(){
    triggerPause()
    let qString = window.location.origin + window.location.pathname + "?q="
    for(let i = 0; i < currentQuestions.length;i ++){
        if(i == 0){
            qString += currentQuestions[i].id
        } else {
            qString += "," + currentQuestions[i].id
        }
    }
    const qrcode = new QRCode(document.getElementById('qrcode'), {
      text: qString,
      width: 128,
      height: 128,
      colorDark : '#000',
      colorLight : '#fff',
      correctLevel : QRCode.CorrectLevel.H
    });
    document.getElementById("shareLink").innerHTML = qString
    document.getElementById("sharePopup").classList = ["popupDiv"];
    document.getElementById("overlayDivHidden").id = "overlayDiv"
}

function resetButtonPressed(){
    let questions = [...cachedQuestions]
    for(let i = 0; i < currentQuestions.length;i++){
        for(let x = 0; x < questions.length; x ++){
            if(questions[x].id == currentQuestions[i].id){
                questions.splice(x,1)
                break;
            }
        }
    }
    resetQuestions(5,questions) 
}

function pullQuestions(callback){
    get(ref(db, `/`)).then((snapshot) => {
        let data = snapshot.val();
        callback(data);
    });
}

function updateGuesses(){
    document.getElementById("guessCounter").innerHTML = "Guesses Made: " + guesses
}

function resetQuestions(amount,questions){
    currentQuestions = []
    let chosen = []
    while(chosen.length < amount){
        let i = Math.floor(Math.random() * questions.length)
        if(!chosen.includes(i)){
            chosen.push(i)
            currentQuestions.push(questions[i])
        }
    }
    populateFields()
}

function answerbuttonpressed(event){
    let answerIndex = event.target.parentElement.parentElement.id.split("answer")[1]
    let questionIndex = (parseInt(event.target.innerHTML) - 1)
    if(guesses == 0){
        firstGuessTime = new Date().getTime();
    }
    guesses++
    updateGuesses()
    if(answerkey[answerIndex].answersQuestion == questionIndex){
        event.target.classList.add("correctButton")
        for(let i = 0; i < answerButtons.length; i++){
            let buttonObj = answerButtons[i]
            if(parseInt(buttonObj.innerHTML) - 1 == questionIndex || event.target.parentElement == buttonObj.parentElement){
                buttonObj.disabled = true;
            }
        }
        answerkey[answerIndex].answered = true
        let questionData = currentQuestions[answerkey[answerIndex].answersQuestion]
        document.getElementById("infoQuestion").innerHTML = questionData.question;
        triggerPause()
        document.getElementById("question" + answerkey[answerIndex].answersQuestion).classList = "questionBox answeredQuestion"
        document.getElementById("infoAnswer").innerHTML = questionData.answer;
        document.getElementById("infoExtra").innerHTML = questionData.extra;
        document.getElementById("questionInfo").classList = ["popupDiv"];
        document.getElementById("overlayDivHidden").id = "overlayDiv"
    } else {
        event.target.disabled = true
        event.target.classList.add("wrongButton")
    }
}

function hideOverlayDivs(){
    document.getElementById("overlayDiv").id = "overlayDivHidden";
    document.getElementById("questionInfo").classList = ["hidden"];
    document.getElementById("questionResults").classList = ["hidden"];
    document.getElementById("sharePopup").classList = ["hidden"];
    document.getElementById("howtoPlayPopup").classList = ["hidden"];
    document.getElementById("qrcode").innerHTML = ""
    let now = new Date().getTime();
    if(pauseTimer != 0){
        pauseTime += now - pauseTimer;
    }
    if(!finished){
        checkFinished();
    } else {
        document.getElementById("guessCounter").innerHTML = "Guesses Made: " + guesses + " | Time Taken: " + msToTime(finalTime)
    }
}

function msToTime(s) {
    if(s > 0){ 
        var ms = s % 1000;
        s = (s - ms) / 1000;
        var secs = s % 60;
        s = (s - secs) / 60;
        var mins = s % 60;
        var hrs = (s - mins) / 60;
    
        let final = ""
        if(hrs > 0)
            final += hrs + 'h '

        if(mins > 0)
            final += mins + 'm '

        if(secs > 0)
            final += secs + 's'
            
        return final;
    } else {
        return "a few moments"
    }
}

function checkFinished(){
    let allClear = true;
    for(let a in answerkey){
        let answer = answerkey[a]
        if(answer.answered == false){
            allClear = false
            break;
        }
    }
    if(allClear){
        finished = true;
        let now = new Date().getTime();
        finalTime = now - (firstGuessTime + pauseTime)     
        document.getElementById("infoResultsTime").innerHTML = "Time Taken: " + msToTime(finalTime) 
        let performance = ""
        if(guesses == 5){
            performance = "Perfect!"
        } else {
            performance = (guesses - 5) + " Incorrect Answers"
        }
        document.getElementById("infoResultsPerformance").innerHTML = performance 
        document.getElementById("overlayDivHidden").id = "overlayDiv"
        document.getElementById("questionResults").classList = ["popupDiv"];
    }
}

function arrayShuffle(array){
    let currentIndex = array.length,  randomIndex;
        
        // While there remain elements to shuffle.
        while (currentIndex != 0) {
        
            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
        
            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
        }
        
        return array;
}

function populateFields(){
    console.log("populating fields")
    guesses = 0;
    finished = false;
    pauseTime = 0;
    pauseTimer = 0;
    firstGuessTime = 0;
    finalTime = 0;
    updateGuesses()
    document.getElementById("guessCounter").innerHTML = "Guesses Made: " + guesses
    for(let i = 0; i < answerButtons.length; i++){
        answerButtons[i].disabled = false
        answerButtons[i].classList = ["answerButton"]
    }
    let indexes = arrayShuffle([0,1,2,3,4])
    for(let i = 0;i < currentQuestions.length; i++){
        let questionData = currentQuestions[i]
        document.getElementById("question" + i).firstElementChild.innerHTML = "Question #" + (parseInt(i)+1) + ": <br>" + questionData.question;
        document.getElementById("question" + i).classList = ["questionBox"]
        let index = indexes[i]
        document.getElementById("answer" + index).firstElementChild.innerHTML = questionData.answer;
        answerkey[index] = {
            answersQuestion: i,
            answered: false
        }
    }
}