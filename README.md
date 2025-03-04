# stashaway-assessment

## Introduction

This is my take to the assignment given. I tried my best or as much as time allows to make it kind of like how I would write it if I were to do it at work minus an actual database, but of course I could still make it better with more time.

A couple of assumptions I'd like to lay out:

- The instructions seem to imply that the deposit plans is for the same customer who made the deposit only
  - in reality of course deposit plan could be for a different customer
  - I constrained the function to only handle allocation for 1 customer at a time even though I could of course allocate funds for multiple customers
- I used bignumber.js since this is a financial application and we need precision
- Maybe a little pedantic but I tried to stick to the instruction to create a function... partly also to reduce the scope of work

## Thoughts on distributing funds

I don't know if this is the _correct_ way of doing it but I think it will be a good user experience to distribute it proportionately. If we break down the deposits into parts matching the size of the deposit plan and deposit them seprately we will arrive at the same allocation.

I wanted to have a switch to choose between "smart allocation" and "dumb allocation", and the smart would behave like the aforementioned and "dumb" allocation would've allocated extra to a "safe" portfolio that will not lose money or not have interest at all, at least it is safe. However, I did not have enough time to implement this switch. Also ideally I think this is an option the user has to choose when setting up their deposits.

Even though I'm using `bignumber.js`, when dealing with fractions, e.g. when distributing proportionally it is still possible to have rounding and result in unallocated funds. Therefore my strategy is to use subtraction to get the last number in the ratio, that way we will never have under/overallocations.

## PSA

- I don't normally do `as any` in tests but bun test doesn't have `jest.mocked` yet.
- Sorry I've opted to test "strategically" and I didn't test all branches or get 100% coverage. If it's a big deal I can take a little more time to do it

## Instructions to run

I use bun locally to write this. If you never used it the instructions should be similar to what you're familiar with. Npm/Yarn should work too. I also run my tests using `bun test` but I made it compatible to Jest so you can use jest if you don't have Bun installed.

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
