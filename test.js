const Tagger = require('./Tagger');

const database = [];

// insert new document to database
function insertDoc(doc) {
  database.push(doc);
}

function updateDoc(id, cluster) {
  const docIndex = getDocIndex(id);
  database.splice(docIndex, 1);
  database.push(cluster);
}

function getDocByID(id) {
  const index = getDocIndex(id);
  return database[index];
}

function getDocIndex(id) {
  const index = database.findIndex((doc) => doc.clusterID === id);
  return index;
}

const tagger = new Tagger(insertDoc, updateDoc, getDocByID, 'id', 'id');

// TESTING
tagger.createNewCluster('rt64q57scg0');
tagger.insertTag(database[0].clusterID, 'Movies', '100', null, true);
tagger.insertItem(database[0].clusterID, '1000', '100');
tagger.insertTag(database[0].clusterID, 'Drama', '110', '100', false);
console.dir(JSON.stringify(database));
tagger.printTags(database[0].clusterID);
