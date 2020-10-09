{
  const Items = [{ tags: ['100', '101', '102'], id: '1000' }];

  const Tags = [
    { root: true, childrenTags: ['101', '102'], tagName: 'Movies', items: ['1000'], id: '100' },
    { root: false, childrenTags: [], tagName: 'Drama', items: ['1000'], id: '101' },
    { root: false, childrenTags: [], tagName: 'American', items: ['1000'], id: '102' },
  ];

  function insertItem(itemID = null, tagID = null) {
    // check for valid itemID and tagID
    if (itemID === null) throw new Error('Null itemID');
    else if (tagID === null) throw new Error('Null TagID');

    const newItemTags = [];

    const stack = [];
    let tag = getTagByID(tagID);
    stack.push(tag);

    while (stack.length > 0) {
      const top = stack.pop();
      top.items.push(itemID);
      newItemTags.push(top.tagName);

      updateTag(top.id, top.items);

      for (let i = 0; i < top.childrenTags.length; i++) {
        stack.push(getTagByID(top.childrenTags[i]));
      }
    }

    const newItem = { tags: newItemTags, id: itemID };
    updateItemsArray(newItem);

    console.log('success');
  }

  // the function that updates items array for tag with ID of tagID
  // this function should be provided bu user
  function updateTag(tagID = null, newItems = null) {
    // check for valid tagID and newItems
    if (newItems === null) throw new Error('Null newItems');
    else if (tagID === null) throw new Error('Null TagID');

    const index = Tags.findIndex((t) => t.id === tagID);
    Tags[index].items = newItems;
  }

  function updateItemsArray(item) {
    Items.push(item);
  }

  // the function that retrieves tag information using tagID
  // this function should be provided by user
  function getTagByID(tagID) {
    Tags.filter((tag) => tag.id === tagID)[0];
  }
}
