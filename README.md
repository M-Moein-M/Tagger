# Tagger

## Intro

An application for tagging images or notes or other entities only with their unique ID. The demo of project can be seen below. Each box represents the item you want to tag. Given an item ID will return the tags related to that ID and given a tag will return all the ID's related to that tag.

![DEMO](https://i.ibb.co/JncZzHW/tagging-project.png)

# Tagger initialization

For storing tags and items related to them, we need a database. Leaving this to the module user to implement the functions that are related to storing and changing from database. So the users can use any database they like but they should do some dirty work to make the functions for Tagger to work with(Tagger might implement an default database for users).

## User dirty work

```javascript
const tagger = new Tagger(insertDoc, updateDoc, getDocByID, tagUniqueIdentifier, itemUniqueIdentifier);
```

As we told, user must implement the functions below for initializing the Tagger.

- **insertDoc** is the function that will be used for saving the tags clusters(the whole tags and items) to the database. The implementation should be as follows:

```javascript
function insertDoc(newDocument) {
  // your code which saves the newDocument into the database
}
```

- **updateDoc** is used for updating a specific document(cluster) in the database. The whole document will be sent to this function which means some of its values might not changed at all.

```javascript
function updateDoc(docID, document) {
  // your code which updates the document with the id of docID with the new values in document.
}
```

---

## Tagger APIs

### Tag related
