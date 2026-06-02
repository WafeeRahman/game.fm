# game.fm — Developer Onboarding

This doc teaches you the JavaScript and React patterns you'll actually use in this codebase. Every example is pulled from real files in the project.

---

## 1. JavaScript you need to know

### Arrow functions

Two ways to write a function. They mean the same thing:

```js
// Old way
function add(a, b) {
  return a + b;
}

// Arrow function
const add = (a, b) => a + b;

// If the body is more than one line, use curly braces and an explicit return
const add = (a, b) => {
  const result = a + b;
  return result;
};
```

You'll see arrow functions everywhere — in `.map()`, event handlers, and component definitions.

---

### Destructuring

Pull values out of objects and arrays into named variables:

```js
// Object destructuring
const user = { name: "Wafee", username: "wafee4952" };
const { name, username } = user;
// name === "Wafee", username === "wafee4952"

// With renaming
const { name: displayName } = user;
// displayName === "Wafee"

// Array destructuring
const [first, second] = ["a", "b", "c"];
// first === "a", second === "b"
```

Real example from `src/app/users/[username]/page.js`:

```js
// Destructuring the result of Promise.all (an array of two values)
const [session, user] = await Promise.all([
  auth(),
  getUserProfile(username),
]);
```

---

### Optional chaining `?.`

Safely access a property that might not exist. Returns `undefined` instead of crashing:

```js
const user = null;
user.name;       // ❌ TypeError: Cannot read properties of null
user?.name;      // ✅ undefined
user?.image?.url // ✅ chain as deep as you want
```

Real example from `src/app/page.js`:

```js
// session might be null if nobody is logged in
if (session?.user) {
  // safe to use session.user here
}
```

---

### Nullish coalescing `??`

Return the right-hand side only if the left is `null` or `undefined`:

```js
const name = user.name ?? user.username;
// If user.name is null or undefined, fall back to user.username
```

Different from `||` — `||` also falls back on `0`, `""`, and `false`, which is often wrong.

Real example from `src/app/users/[username]/page.js`:

```js
<h1>{user.name ?? username}</h1>
// Shows the display name if set, otherwise falls back to the @username
```

---

### Async / await

JavaScript fetches data and waits for responses asynchronously. `async`/`await` lets you write that in a readable, top-to-bottom style:

```js
// Without async/await (harder to read)
fetch("/api/logs")
  .then((res) => res.json())
  .then((data) => console.log(data));

// With async/await (reads like normal code)
async function loadLogs() {
  const res = await fetch("/api/logs");
  const data = await res.json();
  console.log(data);
}
```

`await` pauses execution until the promise resolves. You can only use `await` inside an `async` function.

Real example from `src/components/FollowButton.js`:

```js
async function toggle() {
  setLoading(true);
  // await pauses here until the fetch completes
  await fetch("/api/follow", {
    method: following ? "DELETE" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  setFollowing(!following);
  setLoading(false);
}
```

---

### Array methods: map, filter, find

These are the three you'll use constantly.

**`.map()`** — transform every item in an array into something else. Returns a new array:

```js
const games = ["Elden Ring", "Hades", "Celeste"];
const listItems = games.map((game) => `<li>${game}</li>`);
// ["<li>Elden Ring</li>", "<li>Hades</li>", "<li>Celeste</li>"]
```

Real example from `src/app/page.js`:

```js
{feed.map((log) => (
  <FeedItem key={log.id} log={log} />
))}
```

**`.filter()`** — keep only items that pass a test:

```js
const logs = [{ rating: 5 }, { rating: null }, { rating: 3 }];
const rated = logs.filter((log) => log.rating !== null);
// [{ rating: 5 }, { rating: 3 }]
```

**`.find()`** — return the first item that passes a test (or `undefined`):

```js
const companies = [
  { name: "FromSoftware", developer: true },
  { name: "Bandai Namco", publisher: true },
];
const dev = companies.find((c) => c.developer);
// { name: "FromSoftware", developer: true }
```

Real example from `src/lib/games.js`:

```js
const developer = igdbGame.involved_companies?.find((c) => c.developer)?.company?.name;
```

---

### Spread operator `...`

Copy an object or array and optionally override/add fields:

```js
const base = { name: "Wafee", role: "user" };
const updated = { ...base, role: "admin" };
// { name: "Wafee", role: "admin" }
```

Real example from `src/components/AddToListButton.js`:

```js
// Update one list in the array without mutating the original
setLists((prev) =>
  prev.map((l) => (l.id === list.id ? { ...l, hasGame: !l.hasGame } : l))
);
```

---

## 2. React

### What is a component?

