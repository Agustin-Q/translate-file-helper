const fs = require("fs");
const stringSimilarity = require("string-similarity");
const { argv } = require("process");
const { count } = require("console");

const filePath = argv[2];
const outFilePath = argv[3];
const option = argv[4];
const similarityThreshold = 0.9;
const prefix = "GENERAL.";

function main() {
  let translations = JSON.parse(
    fs.readFileSync(filePath, { encoding: "utf-8" })
  );

  let similarGroups = crateSimilarityGroups(translations);
  console.log("similarGroups", similarGroups);
  let newKeys = createNewKeys(similarGroups);
  newKeys = addPrefixToKeys(newKeys, prefix);
  console.log("newKeys", newKeys);
  let newTranslations = generateNewTranslations(
    translations,
    similarGroups,
    newKeys
  );
  console.log("newTranslations", newTranslations);
}
main();

function generateNewTranslations(translations, similarGroups, newKeys) {}

function removeLinks(translations) {
  let translationKeys = Object.getOwnPropertyNames(translations);
  let newTranslations = {};
  for (let i = 0; i < translationKeys.length; i++) {
    const key = translationKeys[i];
    const translation = translations[key];

    if (!translation.startsWith("@:")) {
      newTranslations[key] = translation;
    }
  }
  return newTranslations;
}

function crateSimilarityGroups(translations) {
  let similarGroups = [];
  let keysGrouped = [];
  let translationsWithOutLinks = removeLinks(translations);
  let translationKeys = Object.getOwnPropertyNames(translationsWithOutLinks);

  for (let i = 0; i < translationKeys.length; i++) {
    const key1 = translationKeys[i];
    if (!keysGrouped.includes(key1)) {
      let similarityGroup = {};
      for (let k = i + 1; k < translationKeys.length; k++) {
        const key2 = translationKeys[k];
        if (!keysGrouped.includes(key2)) {
          let similarity = stringSimilarity.compareTwoStrings(
            translationsWithOutLinks[key1],
            translationsWithOutLinks[key2]
          );
          if (similarity > similarityThreshold) {
            //console.log("similar");
            similarityGroup[key2] = translationsWithOutLinks[key2];
            keysGrouped.push(key2);
            //console.log("key2", key2);
            // console.log(translationsWithOutLinks[key1]);
            // console.log(translationsWithOutLinks[key2]);
            // console.log("similarity", similarity);
          }
        }
      }
      if (Object.getOwnPropertyNames(similarityGroup).length > 0) {
        // hay al menos uno similar
        // incluimos el key 1 y lo metemos en el array
        similarityGroup[key1] = translationsWithOutLinks[key1];
        keysGrouped.push(key1);
        //console.log("key1", key1);
        similarGroups.push(similarityGroup);
      }
    }
  }
  return similarGroups;
}

function addPrefixToKeys(keys, prefix) {
  return keys.map((key) => prefix + key);
}
function createNewKeys(similarGroups) {
  let newKeys = [];
  for (let i = 0; i < similarGroups.length; i++) {
    const group = similarGroups[i];
    let bestGuess = guessBestKey(group);
    let newKey = bestGuess;
    let duplicateCount = 0;
    while (newKeys.includes(newKey)) {
      duplicateCount++;
      newKey = bestGuess + "_" + duplicateCount;
    }
    newKeys.push(newKey);
  }
  return newKeys;
}

function guessBestKey(similarityGroup) {
  let keys = Object.getOwnPropertyNames(similarityGroup);
  let guesses = [];
  for (let i = 0; i < keys.length; i++) {
    const key1 = keys[i];
    for (let k = i + 1; k < keys.length; k++) {
      const key2 = keys[k];
      guesses.push(findCommonSubString(key1, key2));
    }
  }
  // console.log("guesses", guesses);
  // console.log("BestGuess", getMostCommonElementInArray(guesses));
  bestGuess = getMostCommonElementInArray(guesses) || guesses[0]; // si no hay niniguno que sea mejor devolvemos el primero
  bestGuess = bestGuess.replace(/(^[^A-Za-z0-9]|[^A-Za-z0-9]$)/g, ""); //scamos los caracteres que no son alfanumericos del inicio y del final
  return bestGuess;
}

function getMostCommonElementInArray(arr) {
  let maxCount = 0;
  let maxElement;
  for (let i = 0; i < arr.length; i++) {
    let count = 0;
    for (let k = 0; k < arr.length; k++) {
      if (arr[i] === arr[k]) {
        count++;
      }
      if (count > maxCount) {
        maxElement = arr[i];
        maxCount = count;
      }
    }
  }
  return maxElement;
}

//busca el substring común mas largo
function findCommonSubString(str1 = "", str2 = "") {
  const s1 = [...str1];
  const s2 = [...str2];
  const arr = Array(s2.length + 1)
    .fill(null)
    .map(() => {
      return Array(s1.length + 1).fill(null);
    });
  for (let j = 0; j <= s1.length; j += 1) {
    arr[0][j] = 0;
  }
  for (let i = 0; i <= s2.length; i += 1) {
    arr[i][0] = 0;
  }
  let len = 0;
  let col = 0;
  let row = 0;
  for (let i = 1; i <= s2.length; i += 1) {
    for (let j = 1; j <= s1.length; j += 1) {
      if (s1[j - 1] === s2[i - 1]) {
        arr[i][j] = arr[i - 1][j - 1] + 1;
      } else {
        arr[i][j] = 0;
      }
      if (arr[i][j] > len) {
        len = arr[i][j];
        col = j;
        row = i;
      }
    }
  }
  if (len === 0) {
    return "";
  }
  let res = "";
  while (arr[row][col] > 0) {
    res = s1[col - 1] + res;
    row -= 1;
    col -= 1;
  }
  return res;
}
