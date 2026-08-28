const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");

// Make sure data folder exists
function ensureDataFolder() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, {
            recursive: true
        });
    }
}

// Get full path to a data file
function getFilePath(fileName) {
    ensureDataFolder();
    return path.join(DATA_DIR, fileName);
}

// Read JSON safely
function readJSON(fileName, defaultValue = []) {
    const filePath = getFilePath(fileName);

    try {
        if (!fs.existsSync(filePath)) {
            writeJSON(fileName, defaultValue);
            return defaultValue;
        }

        const data = fs.readFileSync(
            filePath,
            "utf8"
        );

        if (!data.trim()) {
            writeJSON(fileName, defaultValue);
            return defaultValue;
        }

        const parsed = JSON.parse(data);

        return parsed;

    } catch (error) {
        console.error(
            `❌ Error reading ${fileName}:`
        );

        console.error(error);

        return defaultValue;
    }
}

// Write JSON safely
function writeJSON(fileName, data) {
    const filePath = getFilePath(fileName);

    try {
        fs.writeFileSync(
            filePath,
            JSON.stringify(data, null, 2),
            "utf8"
        );

        console.log(
            `💾 Saved ${fileName}`
        );

        return true;

    } catch (error) {
        console.error(
            `❌ Error writing ${fileName}:`
        );

        console.error(error);

        return false;
    }
}

module.exports = {
    readJSON,
    writeJSON,
    getFilePath,
    ensureDataFolder
};
