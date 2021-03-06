const Tagger = require('./Tagger');

const database = [];

// insert new document to database
function insertDoc(doc, docID) {
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

  tagger.on('error', (error, dsc) => {
    console.log(dsc);
    console.error(error);
  });

  await tagger.createNewCluster('rt64q57scg0');
  await tagger.insertTag(database[0].clusterID, 'Movies', '100', null, true);
  await tagger.insertTag(database[0].clusterID, 'Drama', '110', '100', false);
  await tagger.insertTag(database[0].clusterID, 'Action', '105', '100', false);
  await tagger.insertTag(database[0].clusterID, 'Comedy', '103', '100', false);
  await tagger.insertTag(database[0].clusterID, 'American', '104', '103', false);

  await tagger.insertItems(database[0].clusterID, ['1000'], '100');
  await tagger.insertItems(database[0].clusterID, ['1001'], '103');
  await tagger.insertItems(database[0].clusterID, ['1002'], '105');

  console.log('- - - - - - - - - - \n', JSON.stringify(database));
  //tagger.printTags(database[0].clusterID);
  await tagger.deleteItem(database[0].clusterID, '1001');
  console.log('- - - - - - - - - - \n', JSON.stringify(database));

  await tagger.printTags(database[0].clusterID);
  await tagger.deleteTag(database[0].clusterID, '105');
  await tagger.printTags(database[0].clusterID);

  // error testing
  await tagger.insertItems(database[0].clusterID, ['1002'], 'unknownTag');

  // testing retrieving item's tag
  const retTags = await tagger.retrieveTags(database[0].clusterID, '1000');
  console.log(retTags);

  // testing retrieving tag's items
  const retItems = await tagger.retrieveItems(database[0].clusterID, '100');
  console.log(retItems);

  // testing createAndInsert
  const listOfTagsId = ['200', '201', '202'];
  const listOfTagsName = ['test1', 'test2', 'test3']; // list of names is optional
  const listOfItemsId = ['2000', '2001'];

  console.log('\n\n');
  console.log('- - - - - BEFORE INSERT AND CREATE FUNCTION - - - - - \n', JSON.stringify(database));
  await tagger.createAndInsert(database[0].clusterID, listOfTagsId, listOfTagsName, '103', listOfItemsId);
  console.log('- - - - - AFTER INSERT AND CREATE FUNCTION - - - - - \n', JSON.stringify(database));
}

test();
