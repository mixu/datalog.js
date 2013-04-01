var assert = require('assert'),
    util = require('util');

var unify = require('./index').unify,
    expand = require('./index').expand,
    establish = require('./index').establish;

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

  beforeEach: function() {
    this.edb = [
      { edge: [ 'a', 'b' ] },
      { edge: [ 'a', 'c' ] },
      { edge: [ 'b', 'd' ] },
      { edge: [ 'c', 'd' ] },
      { edge: [ 'd', 'e' ] }
    ];

    this.idb = [
      {
        head: { path: [ 'X', 'Y'] }, // :-
        body: [ { edge: [ 'X', 'Y' ]} ]
      },
      {
        head: { path: [ 'X', 'Y'] }, // :-
        body: [ { path: [ 'X', 'Z' ]}, { path: [ 'Z', 'Y' ]} ],
      }
    ];
  },

  'should be able to infer using the bottom up strategy': function() {
    var full = expand(this.edb, this.idb);

    console.log(full);

    assert.deepEqual(full, [
      { edge: [ 'a', 'b' ] },
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
      { path: [ 'a', 'e' ] } ]);
  },

  'should be able to infer using a top-down strategy': function() {
    // edge: a, b
    console.log('\n\n?edge(a, b)');
    assert.ok(establish(this.edb, this.idb, { edge: [ 'a', 'b' ]}, {}, []));

    // edge: b, a
    console.log('\n\n?edge(b, a)');
    assert.ok(!establish(this.edb, this.idb, { edge: [ 'b', 'a' ]}, {}, []));

    // path: a, b
    console.log('\n\n?path(a, b)');
    assert.ok(establish(this.edb, this.idb, { path: [ 'a', 'b' ]}, {}, []));

    // path: a, d
    console.log('\n\?path(a, d)');
    assert.ok(establish(this.edb, this.idb, { path: [ 'a', 'd' ]}, {}, []));

    // path: a, e
    console.log('\n\n?path(a, e)');
    assert.ok(establish(this.edb, this.idb, { path: [ 'a', 'e' ]}, {}, []));


    console.log('\n\n?path(X, e)');
    assert.ok(establish(this.edb, this.idb, { path: [ 'X', 'e' ]}, {}, []));
  }
};

// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--bail', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}
