const { MongoClient } = require("mongodb");
function getDb() {
  if (!global._mongo) {
    global._mongo = new MongoClient(process.env.MONGODB_URI).connect().then(async (c) => {
      const db = c.db(process.env.MONGODB_DB || "shortener");
      await Promise.all([
        db.collection("links").createIndex({ code: 1 }, { unique: true }),
        db.collection("users").createIndex({ email: 1 }, { unique: true }),
        db.collection("clicks").createIndex({ linkId: 1, at: -1 }),
      ]);
      return db;
    });
  }
  return global._mongo;
}
module.exports = { getDb };
