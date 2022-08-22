const fs = require("fs");
const { argv } = require("process");

const filePath = argv[2];
const outFilePath = argv[3];
const option = argv[4];
const pseudoLocalizeType = argv[5] || "fake";

function pseudoLocalize() {
  let translations = JSON.parse(
    fs.readFileSync(filePath, { encoding: "utf-8" })
  );
  let newTranslations = {};
  Object.getOwnPropertyNames(translations).forEach((key) => {
    let translation = translations[key];
    newTranslations[key] = pseudoLocalizers[pseudoLocalizeType].localize(
      translation,
      key
    );
  });

  //console.log("newTranslations", newTranslations);
  console.log("Writing file to: ", outFilePath);
  fs.writeFileSync(outFilePath, JSON.stringify(newTranslations, null, 2), {
    encoding: "utf-8",
    flag: "w",
  });
}
//pseudo localizers
// toma una traduccion y la hace fake
function fakeTranslation(translation, key) {
  let depth = 0;
  if (!translation.startsWith("@:")) {
    translation = translation
      .split("")
      .map((char) => {
        if (char === "{") {
          depth++;
          return char;
        } else if (char === "}") {
          depth--;
          return char;
        } else if (depth === 0 && char === " ") {
          return " ";
        } else if (depth === 0) {
          return randomString(1);
        } else {
          return char;
        }
      })
      .join("");
  }
  return translation;
}

//toma una traducción y la reemplaza por la ultima parte de la key
function keyPart(translation, key) {
  return key.split(".").at(-1);
}

// usa la key como traducción
function keyFull(translation, key) {
  return key;
}
// lo deja como esta
function none(translation, key) {
  return translation;
}
// ponemos los pseudolocalizers en un objeto
const pseudoLocalizers = {
  fake: {
    localize: fakeTranslation,
  },
  keyPart: {
    localize: keyPart,
  },
  keyFull: {
    localize: keyFull,
  },
  none: {
    localize: none,
  },
};
//fin de pseudo locaizers
function randomString(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

pseudoLocalize();

// continuos watch
if (option === "cw") {
  console.log(`Watching: ${filePath}`);
  fs.watchFile(filePath, (prev, curr) => {
    console.log(`File: ${filePath} has been changed.`);
    console.log("Pseudo Localizing again...");
    try {
      pseudoLocalize();
    } catch (error) {
      console.log("An error occurred: ");
      console.log(error);
      console.log("Waiting for file modification...");
    }
  });
}
