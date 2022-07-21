const fs = require("fs");
var glob = require("glob");

function main() {
  const translationFilePath = "./test/en.json";
  const basePath = "./test";
  let translations = JSON.parse(
    fs.readFileSync(translationFilePath, {
      encoding: "utf8",
    })
  );
  //console.log("translations", translations);
  const filePaths = findFiles(basePath);
  let keysInFiles = findInFiles(
    filePaths,
    Object.getOwnPropertyNames(translations)
  );
  compressAllPaths(translations);
  console.log("translations", translations);
}

main();

function compressAllPaths(
  translations,
  compressedPathDepth = 1,
  maxDepthLimit = 10,
  depth = 0
) {
  let modificationCount = 0;
  Object.getOwnPropertyNames(translations).forEach((key) => {
    let res = compressPath(
      key,
      translations,
      compressedPathDepth,
      maxDepthLimit,
      depth
    );
    modificationCount += res.modificationCount;
  });
  console.log("modificationCount", modificationCount);
}

function getRootNodes(translations) {
  let rootNodes = [];
  for (key in translations) {
    if (!translations[key].startsWith("@:")) rootNodes.push(key);
  }
  return rootNodes;
}

// function compressPath(node, nodes) {
//   if (node.parent) {
//     node.parent = compressPath.key;
//   }
//   // devolver el parent
//   return getParent(node, nodes);
// }

// function createNodes(keys, translations) {
//   translationNodes = [];

//   for (let prop in translations) {
//     translationNodes.push({
//       parent: getParent(prop, translations),
//       key: prop,
//       protected: keys.includes(prop),
//     });
//   }
//   return translationNodes;
// }
// node = {key, parent , protected}
function createNodes(keys, translations, nodes) {
  if (!nodes) nodes = [];
  for (let prop in translations) {
    console.log("prop", prop);
    let parent = getParent(prop, translations);
    console.log("parent", parent);
    if (parent) {
      parent = translationNodes[parent] = {};
    }

    translationNodes[prop] = {
      parent,
      protected: keys.includes(prop),
    };
  }
  return translationNodes;
}

function createNode(keys, translationKey, translationValue) {
  return {
    parent: "",
    key: translationKey,
    protected: keys.includes(prop),
  };
}

function getParent(key, translations) {
  return translations[key]?.startsWith("@:")
    ? translations[key].slice(2)
    : undefined;
}

function getTranslation(key, translations, maxDepthLimit = 10, depth = 0) {
  // para evitar un bucle infinito y poner un limite a la recursion
  if (depth > maxDepthLimit) return undefined;
  // buscamos la primera traduccion
  let translation = translations[key];
  // si translation no es undefined y empieza con @:
  if (translation?.startsWith("@:")) {
    // le sacamos el @:
    let newKey = translation.slice(2);
    //buscamos remisivamente la siguiente traducción
    // podríamos des comentar la siguiente linea por si queremos devolver
    // la ultima traducción con el @: en vez de undefined
    //translation = getTranslation(newKey, translations) || translation;
    depth++;
    translation = getTranslation(newKey, translations, maxDepthLimit, depth);
  }

  return translation;
}

function compressPath(
  key,
  translations,
  compressedPathDepth = 1,
  maxDepthLimit = 10,
  depth = 0
) {
  depth++;
  let maxDepth = depth;
  let modificationCount = 0;
  // para evitar un bucle infinito y poner un limite a la recursion
  if (depth > maxDepthLimit)
    return { translation: undefined, maxDepth: depth, modificationCount };
  // buscamos la primera traduccion
  let translation = translations[key];
  // si translation no es undefined y empieza con @:
  if (translation?.startsWith("@:")) {
    // le sacamos el @:
    let newKey = translation.slice(2);
    //buscamos remisivamente la siguiente traducción
    // podríamos des comentar la siguiente linea por si queremos devolver
    // la ultima traducción con el @: en vez de undefined
    //translation = getTranslation(newKey, translations) || translation;

    res = compressPath(
      newKey,
      translations,
      compressedPathDepth,
      maxDepthLimit,
      depth
    );
    // si res en undefined abortamos de inmediato. Util cuando llegamos a maxDepthLimit
    // y no encontramos la traduccion, en estos casos la referncia no va
    // a ser modificada
    if (!res.translation)
      return { translation: undefined, maxDepth: depth, modificationCount };
    maxDepth = Math.max(res.maxDepth, depth);
    if (res.maxDepth - depth > compressedPathDepth) {
      translation = res.translation;
      console.log("reemplazamos ref con: ", translation);
      translations[key] = translation;
      modificationCount = res.modificationCount + 1;
    }
  }
  return {
    translation,
    maxDepth: Math.max(maxDepth, depth),
    modificationCount,
  };
}

function findTranslationsInFiles() {}

function findInFiles(filePaths, patterns) {
  let matches = [];
  for (let filePath of filePaths) {
    matches = matches.concat(findInFile(filePath, patterns));
  }
  matches = uniq_fast(matches);
  return matches;
}

function findInFile(filePath, patterns) {
  let matches = [];
  for (let pattern of patterns) {
    let regex = new RegExp(
      `[^\w.]${pattern.replaceAll(".", "\\.")}[^\w.]`,
      "g"
    );
    let fileContent = fs.readFileSync(filePath, {
      encoding: "utf8",
    });
    let match = fileContent.match(regex);
    if (match) {
      matches.push(pattern);
    }
  }
  return matches;
}

function findFiles(basePath, fileExtensions) {
  let pattern = "";
  if (fileExtensions) {
    pattern = `${basePath}/**/*.+(${fileExtensions
      .join("|")
      .replace(".", "")})`;
  } else {
    pattern = `${basePath}/**/*.+(js|html)`; // default pattern
  }
  const filePaths = glob.sync(pattern, { nodir: true });
  return filePaths;
}

// saca valores duplicados de un array
function uniq_fast(a) {
  var seen = {};
  var out = [];
  var len = a.length;
  var j = 0;
  for (var i = 0; i < len; i++) {
    var item = a[i];
    if (seen[item] !== 1) {
      seen[item] = 1;
      out[j++] = item;
    }
  }
  return out;
}
