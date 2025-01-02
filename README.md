# nextjs 新手易范错误、误解 29 条

## server/client component

### 1. 'use client'放在了组件树中太高的位置。

**背景**  
 nextjs 项目/app 目录下的所有页面和组件默认时 server componenet, 如果想要使用 react 的 hook 或者浏览器事件，则要声明成 client component.

**问题**  
 "use client"放太高，导致不仅声明的组件本身，还有 import 进来的其他组件都变成 client component，从而丢失了 server component 的优点（如性能优化）

### 2. 新引入的交互元素(client 元素)，没有提取成组件，而是直接在父组件上使用"use client"。

### 3. 如果组件本身是 client component，应该在该组件顶部显示标明"use client"。

**背景**  
 由于一个 client component A 被另一个 client component B 引入，这时即使组件 A 没有显示标明"use client"仍能被正常编译成 client component。但这种默认行为会导致代码可读性差，万一被 server component 引入，会导致错误。
建议所有 client component 都显示标明"use client".

### 4. 注意第 1 条中的问题，仅会使“引入”（import）进来的 server component 变成 client component。

当 server component 作为参数被传入 client component 内渲染时，并不会把 server component 变成 client component.

**示例**  
 context 的 provider(client component)包裹的 server componenet 实际是通过 children 参数传入并渲染的，这个 server component 并不会变成 client component:

```
 <ThemeProvider> // client component(由于里面使用了 hook)
  <Product /> // 组件内部没有使用"use client"，仍然是 server component
 </ThemeProvider>
```

### 5. 状态管理工具（例：context、redux）只能在 client component 中使用。

状态管理工具用于追踪数据变化。

而 server component 关注的是接口数据的请求和返回, 不追踪变化。

### 6. 错误使用"use server"想要确保某个组件永远是 server component。

同理第 1 点的背景，所有组件默认都是 server component。

有时当组件不小心被引入到 client component 时，可能会想通过"use server"来确保该组件仍然是 server component。但实际上"use server"声明的是 server action，并不是 server component。

当我们编码时注意第 1 点，不要把"use client"放太高，实际上面 👆🏻 的情况很少出现。

### 7. 将敏感数据直接作为 props 从 server component 传给 client component，导致敏感数据泄漏。

建议对敏感数据加密，或者单独实现数据访问层。

### 8. server component 仅会运行在 server 端，而 client component 不仅会运行 client 端，还会在 server 端运行一次。

要点 1：server component 仅会运行在 server 端，所以在 server component 打的 log 需要在 terminal 中查看

要点 2：由于 nextjs 默认情况下会尝试 pre-render，将整个 page 渲染成 HTML，SSG(static side generation)生成的静态文件（HTML）放到 CDN 用以加速页面内容的展示。为了生成 HTML，nextjs 会运行 page 下所有的 component，这导致了 client component 在 server 端运行。而 SSG 仅进行一次。

要点 3：SSG 的 HTML 内容被发送给客户端，此时 React 会进行 hydrate 处理，遍历 HTML 并为对应元素绑定事件等 JS 逻辑以实现元素的可交互性。

### 9. 由于 client component 默认会在 server 端运行一次，在 client component 中直接使用 window 对象下的方法会导致 server 端报错。

例：在 client component 中使用 localStorage

解决方法 1：增加 window 对象的判断。

```
let haveLikedBefore;
if (typeof window !== 'undefined') {
  haveLikedBefore = localStorage.getItem('haveLikedBefore);
}
```

解决方法 2：使用 useEffect hook，在 useEffect 中使用 window 对象下的方法。SSG 仅执行到 HTML 内容生成，而不会渲染组件，所以不会执行到 useEffect。

```
useEffect(() => {
  const haveLikedBefore = localStorage.getItem('haveLikedBefore);
}, [])
```

解决方法 3：动态引入 client component，限制组件仅在 client 端运行。

```
const DynamicBtn = dynamic(() => import('./DynamicBtn'), {
  ssr: false // 限制
});

<DynamicBtn />
```

<br/>

### 10. 动态内容可能会导致 hydration error。

**背景**  
Hydration 后，浏览器会再次运行组件进行渲染，生成新的 HTML 内容。

当 SSG 的静态 HTML 内容和 Hydration 后的 HTML 内容不一样时，会报错。

HTML 内容不一样的原因有很多，比如第 8 点的解法 1 中，由于条件判断，haveLikedBefore 在 server 端和在 client 端的值不同，如果有 HTML 内容根据 haveLikedBefore 的值渲染不同文本，就会导致两个 HTML 内容不一致。或者组件中使用`new Date()`等。

这种不一致是很正常的。

**解法**  
对不一致的元素，使用`suppressHydrationWarning`。

```
<p suppressHydrationWarning>
  {haveLikedBefore ? 'You have liked before' : 'You have not liked before'}
</p>
```

<br/>

### 11. 使用第三方库时，需要判断是否加上"use client"和注意第 9 点。

第三方库（例如轮播组件）是 client component 时，需要加上"use client"，防止报错。

同时，如果第三方库使用了 window 对象，需要使用第 9 点的解法 3。

## 数据获取和数据变更

### 12. 错误使用 route handlers 或 API 来获取数据

在旧的编码习惯中，请求数据时，通常需要通过访问接口路由来获取数据，例：`fetch('/api/products)`，同时需要封装 api 逻辑。

在 nextjs 中，可以直接在 server component(注意是 server component) 中发起请求，例：`const data = await fetch('https://faskestoreapi.com/products/3')`。

### 13. 不需要担心在同一个页面的不同组件中发起相同的请求

当同一个页面中的不同组件中发起相同请求时，例，有组件 Product 和 Prize，他们都发起了请求`const data = await fetch('https://faskestoreapi.com/products/3')`，此时不需要将这个请求提取到父组件或者 page 文件中发起，然后通过 props 传给对应的 server component。

