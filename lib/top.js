var getName = require('./util.js').getName,
    unify = require('./util.js').unify,
    substitute = require('./util.js').substitute,
    match = require('./util.js').match;

function pretty(clause) {
  if(Array.isArray(clause)) {
    // body
    return clause.map(pretty).join(' & ');
  }
  var name = getName(clause);
  return name + '(' + clause[name].join(', ')+')';
}


function establish(edb, idb, goalList, substitutions, history) {
  var isTop = false;
  if(history.length == 0) {
    isTop = true;
    history.push('Original goal: ' + pretty(goalList));
  }

  if(!Array.isArray(goalList)) {
    goalList = [ goalList ];
  }

  var goal = goalList[0],
      goalName = getName(goal);

  // find a edb fact with the same name
  var matched = edb.filter(function(fact) {
      // require that the predicate names match
      return goalName == getName(fact);
  }).some(function(fact) {
      var nextSubstitutions = unify(fact, goal, JSON.parse(JSON.stringify(substitutions)));
      if(!!nextSubstitutions) {
        // since the head unifies with the goal, recurse
        // replace the goal with the body predicates

        if(goalList.length == 1) {
          history.push('DONE - Unified fact: '+pretty(fact)+' and final goal: '+pretty(goal));
          console.log('\t'+history.join('\n\t'));
          return true;
        }
        // create the subgoals by cloning the rest of the goals
        var subgoals = JSON.parse(JSON.stringify(goalList.slice(1)));

        subgoals = subgoals.map(function(item) {
              return substitute(item, nextSubstitutions);
        });

        // console.log('EDB remaining goals: '+JSON.stringify(subgoals));
        // and try to satisfy the new goals
        return establish(edb, idb, subgoals, {}, history.concat(
          'Unified fact: '+pretty(fact)+' and goal: '+pretty(goal),
          'OK - unification is successful, substitutions: '+JSON.stringify(nextSubstitutions),
          'Remaining goal'+(subgoals.length > 1 ? 's' : '')+': '+pretty(subgoals)
          )
        );
      }
      return false;
  });
  if(matched) return true;

  // find a idb clause with the same name in the head
  matched = idb.filter(function(rule) {
      // require that the head names match
      return goalName == getName(rule.head);
    }).some(function(rule) {
      // check if the rule head can be unified with the goal
      var nextSubstitutions = unify(rule.head, goal, JSON.parse(JSON.stringify(substitutions)));

      if(!!nextSubstitutions) {
        // since the head unifies with the goal, recurse
        // replace the goal with the body predicates
        // console.log('Unifying head of '+JSON.stringify(rule.head)+' => '+JSON.stringify(rule.body)+' and goal: '+JSON.stringify(goal));
        // console.log('OK - unification is successful, substitutions: '+JSON.stringify(nextSubstitutions));

        // create the subgoals by cloning the rest of the goals
        var subgoals = JSON.parse(JSON.stringify(rule)).body
                        .concat(JSON.parse(JSON.stringify(goalList.slice(1))));

        subgoals = subgoals.map(function(item) {
              return substitute(item, nextSubstitutions);
        });

        // console.log('New goals: '+JSON.stringify(subgoals));
        // and try to satisfy the new goals
        return establish(edb, idb, subgoals, {}, history.concat(
          'Unified head of '+pretty(rule.head)+' => '+pretty(rule.body)+' and goal: '+pretty(goal),
          'OK - unification is successful, substitutions: '+JSON.stringify(nextSubstitutions),
          'New goal'+(subgoals.length > 1 ? 's' : '')+': '+pretty(subgoals)
          )
        );
      }
      return false;
    });

  if(isTop && !matched) {
    history.push('Failed to find any match');
    console.log('\t'+history.join('\n\t'));
  }

  return matched;
}

module.exports = establish;
