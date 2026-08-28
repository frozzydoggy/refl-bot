const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function loadJSON(filename, defaultValue) {
    ensureDataDirectory();

    const filePath = path.join(DATA_DIR, filename);

    if (!fs.existsSync(filePath)) {
        saveJSON(filename, defaultValue);
        return defaultValue;
    }

    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.error(`Could not read ${filename}:`, error);
        return defaultValue;
    }
}

function saveJSON(filename, data) {
    ensureDataDirectory();

    const filePath = path.join(DATA_DIR, filename);

    fs.writeFileSync(
        filePath,
        JSON.stringify(data, null, 2)
    );
}

module.exports = {
    loadJSON,
    saveJSON
};