A component is just a function that returns JSX (HTML-like syntax). It can accept inputs (props) and render UI:

```jsx
function GameCard({ title, coverUrl }) {
  return (
    <div className="card">
      <img src={coverUrl} alt={title} />
      <p>{title}</p>
    </div>
  );
}
```

Rules:
- Component names must start with a capital letter
- Must return a single root element (wrap in `<div>` or `<>...</>` if needed)
- JavaScript expressions go inside `{curly braces}`

---

### Props

Props are the inputs you pass to a component, like arguments to a function:

```jsx
// Passing props
<GameCard title="Elden Ring" coverUrl="https://..." />

// Receiving props — destructure them in the function signature
function GameCard({ title, coverUrl }) { ... }
```

Real example from `src/app/page.js`:

```jsx
// The FeedItem component receives a single `log` prop
function FeedItem({ log }) {
  return (
    <div>
      {log.game.title}
      {log.user.name ?? log.user.username}
    </div>
  );
}

// Used like this:
{feed.map((log) => (
  <FeedItem key={log.id} log={log} />
))}
```

---

### State — `useState`

State is data that can change. When state changes, React re-renders the component:

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0); // initial value is 0

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
```

`useState` returns a pair: `[currentValue, setterFunction]`. You always update state through the setter — never mutate the value directly.

Real example from `src/components/FollowButton.js`:

```jsx
const [following, setFollowing] = useState(initialFollowing);
const [loading, setLoading] = useState(false);

// Later, in the toggle function:
setFollowing(!following);
setLoading(false);
```

---

### Effects — `useEffect`

Runs code as a side effect — after the component renders. Used for things like event listeners, subscriptions, or syncing with external state:

```jsx
import { useEffect } from "react";

useEffect(() => {
  // runs after every render (avoid this)
});

useEffect(() => {
  // runs only once, when the component mounts
}, []);

useEffect(() => {
  // runs when `value` changes
}, [value]);
```

The function can return a cleanup function that runs when the component unmounts:

```jsx
useEffect(() => {
  function handleClick(e) { ... }
  document.addEventListener("mousedown", handleClick);

  return () => {
    document.removeEventListener("mousedown", handleClick); // cleanup
  };
}, []);
```

Real example from `src/components/AddToListButton.js` — closing the dropdown when clicking outside:

```jsx
useEffect(() => {
  function handleClick(e) {
    if (ref.current && !ref.current.contains(e.target)) setOpen(false);
  }
  document.addEventListener("mousedown", handleClick);
  return () => document.removeEventListener("mousedown", handleClick);
}, []);
```

---

### Refs — `useRef`

A ref holds a value that doesn't trigger re-renders when it changes. Most commonly used to get a direct reference to a DOM element:

```jsx
import { useRef } from "react";

const ref = useRef(null);

// Attach to a DOM element
<div ref={ref}>...</div>

// Now ref.current is the actual DOM node
ref.current.focus();
ref.current.contains(someOtherElement);
```

Real example from `src/components/AddToListButton.js`:

```jsx
const ref = useRef(null);

// Attach to the container div
<div className="relative" ref={ref}>

// In the click handler, check if the click was outside the container
if (ref.current && !ref.current.contains(e.target)) setOpen(false);
```

---

## 3. Next.js App Router

### Server components vs client components

This is the most important Next.js concept to understand.

**Server components** (default — no directive needed):
- Run on the server at request time
- Can use `async`/`await` directly — good for database queries and API calls
- Cannot use `useState`, `useEffect`, event handlers, or browser APIs
- The user never downloads this code

**Client components** (`"use client"` at the top of the file):
- Run in the browser
- Can use state, effects, event handlers
- Cannot directly call the database or use server-only secrets

```jsx
// ✅ Server component — fetches data directly
export default async function ProfilePage({ params }) {
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username } });
  return <h1>{user.name}</h1>;
}

// ✅ Client component — handles interaction
"use client";
export default function FollowButton({ initialFollowing }) {
  const [following, setFollowing] = useState(initialFollowing);
  return <button onClick={...}>{following ? "Unfollow" : "Follow"}</button>;
}
```

The pattern in this codebase: **server components fetch data and pass it as props to client components**.

Real example from `src/app/users/[username]/page.js`:

```jsx
// Server component — fetches isFollowing from DB
const isFollowing = await prisma.follow.findUnique({ ... });

// Passes the result as a prop to the client component
<FollowButton username={username} initialFollowing={isFollowing} />
```

---

### Async params (Next.js 16 breaking change)

In Next.js 16, `params` and `searchParams` are Promises. You must `await` them:

```jsx
// ✅ Correct
export default async function Page({ params }) {
  const { slug } = await params;
}

