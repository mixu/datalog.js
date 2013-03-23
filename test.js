var assert = require('assert');

function termType(x) {
  // lowercase = constant
  // uppercase = variable
  return (/[a-z]/.test(x) ? 'constant' : 'variable');
}


function unify(expr1, expr2) {
  // check that the predicates are the same
  var predicate1 = Object.keys(expr1),
      predicate2 = Object.keys(expr2);
  if(predicate1.length != 1 || predicate2.length != 1 || predicate1[0] != predicate2[0]) {
    console.log('Two predicates are not the same');
    return false;
  }
  var pred = predicate1[0];
  if(expr1[pred].length != expr2[pred].length) {
    console.log('Expression lengths do not match');
    return false; // valid Datalog predicates have the same number of terms
  }

  for(var i = 0; i < expr1[pred].length; i++) {
    var term1 = expr1[pred][i],
        term2 = expr2[pred][i];
    if(termType(term1) == 'variable') {
      if(term1 == term2) {
        // do nothing
      } else {
        // store a substitution: term1 becomes term2
        console.log(term1, 'becomes', term2);
        // apply the substitution to all terms in both expressions
        expr1[pred].forEach(function(item, index) {
          if(item == term1) {
            expr1[pred][index] = term2;
          }
        });
        expr2[pred].forEach(function(item, index) {
          if(item == term1) {
            expr2[pred][index] = term2;
          }
        });
      }
    } else if(termType(term2) == 'variable') {
        // store a substitution: term2 becomes term1
        console.log(term2, 'becomes', term1);
        // apply the substitution to all terms in both expressions
        expr1[pred].forEach(function(item, index) {
          if(item == term2) {
            expr1[pred][index] = term1;
          }
        });
        expr2[pred].forEach(function(item, index) {
          if(item == term2) {
            expr2[pred][index] = term1;
          }
        });
    } else if(term1 != term2) {
      // same constants?
      return false;
    }
    console.log(expr1, expr2);
  }
  return true;
}



exports['unification'] = {

  'should return false if the predicates do not match': function() {
    assert.equal(unify({ dog: [ 'foo' ] }, { cat: ['X'] }), false);
  },

  'should return true when two constants are equal': function() {
    assert.equal(unify({ dog: [ 'foo' ] }, { dog: ['foo'] }), true);
  },

  'should return false when two constants are not equal': function() {
    assert.equal(unify({ dog: [ 'foo' ] }, { dog: ['bar'] }), false);
  },

  'should be able to unify a constant with a variable': function() {

    // dog(foo)
    // animal(X) :- dog(X)

    assert.equal(unify({ dog: [ 'foo' ] }, { dog: ['X'] }), true);
  },

  'expressions with multiple terms': function() {
    assert.equal(unify({ a: [ 'foo', 'bar' ] }, { a: ['foo', 'bar'] }), true);
    assert.equal(unify({ a: [ 'foo', 'bar' ] }, { a: ['foo', 'fail'] }), false);
    assert.equal(unify({ a: [ 'foo', 'bar' ] }, { a: ['fail', 'bar'] }), false);
    assert.equal(unify({ a: [ 'foo', 'bar' ] }, { a: ['foo', 'X'] }), true);
    assert.equal(unify({ a: [ 'foo', 'bar' ] }, { a: ['X', 'bar'] }), true);
    assert.equal(unify({ a: [ 'foo', 'bar' ] }, { a: ['X', 'X'] }), false);
    assert.equal(unify({ a: [ 'foo', 'bar' ] }, { a: ['X', 'Y'] }), true);
  }

};

// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--bail', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}
