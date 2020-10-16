class Tagger {
  constructor(addItemToDatabase, addTagToDatabase, updateTag, getTag, tagUniqueIdentifier, itemUniqueIdentifier) {
    // printing tags
    this.printTags = function () {
      let currentNode = getTag('root', true);
      let currentLevel = 0;

      let queue = [];
      queue.push(Object.assign(currentNode, { nodeLevel: currentLevel }));

      while (queue.length > 0) {
        currentNode = queue.shift();
        if (currentNode.nodeLevel === currentLevel + 1) {
          console.log('\n');
          currentLevel++;
        }
        process.stdout.write(currentNode.tagName + '\t');
        // console.log(currentNode.tagName);

        for (let i = 0; i < currentNode.childrenTags.length; i++) {
          let child = getTag(tagUniqueIdentifier, currentNode.childrenTags[i]);
          queue.push(Object.assign(child, { nodeLevel: currentLevel + 1 }));
        }
      }

      console.log('\n- - - - - - - - - - - - - - -\n');
    };

    // handling item insertion
    this.insertItem = function (itemID = null, tagID = null) {
      // check for valid itemID and tagID
      if (itemID === null) throw new Error('Null itemID');
      else if (tagID === null) throw new Error('Null TagID');

      const newItemTags = [];

      const stack = [];
      let tag = getTag(tagUniqueIdentifier, tagID);

      stack.push(tag);

      // Traversing tags tree
      while (stack.length > 0) {
        const top = stack.pop();
        top.items.push(itemID);
        newItemTags.push(top[tagUniqueIdentifier]); // push tag id

        updateTag(top[tagUniqueIdentifier], { items: top.items });

        for (let i = 0; i < top.childrenTags.length; i++) {
          stack.push(getTag(tagUniqueIdentifier, top.childrenTags[i]));
        }
      }

      const newItem = { tags: newItemTags, id: itemID };
      addItemToDatabase(newItem);
    };

    // handling tag insertion
    // inserting new tag, if root is true then new tag will be the parent of the current root
    this.insertTag = function (tagName = null, tagID = null, attachToID = null, root = false) {
      if (root) {
        const root = getTag('root', true);
        updateTag(root[tagUniqueIdentifier], { root: false });
        addTagToDatabase({
          root: true,
          childrenTags: [root[tagUniqueIdentifier]],
          tagName: tagName,
          items: [...root.items],
          id: tagID,
        });
      } else {
        const attachTag = getTag(tagUniqueIdentifier, attachToID);
        updateTag(attachToID, { childrenTags: attachTag.childrenTags.push(tagID) });
        addTagToDatabase({
          root: false,
          childrenTags: [],
          tagName: tagName,
          items: [],
          id: tagID,
        });
      }
    };
  }
}

module.exports = Tagger;
