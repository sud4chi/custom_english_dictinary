const express = require("express");
const router = express.Router();
const { Client } = require("@notionhq/client");
require("dotenv").config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

router.post("/", async (req, res) => {
  const { tags } = req.body;
  try {

    const filter = {
      and: tags.map(tag => ({
        property: "tag",
        multi_select: {
          contains: tag
        }
      }))
    };

    const response = await notion.databases.query({
      database_id: process.env.DB_ID,
      filter: filter,
//      sorts: [
//    	{ property: "priority", direction: "descending" },
//        { property: "Date", direction: "descending" },
//      ],
    });

    if (response.results.length === 0) {
      console.log("データベースにアイテムがありません");
      return res.status(404).json({ message: "データベースにアイテムがありません" });
    }
	
	const results = response.results.sort((a, b) => {  
		const pa = a.properties.priority.formula.number;
  		const pb = b.properties.priority.formula.number ;
  		return pb - pa;
	});
    const lowestItem = results[0];
	console.log(lowestItem.properties.priority.formula.number);
    const blocks = await notion.blocks.children.list({
      block_id: lowestItem.id
    });
    const item = {
      id: lowestItem.id,
      properties: lowestItem.properties,
      blocks: blocks
    };

    res.status(200).json(item);
  } catch (error) {
    console.error("エラーが発生しました:", error);
    res.status(500).json({ message: "エラーが発生しました", error: error.message });
  }
});

module.exports = router;
