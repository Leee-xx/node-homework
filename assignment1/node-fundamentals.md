# Node.js Fundamentals

## What is Node.js?
Node is a server-side Javascript runtime

## How does Node.js differ from running JavaScript in the browser?
Node does not have access to in-browser elements (e.g. window, the DOM, etc.),
but can do things like file I/O, accessing environment variables, starting web
servers, etc.

## What is the V8 engine, and how does Node use it?
V8 is what turns JS into code that a computer can execute.

## What are some key use cases for Node.js?
Web applications, servers

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

**CommonJS (default in Node.js):**
```js
const { register, logoff } = require("../controllers/userController");
```

**ES Modules (supported in modern Node.js):**
```js
import { useState, useEffect } from "react";
```
