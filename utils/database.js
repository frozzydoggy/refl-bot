const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");

function ensureDataFolder() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function getFilePath(fileName) {
    ensureDataFolder();
    return path.join(DATA_DIR, fileName);
}

function readJSON(fileName, defaultValue = {}) {
    const filePath = getFilePath(fileName);

    if (!fs.existsSync(filePath)) {
        writeJSON(fileName, defaultValue);
        return defaultValue;
    }

    try {
        const data = fs.readFileSync(filePath, "utf8");

        if (!data.trim()) {
            writeJSON(fileName, defaultValue);
            return defaultValue;
        }

        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${fileName}:`, error);
        return defaultValue;
    }
}

function writeJSON(fileName, data) {
    const filePath = getFilePath(fileName);

    try {
        fs.writeFileSync(
            filePath,
            JSON.stringify(data, null, 2),
            "utf8"
        );

        return true;
    } catch (error) {
        console.error(`Error writing ${fileName}:`, error);
        return false;
    }
}

module.exports = {
    readJSON,
    writeJSON,
    getFilePath
};
