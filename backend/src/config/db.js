/**
 * ============================================================
 * FILE: src/config/db.js
 * PURPOSE: Connect the app to MongoDB.
 *
 * TEACHING NOTE - why a separate file for this?
 *   Database connection logic is needed by two different files:
 *     1. server.js  -> when the app boots
 *     2. seed.js    -> when we insert the OWASP data
 *   If both files contained their own connection code we would
 *   duplicate the code and could forget to update one copy.
 *   Putting it here and exporting it means "one single source
 *   of truth" for the connection.
 *
 *   "export" is how a file makes something available to other
 *   files (like a shop putting items on a shelf others can take).
 * ============================================================
 */

// `mongoose` is the official ODM (Object Document Mapper) for MongoDB.
// It lets us define JavaScript "Schemas" (the shape/validation of a
// document) instead of hand-writing raw MongoDB commands.
const mongoose = require("mongoose");

/**
 * Connects to MongoDB using the MONGO_URI string from .env
 *
 * @param {string} uri - the connection string, e.g. mongodb://127.0.0.1:27017/webvulnlab
 * @returns {Promise<object>} the mongoose connection object
 *
 * WHY this is an async function?
 *   Talking to a database over the network takes time, so JavaScript
 *   treats it as a "Promise" - a value that will arrive later.
 *   `await` means "pause this function until the promise settles".
 */
async function connectDB(uri) {
  // Good practice: never open a connection with a user-supplied
  // string that we did not intend. This check simply makes the
  // failure message obvious for beginners.
  if (!uri) {
    throw new Error(
      "MONGO_URI is missing. Copy .env.example to .env and set MONGO_URI."
    );
  }

  // `mongoose.connect()` returns a promise. We await it so the rest
  // of the code only runs once the DB handshake has finished.
  const connection = await mongoose.connect(uri);

  console.log(`[db] MongoDB connected -> ${connection.connection.host}`);
  return connection;
}

// `module.exports = { connectDB }` publishes the function so other
// files can do:  const { connectDB } = require("../config/db");
module.exports = { connectDB };
