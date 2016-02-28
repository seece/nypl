# The Nypl Language Spec v0.1ses
*Designed for Simo™*

A Forth-like, almost concatenative language with functional features, inspired by Factor, [Joy](http://www.kevinalbrecht.com/code/joy-mirror/j01tut.html), lisp, [IBNIZ](http://pelulamu.net/ibniz/) and Kx Systems' Q language.

## Examples

To compute sum of two numbers, push the literals `1` and `2` on the stack and then call the `+` word to sum them. Finally `.` word is executed to print the top of the stack.

    1 2 + .
    > 3

To calculate the product of two sums 5+6 and 1 + 2:

    1 2 + 5 6 + * .
    > 90


A terrible tail recursion for loop that prints the numbers 2, 1, 0:

    3(s-1+d. d(0=)("done".)(sdi)?)di

Stack state during the computation. `f` is the quotation `(s-1+d. d(0=)("done".)(sdi)?)`. `g`, `h` and `k` are also quotations. On the right hand side the command that has executed is shown.

    STACK          COMMANDS
    3           -- 3
    3f          -- f
    3ff         -- d
    3f          -- i
    f3          -- s
    f2          -- -1 + # decrease by one
    f2          -- d. # prints the number
    f22         -- d
    f22ghk      -- (0=)("done".)(sdi) # condition, if and else quotations for ? combinator
    f22         -- ?

    f20         -- 0= # does not equal to zero, push false = 0
    f2          -- ? pops off the result and checks it
    2f          -- s # the "else" part of the ? combinator was taken
    2ff         -- d
    2f          -- i # recursion back to quotation f

    ... recurse until number is 0

    1f          -- # the last iteration of recursion
    f0          -- s-1+
    f0          -- d. # print 0
    f00ghk      -- push the arguments for ?
    f00         -- ?
    f01         -- 0=
    f0"done"    -- push string "done"
    f0          -- . # print string "done"

In this case two values `f` and `0` were left on stack after exit. These could've been removed with `xx`.


There's an explicit parameter stack that the programmer uses to call *words* - basically subroutines - and an implicit call stack provided by the implementation.

Define a word `S` that duplicates (d) and then multiply the two values
so it's square(x) -> x^2. `;` ends the word definition

    :Sd*;

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

    : = begin a new word definition
    ; = end a word definition

User defined words must be a single capital letter. All builtin words are one character long, too.

Checks if given number is even.
Define word `E`, divide given number, swap, drop, push 0, check for equality

    # (n -- is_even)
    :E%sx0=;

### Whitespace

Whitespace can be used to separate immediates and words, but isn't always necessary.
For example `1 2 + 3 *` and `1 2+3*` are equivalent.

## Data types

### Real numbers
All numbers are double precision floating point numbers.

### Boolean values

A number of value `0` is considered falsy and `1` true.

### Strings

Strings are written in double quotes. Supported escape characters are the following: `\"`, `\n`, `\t`.


    "oot aika \"ihana\"".
    > oot aika "ihana"


### Inline code

*Quotations* are fragments of code that can be passed around and executed. Simply wrap some code in parentheses.

This example code pushes `3` on the stack, pushes the quotation `(d*)` on the stack, pops the quotation and executes it via the `i` word and then prints the result.

    3(d*)i.
    > 9

### Combinators
Words that take in quotations as arguments and execute them are called combinators.

## Flow control

The `?` combinator can be used for conditional execution of code.

    ? = conditional (condition)(then)(else)

The following code returns x+2 if the value x on top of the stack is more than 3, and 0 otherwise.

    (3>)(2+)(x0)?


This idea is ripped from [factor](http://docs.factorcode.org/content/article-cookbook-combinators.html)/Joy.

