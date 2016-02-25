"use strict";

var fs = require("fs");
var https = require("https");
var gettextParser = require("gettext-parser");

var translateUrl = "https://www.googleapis.com/language/translate/v2";

function constructTranslateUrl(stringToTranslate, targetLanguage, sourceLanguage) {
    return translateUrl + "?key=" + apiKey + "&source=" + sourceLanguage + "&target="
        + targetLanguage + "&q=" + encodeURIComponent(stringToTranslate);
}

function getTranslation(stringToTranslate, targetLanguage, sourceLanguage) {
    // Bail out if there's nothing to translate
    if (!stringToTranslate || stringToTranslate === "") {
        // Count the translations requested so far
        translationCount++;
        return;
    }

    https.get(constructTranslateUrl(stringToTranslate, targetLanguage, sourceLanguage), function(res) {
        var chunk = "";
        var translatedString = "";
        res.on("data", function(chunk) {
            translatedString += chunk;
        });
        res.on("end", function() {
            // Count the translations requested so far
            translationCount++;

            var translationJSON = JSON.parse(translatedString.toString());
            translations[stringToTranslate] = translationJSON.data.translations[0].translatedText;
            if (translationCount === translationTotal) {
                writeTranslatedFile();
            }
        });
    }).on("error", function(e) {
        return "";
    });
}

function getTranslations(context, targetLanguage, sourceLanguage) {
    var translationList;

    Object.keys(context).forEach(function (context) {
        translationList = parsed.translations[context];

        Object.keys(translationList).forEach(function (key, i) {
            getTranslation(key, targetLanguage, sourceLanguage);
        });
    });
}

function writeTranslatedFile() {
    var outFile = fs.openSync(outFilename, "w");
    var key = "";
    var translation = "";
    fileLines.forEach(function(line) {
        if (line.indexOf("msgid") !== -1) {
            key = line.slice(line.indexOf("\"") + 1, line.lastIndexOf("\""));
            translation = translations[key];
        } else if (line.indexOf("msgstr") !== -1) {
            // Note: Google translate transforms some of the "%s" to "% s" so, fix that here
            if (translation && translation.indexOf("% s") !== -1) {
                translation = translation.replace(/% s/g, " %s");
            }
            line = line.slice(0, -1) + translation + "\"";
        }

        fs.writeSync(outFile, line + "\n");
    });
    fs.closeSync(outFile);
}

process.on("exit", function(code) {
    if (code === 0) {
        console.log("Success!");
    } else if (code === 1) {
        console.log("No api key file found.");
    } else if (code === 2) {
        console.log("No input filename supplied");
    } else {
        console.log("Exiting with unknown error code", code);
    }
});

// argv[2]: file to translate
// argv[3]: target language
// argv[4]: source language
var inFilename;
if (process.argv[2]) {
    inFilename = fs.realpathSync(process.argv[2]);
}
else {
    process.exit(2);
}
var targetLanguage = process.argv[3];
var sourceLanguage = process.argv[4] ? process.argv[4] : "en";

var filePath = inFilename.slice(0, inFilename.lastIndexOf("/") + 1);
var outFilename = filePath + targetLanguage + ".po";

var fileData = fs.readFileSync(inFilename, "utf8");
var fileLines = fileData.split("\n");

// Read the API key
var apiKeyFile = fs.realpathSync("translateApiKey.txt");
var apiKey = fs.readFileSync(apiKeyFile, "utf8");
if (apiKey) {
    apiKey = apiKey.trim();
} else {
    process.exit(1);
}

// Parse the PO file, collect the translations, and then write out the new file
var parsed = gettextParser.po.parse( fileData );
var context = parsed.translations;
var translations = {};
var translationCount = 0;
var translationTotal = Object.keys(context[""]).length;

getTranslations(context, targetLanguage, sourceLanguage);
