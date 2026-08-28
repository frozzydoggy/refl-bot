const fs = require("fs");
const path = require("path");

// Railway: set DATA_DIR to a mounted persistent-volume path.
// Without DATA_DIR, the bot uses ./data in the project.
const DATA_DIR = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.join(__dirname, "..", "data");

function ensureDataFolder() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function getFilePath(fileName) {
    ensureDataFolder();
    return path.join(DATA_DIR, fileName);
}

function readJSON(fileName, defaultValue = []) {
    const filePath = getFilePath(fileName);

    try {
        if (!fs.existsSync(filePath)) {
            writeJSON(fileName, defaultValue);
            return defaultValue;
        }

        const data = fs.readFileSync(filePath, "utf8");

        if (!data.trim()) {
            writeJSON(fileName, defaultValue);
            return defaultValue;
        }

        return JSON.parse(data);
    } catch (error) {
        console.error(`❌ Error reading ${fileName}:`, error);
        return defaultValue;
    }
}

function writeJSON(fileName, data) {
    const filePath = getFilePath(fileName);
    const tempPath = `${filePath}.tmp`;

    try {
        ensureDataFolder();

        fs.writeFileSync(
            tempPath,
            JSON.stringify(data, null, 2),
            "utf8"
        );

        fs.renameSync(tempPath, filePath);
        console.log(`💾 Saved ${fileName}`);
        return true;
    } catch (error) {
        console.error(`❌ Error writing ${fileName}:`, error);

        try {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        } catch {}

        return false;
    }
}

module.exports = {
    readJSON,
    writeJSON,
    getFilePath,
    ensureDataFolder
};
