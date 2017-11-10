# The Nypl Language Guide v0.4
*Designed for Simo™*

A Forth-like, almost concatenative language with functional features, inspired by [Factor](https://factorcode.org/), JavaScript, Lisp, [IBNIZ](http://pelulamu.net/ibniz/) and APL.

## Examples

To compute sum of two numbers, push the literals `1` and `2` on the stack and then call the `+` word to sum them. Finally `.` word is executed to print the top of the stack.

All REPL output is preceded by `>>`.

    1 2 + .
    >> 3


To calculate the product of two sums 5 + 6 and 1 + 2:

    1 2 + 5 6 + * .
    >> 34

What happened here was that first numbers `1` and `2` were pushed on the stack, and `+` was called:

    _________                   _____
    | 1 | 2 | -> call word + -> | 3 |
    ---------                   -----

The sum of numbers `5` and `6` were pushed to the stack and added too:

    _____________                     __________
    | 3 | 5 | 6 |  -> call word + ->  | 3 | 11 |
    -------------                     ----------

Then `*` was invoked. It popped off the two topmost items `3` and `11` off the stack and pushed in the product of them back in:

     __________                   ______
     | 3 | 11 | -> call word * -> | 33 |
     ----------                   ------

## Execution model

There's an explicit parameter stack that the programmer uses to call *words* - basically subroutines - and an implicit call stack provided by the implementation.

### Defining custom words

Define a word `S` that duplicates (d) and then multiply the two values
so it's square(x) -> x^2. `;` ends the word definition

    (d*):S

I can be then called like this:

    5 S
    >> 25


## Stack manipulation

### Stack effect declarations
In the documentation the stack effects are written in the following form:

    (input -- output)

Where `input` is the stack state before calling the word and `output` is the end state, respectively. For example `(n --)` would mean that one argument is expected and none returned, and `(a b -- x)` that two arguments are expected and one returned.

### Stack manipulation operators
    s = swap `(a b -- b a)`
    r = rot `(a b c -- c a b)`
    d = dup `(a -- a a)`
    x = drop `(a -- )`


## Math operators
    / = division ( a b -- a/b )
    + = addition ( a b -- sum )
    - = subtraction ( a b -- difference )
    * = multiplication ( a b -- product )
    = = equality ( a b -- true_if_equal )
    < = less than ( a b -- a < b )
    > = less than ( a b -- a > b )

## I/O operators

    . = print the value on top of the stack

## Word definitions

    CODE :X = defines a custom word X that will execute CODE when
               encountered during execution

User defined words must be a single capital letter. All builtin words are one character long, too.

Checks if given number is even.
Define word `E` as the following: get the result of `n mod 2`, check if 0:

    "(n -- is_even)"x
    (2%0=):E

Now the user defined word `E` can be used the following way:

    5E
    >> false
    6E
    >> true

### Emulating variables

To emulate variables with custom words you can simply use a code list that evaluates to the value:

    (3):X
    X
    >> 3


## Whitespace

Whitespace can be used to separate immediates and words, but isn't always necessary.
For example `1 2 + 3 *` and `1 2+3*` are equivalent.

## Comments

There is no special syntax for comments but one way to add annotations to code is to add string literals that are dropped off the stack immediately afterwards:

    "This is kind of a comment."x

## Data types

Nypl uses the JavaScript data types and comparison rules.

### Strings

Strings are written in double quotes. Supported escape sequences are the following: `\"`, `\n`, `\t`.


    "oot aika \"ihana\"".
    >> oot aika "ihana"


### Inline code

*Quotations* are fragments of code that can be passed around and executed. Simply wrap some code in parentheses.

This example code pushes `3` on the stack, pushes the code list `(d*)` on the stack, pops the code list and executes it via the `i` word and then prints the result.

    3 (d*) i.
    >> 9

### Combinators
Words that take in code lists as inputs are called combinators. Basically just higher-order functions.

## Flow control

The `?` combinator can be used for conditional execution of code.

    ? = conditional (condition)(then)(else)

The following code returns 6, since 4 > 3. Otherwise it would've returned 0.

    4(d3>)(2+)(x0)?
    >> 6


### Looping

The times, or `t` combinator can be used to repeatedly execute a code list.

    t   = times (a b -- ) code list b gets repeated 'a' times

Example: print `hi` five times:

    > 5("hi".)t


### Lists

Lists can be executed as code.

#### filter

    (list) (predicate) f -- removes elements not matching predicate

The predicate should take one argument and return a boolean value.

#### map

    (list) (transform) m -- transforms each element of a list

The transform should take one argument and return a new value that will replace the old one.

TODO: expand


### Interfacing with JavaScript

TODO

* update documentation
* array object toString decoration
    * otherwise printing will miss parens
* native objects
* unified element access
* wrap & unwrap

## Lists

    >(5 10 12)0g
    >> 5

    (1 2)(3 4)+
    >>(1 2 3 4)

    (d"jea"x)2g
    >>"x"
	
## TODO

- accessing values down the stack
- lists
- map, filter, fold



