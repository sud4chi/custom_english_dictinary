const express = require("express");
const router = express.Router();
const { Client } = require("@notionhq/client");
require("dotenv").config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

router.post("/", async (req, res) => {
  const { isCorrect, id } = req.body;
  try {
    const response = await notion.pages.retrieve({
      page_id: id
    });

    let correct = response.properties.correct.number;
    let incorrect = response.properties.incorrect.number;
    
    if(isCorrect){
      correct += 1;
    }else{
      incorrect += 1;
    }

    await notion.pages.update({
      page_id: id,
      properties: {
        correct: {
          number: correct
        },
        incorrect: {
          number: incorrect
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error("ページ更新エラー:", error.message);
    return { success: false, error: error.message };
  }
});

module.exports = router;