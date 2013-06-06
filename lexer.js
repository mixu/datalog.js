var Lexer = require("lex");

var lexer = new Lexer();

lexer.addRule(/\s+/, function () {});
lexer.addRule(/:-/, function() { return 'CONS'} );
lexer.addRule(/,/, function() { return 'COMMA'} );
lexer.addRule(/_/, function() { return 'ANON_VAR'} );
lexer.addRule(/\./, function() { return 'DOT'} );
lexer.addRule(/!/, function() { return 'NEG'} );
lexer.addRule(/not/, function() { return 'NAF'} );
lexer.addRule(/\(/, function() { return 'PARAM_OPEN'} );
lexer.addRule(/\)/, function() { return 'PARAM_CLOSE'} );
lexer.addRule(/[A-Z][A-Za-z0-9_]*/, function(lexeme) { return { t: 'VARIABLE', v: lexeme}; });
lexer.addRule(/[a-z_][a-zA-Z_0-9]*/, function(lexeme) { return { t: 'SYMBOLIC_CONSTANT', v: lexeme }; });


//lexer.input = 'p(X) :- q(Y), not Z(X,Y).';
/*
edge(a,b).
edge(a,c).
edge(b,d).
edge(c,d).
edge(d,e).

path(X,Y) :- edge(X,Y).
path(X,Y) :- path(X,Z), path(Z,Y).
*/

console.log('path(X,Y) :- path(X,Z), path(Z,Y).');

lexer.setInput('path(X,Y) :- path(X,Z), path(Z,Y).');

var token = lexer.lex();

while(token) {
  console.log(token);
  token = lexer.lex();
}


console.log('edge(d,e).');

lexer.setInput('edge(d,e).');

var token = lexer.lex();

while(token) {
  console.log(token);
  token = lexer.lex();
}
