var assert = require('assert');

function termType(x) {
  // lowercase = constant
  // uppercase = variable
  return (/[a-z]/.test(x) ? 'constant' : 'variable');
}

function getName(expr) {
  var keys = Object.keys(expr);
  if(keys.length != 1) {
    console.log('Warn: predicate should not have multiple names');
  }
  return keys[0];
}


// Unifies two expressions. Returns false if it cannot unify, and the result of the unification otherwise
// for forward chaining, keep the list of substitutions...
function unify(expr1, expr2, substitutions) {
  // check that the predicates are the same
  var pred = getName(expr1);
  if(pred != getName(expr2)) {
    console.log('Two predicates are not the same');
    return false;
  }
  var i;
  if(arguments.length == 2) {
    substitutions = {};
  }
  console.log('substitutions', substitutions);

  if(expr1[pred].length != expr2[pred].length) {
    console.log('Expression lengths do not match');
    return false; // valid Datalog predicates have the same number of terms
  }

  for(i = 0; i < expr1[pred].length; i++) {
    var term1 = expr1[pred][i],
        term2 = expr2[pred][i];
    if(termType(term1) == 'variable') {
      if(term1 == term2) {
        // do nothing
      } else {
        if(typeof substitutions[term1] == 'undefined') {
          // store a substitution: term1 becomes term2
          // console.log(term1, 'becomes', term2);
          substitutions[term1] = term2;
        } else if(substitutions[term1] != term2) {
          console.log('Cannot subtitute variable twice: ' + term1 + ' => '+ substitutions[term1]+' tried '+term2);
          return false;
        }
      }
    } else if(termType(term2) == 'variable') {
        if(typeof substitutions[term2] == 'undefined') {
          // store a substitution: term2 becomes term1
          // console.log(term2, 'becomes', term1);
          substitutions[term2] = term1;
        } else if(substitutions[term2] != term1) {
          console.log('Cannot subtitute variable twice: ' + term2 + ' => '+ substitutions[term2]+' tried '+term1);
          return false;
        }
    } else if(term1 != term2) {
      // same constants?
      return false;
    }
    // console.log(expr1, expr2);
  }
  return substitutions;
}



exports['unification'] = {

  'should return false if the predicates do not match': function() {
    assert.equal(unify({ dog: [ 'foo' ] }, { cat: ['X'] }), false);
  },

  'should return true when two constants are equal': function() {
    assert.deepEqual(unify({ dog: [ 'foo' ] }, { dog: ['foo'] }), { });
  },

  'should return false when two constants are not equal': function() {
    assert.equal(unify({ dog: [ 'foo' ] }, { dog: ['bar'] }), false);
  },

  'should be able to unify a constant with a variable': function() {

    // dog(foo)
    // animal(X) :- dog(X)

    assert.deepEqual(unify({ dog: [ 'foo' ] }, { dog: ['X'] }), { X: 'foo' });
  },

  'expressions with multiple terms': function() {
    assert.deepEqual(unify({ a: [ 'foo', 'bar' ] }, { a: ['foo', 'bar'] }), { });
    assert.equal(unify({ a: [ 'foo', 'bar' ] }, { a: ['foo', 'fail'] }), false);
    assert.equal(unify({ a: [ 'foo', 'bar' ] }, { a: ['fail', 'bar'] }), false);
    assert.deepEqual(unify({ a: [ 'foo', 'bar' ] }, { a: ['foo', 'X'] }), { X: 'bar' });
    assert.deepEqual(unify({ a: [ 'foo', 'bar' ] }, { a: ['X', 'bar'] }), { X: 'foo' });
    assert.equal(unify({ a: [ 'foo', 'bar' ] }, { a: ['X', 'X'] }), false);
    assert.deepEqual(unify({ a: [ 'foo', 'bar' ] }, { a: ['X', 'Y'] }), { X: 'foo', Y: 'bar' });
  }

};

// match a fact against a database
function match(fact, database) {
  var factPredicate = Object.keys(fact)[0],
      factArity = Object.keys(fact[factPredicate]).length;

  return database.some(function(item) {
    var itemPredicate = Object.keys(item)[0];
    // console.log('match', fact, item, factPredicate, itemPredicate, factArity, Object.keys(item[itemPredicate]).length);
    if(factPredicate == itemPredicate && factArity == Object.keys(item[itemPredicate]).length) {
      var r = item[itemPredicate].every(function(value, index) {
        // console.log(fact[factPredicate][index],  value);
        return fact[factPredicate][index] == value;
      });
      if(r) {
        // console.log('match?', true);
        return true;
      }
    }
  });
}

// given a head and a set of substitutions, perform the substitutions
function substitute(head, substitutions) {
  // create the result (doesn't matter which side this is applied to)
  var i, result = {},
      predicate = Object.keys(head),
      name = predicate[0],
      arity = head[name].length;

  result[name] = [];
  for(i = 0; i < arity; i++) {
    result[name][i] = substitutions[head[name][i]] || head[name][i];
  }
  return result;
}



exports['inference'] = {

  /*
    Graph:

      /-> b \
    a        -> d -> e
      \-> c /

    Paths:
      (a,b), (a,c), (b,d), (c,d), (d,e)
      (a,d), (b,e), (c,e)
      (a,e)
  */

  'should be able to infer using the bottom up strategy': function() {
    var edb = [
      { edge: [ 'a', 'b' ] },
      { edge: [ 'a', 'c' ] },
      { edge: [ 'b', 'd' ] },
      { edge: [ 'c', 'd' ] },
      { edge: [ 'd', 'e' ] }
    ];

    var idb = [
      {
        head: { path: [ 'X', 'Y'] }, // :-
        body: { edge: [ 'X', 'Y' ]}
      },
      {
        head: { path: [ 'X', 'Y'] }, // :-
        body: [ { path: [ 'X', 'Z' ]}, { path: [ 'Z', 'Y' ]} ],
      }
    ];

    function matchEdb(remainingPredicates, substitutions, onComplete) {
      var head = remainingPredicates[0],
          headName = getName(head);
      // try to unify the current predicate with each edb fact
      var matched = edb.filter(function(fact) {
          // require that the predicate names match
          return headName == getName(fact);
        }).forEach(function(fact) {
          // check if given the current substitutions, there is an existing edb fact
          // that can be matched
          var nextSubstitutions = unify(fact, head, JSON.parse(JSON.stringify(substitutions)));
          console.log(fact, head, nextSubstitutions ? 'unifies': 'false', nextSubstitutions);

          if(!!nextSubstitutions) {
            if(remainingPredicates.length > 1) {
              matchEdb(remainingPredicates.slice(1), nextSubstitutions, onComplete);
            } else {
              onComplete(nextSubstitutions);
            }
          }
        });
      // otherwise, do not recurse further
    }


    var addFact = true, iteration = 1;
    while(addFact == true) {
      addFact = false;
      console.log('RUN '+iteration++);
      // for each idb rule
      idb.forEach(function(rule) {
        // if you can unify the rule body then you can infer the rule head

        // if the rule body is not an array, make it so
        if(!Array.isArray(rule.body)) {
          rule.body = [ rule.body ];
        }


        // for each body predicate, try to match against
        // every possible edb fact

        matchEdb(rule.body, {}, function(substitutions) {
          // perform substitutions on the the rule head
          // check that the fact is not in the edb
          var result = substitute(rule.head, substitutions);
          if(!match(result, edb)) {
            addFact = true;
            console.log('new fact', result);
            edb.push(result);
          }
        });
      });
    }

    console.log(edb);
  }

};

// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--bail', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}
