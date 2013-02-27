//We need a value larger than list-max-ziplist-value to make sure
//the list has the right encoding when it is swapped in again.

var largevalue = new Array();
largevalue['ziplist'] = 'hello';
module.exports.ziplist = largevalue['ziplist'];
largevalue['linkedlist'] = 'hellohellohellohello';
module.exports.linkedlist = largevalue['linkedlist'];