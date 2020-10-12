class Tagger {
  constructor() {
    const Items = [{ tags: ['100', '101', '102'], id: '1000' }];

    const Tags = [
      { root: true, childrenTags: ['101', '102'], tagName: 'Movies', items: ['1000'], id: '100' },
      { root: false, childrenTags: [], tagName: 'Drama', items: ['1000'], id: '101' },
      { root: false, childrenTags: [], tagName: 'American', items: ['1000'], id: '102' },
    ];

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

    // the function that updates properties for tag with ID of tagID
    // this function should be provided bu user
    // changedValues is an object of the keys and values to change e.g. {items: newItems, id: '1231'}
    const updateTag = function (tagID = null, newValues = null) {
      // check for valid tagID and newItems
      if (newValues === null) throw new Error('Null newValues');
      else if (tagID === null) throw new Error('Null TagID');

      const index = Tags.findIndex((t) => t.id === tagID);
      const newProperties = Object.keys(newValues);

      for (let i = 0; i < newProperties.length; i++) {
        const property = newProperties[i];
        Tags[index][property] = newValues[property];
      }
    };

    // insert new item to database
    const addItemToDatabase = function (item) {
      Items.push(item);
    };

    // insert new tag to database
    const addTagToDatabase = function (tag) {
      Tags.push(tag);
    };

    // the function that retrieves tag information using id
    // this function should be provided by user
    const getTagByID = function (id) {
      return Tags.filter((tag) => tag.id === id)[0];
    };

    const getRoot = function () {
      return Tags.filter((tag) => tag.root)[0];
    };

    function printTags() {
      console.log(Tags);
      console.log(Items);
    }

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

    // TESTING
    // insertItem('1001', '100');
    // insertTag('Cinema', '104', null, true);
    // printTags();
  }
}
