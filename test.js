const Tagger = require('./Tagger');

const Items = [{ tags: ['100', '101', '102'], id: '1000' }];

const Tags = [
  { root: true, childrenTags: ['101', '102'], tagName: 'Movies', items: ['1000'], id: '100' },
  { root: false, childrenTags: [], tagName: 'Drama', items: ['1000'], id: '101' },
  { root: false, childrenTags: [], tagName: 'American', items: ['1000'], id: '102' },
];

// the function that updates properties for tag with ID of tagID
// this function should be provided bu user
// changedValues is an object of the keys and values to change e.g. {items: newItems, id: '1231'}
function updateTag(tagID = null, newValues = null) {
  // check for valid tagID and newItems
  if (newValues === null) throw new Error('Null newValues');
  else if (tagID === null) throw new Error('Null TagID');

  const index = Tags.findIndex((t) => t.id === tagID);
  const newProperties = Object.keys(newValues);

  for (let i = 0; i < newProperties.length; i++) {
    const property = newProperties[i];
    Tags[index][property] = newValues[property];
  }
}

// insert new item to database
function addItemToDatabase(item) {
  Items.push(item);
}

// insert new tag to database
function addTagToDatabase(tag) {
  Tags.push(tag);
}

// the function that retrieves tag information using id
// this function should be provided by user
function getTagByID(id) {
  return Tags.filter((tag) => tag.id === id)[0];
}

function getRoot() {
  return Tags.filter((tag) => tag.root)[0];
}

function printTags() {
  console.dirxml(Tags);
  console.dirxml(Items);
}

const tagger = new Tagger(addItemToDatabase, addTagToDatabase, getTagByID, updateTag, getRoot);

// TESTING
tagger.insertItem('1001', '100');
insertTag('Cinema', '104', null, true);
printTags();