// ❌ Wrong — used to work in older Next.js, will break here
export default async function Page({ params }) {
  const { slug } = params;
}
```

---

### Route handlers (API routes)

Files named `route.js` inside `src/app/api/` define backend endpoints. Export a function named after the HTTP method:

```js
// src/app/api/logs/route.js

// Handles POST /api/logs
export async function POST(request) {
  const body = await request.json(); // parse the request body
  // ... do something
  return Response.json({ ok: true }); // send a response
}

// Handles GET /api/logs
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("igdbId");
  // ...
}
```

Dynamic segments work the same way:

```js
// src/app/api/lists/[id]/route.js

export async function DELETE(request, { params }) {
  const { id } = await params; // must await params here too
  // ...
}
```

---

### Calling API routes from client components

Always use `fetch` from client components — never import server code directly:

```jsx
"use client";

async function handleSubmit() {
  const res = await fetch("/api/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ igdbId: 1234, status: "COMPLETED" }),
  });
  const data = await res.json();
}
```

---

### `router.refresh()`

After a mutation (adding a log, following someone), the server components on the page hold stale data. `router.refresh()` tells Next.js to re-fetch all server component data on the current page without doing a full page reload:

```jsx
"use client";
import { useRouter } from "next/navigation";

const router = useRouter();

async function handleFollow() {
  await fetch("/api/follow", { method: "POST", ... });
  router.refresh(); // re-runs all server components on this page
}
```

---

### `Link` and `Image`

Always use Next.js's built-in `Link` instead of `<a>` for internal navigation (it prefetches and avoids full page reloads):

```jsx
import Link from "next/link";

<Link href="/games/elden-ring">Elden Ring</Link>
```

Always use `Image` instead of `<img>` for images (it handles lazy loading, sizing, and optimisation):

```jsx
import Image from "next/image";

// Fixed size
<Image src={coverUrl} alt="Cover" width={200} height={266} />

// Fill a container (parent needs position: relative)
<div className="relative w-10 h-14">
  <Image src={coverUrl} alt="Cover" fill className="object-cover" />
</div>
```

---

## 4. How to add a new feature

Here's the checklist for any new feature:

### 1. Add a database model (if needed)
Edit `prisma/schema.prisma`, then run:
```bash
npx prisma migrate dev --name describe-your-change
```

### 2. Add an API route
Create `src/app/api/your-feature/route.js`. Always:
- Check `auth()` at the top
- Return `Response.json(...)` not plain objects

### 3. Add a page (if needed)
Create `src/app/your-route/page.js`. If it needs user interaction, break the interactive part into a separate client component.

### 4. Add a client component (if needed)
Create `src/components/YourComponent.js` with `"use client"` at the top. Keep it small — only make things client components when they actually need state or event handlers.

### 5. Call `router.refresh()` after mutations
Any time a client component changes data, call `router.refresh()` so the server components re-fetch.

---

## 5. Project file map

```
src/
├── app/
│   ├── page.js                          Home page (feed or hero)
│   ├── games/
│   │   ├── page.js                      Game search
│   │   └── [slug]/page.js               Game detail + log button
│   ├── users/
│   │   └── [username]/
│   │       ├── page.js                  Profile page
│   │       └── lists/
│   │           ├── page.js              All lists for a user
│   │           └── [id]/page.js         Single list
│   ├── settings/page.js                 Steam import
│   └── api/
│       ├── auth/[...nextauth]/route.js  NextAuth handler (don't touch)
│       ├── logs/route.js                Create/get game logs
│       ├── follow/route.js              Follow/unfollow
│       ├── lists/
│       │   ├── route.js                 Create/list lists
│       │   └── [id]/
│       │       ├── route.js             Delete/update a list
│       │       └── games/route.js       Add/remove games
│       └── steam/import/route.js        Steam library import
├── components/
│   ├── Navbar.js                        Top nav (server)
│   ├── SearchBar.js                     Search input (client)
│   ├── LogGameButton.js                 Log modal (client)
│   ├── FollowButton.js                  Follow toggle (client)
│   ├── AddToListButton.js               List dropdown (client)
│   ├── CreateListButton.js              New list form (client)
│   ├── DeleteListButton.js              Delete confirm (client)
│   ├── RemoveFromListButton.js          Remove from list (client)
│   └── SteamImport.js                   Steam import form (client)
└── lib/
    ├── db.js                            Prisma client singleton
    ├── igdb.js                          IGDB API client
    ├── games.js                         upsertGame helpers
    ├── steam.js                         Steam API helpers
    ├── users.js                         getUserProfile
    └── feed.js                          getFeed
```
