# Datalog.js

A trivial Datalog interpreter written in Javascript to learn how Datalog evaluation works.

Features:

- Implements both (naive) bottom-up and top-down evaluation for Datalog
- Traces the history for the top-down evaluation if successful

Caveats:

- No parser: you need to type the expressions in as JSON
- No validation (e.g. no sanity checking on the edb or idb contents)
- No negation or aggregate operators
- No repeated goal detection
- Only tested with a simple transitive closure / graph reachability problem

## Bottom-up evaluation

Works by inferring new facts until no new facts can be inferred.

`expand(edb, idb)`: returns the db with all possible facts.

Example:

    var expand = require('datalog.js').expand,
        edb = [
          { edge: [ 'a', 'b' ] },
          { edge: [ 'a', 'c' ] },
          { edge: [ 'b', 'd' ] },
          { edge: [ 'c', 'd' ] },
          { edge: [ 'd', 'e' ] }
        ],
        idb = [
        {
          head: { path: [ 'X', 'Y'] }, // :-
          body: [ { edge: [ 'X', 'Y' ]} ]
        },
        {
          head: { path: [ 'X', 'Y'] }, // :-
          body: [ { path: [ 'X', 'Z' ]}, { path: [ 'Z', 'Y' ]} ],
        }
      ];

    console.log(expand(edb, idb));

Output:

    [ { edge: [ 'a', 'b' ] },
      { edge: [ 'a', 'c' ] },
      { edge: [ 'b', 'd' ] },
      { edge: [ 'c', 'd' ] },
      { edge: [ 'd', 'e' ] },
      { path: [ 'a', 'b' ] },
      { path: [ 'a', 'c' ] },
      { path: [ 'b', 'd' ] },
      { path: [ 'c', 'd' ] },
      { path: [ 'd', 'e' ] },
      { path: [ 'a', 'd' ] },
      { path: [ 'b', 'e' ] },
      { path: [ 'c', 'e' ] },
      { path: [ 'a', 'e' ] } ]

## Top-down evaluation

Note that the top-down evaluation currently stops at the first instance that unifies.

`establish(edb, idb, goal, {}, [])`: tries to establish the goal, given an edb and idb. Returns true if successful.

Example:

    var establish = require('datalog.js').establish,
        idb = ...,
        edb = ...;

    // edge: a, b
    console.log('\n\n?edge(a, b)');
    establish(this.edb, this.idb, { edge: [ 'a', 'b' ]}, {}, []);

    // edge: b, a
    console.log('\n\n?edge(b, a)');
    establish(this.edb, this.idb, { edge: [ 'b', 'a' ]}, {}, []);

    // path: a, b
    console.log('\n\n?path(a, b)');
    establish(this.edb, this.idb, { path: [ 'a', 'b' ]}, {}, []);

    // path: a, d
    console.log('\n\?path(a, d)');
    establish(this.edb, this.idb, { path: [ 'a', 'd' ]}, {}, []);

Output:

    ?edge(a, b)
      Original goal: edge(a, b)
      DONE - Unified fact: edge(a, b) and final goal: edge(a, b)


    ?edge(b, a)
      Original goal: edge(b, a)
      Failed to find any match


    ?path(a, b)
      Original goal: path(a, b)
      Unified head of path(X, Y) => edge(X, Y) and goal: path(a, b)
      OK - unification is successful, substitutions: {"X":"a","Y":"b"}
      New goal: edge(a, b)
      DONE - Unified fact: edge(a, b) and final goal: edge(a, b)

    ?path(a, d)
      Original goal: path(a, d)
      Unified head of path(X, Y) => path(X, Z) & path(Z, Y) and goal: path(a, d)
      OK - unification is successful, substitutions: {"X":"a","Y":"d"}
      New goals: path(a, Z) & path(Z, d)
      Unified head of path(X, Y) => edge(X, Y) and goal: path(a, Z)
      OK - unification is successful, substitutions: {"X":"a","Y":"Z"}
      New goals: edge(a, Z) & path(Z, d)
      Unified fact: edge(a, b) and goal: edge(a, Z)
      OK - unification is successful, substitutions: {"Z":"b"}
      Remaining goal: path(b, d)
      Unified head of path(X, Y) => edge(X, Y) and goal: path(b, d)
      OK - unification is successful, substitutions: {"X":"b","Y":"d"}
      New goal: edge(b, d)
      DONE - Unified fact: edge(b, d) and final goal: edge(b, d)
