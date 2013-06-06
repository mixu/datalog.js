/* description: Datalog */

/* lexical grammar */
%lex
%%

\s+                    /* skip whitespace */
':-'                   return 'CONS';
','                    return 'COMMA';
'_'                    return 'ANON_VAR';
'.'                    return 'DOT';
'!'                    return 'NEG';
'not'                  return 'NAF';
'('                    return 'PARAM_OPEN';
')'                    return 'PARAM_CLOSE';
[A-Z][A-Za-z0-9_]*     return 'VARIABLE';
[a-zA-Z_][a-zA-Z_0-9]* return 'SYMBOLIC_CONSTANT';
[^\"]*                 return 'STRING';
<<EOF>>                return 'EOF';


/lex

/* operator associations and precedence */

%start program

%% /* language grammar */

program
    : rules;

rules
    : rules rule;

rules
    : rule;

rule
    : head CONS body DOT;

head
    : atom;

body
    : conjunction;

conjunction
    : conjunction COMMA naf_literal;

conjunction
    : naf_literal;

naf_literal
    : NAF classic_literal;

naf_literal
    : classic_literal;

classic_literal
    : NEG atom;

classic_literal
    : atom;

atom
    : predicate_name PARAM_OPEN terms PARAM_CLOSE;

predicate_name
    : identifier;

terms
    : term;

terms
    : term COMMA terms;

term
    : basic_term;

basic_term
    : ground_term
    | variable_term;

ground_term
    : SYMBOLIC_CONSTANT;

variable_term
    : VARIABLE
    | ANON_VAR;

identifier
    : SYMBOLIC_CONSTANT
    | STRING
    | VARIABLE;
