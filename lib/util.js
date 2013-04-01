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
  var i,
      name = getName(expr1);

  if(arguments.length < 3) {
    substitutions = {};
  }

  if(name != getName(expr2)) {
    console.log('Two predicates are not the same');
    return false;
  }
  if(expr1[name].length != expr2[name].length) {
    console.log('Expression lengths do not match');
    return false; // valid Datalog predicates have the same number of terms
  }

  for(i = 0; i < expr1[name].length; i++) {
    var term1 = expr1[name][i],
        term2 = expr2[name][i];
    if(termType(term1) == 'variable') {
      if(term1 == term2) {
        // do nothing
      } else {
        if(typeof substitutions[term1] == 'undefined') {
          // store a substitution: term1 becomes term2
          // console.log(term1, 'becomes', term2);
          substitutions[term1] = term2;
        } else if(substitutions[term1] != term2) {
          // console.log('Cannot subtitute variable twice: ' + term1 + ' => '+ substitutions[term1]+' tried '+term2);
          return false;
        }
      }
    } else if(termType(term2) == 'variable') {
        if(typeof substitutions[term2] == 'undefined') {
          // store a substitution: term2 becomes term1
          // console.log(term2, 'becomes', term1);
          substitutions[term2] = term1;
        } else if(substitutions[term2] != term1) {
          // console.log('Cannot subtitute variable twice: ' + term2 + ' => '+ substitutions[term2]+' tried '+term1);
          return false;
        }
    } else if(term1 != term2) {
      // same constants?
      return false;
    }
  }
  return substitutions;
}

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

module.exports = {
  getName: getName,
  unify: unify,
  match: match,
  substitute: substitute
};
