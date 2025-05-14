require("dotenv").config();

const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(bodyParser.json());

const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en";

app.post("/submit", async (req, res) => {
  const {word} = req.body;
  try{

    const duplication = await notion.databases.query({
      database_id: process.env.DB_ID,
      filter: {
        property: "Word", // タイトルプロパティ名
        title: {
          equals: word, // 検索したいタイトル
        },
      },
    });

    if (duplication.results.length > 0) {
      console.log(`Error: ${word} already exists!`);
      return res.status(200).json({
        success: false,
        message: `Error: The word already exists!`,
      });
    }


    const response = await fetch(`${API_URL}/${word}`);
    if (!response.ok) {
      console.log(`Error: ${word} is not found!`);
      return res.status(200).json({
        success: false,
        message: `API request failed: ${response.statusText}`,
      });
    }
    const data = await response.json();
    
    const word_page = await notion.pages.create({
      "parent": {
        "type": "database_id",
        "database_id": process.env.DB_ID
      },
      "properties": {
        "Word": {
          "title": [
            {
              "text": {
                "content": data[0].word
              }
            }
          ]
        },
        "Definition": {
          rich_text: [
            {
              type: "text",
              text: {
                content: data[0].meanings[0].definitions[0].definition, 
              },
            },
          ],
        },
        "correct": {
          number: 0,
        },
        "incorrect": {
          number: 0,
        },
      }
    });

    const unsplash_key = process.env.UNSPLASH_API_KEY;
    const IMAGE_URL = `https://api.unsplash.com/photos/random?query=${word}&count=5&client_id=${unsplash_key}`;
    const response_2 = await fetch(IMAGE_URL);
    let data_2 = await response_2.json();

    if(!data_2.errors){
      await notion.pages.update({
        page_id: word_page.id,
        properties: {
          "image1": {
            "files": [
              {
                "type": "external",
                "name": "apple.jpg",
                "external": {
                  "url": data_2[0].urls.regular
                }
              }
            ]
          },
          "image2": {
            "files": [
              {
                "type": "external",
                "name": "apple.jpg",
                "external": {
                  "url": data_2[1].urls.regular
                }
              }
            ]
          },
        }
      });
    }else{
      console.log(`${word}: ${data_2.errors}`);
    }

    const blocks = parseJSONToBlocks(data);

    // 子ページにブロックを追加
    await notion.blocks.children.append({
      block_id: word_page.id,
      children: blocks,
    });

    return res.status(200).json({
      success: true,
      data: data,
    });

  } catch (error){
    console.error("Error fetching data:", error);
    return res.status(200).json({
      success: false,
      message: `Server error: ${error.message}`,
    });
  }

});


const parseJSONToBlocks = (json) => {
  const blocks = [];

  // 各意味を処理
  json.forEach((entry) => {
    if (entry.meanings) {
      entry.meanings.forEach((meaning) => {
        // partOfSpeech を追加
        blocks.push({
          object: "block",
          type: "heading_3",
          heading_3: {
            rich_text: [
              {
                type: "text",
                text: { content: meaning.partOfSpeech },
              },
            ],
          },
        });

        // 定義を番号付きで追加
        meaning.definitions.forEach((definition, index) => {
          const content = definition.example
            ? `${definition.definition}\n   Example: ${definition.example}`
            : definition.definition;

          blocks.push({
            object: "block",
            type: "numbered_list_item",
            numbered_list_item: {
              rich_text: [
                {
                  type: "text",
                  text: { content },
                },
              ],
            },
          });
        });
      });
    }
  });

  return blocks;
};



// サーバー起動
app.listen(3000, () => {
  console.log("サーバーが http://localhost:3000 で起動しました");
});

