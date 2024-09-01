const express = require("express");
const { ObjectId } = require("mongodb");
const { connectToMongo, getDb } = require("./db");
const fetchData = require("./newsApi");

const router = express.Router();

async function getCollections() {
  await connectToMongo();
  const db = getDb();
  return {
    newsData: db.collection("news"),
    dataDate: db.collection("dataDate"),
  };
}

async function fetchNews(req, res) {
  try {
    const currentDateUTC = new Date();
    const currentDate = new Date(
      Date.UTC(
        currentDateUTC.getUTCFullYear(),
        currentDateUTC.getUTCMonth(),
        currentDateUTC.getUTCDate()
      )
    );

    const { newsData, dataDate } = await getCollections();

    const dateInfo = await dataDate.findOne();
    const existingNews = await newsData.find().toArray();

    if (dateInfo) {
      const {
        date: dateInfoDate,
        _id: dateInfoId,
        version: dateInfoVersion,
      } = dateInfo;
      if (currentDate > dateInfoDate) {
        const fetchedData = await fetchData();
        if (fetchedData.success) {
          const newNewsData = fetchedData.data.filter(
            (item2) => !existingNews.some((item1) => item1.id === item2.id)
          );

          if (newNewsData.length > 0) {
            const newNewsDataWithTimestamp = newNewsData.map((item) => ({
              ...item,
              createdAt: new Date(),
            }));

            await newsData.insertMany(newNewsDataWithTimestamp);
          }

          await dataDate.updateOne(
            { _id: new ObjectId(dateInfoId) },
            {
              $set: {
                date: currentDate,
                version: dateInfoVersion + 0.1,
              },
            }
          );
        }
      }
    } else {
      await dataDate.insertOne({ date: currentDate, version: 0.1 });
    }

    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const newsDatas = await newsData
      .find(
        {},
        {
          projection: {
            headline: 1,
            shorterHeadline: 1,
            shortDateLastPublished: 1,
            url: 1,
            featuredMedia: 1,
            promoImage: 1,
          },
        }
      )
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    
    let hasMore = true;
    const allNews = await newsData.find().toArray();
    if(allNews.length < offset) {
      hasMore = false;
    }

    return res.status(200).json({
      success: true,
      data: newsDatas,
      message: "Success",
      hasMore: hasMore,
    });
  } catch (error) {
    console.error("Error in fetchNews:", error.message);

    return res.status(500).json({
      success: false,
      data: [],
      message: "Something went wrong!",
      error: error.message,
    });
  }
}

async function searchNews(req, res) {
  try {
    const query = req.params.search;

    if (!query) {
      return res.status(400).json({
        success: false,
        data: [],
        message: "Query parameter is required",
      });
    }

    const { newsData } = await getCollections();

    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const searchResults = await newsData
      .find(
        {
          $or: [
            { headline: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        },
        {
          projection: {
            headline: 1,
            shorterHeadline: 1,
            shortDateLastPublished: 1,
            url: 1,
            featuredMedia: 1,
            promoImage: 1,
          },
        }
      )
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    let hasMore = true;
    const allNews = await newsData.find().toArray();
    if(allNews.length < offset) {
      hasMore = false;
    }

    return res.status(200).json({
      success: true,
      data: searchResults,
      message: "Search results retrieved successfully",
      hasMore: hasMore,
    });
  } catch (error) {
    console.error("Error in searchNews:", error.message);

    return res.status(500).json({
      success: false,
      data: [],
      message: "Something went wrong!",
      error: error.message,
    });
  }
}

router.get("/fetchnews", fetchNews);
router.get("/searchnews/:search", searchNews);

module.exports = router;
