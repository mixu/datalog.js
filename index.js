// EDB facts
var edb = {
  parent: [
    [ constant('bill'), constant('mary') ],
    [ constant('mary'), constant('john') ]
  ]
};

// IDB rules
var idb = {
  ancestor: [
    {
      head: [ vari('X'), vari('Y') ], // :-
      body: [ { parent: [ vari('X'), vari('Y') ] } ]
    },
    {
      head: [ vari('X'), vari('Y') ], // :-
      body: [ { parent: [ vari('X'), vari('Z') ] }, { ancestor: [ vari('Z'), vari('Y') ] } ]
    }
  ]
};

var goal = { ancestor: [ 'bill', undefined ] };

/*

  ancestor('bill', undefined)

  Should generate:

  ancestor('bill', 'mary')
  ancestor('bill', 'john')

  By doing something like:

  1. ancestor('bill', 'mary') <= parent('bill', 'mary')
  2. ancestor('bill', 'john') <= parent('bill', 'mary')
                               & ancestor('mary', 'john')
                               <= parent('mary', 'john')


*/
