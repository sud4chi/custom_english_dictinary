const express = require("express");
const router = express.Router();
const { Client } = require("@notionhq/client");
require("dotenv").config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

router.get("/", async (req, res) => {
  try {
    // Notionデータベースクエリ
    const response = await notion.databases.query({
      database_id: process.env.DB_ID, // 環境変数からDB_IDを取得
    });

    const tags = [];

    // 結果からtagプロパティを抽出
    response.results.forEach(item => {
      const tagProperty = item.properties.tag; // tagプロパティの名前に合わせて
      if (tagProperty && tagProperty.multi_select) {
        tagProperty.multi_select.forEach(tag => {
          tags.push(tag.name); // タグ名を配列に追加
        });
      }
    });

    const uniqueTags =  [...new Set(tags)];
    res.status(200).json(uniqueTags); // タグをクライアントに返す
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
})

module.exports = router;
