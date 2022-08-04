const fs = require("fs");
const { argv, cwd } = require("process");

function main() {
  const fileName = argv[2];
  const opt2 = argv[3];
  const fileContents = fs.readFileSync(fileName, { encoding: "utf-8" });
  let result = fileToArrayOfObjects(fileContents);
  let duplicates = findDuplicates(result);
  console.log("duplicates", duplicates);
  console.log("Number Of duplicates:", duplicates.length);
  let newFileContent = fileContents;
  for (let duplicate of duplicates) {
    newFileContent = removeDuplicate(newFileContent, duplicate);
  }

  //console.log("newFileContent", newFileContent);
  if (opt2 === "w") {
    fs.writeFileSync(fileName, newFileContent, { encoding: "utf-8" });
  }
}

main();

function fileToArrayOfObjects(fileContents) {
  let brackets = parseBrackets(fileContents);
  let newContent = fileContents
    .slice(brackets.start + 1, brackets.end)
    .split(/,\s*\n/g);
  //fileContents.match(/["][^"]*/g)
  let result = newContent.map((elem) => {
    console.log("elem", elem);
    let match = elem.match(/"(?:\\.|[^"\\])*"/g);
    console.log("match", match);
    return {
      key: match[0].slice(1, -1),
      value: match[1].slice(1, -1),
      line: elem,
    };
  });
  console.log("result", result);
  return result;
}

//devuelve index de la que abre y de la que cierra
function parseBrackets(str) {
  let depth = 0;
  let result = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === "{") {
      if (depth === 0) result.start = i;
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0) {
        result.end = i;
        break;
      }
    }
  }
  return result;
}

// busca duplicados duplicados
function findDuplicates(arr) {
  let duplicates = [];
  for (let i = 0; i < arr.length - 1; i++) {
    const elem = arr[i];
    for (let j = i + 1; j < arr.length; j++) {
      const elem2 = arr[j];
      if (elem.key === elem2.key && elem.value === elem2.value)
        duplicates.push(elem);
    }
  }
  return duplicates;
}

function removeDuplicate(str, duplicate) {
  let regx = new RegExp(
    ".*" + duplicate.line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ".*[\\s]?",
    "g"
  );
  let count = 0;
  return str.replace(regx, (match) => {
    count++;
    if (count > 1) {
      return "";
    } else {
      return match;
    }
  });
}