react 和 nextjs 都为这种情况实现了缓存。

对于 fetch 请求，react 和 nextjs 都默认实现了缓存。实际上只会发起一次请求，并且缓存请求结果。

对于非 fetch 请求（如数据库请求，prisma），需要开发者调用 react 的 cache 方法或者 nextjs 的 unstable_cache 方法。例：

```
import { unstable_cache } from 'next/cache'

async function getProduct() {
  const products = await prisma.products.findMany();
  return products;
}

export const getProductCache = unstable_cache(getProduct);

// 或者使用react的cache方法
import { cache } from 'react';

export const getProductCache = unstable_cache(getProduct);
```

### 14. 注意请求瀑布流

出现瀑布流的情况：

1. await 请求没有写好。比如下面两个请求没有依赖关系，但是请求没有并行发起。

```
const products = await getProducts()
const rates = await getRates()

// 使用Promise.all或Promise.allSettled并行发起请求
```

2. 组件嵌套。子组件的请求会在父组件的请求完成后再发起。解决方法：提升请求到父组件中。

### 15.应该使用 server action 进行更新数据的操作

在 server 端，包含 3 个主要内容：server component、server action 和 route handlers。

server component 除了页面渲染外，主要负责 get 请求。

server action 负责 post/put/delete 请求这类更新数据的操作。

route handlers 主要负责 webhook。

使用 server action 更新数据：

```

// action.ts
"user server"  // 注意，"use server"用于server action而不是server component

 export async function addProduct(formData: FormData) {
  await prisma.products.create({
    data: {
      name: formData.get('name'),
    },
  })
}


// Product.tsx
<form action={addProduct}>...</form>
```

### 16. 更新数据后页面未更新，需要使用 revalidatePath 清除 nextjs 对页面的缓存，从而显示最新的数据。

### 17. 注意 server action 不仅可以在 server component 中调用，client component 也可以调用。

### 18. 使用 server action 更新数据前，别忘了进行数据校验和身份校验。

### 19. 错误使用"use server"来限制组件或者函数只能在 server 端运行。

在 nextjs 中，"use server"用于 server action，而不是用于限制组件只能在 server 端运行。"use server"实际是暴露服务器的一个端点，让别人可以连接这个端点。

要想限制组件或者函数只能在 server 端运行，可以使用"server-only"（需要安装）。

### 20. 注意 url 上对应的参数 params 和 query 参数 searchParams 只能在 page 文件获取， 作为组件使用的 server component 没有这 2 个参数。

### 21. 注意获取 searchParams 两种方法的限制。

方法 1： 通过 page 的 searchParams 参数获取

需要注意的是，每当 url 变化，实际上会发送一个请求给到 server，用以通知 server component url 变化，从而获取最新的 searchParams。由于是一个请求，这在生产环境中可能会存在一定的延时。

方法 2： 使用 usesrSearchParams hook 获取

需要注意的是，这是一个 client 的 hook，只能在 client component 中使用。

### 22. 别忘了设置页面和组件加载的 loading 效果。

在本地开发时代码总是运行很快，可能会遗忘实现过渡效果。

### 23. 细化 suspense 的 loading 范围，以提供更好的用户体验。

### 24. suspense 应该放在等待的异步操作的外围。

有时可能会希望将 suspense 放入组件中，聚合相关代码。但这样的写法无法触发 suspense 的作用，从而导致整个页面都处于等待状态。

错误例子：

```
export default async  function Product() {
  await new Promise(() => setTimeout(resolve, 3000));

  return (
    <Suspense fallback='loading...'>
      <div>details</div>
    </Suspense>
  )
}
```

### 25. suspense 需要在参数变化时触发，记住加上 key

例，希望在 searchParams 变化时触发 suspense

```
export default async  function ProductPage({ searchParams }) {

  return (
    <Suspense fallback='loading...' key={searchParams.id}>  // 注意加上 key，否则仅在初次加载时触发loading...
      <Product id={searchParams.id} />
    </Suspense>
  )
}
```

## 静态和动态渲染

### 26. 注意一些会使页面变为动态渲染的方法或参数。

有些方法和参数会使页面变为动态渲染，从而在每次请求时都重新渲染页面。
例： searchParams、cookies、headers

注意 1：如果某个组件使用的这些方法和参数，那么这个组件也会变为动态渲染。所有引用了这个组件的页面也会变为动态渲染。

注意 2：一些第三方库，如身份验证的库，里面可能使用了这些方法，从而让使用了第三方库的组件也变成动态渲染。

注意点 2 无法避免，但及时在本地环境构建项目能发现一些不必要的动态渲染。

## 安全

### 27. 不要将 secret key 作为常量写在代码中。

当写有 secret key 的组件 A 被放在 client component 下引用时，组件 A 将变成 client component，这会使得 secret key 在打包产物中可见。

理想做法是使用环境变量，将 secret key 放到.env.local 或者.env 中。

注意，如果在组件中显示环境变量，那 secret key 仍然会显示并泄漏。

### 28. 不要混用 server 端和 client 端的 utils 方法。

假如在 server 端的 utils 中使用了环境变量，当这个 utils 在 client component 中调用时，nextjs 会保护里面的环境变量，将找不到对应的值，导致 utils 执行出错。

## 其他

### 29. 不要在 try...catch 的 try 中使用 next/navigation 的 redirect 方法来实现重定向。

next/navigation 的 redirect 方法实际等同于`throw new Error`，这会导致它被 catch 捕捉。直接结果就是页面没有变化。

需要注意的是，一些第三方库可能使用了 redirect，需要注意不要套在 try...catch 中。
