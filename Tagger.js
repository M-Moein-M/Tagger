class Tagger {
  constructor(addItemToDatabase, addTagToDatabase, getTagByID, updateTag, getRoot) {
    // handling item insertion
    this.insertItem = function (itemID = null, tagID = null) {
      // check for valid itemID and tagID
      if (itemID === null) throw new Error('Null itemID');
      else if (tagID === null) throw new Error('Null TagID');

      const newItemTags = [];

      const stack = [];
      let tag = getTagByID(tagID);

      stack.push(tag);

      // Traversing tags tree
      while (stack.length > 0) {
        const top = stack.pop();
        top.items.push(itemID);
        newItemTags.push(top.id);

        updateTag(top.id, { items: top.items });

        for (let i = 0; i < top.childrenTags.length; i++) {
          stack.push(getTagByID(top.childrenTags[i]));
        }
      }

      const newItem = { tags: newItemTags, id: itemID };
      addItemToDatabase(newItem);
    };

    // handling tag insertion
    // inserting new tag, if root is true then new tag will be the parent of the current root
    this.insertTag = function (tagName = null, tagID = null, attachToID = null, root = false) {
      if (root) {
        const root = getRoot();
        updateTag(root.id, { root: false });
        addTagToDatabase({
          root: true,
          childrenTags: [root.id],
          tagName: tagName,
          items: [...root.items],
          id: tagID,
        });
      } else {
        const attachTag = getTagByID(attachToID);
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
