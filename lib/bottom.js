var getName = require('./util.js').getName,
    unify = require('./util.js').unify,
    substitute = require('./util.js').substitute,
    match = require('./util.js').match;

function matchEdb(edb, remainingPredicates, substitutions, onComplete) {
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
      // console.log(fact, head, nextSubstitutions ? 'unifies': 'false', nextSubstitutions);

      if(!!nextSubstitutions) {
        if(remainingPredicates.length > 1) {
          matchEdb(edb, remainingPredicates.slice(1), nextSubstitutions, onComplete);
        } else {
          onComplete(nextSubstitutions);
        }
      }
    });
  // otherwise, do not recurse further
}

module.exports = function expand(edb, idb) {
  var addFact = true, iteration = 1;
  while(addFact == true) {
    addFact = false;
    // console.log('RUN '+iteration++);
    // for each idb rule
    idb.forEach(function(rule) {
      // if you can unify the rule body then you can infer the rule head

      // if the rule body is not an array, make it so
      if(!Array.isArray(rule.body)) {
        rule.body = [ rule.body ];
      }
      // for each body predicate, try to match against
      // every possible edb fact

      matchEdb(edb, rule.body, {}, function(substitutions) {
        // perform substitutions on the the rule head
        // check that the fact is not in the edb
        var result = substitute(rule.head, substitutions);
        if(!match(result, edb)) {
          addFact = true;
          // console.log('new fact', result);
          edb.push(result);
        }
      });
    });
  }
  return edb;
};
