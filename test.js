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
    return false;
  }

  var term1 = expr1[predicate1][0],
      term2 = expr2[predicate2][0];

  if(termType(term1) == 'variable') {
    if(term1 == term2) {
      // do nothing
    } else {
      // store a substitution: term1 becomes term2
      console.log(term1, 'becomes', term2);
      // apply the substitution to all terms in both expressions
      term1 = term2;
    }
  } else if(termType(term2) == 'variable') {
      // store a substitution: term2 becomes term1
      console.log(term2, 'becomes', term1);
      // apply the substitution to all terms in both expressions
      term2 = term1;
  } else if(term1 != term2) {
    // same constants?
    return false;
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
  }


};

// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--bail', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}
