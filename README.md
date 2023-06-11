HSM protected password generation
=================================

This project aims at managing daily passwords with a new approach.

Migrating from storing all my passwords in a manager software(like KeePass or
Bitwarden), I want to elimate the single point of failure should one day my
master password is accidentally released. I realize that my passwords need
another piece of entropy, which may not come alone with the files or database
storing it.

We define our password as results of key derivating functions:

    `password = password(usage) = KDF(secret(usage), some_salt_or_nonce)`

where

* each secret for calculating the password is a function of that password's
usage(including the website to be used, the username, etc.), and
* the `secret()` function is carried out not on user's computer but in a HSM(hardware security module),

then, to recover a password, the user must have:

1. knowledge of the nonce or salt for that password - this can be stored in a traditional password manager.
2. access to the HSM - this can be done using a Google account, whose login can be configured using tokens etc. and can be very secure.

This makes retriving a password very hard: by knowledge + ownership.

A frequent scenario of password leakage is, that users reuse their same passwords on different websites, and one of them later leaked that.
Not only this exposes the user to subsequent malicious login attempts, but also the revelation of their online habits.

By using a KDF function to derive user passwords, we make sure knowledge of any password in result will not cause insecurity of other passwords.
Further we relieve the burden of managing a database of secrets, as even if the nonces are released, accesses to HSM still requires more than what a hacker may have.