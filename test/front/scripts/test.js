const questionElement = document.getElementById("question");
const answerElement = document.getElementById("answer");
const generateButton = document.getElementById("generate");
const showAnswerButton = document.getElementById("show-answer");
const correctButton = document.getElementById("correct-button");
const wrongButton = document.getElementById("wrong-button");
const nextButton = document.getElementById("next-question");


const urlParams = new URLSearchParams(window.location.search);
const tagStr = urlParams.get('tags');
const tags = tagStr.split(',');

let currentQuestion = null;
let defIndex = 0;

// テスト生成ボタンの動作
generateButton.addEventListener("click", async () => {
  try {
    const response = await fetch('http://localhost:4000/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({tags: tags})
    });

    if (!response.ok) {
      throw new Error('データを取得できませんでした');
    }

    // currentQuestion をここで設定
    currentQuestion = await response.json();
    defIndex = 1;
    // `properties.Definition` の確認と表示
    questionElement.textContent = `${parseJSONToStr(currentQuestion.blocks.results, 0)}`;
    questionElement.textContent += `${parseJSONToStr(currentQuestion.blocks.results, 1)}`;
    answerElement.textContent = ""; // 答えをクリア
    showAnswerButton.disabled = false; // 答えボタンを有効化
    correctButton.disabled = true;
    wrongButton.disabled = true;
    if(currentQuestion.blocks.results.length > defIndex+1){
      nextButton.disabled = false;
    }
    console.log(currentQuestion);
  } catch (error) {
    questionElement.textContent = "問題の取得に失敗しました";
    console.error(error);
  }
});

// 答えボタンの動作
showAnswerButton.addEventListener("click", () => {
  if (currentQuestion) {
    // `properties.Word` の確認と表示
    answerElement.textContent = `正解: ${currentQuestion.properties.Word.title[0].text.content}`;
    showAnswerButton.disabled = true; // 答えボタンを無効化
    correctButton.disabled = false;
    wrongButton.disabled = false;
  }
});

nextButton.addEventListener("click", () => {
  defIndex += 1;
  questionElement.textContent += `\n${parseJSONToStr(currentQuestion.blocks.results, defIndex)}`;
  if(currentQuestion.blocks.results.length > defIndex+1){
    nextButton.disabled = false;
  }else{
    nextButton.disabled = true;
  }
});


document.getElementById("correct-button").addEventListener("click", () => {
  fetch("http://localhost:4000/answer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ isCorrect: true, id: currentQuestion.id})
  });
}); 

document.getElementById("wrong-button").addEventListener("click", () => {
  fetch("http://localhost:4000/answer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ isCorrect: false, id: currentQuestion.id})
  });
}); 

document.getElementById("back-button").addEventListener("click", () => {
  // index.html に戻る
  window.location.href = "index.html";
});

const parseJSONToStr = (data, n) => {
  if(data[n].heading_3){
    return data[n].heading_3.rich_text[0].text.content;
  }else if(data[n].numbered_list_item.rich_text){
    return data[n].numbered_list_item.rich_text[0].text.content;
  }
  return ;
}