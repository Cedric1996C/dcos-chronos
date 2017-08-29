## DCOS-UI

> node 版本号：4.4.x
> npm 版本号：3.9.x，最好不要用 cnpm，会报奇怪的错误

### 下载并运行

  * 下载[[https://github.com/dcos/dcos-ui|dcos-ui]]到本地
  * 下载[[https://pan.baidu.com/s/1dFjBLTJ|这个压缩文件 密码: xyiy]]，解压后把 <html>marathon</html> 目录和  <html>v2</html> 目录放到 <html>src/resources/raml</html> 目录下，形成如下目录结构( xml 表示)。

```xml
<src type="directory">
  <fonts type="directory"><!-- sub-directories --></fonts>
  <img type="directory"><!-- sub-directories --></img>
  <js type="directory"><!-- sub-directories --></js>
  <resources type="directory">
    <grammar type="directory"><!-- sub-directories --></grammar>
    <raml type="directory">
      <marathon type="directory"><!-- sub-directories --></marathon>
      <v2 type="directory"><!-- sub-directories --></v2>
      <README.md type="markdown" />
    </raml>
  </resources>
  <styles type="directory"><!-- sub-directories --></styles>
  <index.html type="html" />
</src>
```
  * 回到该项目根目录，运行以下命令安装依赖包（需要开 VPN ）
  
```sh
npm install 
```

  * 运行以下命令，这会生成 <html>webpack/proxy.dev.js</html> 和 <html>src/js/config/Config.dev.js</html>

```sh
npm run scaffold 
```

  * 修改 <html>webpack/proxy.dev.js</html> 如下：

```javascript
module.exports = {
  "**": "http://114.212.86.224"
};
```

  * 运行以下命令，运行浏览器跳转到[[http://localhost:4200|http://localhost:4200]]

```sh
npm start
```
  
### 相关说明

#### 代理

由于前端工程只供在本地显示用，而实际的数据在远程的虚拟机集群上，因此我们需要把所有的数据请求代理到集群上，代理位于`webpack/proxy.dev.js`，可以修改这个文件来进行 URL 映射，映射规则见 [[http://webpack.github.io/docs/webpack-dev-server.html#proxy|Webpack 文档 wepack-dev-server proxy 部分]]。

#### 虚拟机集群

目前运行上述工程后，界面显示的所有数据均为 <html>dcos-vagrant</html> 虚拟机所搭建的集群内部的数据，虚拟机所搭建的集群所在的位置 `114.212.86.224`

> 由于这个 IP 是个内部 IP ，经常变化，所以当工程无法成功获取到登陆页面时需要修改此 IP

#### React-Flux 架构

由于整个工程是 React 的，而且工程大，数据管理繁琐，所以 dcos-ui 采用了 Flux 架构来管理数据，并使用 Flux (而非 Redux )来开发。所以，有必要稍微了解一下 Flux，[[https://hulufei.gitbooks.io/react-tutorial/content/flux.html|这里]]有个教程，目前了解一下主要思想就可以继续了。

了解了 Flux 架构后，再看当前的代码就比较清晰了，dcos-ui 这个项目把 Dispatcher 和 Action 放于 `src/js/events` 下，Store 放于 `stores` 下。`js` 下其他部分的作用如下描述：

```
+ js
|-- components    -> 展示组件
|-- events        -> Dispatcher 和 Action
|-- pages         -> 容器组件
|-- schemas       -> API 信息
|-- translations  
|-- config        -> 配置信息
|-- index.js      
|-- plugin-bridge 
|-- stores        -> Store
|-- utils         -> 工具
|-- constants     
|-- mixins        -> 混入模式
|-- routes        -> 路由
|-- structs       
|-- vendor
```

### 修改数据源

到目前为止，所有的数据还都是 <html>dcos-vagrant</html> 的，现在开始修改为我们的数据。使用我们自己的数据的方法有两种：

  - 继续使用代理
  - 修改 Store

由于代理的方式在开发阶段还可以用，但在生产阶段，代理并不是一种好的选择，而且代理过长和过于繁琐将来修改也很头疼，所以我们采用第二种方式。（采用这种方式在开发阶段仍然需要代理，因为会产生跨域问题，如果不用代理，则需要服务器设置 HTTP HEADER 的 Access-Control-Allow-Origin 设置为可信任的地址，最简单但最不安全的便是 “*” ）。

正如 Flux 所描述的，我们从服务器端获取到数据并将数据渲染出来是一个单向数据流，这个过程由以下几个过程组成：

  - 触发一个 Action ，这可能是组件被点击等所产生的，也可能是某处的服务代码所自发产生的（如轮询），但不管怎样，第一个过程一定是 Action 被触发。
  - 当一个 Action 被触发后，客户端将向服务器获取数据，当服务器返回时，无论成功与否，被触发的 Action 将被 Dispatcher 分发。
  - 当 Action 被分发后，注册在这个 Action 上的监听器（在此处是一个 Store ）将得到回调，得到回调的 Store 将把 Action 携带的数据处理并存储，同时释放一个事件（如 XXX_CHANGE ），以表示 Store 内部的数据发生了变化。
  - 监听在 XXX_CHANGE 事件上的监听器（通常是一个容器组件）将被回调，并设置自身的状态，以进行渲染。

按照上述描述，写一个我们自己的 Store ，同时需要我们完成 Action 和 Dispatcher。下面我们以 API [[http://114.212.189.138:5050/state|http://114.212.189.138:5050/state]] 并以使用代理为例进行说明，使用 Store 的方式也将被说明。
  * 修改`>webpack/proxy.dev.js`如下：

```javascript
module.exports = {
  '/dcos-history-service/history/*': {
    target: 'http://114.212.189.138:5050',
    changeOrigin: true,
    rewrite: function(req) {
      req.url = req.url.replace(/\/dcos.*/, '/state');
    },
    logLevel: 'debug'
  },
  "**": "http://114.212.86.224"
};
```

  * 运行，并打开浏览器跳转到[[http://localhost:4200|http://localhost:4200]]，可以看到界面上的数据发生了变化

```sh
npm start
```

这个显示的变化经历了如下过程：

  - 项目启动后，轮询开启，<html>MesosSummaryStore</html> 将开启轮询，不断触发 <html>MesosSummaryActions</html> 中所定义的Action <html>fetchState</html> 以获取集群状态( <html>js/events/MesosSummaryActions</html> 第9行)
  - 当获取到数据时，若正确获取到数据，将携带负载数据并分发 REQUEST_SUMMARY_SUCCESS ,( <html>js/events/MesosStateActions</html> 第61/87行)
  - 注册在 REQUEST_SUMMARY_SUCCESS 事件上的回调将得到执行( <html>js/stores/MesosSummaryStore</html> 第100行)，处理并存储数据，并分发 MESOS_SUMMARY_CHANGE 事件( <html>js/stores/MesosSummaryStore</html> 第218行)
  - 注册在 MESOS_SUMMARY_CHANGE 事件上的回调将得到执行( <html>js/pages/DashboardPage</html> 第90/109行)
  - DashboardPage 将得到渲染（因为 state 发生了变化）

了解了上述过程， 写一个 Store 便也如出一辙。根据 dcos-ui 的配置和工具的使用，需要注意的有以下几点：

  - 建立的 Store 在 constructor 中要利用 <html>PluginSDK.addStoreConfig(options)</html> 配置一下，配置方式如 <html>js/stores/MesosSummaryStore</html> 第74行，目的是我们可以像<html>js/pages/DashboardPage</html> 第90行中一样，利用 <html>StoreMixin</html>来进行回调的注册。
  - 在 DashboardPage 等容器的组件页注册上述的回调函数时，名称要遵循上面一条的规则。