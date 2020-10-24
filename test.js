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

// TESTING
async function test() {
  const tagger = new Tagger(insertDoc, updateDoc, getDocByID, 'id', 'id');
  tagger.createNewCluster('rt64q57scg0');
  tagger.insertTag(database[0].clusterID, 'Movies', '100', null, true);
  tagger.insertTag(database[0].clusterID, 'Drama', '110', '100', false);
  tagger.insertTag(database[0].clusterID, 'Action', '105', '100', false);
  tagger.insertTag(database[0].clusterID, 'Comedy', '103', '100', false);
  tagger.insertTag(database[0].clusterID, 'American', '104', '103', false);

  tagger.insertItem(database[0].clusterID, '1000', '100');
  tagger.insertItem(database[0].clusterID, '1001', '103');
  tagger.insertItem(database[0].clusterID, '1002', '105');

  console.log('- - - - - - - - - - \n', JSON.stringify(database));
  //tagger.printTags(database[0].clusterID);
  await tagger.deleteItem(database[0].clusterID, '1001');
  console.log('- - - - - - - - - - \n', JSON.stringify(database));

  tagger.printTags(database[0].clusterID);
  await tagger.deleteTag(database[0].clusterID, '100');
  tagger.printTags(database[0].clusterID);
}

test();
